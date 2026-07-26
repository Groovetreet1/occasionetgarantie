const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { send } = require('../emails');

router.post('/', async (req, res) => {
  try {
    const { name, message } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'Nom requis.' });
    if (!message || !message.trim()) return res.status(400).json({ message: 'Message requis.' });

    try {
      await pool.query(`CREATE TABLE IF NOT EXISTS support_tickets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`);
    } catch (tableErr) {
      console.log('support_tickets table check:', tableErr.message);
    }

    await pool.query(
      'INSERT INTO support_tickets (name, message) VALUES (?, ?)',
      [name.trim(), message.trim()]
    );

    try {
      await send({
        to: process.env.CONTACT_EMAIL || 'contact-occasionetgarantie@proton.me',
        subject: `[Support] Nouveau ticket de ${name.trim()}`,
        html: `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"></head><body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f8f9fc"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px"><tr><td align="center"><table role="presentation" width="100%" style="max-width:480px;background:#fff;border-radius:12px;padding:32px"><tr><td><h1 style="font-size:18px;color:#1e293b;margin:0 0 16px">Nouveau ticket support</h1><table cellpadding="8"><tr><td style="font-size:13px;color:#64748b;width:60px">Nom</td><td style="font-size:14px;font-weight:600;color:#1e293b">${name.trim()}</td></tr></table><div style="margin-top:16px;padding:16px;background:#f0f1f5;border-radius:8px;font-size:14px;color:#1e293b;line-height:1.6">${message.replace(/\n/g, '<br>')}</div><p style="font-size:12px;color:#94a3b8;margin-top:16px">Repondez a cet email pour repondre au ticket.</p></td></tr></table></td></tr></table></body></html>`,
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
