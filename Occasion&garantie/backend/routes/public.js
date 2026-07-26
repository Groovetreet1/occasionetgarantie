const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/stats', async (req, res) => {
  try {
    const [users] = await pool.query('SELECT COUNT(*) as cnt FROM users');
    const [products] = await pool.query('SELECT COUNT(*) as cnt FROM products');
    const [ratings] = await pool.query('SELECT ROUND(AVG(rating), 1) as avg FROM seller_ratings');
    const [orders] = await pool.query("SELECT COUNT(*) as cnt FROM orders WHERE status != 'annulee'").catch(() => [{ cnt: 0 }]);
    res.json({
      totalUsers: users[0].cnt,
      totalProducts: products[0].cnt,
      avgRating: ratings[0].avg || 5.0,
      totalOrders: orders[0]?.cnt || 0,
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;
