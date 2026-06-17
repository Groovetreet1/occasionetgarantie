const express = require('express');
const pool = require('../config/db');
const { authenticate, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Public: list products
router.get('/', async (req, res) => {
  try {
    const { category, search, min, max, state, sort } = req.query;
    let sql = `
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.active = TRUE
    `;
    const params = [];

    if (category) { sql += ' AND c.slug = ?'; params.push(category); }
    if (search) { sql += ' AND (p.name LIKE ? OR p.description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    if (min) { sql += ' AND p.price >= ?'; params.push(min); }
    if (max) { sql += ' AND p.price <= ?'; params.push(max); }
    if (state) { sql += ' AND p.state = ?'; params.push(state); }

    if (sort === 'price_asc') sql += ' ORDER BY p.price ASC';
    else if (sort === 'price_desc') sql += ' ORDER BY p.price DESC';
    else if (sort === 'newest') sql += ' ORDER BY p.created_at DESC';
    else sql += ' ORDER BY p.featured DESC, p.created_at DESC';

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

// Public: featured products
router.get('/featured', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.featured = TRUE AND p.active = TRUE LIMIT 8'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Admin: get product by ID (for edit form)
router.get('/id/:id', authenticate, adminOnly, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Produit introuvable.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Public: single product by slug
router.get('/:slug', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.slug = ?',
      [req.params.slug]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Produit introuvable.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Admin: create product
router.post('/', authenticate, adminOnly, async (req, res) => {
  try {
    const { name, slug, description, price, old_price, category_id, brand, state, warranty, stock, featured, image, specs } = req.body;
    const [result] = await pool.query(
      `INSERT INTO products (name, slug, description, price, old_price, category_id, brand, state, warranty, stock, featured, image, specs)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, slug, description, price, old_price || null, category_id || null, brand || null, state || 'tres_bon', warranty || '6 mois', stock || 1, featured || false, image || null, specs ? JSON.stringify(specs) : null]
    );
    res.status(201).json({ id: result.insertId, message: 'Produit ajouté.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

// Admin: update product
router.put('/:id', authenticate, adminOnly, async (req, res) => {
  try {
    const { name, slug, description, price, old_price, category_id, brand, state, warranty, stock, featured, image, specs } = req.body;
    await pool.query(
      `UPDATE products SET name=?, slug=?, description=?, price=?, old_price=?, category_id=?, brand=?, state=?, warranty=?, stock=?, featured=?, image=?, specs=? WHERE id = ?`,
      [name, slug, description, price, old_price || null, category_id || null, brand || null, state || 'tres_bon', warranty || '6 mois', stock || 1, featured || false, image || null, specs ? JSON.stringify(specs) : null, req.params.id]
    );
    res.json({ message: 'Produit mis à jour.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

// Admin: delete product
router.delete('/:id', authenticate, adminOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ message: 'Produit supprimé.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

module.exports = router;
