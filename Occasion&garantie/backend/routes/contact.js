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
    const { name, message, email } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'Nom requis.' });
    if (!message || !message.trim()) return res.status(400).json({ message: 'Message requis.' });

    try {
      await pool.query(`CREATE TABLE IF NOT EXISTS support_tickets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ticket_number VARCHAR(10) NOT NULL UNIQUE,
        user_id INT DEFAULT NULL,
        email VARCHAR(200) DEFAULT NULL,
        ip_address VARCHAR(45) DEFAULT NULL,
        name VARCHAR(100) NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`);
      try { await pool.query('ALTER TABLE support_tickets ADD COLUMN ticket_number VARCHAR(10) NOT NULL UNIQUE'); } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') console.log('ticket_number col:', e.message); }
      try { await pool.query('ALTER TABLE support_tickets ADD COLUMN user_id INT DEFAULT NULL'); } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') console.log('user_id col:', e.message); }
      try { await pool.query('ALTER TABLE support_tickets ADD COLUMN email VARCHAR(200) DEFAULT NULL'); } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') console.log('email col:', e.message); }
      try { await pool.query('ALTER TABLE support_tickets ADD COLUMN ip_address VARCHAR(45) DEFAULT NULL'); } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') console.log('ip_address col:', e.message); }
    } catch (tableErr) {
      console.log('support_tickets table check:', tableErr.message);
    }

    const userId = getUserIdFromReq(req);
    const ip = getClientIp(req);
    const today = new Date().toISOString().slice(0, 10);

    let userEmail = email || null;
    if (userId) {
      const [users] = await pool.query('SELECT email FROM users WHERE id = ?', [userId]);
      if (users.length > 0) userEmail = users[0].email;
    }
    if (!userEmail) return res.status(400).json({ message: 'Email requis.' });

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
      'INSERT INTO support_tickets (ticket_number, user_id, email, ip_address, name, message) VALUES (?, ?, ?, ?, ?, ?)',
      [ticketNumber, userId, userEmail, userId ? null : ip, name.trim(), message.trim()]
    );

    res.json({ message: 'Message envoye avec succes.', ticketNumber });
  } catch (err) {
    const detail = err.sqlMessage || err.message || 'Erreur inconnue';
    console.error('POST /contact error:', detail);
    res.status(500).json({ message: 'Erreur serveur.', detail });
  }
});

router.post('/reply/:ticketNumber', authenticate, adminOnly, async (req, res) => {
  try {
    const { reply } = req.body;
    if (!reply || !reply.trim()) return res.status(400).json({ message: 'Reponse requise.' });

    const [tickets] = await pool.query('SELECT * FROM support_tickets WHERE ticket_number = ?', [req.params.ticketNumber]);
    if (tickets.length === 0) return res.status(404).json({ message: 'Ticket introuvable.' });

    const ticket = tickets[0];
    if (!ticket.email) return res.status(400).json({ message: 'Aucun email associe a ce ticket.' });

    const SUPPORT_EMAIL = 'contact@contact.occasionetgarantie.store';

    const [admins] = await pool.query('SELECT full_name FROM users WHERE id = ?', [req.user.id]);
    const adminName = admins.length > 0 ? admins[0].full_name : 'Support';

    try {
      await pool.query('ALTER TABLE support_tickets ADD COLUMN replied_at TIMESTAMP NULL DEFAULT NULL');
    } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') console.log('replied_at col:', e.message); }

    await pool.query('UPDATE support_tickets SET replied_at = NOW() WHERE ticket_number = ?', [ticket.ticket_number]);

    await send({
      to: ticket.email,
      subject: `Re: Votre ticket #${ticket.ticket_number} - Occasion & Garantie`,
      html: `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"></head><body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f8f9fc"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px"><tr><td align="center"><table role="presentation" width="100%" style="max-width:480px;background:#fff;border-radius:12px;padding:32px"><tr><td><h1 style="font-size:18px;color:#1e293b;margin:0 0 8px">Reponse a votre ticket #${ticket.ticket_number}</h1><div style="margin-bottom:16px;padding:12px;background:#f0f1f5;border-radius:8px;font-size:13px;color:#64748b"><strong>Votre message :</strong><br>${ticket.message.replace(/\n/g, '<br>')}</div><div style="padding:16px;background:rgba(37,99,235,0.05);border:1px solid rgba(37,99,235,0.15);border-radius:8px;font-size:14px;color:#1e293b;line-height:1.6">${reply.replace(/\n/g, '<br>')}</div><p style="font-size:12px;color:#94a3b8;margin-top:16px">L equipe ${adminName} - Occasion & Garantie</p></td></tr></table></td></tr></table></body></html>`,
    });

    res.json({ message: 'Reponse envoyee avec succes.' });
  } catch (err) {
    const detail = err.sqlMessage || err.message || 'Erreur inconnue';
    console.error('POST /contact/reply error:', detail);
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
