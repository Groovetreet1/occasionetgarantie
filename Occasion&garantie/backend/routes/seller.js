const express = require('express');
const pool = require('../config/db');
const { authenticate, sellerOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Get seller's own profile + stats
router.get('/me', authenticate, async (req, res) => {
  if (req.user.role !== 'seller' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Accès réservé aux vendeurs.' });
  }
  try {
    const [users] = await pool.query(
      'SELECT id, full_name, email, phone, store_name, store_logo, avatar, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (users.length === 0) return res.status(404).json({ message: 'Utilisateur introuvable.' });
    const [products] = await pool.query(
      'SELECT COUNT(*) as total, SUM(CASE WHEN active=TRUE THEN 1 ELSE 0 END) as active_count FROM products WHERE seller_id = ?',
      [req.user.id]
    );
    const [recent] = await pool.query(
      'SELECT id, name, price, active, created_at FROM products WHERE seller_id = ? ORDER BY created_at DESC LIMIT 5',
      [req.user.id]
    );
    res.json({ ...users[0], stats: products[0], recentProducts: recent });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

// Update seller profile
router.put('/me', authenticate, async (req, res) => {
  if (req.user.role !== 'seller' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Accès réservé aux vendeurs.' });
  }
  try {
    const { store_name, store_logo } = req.body;
    await pool.query('UPDATE users SET store_name = ?, store_logo = ? WHERE id = ?', [store_name || null, store_logo || null, req.user.id]);
    res.json({ message: 'Profil vendeur mis à jour.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

// Get seller's own products (including inactive)
router.get('/me/products', authenticate, async (req, res) => {
  if (req.user.role !== 'seller' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Accès réservé aux vendeurs.' });
  }
  try {
    const [rows] = await pool.query(
      `SELECT p.*, c.name as category_name FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.seller_id = ? ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

// Public seller profile
router.get('/:id', async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, full_name, store_name, store_logo, avatar, created_at, premium FROM users WHERE id = ? AND role = ?',
      [req.params.id, 'seller']
    );
    if (users.length === 0) return res.status(404).json({ message: 'Vendeur introuvable.' });
    const [count] = await pool.query(
      'SELECT COUNT(*) as total FROM products WHERE seller_id = ? AND active = TRUE',
      [req.params.id]
    );
    const [rating] = await pool.query(
      'SELECT COUNT(*) as rating_count, ROUND(AVG(rating), 1) as rating_avg FROM seller_ratings WHERE seller_id = ?',
      [req.params.id]
    );
    res.json({ ...users[0], productCount: count[0].total, ...rating[0] });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

// Public seller products
router.get('/:id/products', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, c.name as category_name, u.premium as seller_premium FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       JOIN users u ON u.id = p.seller_id
       WHERE p.seller_id = ? AND p.active = TRUE ORDER BY RAND()`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

// Get seller commissions
router.get('/me/commissions', authenticate, async (req, res) => {
  if (req.user.role !== 'seller' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Accès réservé aux vendeurs.' });
  }
  try {
    const [rows] = await pool.query(
      `SELECT c.*, p.name as product_name FROM commissions c
       LEFT JOIN products p ON c.product_id = p.id
       WHERE c.seller_id = ? ORDER BY c.created_at DESC`,
      [req.user.id]
    );
    const [totalRow] = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as total_commission, COUNT(*) as count FROM commissions WHERE seller_id = ?',
      [req.user.id]
    );
    res.json({ commissions: rows, summary: totalRow[0] });
  } catch (err) {
    if (err.errno === 1146 || err.code === 'ER_NO_SUCH_TABLE') {
      return res.json({ commissions: [], summary: { total_commission: 0, count: 0 } });
    }
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

module.exports = router;
