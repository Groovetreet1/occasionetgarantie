const express = require('express');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

function isAdminOrSeller(req) {
  return req.user && (req.user.role === 'admin' || req.user.role === 'seller');
}

// Public: list products (only disponible)
router.get('/', async (req, res) => {
  try {
    const { category, search, min, max, state, sort, seller } = req.query;
    let sql = `
      SELECT p.*, c.name as category_name,
             u.store_name as seller_name, u.store_logo as seller_logo,
             (u.premium = 1 AND (u.premium_expires_at IS NULL OR u.premium_expires_at > NOW())) as seller_premium
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.seller_id = u.id
      WHERE p.active = TRUE AND p.status = 'disponible'
    `;
    const params = [];

    if (category) { sql += ' AND LOWER(c.name) = ?'; params.push(category.toLowerCase()); }
    if (search) { sql += ' AND (p.name LIKE ? OR p.description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    if (min) { sql += ' AND p.price >= ?'; params.push(min); }
    if (max) { sql += ' AND p.price <= ?'; params.push(max); }
    if (state) { sql += ' AND p.state = ?'; params.push(state); }
    if (seller) { sql += ' AND p.seller_id = ?'; params.push(seller); }

    if (sort === 'price_asc') sql += ' ORDER BY p.price ASC';
    else if (sort === 'price_desc') sql += ' ORDER BY p.price DESC';
    else if (sort === 'newest') sql += ' ORDER BY p.created_at DESC';
    else sql += ' ORDER BY seller_premium DESC, p.featured DESC, p.created_at DESC';

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

// Public: featured products (only disponible)
router.get('/featured', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, c.name as category_name, u.store_name as seller_name, u.store_logo as seller_logo,
              (u.premium = 1 AND (u.premium_expires_at IS NULL OR u.premium_expires_at > NOW())) as seller_premium
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN users u ON p.seller_id = u.id
       WHERE p.featured = TRUE AND p.active = TRUE AND p.status = 'disponible'
       ORDER BY seller_premium DESC, p.created_at DESC LIMIT 8`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Authenticated: get product by ID (for edit form)
router.get('/id/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Produit introuvable.' });
    const p = rows[0];
    if (req.user.role !== 'admin' && p.seller_id !== req.user.id) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }
    res.json(p);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Public: single product by slug (show any status)
router.get('/:slug', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, c.name as category_name,
              u.id as seller_id, u.full_name as seller_full_name, u.store_name as seller_name, u.store_logo as seller_logo,
              u.phone as seller_phone,
              (u.premium = 1 AND (u.premium_expires_at IS NULL OR u.premium_expires_at > NOW())) as seller_premium
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN users u ON p.seller_id = u.id
       WHERE p.slug = ?`,
      [req.params.slug]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Produit introuvable.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Authenticated: create product (admin or seller)
router.post('/', authenticate, async (req, res) => {
  if (!isAdminOrSeller(req)) {
    return res.status(403).json({ message: 'Accès réservé aux vendeurs et administrateurs.' });
  }
  try {
    const { name, slug, description, price, old_price, category_id, brand, state, warranty, stock, featured, image, gallery, specs } = req.body;
    const sellerId = req.user.role === 'admin' ? (req.body.seller_id || null) : req.user.id;
    const [result] = await pool.query(
      `INSERT INTO products (name, slug, description, price, old_price, category_id, seller_id, brand, state, warranty, stock, featured, image, gallery, specs, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, slug, description, price, old_price || null, category_id || null, sellerId, brand || null, state || 'tres_bon', warranty || '6 mois', stock || 1, featured || false, image || null, gallery ? JSON.stringify(gallery) : null, specs ? JSON.stringify(specs) : null, 'disponible']
    );
    res.status(201).json({ id: result.insertId, message: 'Produit ajouté.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

// Authenticated: update product (admin or owner seller)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT seller_id FROM products WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Produit introuvable.' });
    if (req.user.role !== 'admin' && rows[0].seller_id !== req.user.id) {
      return res.status(403).json({ message: 'Vous ne pouvez modifier que vos propres produits.' });
    }
    const { name, slug, description, price, old_price, category_id, brand, state, warranty, stock, featured, image, gallery, specs, status } = req.body;
    await pool.query(
      `UPDATE products SET name=?, slug=?, description=?, price=?, old_price=?, category_id=?, brand=?, state=?, warranty=?, stock=?, featured=?, image=?, gallery=?, specs=?, status=? WHERE id = ?`,
      [name, slug, description, price, old_price || null, category_id || null, brand || null, state || 'tres_bon', warranty || '6 mois', stock || 1, featured || false, image || null, gallery ? JSON.stringify(gallery) : null, specs ? JSON.stringify(specs) : null, status || 'disponible', req.params.id]
    );
    res.json({ message: 'Produit mis à jour.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

// Authenticated: quick status update
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT seller_id FROM products WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Produit introuvable.' });
    if (req.user.role !== 'admin' && rows[0].seller_id !== req.user.id) {
      return res.status(403).json({ message: 'Vous ne pouvez modifier que vos propres produits.' });
    }
    const { status } = req.body;
    if (!['disponible', 'en_attente', 'vendu'].includes(status)) {
      return res.status(400).json({ message: 'Statut invalide.' });
    }
    await pool.query('UPDATE products SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: 'Statut mis à jour.', status });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

// Authenticated: delete product (admin or owner seller)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT seller_id FROM products WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Produit introuvable.' });
    if (req.user.role !== 'admin' && rows[0].seller_id !== req.user.id) {
      return res.status(403).json({ message: 'Vous ne pouvez supprimer que vos propres produits.' });
    }
    await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ message: 'Produit supprimé.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

module.exports = router;
