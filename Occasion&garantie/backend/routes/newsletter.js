const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.post('/subscribe', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email requis.' });
    try {
      await pool.query('INSERT INTO newsletter_subscribers (email) VALUES (?)', [email]);
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY' || e.errno === 1062) {
        return res.status(200).json({ message: 'Deja inscrit.' });
      }
      if (e.code === 'ER_NO_SUCH_TABLE' || e.errno === 1146) {
        await pool.query(`CREATE TABLE IF NOT EXISTS newsletter_subscribers (
          id INT AUTO_INCREMENT PRIMARY KEY,
          email VARCHAR(255) NOT NULL UNIQUE,
          subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          is_active BOOLEAN DEFAULT TRUE
        )`);
        await pool.query('INSERT INTO newsletter_subscribers (email) VALUES (?)', [email]);
      } else {
        throw e;
      }
    }
    res.json({ message: 'Inscription reussie.' });
  } catch (err) {
    console.error('Newsletter subscribe error:', err.message);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;
