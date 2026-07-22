const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

const RESERVATION_AMOUNT = 200;

router.post('/', authenticate, async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ message: 'ID produit requis.' });

    const [products] = await pool.query('SELECT id, name, price FROM products WHERE id = ? AND active = TRUE', [productId]);
    if (products.length === 0) return res.status(404).json({ message: 'Produit introuvable.' });

    const [existing] = await pool.query('SELECT id FROM reservations WHERE user_id = ? AND product_id = ? AND status = ?', [req.user.id, productId, 'en_attente']);
    if (existing.length > 0) return res.status(400).json({ message: 'Vous avez deja une reservation en attente pour ce produit.' });

    const [result] = await pool.query(
      'INSERT INTO reservations (user_id, product_id, amount, status) VALUES (?, ?, ?, ?)',
      [req.user.id, productId, RESERVATION_AMOUNT, 'en_attente']
    );

    res.status(201).json({
      message: `Reservation creee. Versez ${RESERVATION_AMOUNT} DH pour confirmer.`,
      reservationId: result.insertId,
      amount: RESERVATION_AMOUNT
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.get('/mine', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT r.*, p.name as product_name, p.price as product_price FROM reservations r JOIN products p ON r.product_id = p.id WHERE r.user_id = ? ORDER BY r.created_at DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;
