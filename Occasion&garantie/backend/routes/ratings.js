const express = require('express');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

(async () => {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS seller_ratings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      seller_id INT NOT NULL,
      user_id INT NOT NULL,
      rating TINYINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY unique_rating (seller_id, user_id)
    )`);
    console.log('seller_ratings table ready');
  } catch (e) {
    console.log('seller_ratings table check skipped:', e.message);
  }
})();

router.post('/', authenticate, async (req, res) => {
  try {
    const { seller_id, rating, comment } = req.body;
    if (!seller_id || !rating) return res.status(400).json({ message: 'seller_id et rating requis.' });
    if (rating < 1 || rating > 5) return res.status(400).json({ message: 'Rating must be 1-5.' });
    if (req.user.id === seller_id) return res.status(400).json({ message: 'Vous ne pouvez pas vous noter vous-meme.' });

    const [sellers] = await pool.query('SELECT id, role FROM users WHERE id = ?', [seller_id]);
    if (sellers.length === 0) return res.status(404).json({ message: 'Vendeur introuvable.' });

    const [existing] = await pool.query('SELECT id FROM seller_ratings WHERE seller_id = ? AND user_id = ?', [seller_id, req.user.id]);
    if (existing.length > 0) return res.status(400).json({ message: 'Vous avez deja note ce vendeur.' });

    await pool.query('INSERT INTO seller_ratings (seller_id, user_id, rating, comment) VALUES (?, ?, ?, ?)', [seller_id, req.user.id, rating, comment || null]);
    res.status(201).json({ message: 'Note ajoutee.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.get('/seller/:sellerId', async (req, res) => {
  try {
    const { sellerId } = req.params;
    const [rows] = await pool.query(
      'SELECT r.*, u.full_name, u.avatar FROM seller_ratings r JOIN users u ON r.user_id = u.id WHERE r.seller_id = ? ORDER BY r.created_at DESC',
      [sellerId]
    );
    const [stats] = await pool.query(
      'SELECT COUNT(*) as total, ROUND(AVG(rating), 1) as avg FROM seller_ratings WHERE seller_id = ?',
      [sellerId]
    );
    res.json({ ratings: rows, stats: stats[0] });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    if (!rating) return res.status(400).json({ message: 'Rating requis.' });
    if (rating < 1 || rating > 5) return res.status(400).json({ message: 'Rating must be 1-5.' });

    const [rows] = await pool.query('SELECT * FROM seller_ratings WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Avis introuvable.' });
    if (rows[0].user_id !== req.user.id) return res.status(403).json({ message: 'Vous ne pouvez modifier que votre propre avis.' });

    await pool.query('UPDATE seller_ratings SET rating = ?, comment = ? WHERE id = ?', [rating, comment || null, id]);
    res.json({ message: 'Avis modifie.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM seller_ratings WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Avis introuvable.' });
    if (rows[0].user_id !== req.user.id) return res.status(403).json({ message: 'Vous ne pouvez supprimer que votre propre avis.' });

    await pool.query('DELETE FROM seller_ratings WHERE id = ?', [id]);
    res.json({ message: 'Avis supprime.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.get('/my', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT r.*, u.full_name, u.avatar FROM seller_ratings r JOIN users u ON r.user_id = u.id WHERE r.seller_id = ? ORDER BY r.created_at DESC',
      [req.user.id]
    );
    const [stats] = await pool.query(
      'SELECT COUNT(*) as total, ROUND(AVG(rating), 1) as avg FROM seller_ratings WHERE seller_id = ?',
      [req.user.id]
    );
    res.json({ ratings: rows, stats: stats[0] });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;
