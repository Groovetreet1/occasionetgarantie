const express = require('express');
const router = express.Router();
const pool = require('../config/db');

(async () => {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS contact_messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(200) NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    console.log('contact_messages table ready');
  } catch (e) {
    console.log('contact_messages table check skipped:', e.message);
  }
})();

router.post('/', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'Nom requis.' });
    if (!email || !email.trim()) return res.status(400).json({ message: 'Email requis.' });
    if (!message || !message.trim()) return res.status(400).json({ message: 'Message requis.' });

    await pool.query(
      'INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)',
      [name.trim(), email.trim(), message.trim()]
    );

    try {
      const nodemailer = require('nodemailer');
      if (process.env.SMTP_HOST) {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        });
        await transporter.sendMail({
          from: `"${name}" <${email}>`,
          to: process.env.CONTACT_EMAIL || 'contact-occasionetgarantie@proton.me',
          subject: `[Occasion & Garantie] Message de ${name}`,
          text: `Nom: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
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
