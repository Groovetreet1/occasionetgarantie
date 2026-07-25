const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { send, newsletter } = require('../emails');

router.post('/', authenticate, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) return res.status(400).json({ message: 'Message requis.' });

    // Ensure table + columns exist
    try {
      await pool.query(`CREATE TABLE IF NOT EXISTS contact_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`);
    } catch (tableErr) {
      console.log('contact_messages table check:', tableErr.message);
    }
    try {
      await pool.query('ALTER TABLE contact_messages ADD COLUMN user_id INT NOT NULL');
    } catch (e) {
      if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') console.log('user_id col check:', e.message);
    }

    const [users] = await pool.query('SELECT full_name, email FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) return res.status(400).json({ message: 'Utilisateur introuvable.' });

    const { full_name, email } = users[0];

    await pool.query(
      'INSERT INTO contact_messages (user_id, name, email, message) VALUES (?, ?, ?, ?)',
      [req.user.id, full_name, email, message.trim()]
    );

    try {
      await send({
        to: process.env.CONTACT_EMAIL || 'contact-occasionetgarantie@proton.me',
        subject: `[Occasion & Garantie] Message de ${full_name}`,
        html: `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"></head><body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f5f7fa"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px"><tr><td align="center"><table role="presentation" width="100%" style="max-width:480px;background:#fff;border-radius:12px;padding:32px"><tr><td><h1 style="font-size:18px;color:#1a1a2e;margin:0 0 16px">Nouveau message de contact</h1><table cellpadding="8"><tr><td style="font-size:13px;color:#64748b;width:60px">Nom</td><td style="font-size:14px;font-weight:600;color:#1a1a2e">${full_name}</td></tr><tr><td style="font-size:13px;color:#64748b">Email</td><td style="font-size:14px;color:#2563eb">${email}</td></tr></table><div style="margin-top:16px;padding:16px;background:#f8fafc;border-radius:8px;font-size:14px;color:#475569;line-height:1.6">${message.replace(/\n/g, '<br>')}</div></td></tr></table></td></tr></table></body></html>`,
      });
    } catch (mailErr) {
      console.log('Email notification skipped:', mailErr.message);
    }

    res.json({ message: 'Message envoye avec succes.' });
  } catch (err) {
    const detail = err.sqlMessage || err.message || 'Erreur inconnue';
    console.error('POST /contact error:', detail);
    res.status(500).json({ message: 'Erreur serveur.', detail });
  }
});

module.exports = router;
