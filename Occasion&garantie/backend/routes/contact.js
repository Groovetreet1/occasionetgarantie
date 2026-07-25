const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) return res.status(400).json({ message: 'Message requis.' });

    // Ensure table exists (handles first-time use on fresh DB)
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

    const [users] = await pool.query('SELECT full_name, email FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) return res.status(400).json({ message: 'Utilisateur introuvable.' });

    const { full_name, email } = users[0];

    await pool.query(
      'INSERT INTO contact_messages (user_id, name, email, message) VALUES (?, ?, ?, ?)',
      [req.user.id, full_name, email, message.trim()]
    );

    try {
      if (process.env.RESEND_API_KEY) {
        const { Resend } = require('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: 'Occasion & Garantie <contact@occasionetgarantie.store>',
          to: process.env.CONTACT_EMAIL || 'contact-occasionetgarantie@proton.me',
          subject: `[Occasion & Garantie] Message de ${full_name}`,
          text: `Nom: ${full_name}\nEmail: ${email}\n\nMessage:\n${message}`,
        });
      }
    } catch (mailErr) {
      console.log('Email notification skipped:', mailErr.message);
    }

    res.json({ message: 'Message envoye avec succes.' });
  } catch (err) {
    console.error('POST /contact:', err.message);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;
