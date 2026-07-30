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

const GSM = 'https://fdn2.gsmarena.com/vv/bigpic/';
const seedProducts = [
  { name: 'Samsung Galaxy A07 2026', brand: 'Samsung', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 10, slug: 'samsung-galaxy-a07-2026', price: 1, description: 'Le Samsung Galaxy A07 2026 est un smartphone d\'entrée de gamme avec écran HD+ 6.5 pouces, batterie 5000mAh et double appareil photo 50MP+2MP.', image: GSM + 'samsung-galaxy-a07-5g.jpg' },
  { name: 'Samsung Galaxy A17 2026', brand: 'Samsung', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 10, slug: 'samsung-galaxy-a17-2026', price: 1, description: 'Le Samsung Galaxy A17 2026 offre un écran Super AMOLED 6.6 pouces 90Hz, processeur octa-core et triple appareil photo 50MP+5MP+2MP.', image: GSM + 'samsung-galaxy-a17-5g.jpg' },
  { name: 'Samsung Galaxy S26', brand: 'Samsung', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 5, slug: 'samsung-galaxy-s26', price: 1, description: 'Le Samsung Galaxy S26 2026 est un flagship avec écran Dynamic AMOLED 6.7 pouces 120Hz, processeur Exynos 2600 et quadruple appareil photo 200MP+50MP+12MP+10MP.', image: GSM + 'samsung-galaxy-s26.jpg' },
  { name: 'Samsung Galaxy S26 Ultra', brand: 'Samsung', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 3, slug: 'samsung-galaxy-s26-ultra', price: 1, description: 'Le Samsung Galaxy S26 Ultra 2026 est le smartphone le plus avancé avec écran 6.9 pouces 120Hz LTPO AMOLED, processeur Exynos 2600, stylet S-PEN intégré et appareil photo 300MP avec zoom spatial 100x.', image: GSM + 'samsung-galaxy-s26-ultra-new.jpg' },
  { name: 'Samsung Galaxy A26 2026', brand: 'Samsung', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 10, slug: 'samsung-galaxy-a26-2026', price: 1, description: 'Smartphone Samsung Galaxy A26 2026 avec écran Super AMOLED 6.7 pouces 120Hz, batterie 5000mAh et charge rapide 25W.', image: GSM + 'samsung-galaxy-a26.jpg' },
  { name: 'Samsung Galaxy A56 2026', brand: 'Samsung', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 8, slug: 'samsung-galaxy-a56-2026', price: 1, description: 'Samsung Galaxy A56 2026 avec écran Super AMOLED 120Hz, processeur Exynos 1580 et appareil photo 50MP OIS + 12MP + 5MP.', image: GSM + 'samsung-galaxy-a56-.jpg' },
  { name: 'Samsung Galaxy Tab S10 FE 2026', brand: 'Samsung', category_id: 2, state: 'neuf', warranty: '12 mois', stock: 5, slug: 'samsung-galaxy-tab-s10-fe-2026', price: 1, description: 'Tablette Samsung Galaxy Tab S10 FE 2026 avec écran TFT 10.9 pouces, processeur Exynos 1580 et batterie 8000mAh.', image: GSM + 'samsung-galaxy-tab-s10-fe.jpg' },
  { name: 'Xiaomi Redmi Note 17T', brand: 'Xiaomi', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 10, slug: 'xiaomi-redmi-note-17t', price: 1, description: 'Xiaomi Redmi Note 17T 2026 avec écran AMOLED 120Hz 6.7 pouces 1.5K, batterie 5500mAh et charge rapide 67W.', image: GSM + 'xiaomi-redmi-note17-cn.jpg' },
  { name: 'Xiaomi Redmi Note 17T Pro', brand: 'Xiaomi', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 8, slug: 'xiaomi-redmi-note-17t-pro', price: 1, description: 'Xiaomi Redmi Note 17T Pro 2026 avec processeur Dimensity 8400 Ultra, écran AMOLED 1.5K 120Hz et appareil photo 200MP OIS.', image: GSM + 'xiaomi-redmi-note17-cn.jpg' },
  { name: 'Xiaomi Redmi A7 Pro', brand: 'Xiaomi', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 15, slug: 'xiaomi-redmi-a7-pro', price: 1, description: 'Xiaomi Redmi A7 Pro 2026 avec écran HD+ 6.7 pouces 90Hz, batterie 5200mAh et processeur octa-core Helio G81.', image: GSM + 'xiaomi-redmi-a7-pro.jpg' },
  { name: 'Xiaomi 15T 2026', brand: 'Xiaomi', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 6, slug: 'xiaomi-15t-2026', price: 1, description: 'Xiaomi 15T 2026 avec écran AMOLED 144Hz 1.5K, processeur Snapdragon 8 Gen 4 et triple appareil photo Leica 50MP+50MP+12MP.', image: GSM + 'xiaomi-15t.jpg' },
  { name: 'Xiaomi 15T Pro 2026', brand: 'Xiaomi', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 4, slug: 'xiaomi-15t-pro-2026', price: 1, description: 'Xiaomi 15T Pro 2026 flagship avec processeur Snapdragon 8 Gen 4, écran AMOLED 2K 144Hz et batterie 6000mAh avec charge rapide 120W.', image: GSM + 'xiaomi-15t-pro.jpg' },
  { name: 'Xiaomi Pad 7S 2026', brand: 'Xiaomi', category_id: 2, state: 'neuf', warranty: '12 mois', stock: 5, slug: 'xiaomi-pad-7s-2026', price: 1, description: 'Tablette Xiaomi Pad 7S 2026 avec écran LCD 11 pouces 120Hz, processeur Snapdragon 8 Gen 4 et batterie 8850mAh.', image: GSM + 'xiaomi-pad-7s-pro-125.jpg' },
  { name: 'OPPO Find N6 2026', brand: 'OPPO', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 3, slug: 'oppo-find-n6-2026', price: 1, description: 'OPPO Find N6 2026 smartphone pliable avec écran pliable 7.8 pouces AMOLED 120Hz, processeur Snapdragon 8 Gen 4 et triple appareil photo Hasselblad.', image: GSM + 'oppo-find-n6.jpg' },
  { name: 'OPPO Find X9 Pro 2026', brand: 'OPPO', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 4, slug: 'oppo-find-x9-pro-2026', price: 1, description: 'OPPO Find X9 Pro 2026 flagship avec écran AMOLED 6.8 pouces 120Hz LTPO, processeur Snapdragon 8 Gen 4 et quadruple appareil photo Hasselblad 50MP+50MP+50MP+50MP.', image: GSM + 'oppo-find-x9-pro.jpg' },
  { name: 'OPPO Reno 15 2026', brand: 'OPPO', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 8, slug: 'oppo-reno-15-2026', price: 1, description: 'OPPO Reno 15 2026 avec écran AMOLED 120Hz, charge rapide 80W et appareil photo 50MP avec portrait expert IA.', image: GSM + 'oppo-reno15-global.jpg' },
  { name: 'OPPO Reno 15 Pro 2026', brand: 'OPPO', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 6, slug: 'oppo-reno-15-pro-2026', price: 1, description: 'OPPO Reno 15 Pro 2026 avec écran AMOLED 120Hz, processeur Dimensity 8400 et triple appareil photo 50MP+8MP+2MP.', image: GSM + 'oppo-reno15-pro.jpg' },
  { name: 'OPPO A80 2026', brand: 'OPPO', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 15, slug: 'oppo-a80-2026', price: 1, description: 'OPPO A80 2026 smartphone d\'entrée de gamme avec écran HD+ 6.7 pouces 90Hz et batterie 5100mAh.', image: GSM + 'oppo-a80.jpg' },
  { name: 'Motorola Edge 60 Ultra 2026', brand: 'Motorola', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 4, slug: 'motorola-edge-60-ultra-2026', price: 1, description: 'Motorola Edge 60 Ultra 2026 flagship avec écran pOLED 144Hz, processeur Snapdragon 8 Gen 4 et appareil photo 200MP OIS.', image: GSM + 'motorola-edge-60-fusion.jpg' },
  { name: 'Motorola Edge 60 2026', brand: 'Motorola', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 6, slug: 'motorola-edge-60-2026', price: 1, description: 'Motorola Edge 60 2026 avec écran pOLED 144Hz, batterie 5000mAh et processeur MediaTek Dimensity 8300.', image: GSM + 'motorola-edge-60.jpg' },
  { name: 'Motorola Moto G85 2026', brand: 'Motorola', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 12, slug: 'motorola-moto-g85-2026', price: 1, description: 'Motorola Moto G85 2026 avec écran pOLED 120Hz, batterie 5000mAh et appareil photo 50MP OIS.', image: GSM + 'motorola-moto-g85.jpg' },
  { name: 'Motorola Moto G35 2026', brand: 'Motorola', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 15, slug: 'motorola-moto-g35-2026', price: 1, description: 'Motorola Moto G35 2026 avec écran LCD 90Hz HD+, batterie 5000mAh et appareil photo 50MP.', image: GSM + 'motorola-moto-g35-5g.jpg' },
  { name: 'Motorola Razr 60 2026', brand: 'Motorola', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 3, slug: 'motorola-razr-60-2026', price: 1, description: 'Motorola Razr 60 2026 smartphone pliable avec écran pliable pOLED 6.9 pouces 120Hz et écran externe 3.6 pouces.', image: GSM + 'motorola-razr-60.jpg' },
  { name: 'Infinix Note 50 2026', brand: 'Infinix', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 12, slug: 'infinix-note-50-2026', price: 1, description: 'Infinix Note 50 2026 avec écran AMOLED 120Hz, batterie 6000mAh et charge rapide 33W.', image: GSM + 'infinix-note50.jpg' },
  { name: 'Infinix Note 50 Pro 2026', brand: 'Infinix', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 10, slug: 'infinix-note-50-pro-2026', price: 1, description: 'Infinix Note 50 Pro 2026 avec écran AMOLED 120Hz, processeur Helio G100 Ultimate et triple appareil photo 108MP+2MP+2MP.', image: GSM + 'infinix-note50-pro.jpg' },
  { name: 'Infinix Hot 50 2026', brand: 'Infinix', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 20, slug: 'infinix-hot-50-2026', price: 1, description: 'Infinix Hot 50 2026 avec écran HD+ 90Hz et batterie 6000mAh.', image: GSM + 'infinix-hot-50-4g.jpg' },
  { name: 'Infinix Hot 50 Pro 2026', brand: 'Infinix', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 15, slug: 'infinix-hot-50-pro-2026', price: 1, description: 'Infinix Hot 50 Pro 2026 avec écran AMOLED 120Hz et appareil photo 108MP.', image: GSM + 'infinix-hot-50-4g.jpg' },
  { name: 'Infinix Zero 50 2026', brand: 'Infinix', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 8, slug: 'infinix-zero-50-2026', price: 1, description: 'Infinix Zero 50 2026 flagship avec écran AMOLED 144Hz, processeur MediaTek Dimensity 8300 et appareil photo 108MP OIS.', image: GSM + 'infinix-hot-50-4g.jpg' },
  // ---- Ordinateurs (PC portables & de bureau) ----
  { name: 'Apple MacBook Air M4 2026', brand: 'Apple', category_id: 3, state: 'neuf', warranty: '12 mois', stock: 4, slug: 'apple-macbook-air-m4-2026', price: 1, description: 'Apple MacBook Air M4 2026 avec puce Apple M4, écran Liquid Retina 13.6 pouces, 16 Go RAM unifiée et SSD 256 Go.' },
  { name: 'HP Pavilion 15 2026', brand: 'HP', category_id: 3, state: 'neuf', warranty: '12 mois', stock: 8, slug: 'hp-pavilion-15-2026', price: 1, description: 'HP Pavilion 15 2026 avec processeur Intel Core i5, écran 15.6 pouces Full HD, 16 Go RAM et SSD 512 Go.' },
  { name: 'Dell Inspiron 16 2026', brand: 'Dell', category_id: 3, state: 'neuf', warranty: '12 mois', stock: 6, slug: 'dell-inspiron-16-2026', price: 1, description: 'Dell Inspiron 16 2026 avec processeur Intel Core i7, écran 16 pouces 2K, 16 Go RAM et SSD 1 To.' },
  { name: 'Lenovo IdeaPad 5 2026', brand: 'Lenovo', category_id: 3, state: 'neuf', warranty: '12 mois', stock: 7, slug: 'lenovo-ideapad-5-2026', price: 1, description: 'Lenovo IdeaPad 5 2026 avec processeur AMD Ryzen 7, écran 15.6 pouces Full HD IPS, 16 Go RAM et SSD 512 Go.' },
  { name: 'ASUS Vivobook 16 2026', brand: 'ASUS', category_id: 3, state: 'neuf', warranty: '12 mois', stock: 5, slug: 'asus-vivobook-16-2026', price: 1, description: 'ASUS Vivobook 16 2026 avec processeur Intel Core i5, écran 16 pouces OLED, 16 Go RAM et SSD 512 Go.' },
  { name: 'Acer Aspire 5 2026', brand: 'Acer', category_id: 3, state: 'neuf', warranty: '12 mois', stock: 10, slug: 'acer-aspire-5-2026', price: 1, description: 'Acer Aspire 5 2026 avec processeur Intel Core i5, écran 15.6 pouces Full HD, 8 Go RAM et SSD 256 Go.' },
  { name: 'HP Victus 16 2026', brand: 'HP', category_id: 3, state: 'neuf', warranty: '12 mois', stock: 3, slug: 'hp-victus-16-2026', price: 1, description: 'HP Victus 16 2026 PC gaming avec processeur Intel Core i7, GPU NVIDIA GeForce RTX 4060, 16 Go RAM et SSD 1 To.' },
  { name: 'Lenovo Legion 5 2026', brand: 'Lenovo', category_id: 3, state: 'neuf', warranty: '12 mois', stock: 3, slug: 'lenovo-legion-5-2026', price: 1, description: 'Lenovo Legion 5 2026 PC gaming avec processeur AMD Ryzen 7, GPU NVIDIA RTX 4070, écran 16 pouces 165Hz, 32 Go RAM et SSD 1 To.' },
  // ---- Tablettes supplémentaires ----
  { name: 'Apple iPad 11 (A16) 2025', brand: 'Apple', category_id: 2, state: 'neuf', warranty: '12 mois', stock: 10, slug: 'apple-ipad-11-a16-2025', price: 1, description: 'Apple iPad 11e génération avec puce A16 Bionic, écran Liquid Retina 11 pouces, 128 Go stockage.', image: GSM + 'apple-ipad-11-inch-2025.jpg' },
  { name: 'Apple iPad Air 11 (M3) 2025', brand: 'Apple', category_id: 2, state: 'neuf', warranty: '12 mois', stock: 6, slug: 'apple-ipad-air-11-m3-2025', price: 1, description: 'Apple iPad Air 11 pouces avec puce M3, écran Liquid Retina, 128 Go stockage.', image: GSM + 'apple-ipad-air-11-2025.jpg' },
  { name: 'Apple iPad Air 13 (M4) 2026', brand: 'Apple', category_id: 2, state: 'neuf', warranty: '12 mois', stock: 4, slug: 'apple-ipad-air-13-m4-2026', price: 1, description: 'Apple iPad Air 13 pouces avec puce M4, écran Liquid Retina, 12 Go RAM, 128 Go stockage.', image: GSM + 'apple-ipad-air-13-2025.jpg' },
  { name: 'Samsung Galaxy Tab S10+ 2026', brand: 'Samsung', category_id: 2, state: 'neuf', warranty: '12 mois', stock: 4, slug: 'samsung-galaxy-tab-s10-plus-2026', price: 1, description: 'Samsung Galaxy Tab S10+ 2026 avec écran Dynamic AMOLED 12.4 pouces 120Hz, processeur Dimensity 9300+, batterie 10090mAh.', image: GSM + 'samsung-galaxy-tab-s10-plus.jpg' },
  { name: 'Lenovo Tab P12 2026', brand: 'Lenovo', category_id: 2, state: 'neuf', warranty: '12 mois', stock: 5, slug: 'lenovo-tab-p12-2026', price: 1, description: 'Lenovo Tab P12 2026 avec écran 12.7 pouces 3K, processeur MediaTek Dimensity 7050, 8 Go RAM, 256 Go stockage.', image: GSM + 'lenovo-tab-p12.jpg' },
  { name: 'Huawei MatePad 11.5 S 2026', brand: 'Huawei', category_id: 2, state: 'neuf', warranty: '12 mois', stock: 6, slug: 'huawei-matepad-115-s-2026', price: 1, description: 'Huawei MatePad 11.5 S avec écran PaperMatte 11.5 pouces 144Hz, processeur Kirin 9000WL, batterie 8800mAh.', image: GSM + 'huawei-matepad-115-s.jpg' },
];
const seedSpecs = { Ecran: '6.7 pouces', Processeur: 'Octa-core 2.5GHz', RAM: '8 Go', Stockage: '256 Go', Batterie: '5000mAh', Couleur: 'Noir Cosmic' };

router.post('/seed', authenticate, adminOnly, async (req, res) => {
  try {
    let created = 0;
    for (const p of seedProducts) {
      const { name, brand, category_id, state, warranty, stock, slug, price, description, image } = p;
      const [existing] = await pool.query('SELECT id FROM products WHERE slug = ?', [slug]);
      if (existing.length > 0) continue;
      await pool.query(
        `INSERT INTO products (name, slug, description, price, category_id, seller_id, brand, state, warranty, stock, featured, specs, status, ville, approved, product_type, active, image)
         VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, 1, ?, 'disponible', 'Casablanca', 1, 'store', 1, ?)`,
        [name, slug, description, price, category_id, brand, state, warranty, stock, JSON.stringify(seedSpecs), image || null]
      );
      created++;
    }
    res.json({ message: `${created} produits Boutique Officielle créés.`, count: created });
  } catch (err) {
    res.status(500).json({ message: 'Erreur seed.', error: err.sqlMessage || err.message });
  }
});

module.exports = router;
