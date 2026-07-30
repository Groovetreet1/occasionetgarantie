const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate, adminOnly } = require('../middleware/auth');
const gomobile = require('../services/gomobile');
const { send, creditConfirmed } = require('../emails');
const { destroy: cloudDestroy, USE_CLOUDINARY } = require('../services/uploader');

router.post('/clean-db', authenticate, adminOnly, async (req, res) => {
  try {
    if (req.body.confirm !== 'CLEAN_ALL_DATA')
      return res.status(400).json({ message: 'Confirmation requise: envoyez { confirm: "CLEAN_ALL_DATA" }' });
    const tables = [
      'messages', 'conversations', 'product_images', 'order_items', 'orders',
      'premium_payments', 'commissions', 'credit_transactions', 'credit_purchases',
      'contact_messages', 'reservations', 'products'
    ];
    for (const t of tables) {
      try { await pool.query(`DELETE FROM \`${t}\``); } catch {}
    }
    await pool.query('DELETE FROM users WHERE id != 1');
    res.json({ message: 'DB nettoyee. Admin uniquement.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.delete('/premium-payments/:id', authenticate, adminOnly, async (req, res) => {
  try {
    const paymentId = Number(req.params.id);
    await pool.query('DELETE FROM premium_payments WHERE id = ?', [paymentId]);
    res.json({ message: 'Paiement supprime.' });
  } catch (err) {
    console.error('Delete premium error:', err.sqlMessage || err.message);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.get('/premium-payments', authenticate, adminOnly, async (req, res) => {
  try {
    try {
      const [rows] = await pool.query(
        'SELECT p.*, u.full_name, u.email, u.phone FROM premium_payments p JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC'
      );
      return res.json(rows);
    } catch (e) {
      if (e.errno === 1146 || e.code === 'ER_NO_SUCH_TABLE') return res.json([]);
      throw e;
    }
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.post('/premium-payments/:id/confirm', authenticate, adminOnly, async (req, res) => {
  try {
    const paymentId = Number(req.params.id);
    const [payments] = await pool.query('SELECT * FROM premium_payments WHERE id = ?', [paymentId]);
    if (payments.length === 0) return res.status(404).json({ message: 'Paiement introuvable.' });
    if (payments[0].status === 'actif') return res.status(400).json({ message: 'Deja confirme.' });

    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    await pool.query('UPDATE premium_payments SET status = ? WHERE id = ?', ['actif', paymentId]);

    try {
      await pool.query('UPDATE users SET premium = TRUE, premium_expires_at = ? WHERE id = ?', [expiresAt, payments[0].user_id]);
    } catch (userErr) {
      if (userErr.errno === 1054 || userErr.code === 'ER_BAD_FIELD_ERROR') {
        await pool.query('UPDATE users SET premium = TRUE WHERE id = ?', [payments[0].user_id]);
      } else {
        throw userErr;
      }
    }

    // Notify client by email
    try {
      const [userRow] = await pool.query('SELECT email, full_name FROM users WHERE id = ?', [payments[0].user_id]);
      if (userRow.length > 0 && userRow[0].email) {
        await send({
          to: userRow[0].email,
          subject: 'Premium active - Occasion & Garantie',
          html: `<div style="font-family:Arial;padding:20px;background:#f8f9fc;border-radius:8px;max-width:480px;margin:0 auto"><div style="background:#fff;border-radius:12px;padding:24px"><h2 style="color:#10b981;margin:0 0 12px;font-size:18px">Premium activée</h2><p style="color:#1e293b;font-size:14px;line-height:1.6;margin:0">Bonjour ${userRow[0].full_name}, votre compte Premium est actif pour 1 an. Les publicités sont désactivées.</p></div></div>`,
        });
      }
    } catch (notifErr) { console.error('Email failed:', notifErr.message); }

    res.json({ message: 'Premium confirme avec succes pour 1 an.' });
  } catch (err) {
    console.error('Confirm premium error:', err.sqlMessage || err.message, err.sql);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.post('/premium-payments/:id/reject', authenticate, adminOnly, async (req, res) => {
  try {
    const paymentId = Number(req.params.id);
    const { reason } = req.body;
    const [payments] = await pool.query('SELECT * FROM premium_payments WHERE id = ?', [paymentId]);
    if (payments.length === 0) return res.status(404).json({ message: 'Paiement introuvable.' });
    if (payments[0].status !== 'en_attente') return res.status(400).json({ message: 'Deja traite.' });

    const rejectionReason = reason || 'Paiement non valide. Veuillez reessayer avec un virement correct de 50 DH.';
    await pool.query('UPDATE premium_payments SET status = ?, rejection_reason = ? WHERE id = ?', ['rejete', rejectionReason, paymentId]);

    try {
      const [userRow] = await pool.query('SELECT email, full_name FROM users WHERE id = ?', [payments[0].user_id]);
      if (userRow.length > 0 && userRow[0].email) {
        await send({
          to: userRow[0].email,
          subject: 'Demande Premium refusee - Occasion & Garantie',
          html: `<div style="font-family:Arial;padding:20px;background:#f8f9fc;border-radius:8px;max-width:480px;margin:0 auto"><div style="background:#fff;border-radius:12px;padding:24px"><h2 style="color:#ef4444;margin:0 0 12px;font-size:18px">Demande refusée</h2><p style="color:#1e293b;font-size:14px;line-height:1.6;margin:0">Bonjour ${userRow[0].full_name}, votre demande Premium a été refusée.</p><p style="color:#64748b;font-size:13px;margin:8px 0 0">Raison : ${rejectionReason}</p></div></div>`,
        });
      }
    } catch (notifErr) { console.error('Email failed:', notifErr.message); }

    res.json({ message: 'Paiement rejete.', reason: rejectionReason });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ---- Credit Purchases (admin confirm/reject) ----
router.get('/credit-purchases', authenticate, adminOnly, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT c.*, u.full_name, u.email, u.phone FROM credit_purchases c JOIN users u ON c.user_id = u.id ORDER BY c.created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.post('/credit-purchases/:id/confirm', authenticate, adminOnly, async (req, res) => {
  try {
    const purchaseId = Number(req.params.id);
    const [purchases] = await pool.query('SELECT * FROM credit_purchases WHERE id = ?', [purchaseId]);
    if (purchases.length === 0) return res.status(404).json({ message: 'Demande introuvable.' });
    if (purchases[0].status !== 'en_attente') return res.status(400).json({ message: 'Deja traitee.' });

    const creditsToAdd = Number(purchases[0].credits);
    const userId = purchases[0].user_id;

    try {
      await pool.query('ALTER TABLE users ADD COLUMN credit_balance DECIMAL(15,2) DEFAULT 0');
    } catch (e) {
      if (e.code !== 'ER_DUP_FIELDNAME' && e.errno !== 1060) {
        console.log('ALTER credit_balance skipped:', e.message);
      }
    }

    await pool.query('UPDATE credit_purchases SET status = ?, confirmed_at = NOW() WHERE id = ?', ['confirme', purchaseId]);

    // Read current balance, add credits in JS, write back (most robust)
    let currentBalance = 0;
    try {
      const [rows] = await pool.query('SELECT credit_balance FROM users WHERE id = ?', [userId]);
      if (rows.length > 0 && rows[0].credit_balance !== null && rows[0].credit_balance !== undefined) {
        currentBalance = Number(rows[0].credit_balance);
      }
    } catch (e) {
      if (e.code === 'ER_BAD_FIELD_ERROR' || e.errno === 1054) {
        try { await pool.query('ALTER TABLE users ADD COLUMN credit_balance DECIMAL(15,2) DEFAULT 0'); } catch {}
      } else throw e;
    }

    const newBalance = currentBalance + creditsToAdd;
    await pool.query('UPDATE users SET credit_balance = ? WHERE id = ?', [newBalance, userId]);

    try {
      await pool.query('INSERT INTO credit_transactions (user_id, type, amount, description) VALUES (?, ?, ?, ?)',
        [userId, 'purchase', creditsToAdd, `Achat de ${creditsToAdd} credits (${purchases[0].amount_dh} DH) confirme par admin`]
      );
    } catch (e) {
      if (e.errno === 1146 || e.code === 'ER_NO_SUCH_TABLE') {}
      else throw e;
    }

    try {
      const [userRow] = await pool.query('SELECT phone, full_name, email FROM users WHERE id = ?', [userId]);
      if (userRow.length > 0 && userRow[0].email) {
        await send({
          to: userRow[0].email,
          subject: 'Achat de credits confirme - Occasion & Garantie',
          html: creditConfirmed({ userName: userRow[0].full_name, credits: creditsToAdd, amountDH: purchases[0].amount_dh, newBalance }),
        });
      }
    } catch (notifErr) { console.error('Email notification failed:', notifErr.message); }

    res.json({ message: 'Achat confirme, credits ajoutes.', credit_balance: newBalance });
  } catch (err) {
    console.error('Confirm credit error:', err.sqlMessage || err.message);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.post('/credit-purchases/:id/reject', authenticate, adminOnly, async (req, res) => {
  try {
    const purchaseId = Number(req.params.id);
    const { reason } = req.body;
    const [purchases] = await pool.query('SELECT * FROM credit_purchases WHERE id = ?', [purchaseId]);
    if (purchases.length === 0) return res.status(404).json({ message: 'Demande introuvable.' });
    if (purchases[0].status !== 'en_attente') return res.status(400).json({ message: 'Deja traitee.' });

    const rejectionReason = reason || 'Paiement non recu. Veuillez reessayer.';
    await pool.query('UPDATE credit_purchases SET status = ?, rejection_reason = ? WHERE id = ?', ['rejete', rejectionReason, purchaseId]);

    try {
      const [userRow] = await pool.query('SELECT email, full_name FROM users WHERE id = ?', [purchases[0].user_id]);
      if (userRow.length > 0 && userRow[0].email) {
        await send({
          to: userRow[0].email,
          subject: 'Achat de credits refuse - Occasion & Garantie',
          html: `<div style="font-family:Arial;padding:20px;background:#f8f9fc;border-radius:8px;max-width:480px;margin:0 auto"><div style="background:#fff;border-radius:12px;padding:24px"><h2 style="color:#ef4444;margin:0 0 12px;font-size:18px">Achat refusé</h2><p style="color:#1e293b;font-size:14px;line-height:1.6;margin:0">Bonjour ${userRow[0].full_name}, votre achat de crédits a été refusé.</p><p style="color:#64748b;font-size:13px;margin:8px 0 0">Raison : ${rejectionReason}</p></div></div>`,
        });
      }
    } catch (notifErr) { console.error('Email failed:', notifErr.message); }

    res.json({ message: 'Achat rejete.', reason: rejectionReason });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.delete('/credit-purchases/:id', authenticate, adminOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM credit_purchases WHERE id = ?', [Number(req.params.id)]);
    res.json({ message: 'Demande supprimee.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ---- Check user credit balance (debug) ----
router.get('/users/:id/credits', authenticate, adminOnly, async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const [rows] = await pool.query('SELECT id, full_name, email, credit_balance FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) return res.status(404).json({ message: 'Utilisateur introuvable.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ---- Delete user + all their data ----
router.delete('/users/:id', authenticate, adminOnly, async (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (userId === 1) return res.status(400).json({ message: 'Impossible de supprimer le super admin.' });

    const [userRows] = await pool.query('SELECT full_name, email FROM users WHERE id = ?', [userId]);
    if (userRows.length === 0) return res.status(404).json({ message: 'Utilisateur introuvable.' });

    const safeDelete = async (sql, params, desc) => {
      try { await pool.query(sql, params); } catch (e) { console.log(`Delete ${desc} skipped:`, e.message); }
    };
    await safeDelete('DELETE FROM messages WHERE sender_id = ? OR receiver_id = ?', [userId, userId], 'messages');
    await safeDelete('DELETE FROM conversations WHERE user1_id = ? OR user2_id = ?', [userId, userId], 'conversations');
    await safeDelete('DELETE FROM premium_payments WHERE user_id = ?', [userId], 'premium_payments');
    await safeDelete('DELETE FROM credit_transactions WHERE user_id = ?', [userId], 'credit_transactions');
    await safeDelete('DELETE FROM credit_purchases WHERE user_id = ?', [userId], 'credit_purchases');
    await safeDelete('DELETE FROM installments WHERE buyer_id = ? OR seller_id = ?', [userId, userId], 'installments');
    await safeDelete('DELETE FROM reservations WHERE user_id = ?', [userId], 'reservations');
    await safeDelete('DELETE FROM commissions WHERE seller_id = ?', [userId], 'commissions');
    await safeDelete('DELETE FROM product_images WHERE product_id IN (SELECT id FROM products WHERE seller_id = ?)', [userId], 'product_images');
    await safeDelete('DELETE FROM contact_messages WHERE user_id = ?', [userId], 'contact_messages');
    const userEmail = userRows[0]?.email;
    if (userEmail) await safeDelete('DELETE FROM newsletter_subscribers WHERE email = ?', [userEmail], 'newsletter_subscribers');

    let products = [];
    try { [products] = await pool.query('SELECT id, image FROM products WHERE seller_id = ?', [userId]); } catch (e) { console.log('Delete products select skipped:', e.message); }
    for (const p of products) {
      if (p.image) {
        try { fs.unlinkSync(path.join(__dirname, '..', 'uploads', p.image)); } catch {}
        try {
          if (USE_CLOUDINARY && typeof p.image === 'string' && p.image.startsWith('http') && p.image.includes('/upload/')) {
            const afterUpload = p.image.split('/upload/')[1];
            if (afterUpload) {
              const publicId = afterUpload.split('?')[0].split('/').slice(1).join('/').replace(/\.[^.]+$/, '');
              if (publicId) cloudDestroy(publicId);
            }
          }
        } catch (e) { console.error('Cloudinary destroy error:', e.message); }
      }
    }
    await safeDelete('DELETE FROM products WHERE seller_id = ?', [userId], 'products');
    await pool.query('DELETE FROM users WHERE id = ?', [userId]);

    res.json({ message: `Compte de "${userRows[0].full_name}" et toutes ses donnees supprime.` });
  } catch (err) {
    console.error('Delete user error:', err.sqlMessage || err.message);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ---- Product approval ----
router.get('/products/pending', authenticate, adminOnly, async (req, res) => {
  try {
    try { await pool.query('ALTER TABLE products ADD COLUMN approved TINYINT(1) DEFAULT 1'); } catch {}
    try { await pool.query(`ALTER TABLE products ADD COLUMN rejection_reason VARCHAR(500) DEFAULT NULL`); } catch {}
    const [rows] = await pool.query(
      `SELECT p.*, u.full_name as seller_name, u.store_name, c.name as category_name FROM products p
       LEFT JOIN users u ON p.seller_id = u.id
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.approved = FALSE AND p.rejection_reason IS NULL ORDER BY p.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.post('/products/approve-existing', authenticate, adminOnly, async (req, res) => {
  try {
    try { await pool.query('ALTER TABLE products ADD COLUMN approved TINYINT(1) DEFAULT 1'); } catch {}
    try { await pool.query(`ALTER TABLE products ADD COLUMN rejection_reason VARCHAR(500) DEFAULT NULL`); } catch {}
    const [pending] = await pool.query('SELECT id, seller_id, name FROM products WHERE approved = FALSE OR approved IS NULL');
    await pool.query('UPDATE products SET approved = 1 WHERE approved IS NULL OR approved = 0');
    for (const prod of pending) {
      if (prod.seller_id) {
        try {
          await pool.query("CREATE TABLE IF NOT EXISTS notifications (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, type VARCHAR(50) DEFAULT 'general', title VARCHAR(200) NOT NULL, message TEXT DEFAULT NULL, link VARCHAR(500) DEFAULT NULL, read_at TIMESTAMP NULL DEFAULT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) DEFAULT CHARSET=utf8mb4");
          await pool.query('INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)',
            [prod.seller_id, 'product_approved', 'Annonce approuvée',
             `Votre annonce "${prod.name}" a été approuvée et est maintenant visible sur le site.`,
             '/seller']);
        } catch (nErr) { console.error('Notif failed:', nErr.message); }
      }
    }
    res.json({ message: `${pending.length} produits approuves.` });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.put('/products/:id/approve', authenticate, adminOnly, async (req, res) => {
  try {
    try { await pool.query('ALTER TABLE products ADD COLUMN approved TINYINT(1) DEFAULT 1'); } catch {}
    try { await pool.query(`ALTER TABLE products ADD COLUMN rejection_reason VARCHAR(500) DEFAULT NULL`); } catch {}
    const [prod] = await pool.query('SELECT seller_id, name FROM products WHERE id = ?', [req.params.id]);
    await pool.query('UPDATE products SET approved = TRUE, rejection_reason = NULL WHERE id = ?', [req.params.id]);
    if (prod.length > 0 && prod[0].seller_id) {
      try {
        await pool.query("CREATE TABLE IF NOT EXISTS notifications (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, type VARCHAR(50) DEFAULT 'general', title VARCHAR(200) NOT NULL, message TEXT DEFAULT NULL, link VARCHAR(500) DEFAULT NULL, read_at TIMESTAMP NULL DEFAULT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) DEFAULT CHARSET=utf8mb4");
        await pool.query('INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)',
          [prod[0].seller_id, 'product_approved', 'Annonce approuvée',
           `Votre annonce "${prod[0].name}" a été approuvée et est maintenant visible sur le site.`,
           '/seller']);
      } catch (nErr) { console.error('Notif failed:', nErr.message); }
    }
    res.json({ message: 'Produit approuve.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.put('/products/:id/reject', authenticate, adminOnly, async (req, res) => {
  try {
    try { await pool.query('ALTER TABLE products ADD COLUMN approved TINYINT(1) DEFAULT 1'); } catch {}
    try { await pool.query(`ALTER TABLE products ADD COLUMN rejection_reason VARCHAR(500) DEFAULT NULL`); } catch {}
    const { reason } = req.body;
    const rejectionReason = reason || 'Annonce non conforme à nos conditions.';
    const [prod] = await pool.query('SELECT seller_id, name FROM products WHERE id = ?', [req.params.id]);
    await pool.query('UPDATE products SET approved = FALSE, rejection_reason = ? WHERE id = ?', [rejectionReason, req.params.id]);
    if (prod.length > 0 && prod[0].seller_id) {
      try {
        await pool.query("CREATE TABLE IF NOT EXISTS notifications (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, type VARCHAR(50) DEFAULT 'general', title VARCHAR(200) NOT NULL, message TEXT DEFAULT NULL, link VARCHAR(500) DEFAULT NULL, read_at TIMESTAMP NULL DEFAULT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) DEFAULT CHARSET=utf8mb4");
        await pool.query('INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)',
          [prod[0].seller_id, 'product_rejected', 'Annonce refusée',
           `Votre annonce "${prod[0].name}" a été refusée. Raison : ${rejectionReason}`,
           '/seller']);
      } catch (nErr) { console.error('Notif failed:', nErr.message); }
    }
    res.json({ message: 'Produit refusé.', reason: rejectionReason });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ---- Suspend / Un-suspend users (VPN, manual) ----
router.put('/users/:id/suspend', authenticate, adminOnly, async (req, res) => {
  try {
    const { reason } = req.body;
    const userId = Number(req.params.id);
    await pool.query('UPDATE users SET suspended = 1, suspension_reason = ? WHERE id = ?', [
      reason || 'Compte suspendu par l\'administration',
      userId
    ]);
    res.json({ message: 'Compte suspendu avec succes.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur suspension.', error: err.message });
  }
});

router.put('/users/:id/unsuspend', authenticate, adminOnly, async (req, res) => {
  try {
    const userId = Number(req.params.id);
    await pool.query('UPDATE users SET suspended = 0, suspension_reason = NULL, vpn_strike_count = 0, vpn_strike_date = NULL WHERE id = ?', [userId]);
    res.json({ message: 'Compte re-active avec succes.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur reactivation.', error: err.message });
  }
});

// ---- Admin stats ----
router.get('/products', authenticate, adminOnly, async (req, res) => {
  try {
    try { await pool.query('ALTER TABLE products ADD COLUMN approved TINYINT(1) DEFAULT 1'); } catch {}
    const [rows] = await pool.query('SELECT p.*, u.full_name as seller_name, u.store_name FROM products p LEFT JOIN users u ON p.seller_id = u.id ORDER BY p.id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.get('/store-products', authenticate, adminOnly, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const offset = (page - 1) * limit;
    const [countRows] = await pool.query("SELECT COUNT(*) as total FROM products WHERE product_type = 'store'");
    const total = countRows[0].total;
    const [rows] = await pool.query("SELECT * FROM products WHERE product_type = 'store' ORDER BY id DESC LIMIT ? OFFSET ?", [limit, offset]);
    const [featuredCount] = await pool.query("SELECT COUNT(*) as c FROM products WHERE product_type = 'store' AND featured = 1");
    const [inStock] = await pool.query("SELECT COUNT(*) as c FROM products WHERE product_type = 'store' AND stock > 0");
    const [soldCount] = await pool.query("SELECT COUNT(*) as c FROM products WHERE product_type = 'store' AND status = 'vendu'");
    res.json({ products: rows, total, page, limit, totalPages: Math.ceil(total / limit), stats: { total, featured: featuredCount[0].c, inStock: inStock[0].c, sold: soldCount[0].c } });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.get('/store-contacts', authenticate, adminOnly, async (req, res) => {
  try {
    await pool.query("CREATE TABLE IF NOT EXISTS store_contacts (id INT AUTO_INCREMENT PRIMARY KEY, product_id INT NOT NULL, product_name VARCHAR(200) DEFAULT NULL, client_name VARCHAR(100) NOT NULL, client_phone VARCHAR(20) NOT NULL, message TEXT DEFAULT NULL, status VARCHAR(20) DEFAULT 'en_attente', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const offset = (page - 1) * limit;
    const [countRows] = await pool.query('SELECT COUNT(*) as total FROM store_contacts');
    const total = countRows[0].total;
    const [rows] = await pool.query('SELECT sc.*, p.slug, p.image FROM store_contacts sc LEFT JOIN products p ON sc.product_id = p.id ORDER BY sc.created_at DESC LIMIT ? OFFSET ?', [limit, offset]);
    res.json({ contacts: rows, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.put('/store-contacts/:id/status', authenticate, adminOnly, async (req, res) => {
  try {
    try { await pool.query("ALTER TABLE store_contacts ADD COLUMN status VARCHAR(20) DEFAULT 'en_attente'"); } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') {} }
    const { status } = req.body;
    if (!['en_attente', 'contacte', 'termine'].includes(status)) return res.status(400).json({ message: 'Statut invalide.' });
    await pool.query('UPDATE store_contacts SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: 'Statut mis a jour.' });
  } catch (err) {
    console.error('store-contact status update error:', err.sqlMessage || err.message);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.get('/users', authenticate, adminOnly, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const offset = (page - 1) * limit;
    const [countRows] = await pool.query('SELECT COUNT(*) as total FROM users');
    const total = countRows[0].total;
    const [rows] = await pool.query('SELECT id, full_name, email, phone, role, phone_verified, created_at, store_name, premium, credit_balance, terms_accepted, suspended, suspension_reason FROM users ORDER BY id ASC LIMIT ? OFFSET ?', [limit, offset]);
    res.json({ users: rows, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.put('/users/:id/store-name', authenticate, adminOnly, async (req, res) => {
  try {
    const { store_name } = req.body;
    if (!store_name || !store_name.trim()) return res.status(400).json({ message: 'Nom de store requis.' });
    const [users] = await pool.query('SELECT id FROM users WHERE id = ?', [req.params.id]);
    if (users.length === 0) return res.status(404).json({ message: 'Utilisateur introuvable.' });
    await pool.query('UPDATE users SET store_name = ? WHERE id = ?', [store_name.trim(), req.params.id]);
    res.json({ message: 'Nom de store mis a jour avec succes.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ---- Installments (admin confirm/reject) ----


// ---- Newsletter ----
router.post('/newsletter/send', authenticate, adminOnly, async (req, res) => {
  try {
    const { title, content, emails } = req.body;
    if (!title || !content || !emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ message: 'Titre, contenu et liste d\'emails requis.' });
    }
    const { send: mailSend, newsletter: newsletterTpl } = require('../emails');
    let sent = 0;
    for (const email of emails) {
      try {
        await mailSend({
          to: email,
          subject: title,
          html: newsletterTpl({ title, content, unsubscribeLink: `https://www.occasionetgarantie.store/unsubscribe?email=${encodeURIComponent(email)}` }),
        });
        sent++;
      } catch (e) { console.log('Newsletter send failed for', email, e.message); }
    }
    res.json({ message: `Newsletter envoyee a ${sent}/${emails.length} destinataires.` });
  } catch (err) {
    console.error('Newsletter error:', err.message);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.get('/vendor-logs', authenticate, adminOnly, async (req, res) => {
  try {
      try { await pool.query(`CREATE TABLE IF NOT EXISTS vendor_activity_log (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      action VARCHAR(50) NOT NULL,
      ip_address VARCHAR(45) DEFAULT NULL,
      isp VARCHAR(200) DEFAULT NULL,
      city VARCHAR(100) DEFAULT NULL,
      region VARCHAR(100) DEFAULT NULL,
      country VARCHAR(100) DEFAULT NULL,
      is_vpn TINYINT(1) DEFAULT 0,
      is_datacenter TINYINT(1) DEFAULT 0,
      vpn_warned_at DATETIME DEFAULT NULL,
      user_agent TEXT DEFAULT NULL,
      product_id INT DEFAULT NULL,
      details TEXT DEFAULT NULL,
      latitude DECIMAL(10,7) DEFAULT NULL,
      longitude DECIMAL(10,7) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`); } catch (e) { console.log('vendor_activity_log table:', e.message); }
    try { await pool.query('ALTER TABLE vendor_activity_log ADD COLUMN isp VARCHAR(200) DEFAULT NULL'); } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') console.log('isp col:', e.message); }
    try { await pool.query('ALTER TABLE vendor_activity_log ADD COLUMN city VARCHAR(100) DEFAULT NULL'); } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') console.log('city col:', e.message); }
    try { await pool.query('ALTER TABLE vendor_activity_log ADD COLUMN region VARCHAR(100) DEFAULT NULL'); } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') console.log('region col:', e.message); }
    try { await pool.query('ALTER TABLE vendor_activity_log ADD COLUMN country VARCHAR(100) DEFAULT NULL'); } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') console.log('country col:', e.message); }
    try { await pool.query('ALTER TABLE vendor_activity_log ADD COLUMN is_vpn TINYINT(1) DEFAULT 0'); } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') console.log('is_vpn col:', e.message); }
    try { await pool.query('ALTER TABLE vendor_activity_log ADD COLUMN vpn_warned_at DATETIME DEFAULT NULL'); } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') console.log('vpn_warned_at col:', e.message); }
    try { await pool.query('ALTER TABLE vendor_activity_log ADD COLUMN latitude DECIMAL(10,7) DEFAULT NULL'); } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') console.log('latitude col:', e.message); }
    try { await pool.query('ALTER TABLE vendor_activity_log ADD COLUMN longitude DECIMAL(10,7) DEFAULT NULL'); } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') console.log('longitude col:', e.message); }

    const [rows] = await pool.query(
      `SELECT l.*, u.full_name, u.store_name, u.email, u.phone
       FROM vendor_activity_log l
       LEFT JOIN users u ON l.user_id = u.id
       ORDER BY l.created_at DESC LIMIT 200`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Removed debug endpoint

router.post('/vendor-logs/reindex', authenticate, adminOnly, async (req, res) => {
  try {
    const { resolveIp } = require('../services/tracker');
    let rows = [];
    try {
      [rows] = await pool.query('SELECT id, ip_address, user_id FROM vendor_activity_log');
    } catch (selErr) {
      return res.status(500).json({ message: 'Erreur SELECT reindex.', error: selErr.message, sql: selErr.sql || 'SELECT id, ip_address FROM vendor_activity_log' });
    }
    let done = 0;
    const vpnUsers = new Set();
    for (const row of rows) {
      try {
        const info = await resolveIp(row.ip_address, true);
        const isVpn = info.isVpn ? 1 : 0;
        await pool.query(
          'UPDATE vendor_activity_log SET isp = ?, city = ?, region = ?, country = ?, is_vpn = ?, is_datacenter = ?, latitude = COALESCE(latitude, ?), longitude = COALESCE(longitude, ?) WHERE id = ?',
          [info.isp, info.city, info.region, info.country, isVpn, info.isDatacenter ? 1 : 0, info.latitude, info.longitude, row.id]
        );
        if (isVpn && row.user_id) vpnUsers.add(row.user_id);
        done++;
      } catch (rowErr) {
        console.error('Reindex row error:', row.id, row.ip_address, rowErr.message);
      }
    }
    if (vpnUsers.size > 0) {
      try { await pool.query("ALTER TABLE users ADD COLUMN has_vpn_history TINYINT(1) DEFAULT 0"); } catch (e) {}
      for (const uid of vpnUsers) {
        await pool.query('UPDATE users SET has_vpn_history = 1 WHERE id = ?', [uid]);
      }
    }
    res.json({ reindexed: done, total: rows.length, vpn_users_found: vpnUsers.size });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// -- Managed Vendors (comptes vendeur créés par l'admin) --

router.get('/managed-vendors', authenticate, adminOnly, async (req, res) => {
  try {
    try { await pool.query("ALTER TABLE users ADD COLUMN admin_managed_id INT DEFAULT NULL"); } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') {} }
    try { await pool.query("ALTER TABLE users ADD COLUMN ville VARCHAR(100) DEFAULT NULL"); } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') {} }
    const [rows] = await pool.query(
      `SELECT id, full_name, store_name, email, phone, ville, created_at FROM users WHERE admin_managed_id IS NOT NULL ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.post('/managed-vendors', authenticate, adminOnly, async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    try { await pool.query("ALTER TABLE users ADD COLUMN admin_managed_id INT DEFAULT NULL"); } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') {} }
    try { await pool.query("ALTER TABLE users ADD COLUMN ville VARCHAR(100) DEFAULT NULL"); } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') {} }
    const { full_name, store_name, ville } = req.body;
    const rawPw = Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 8);
    const password = await bcrypt.hash(rawPw, 10);
    const email = `vendeur-${Date.now()}@occasionetgarantie.store`;
    const [result] = await pool.query(
      `INSERT INTO users (full_name, store_name, email, password, phone, role, phone_verified, admin_managed_id, ville, created_at) VALUES (?, ?, ?, ?, ?, 'seller', 1, ?, ?, NOW())`,
      [full_name || 'Vendeur', store_name || null, email, password, null, req.user.id, ville || null]
    );
    res.json({ id: result.insertId, email, password: rawPw, full_name, store_name, ville });
  } catch (err) {
    res.status(500).json({ message: 'Erreur creation vendeur.', error: err.message });
  }
});

router.delete('/managed-vendors/:id', authenticate, adminOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = ? AND admin_managed_id IS NOT NULL', [req.params.id]);
    res.json({ message: 'Vendeur supprime.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur suppression.', error: err.message });
  }
});

router.post('/managed-vendors/:id/reset-password', authenticate, adminOnly, async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const [vendors] = await pool.query('SELECT id, full_name, email FROM users WHERE id = ? AND admin_managed_id IS NOT NULL', [req.params.id]);
    if (vendors.length === 0) return res.status(404).json({ message: 'Vendeur introuvable.' });
    const rawPw = Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 8);
    const password = await bcrypt.hash(rawPw, 10);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [password, req.params.id]);
    res.json({ id: vendors[0].id, email: vendors[0].email, password: rawPw, full_name: vendors[0].full_name });
  } catch (err) {
    res.status(500).json({ message: 'Erreur reinitialisation.', error: err.message });
  }
});

module.exports = router;
