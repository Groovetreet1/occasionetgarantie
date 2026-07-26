const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const router = express.Router();
const pool = require('../config/db');
const { send } = require('../emails');
const { authenticate, adminOnly } = require('../middleware/auth');
const DAILY_LIMIT = 5;

async function generateTicketNumber() {
  for (let i = 0; i < 50; i++) {
    const num = crypto.randomInt(1000000000, 9999999999).toString();
    const [rows] = await pool.query('SELECT id FROM support_tickets WHERE ticket_number = ?', [num]);
    if (rows.length === 0) return num;
  }
  return Date.now().toString().slice(-10);
}

function getUserIdFromReq(req) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) return null;
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.id;
  } catch { return null; }
}

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
}

router.post('/', async (req, res) => {
  try {
    const { name, message } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'Nom requis.' });
    if (!message || !message.trim()) return res.status(400).json({ message: 'Message requis.' });

    try {
      await pool.query(`CREATE TABLE IF NOT EXISTS support_tickets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ticket_number VARCHAR(10) NOT NULL UNIQUE,
        user_id INT DEFAULT NULL,
        ip_address VARCHAR(45) DEFAULT NULL,
        name VARCHAR(100) NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`);
      try { await pool.query('ALTER TABLE support_tickets ADD COLUMN ticket_number VARCHAR(10) NOT NULL UNIQUE'); } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') console.log('ticket_number col:', e.message); }
      try { await pool.query('ALTER TABLE support_tickets ADD COLUMN user_id INT DEFAULT NULL'); } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') console.log('user_id col:', e.message); }
      try { await pool.query('ALTER TABLE support_tickets ADD COLUMN ip_address VARCHAR(45) DEFAULT NULL'); } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') console.log('ip_address col:', e.message); }
    } catch (tableErr) {
      console.log('support_tickets table check:', tableErr.message);
    }

    const userId = getUserIdFromReq(req);
    const ip = getClientIp(req);
    const today = new Date().toISOString().slice(0, 10);

    let count;
    if (userId) {
      [count] = await pool.query('SELECT COUNT(*) as cnt FROM support_tickets WHERE user_id = ? AND DATE(created_at) = ?', [userId, today]);
    } else {
      [count] = await pool.query('SELECT COUNT(*) as cnt FROM support_tickets WHERE ip_address = ? AND DATE(created_at) = ?', [ip, today]);
    }
    if (count[0].cnt >= DAILY_LIMIT) {
      return res.status(429).json({ message: `Limite de ${DAILY_LIMIT} tickets par jour atteinte. Reessayez demain.` });
    }

    const ticketNumber = await generateTicketNumber();

    await pool.query(
      'INSERT INTO support_tickets (ticket_number, user_id, ip_address, name, message) VALUES (?, ?, ?, ?, ?)',
      [ticketNumber, userId, userId ? null : ip, name.trim(), message.trim()]
    );

    try {
      await send({
        to: process.env.CONTACT_EMAIL || 'contact-occasionetgarantie@proton.me',
        subject: `[Support] Ticket #${ticketNumber} - ${name.trim()}`,
        html: `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"></head><body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f8f9fc"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px"><tr><td align="center"><table role="presentation" width="100%" style="max-width:480px;background:#fff;border-radius:12px;padding:32px"><tr><td><h1 style="font-size:18px;color:#1e293b;margin:0 0 8px">Nouveau ticket support</h1><p style="font-size:14px;color:#f59e0b;font-weight:700;margin:0 0 16px">Ticket #${ticketNumber}</p><table cellpadding="8"><tr><td style="font-size:13px;color:#64748b;width:60px">Nom</td><td style="font-size:14px;font-weight:600;color:#1e293b">${name.trim()}</td></tr></table><div style="margin-top:16px;padding:16px;background:#f0f1f5;border-radius:8px;font-size:14px;color:#1e293b;line-height:1.6">${message.replace(/\n/g, '<br>')}</div><p style="font-size:12px;color:#94a3b8;margin-top:16px">Repondez a cet email pour repondre au ticket #${ticketNumber}.</p></td></tr></table></td></tr></table></body></html>`,
      });
    } catch (mailErr) {
      console.log('Email notification skipped:', mailErr.message);
    }

    res.json({ message: 'Message envoye avec succes.', ticketNumber });
  } catch (err) {
    const detail = err.sqlMessage || err.message || 'Erreur inconnue';
    console.error('POST /contact error:', detail);
    res.status(500).json({ message: 'Erreur serveur.', detail });
  }
});

router.get('/tickets', authenticate, adminOnly, async (req, res) => {
  try {
    const [tickets] = await pool.query('SELECT * FROM support_tickets ORDER BY created_at DESC');
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.get('/tickets/:ticketNumber', authenticate, adminOnly, async (req, res) => {
  try {
    const [tickets] = await pool.query('SELECT * FROM support_tickets WHERE ticket_number = ?', [req.params.ticketNumber]);
    if (tickets.length === 0) return res.status(404).json({ message: 'Ticket introuvable.' });
    res.json(tickets[0]);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;
