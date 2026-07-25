const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate, adminOnly } = require('../middleware/auth');
const gomobile = require('../services/gomobile');
const { send, creditConfirmed } = require('../emails');
const { destroy: cloudDestroy, USE_CLOUDINARY } = require('../services/uploader');

router.post('/clean-db', authenticate, adminOnly, async (req, res) => {
  try {
    const tables = [
      'messages', 'conversations', 'product_images', 'order_items', 'orders',
      'premium_payments', 'commissions', 'credit_transactions', 'credit_purchases',
      'installments', 'contact_messages', 'reservations', 'products'
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
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
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
    res.status(500).json({ message: 'Erreur serveur.', detail: err.sqlMessage || err.message });
  }
});

// ---- Admin stats ----
router.get('/products', authenticate, adminOnly, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT p.*, u.full_name as seller_name, u.store_name FROM products p LEFT JOIN users u ON p.user_id = u.id ORDER BY p.id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.get('/users', authenticate, adminOnly, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, full_name, email, phone, role, phone_verified, created_at, store_name, premium, credit_balance, terms_accepted FROM users ORDER BY id ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ---- Installments (admin confirm/reject) ----
router.get('/installments', authenticate, adminOnly, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT i.*, p.name as product_name, p.price as product_price, u.full_name as buyer_name, u.email as buyer_email, u.phone as buyer_phone, s.store_name as seller_name
       FROM installments i
       JOIN products p ON i.product_id = p.id
       JOIN users u ON i.buyer_id = u.id
       LEFT JOIN users s ON i.seller_id = s.id
       ORDER BY i.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

router.post('/installments/:id/confirm', authenticate, adminOnly, async (req, res) => {
  try {
    const instId = Number(req.params.id);
    const [rows] = await pool.query('SELECT * FROM installments WHERE id = ?', [instId]);
    if (rows.length === 0) return res.status(404).json({ message: 'Demande introuvable.' });
    if (rows[0].status !== 'en_attente') return res.status(400).json({ message: 'Deja traitee.' });
    await pool.query('UPDATE installments SET status = ? WHERE id = ?', ['actif', instId]);
    res.json({ message: 'Paiement echelonne confirme.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.post('/installments/:id/reject', authenticate, adminOnly, async (req, res) => {
  try {
    const instId = Number(req.params.id);
    const { reason } = req.body;
    const [rows] = await pool.query('SELECT * FROM installments WHERE id = ?', [instId]);
    if (rows.length === 0) return res.status(404).json({ message: 'Demande introuvable.' });
    if (rows[0].status !== 'en_attente') return res.status(400).json({ message: 'Deja traitee.' });
    await pool.query('UPDATE installments SET status = ?, rejection_reason = ? WHERE id = ?', ['rejete', reason || 'Demande refuse.', instId]);
    res.json({ message: 'Demande de paiement echelonne refuse.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

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

module.exports = router;
