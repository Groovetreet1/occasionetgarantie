const express = require('express');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');
const { destroy: cloudDestroy, USE_CLOUDINARY } = require('../services/uploader');

const { logVendorAction } = require('../services/tracker');

const router = express.Router();

function isAdminOrSeller(req) {
  return req.user && (req.user.role === 'admin' || req.user.role === 'seller');
}

const ALLOWED_CATEGORY_IDS = [1, 2, 3, 4, 5];

async function validateCategory(categoryId) {
  if (!categoryId) return 'Categorie requise. Seuls les produits electronique (Smartphones, Tablettes, Ordinateurs, Accessoires, Gaming) sont autorises.';
  if (!ALLOWED_CATEGORY_IDS.includes(Number(categoryId))) return 'Categorie invalide. Seuls les produits electronique sont autorises.';
  const [rows] = await pool.query('SELECT id FROM categories WHERE id = ?', [categoryId]);
  if (rows.length === 0) return 'Categorie introuvable.';
  return null;
}

// Public: list products (only disponible)
router.get('/', async (req, res) => {
  try {
    const { category, search, min, max, state, sort, seller, ville, user_ville, page, limit, brand } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const offset = (pageNum - 1) * limitNum;

    try { await pool.query("ALTER TABLE products ADD COLUMN product_type VARCHAR(10) DEFAULT 'vendor'"); } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') {} }
    let where = " WHERE p.active = TRUE AND p.status = 'disponible' AND p.approved = TRUE AND (p.product_type IS NULL OR p.product_type = 'vendor') AND u.id IS NOT NULL";
    const params = [];

    if (category) { where += ' AND LOWER(c.name) = ?'; params.push(category.toLowerCase()); }
    if (search) { where += ' AND (p.name LIKE ? OR p.description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    if (min) { where += ' AND p.price >= ?'; params.push(min); }
    if (max) { where += ' AND p.price <= ?'; params.push(max); }
    if (state) { where += ' AND p.state = ?'; params.push(state); }
    if (seller) { where += ' AND p.seller_id = ?'; params.push(seller); }
    if (ville) { where += ' AND p.ville = ?'; params.push(ville); }
    if (brand) { where += ' AND LOWER(TRIM(p.brand)) = LOWER(TRIM(?))'; params.push(brand); }

    const countSql = `SELECT COUNT(*) as total FROM products p LEFT JOIN categories c ON p.category_id = c.id LEFT JOIN users u ON p.seller_id = u.id${where}`;
    const [countRows] = await pool.query(countSql, params);
    const total = countRows[0].total;

    let sql = `
      SELECT p.*, c.name as category_name,
             u.store_name as seller_name, u.store_logo as seller_logo, u.avatar as seller_avatar, u.premium as seller_premium,
             (SELECT ROUND(AVG(rating), 1) FROM seller_ratings WHERE seller_id = u.id) as seller_rating_avg,
             (SELECT COUNT(*) FROM seller_ratings WHERE seller_id = u.id) as seller_rating_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.seller_id = u.id
    `;
    sql += where;
    sql += ' ORDER BY (u.premium = TRUE AND (u.premium_expires_at IS NULL OR u.premium_expires_at > NOW())) DESC';
    if (user_ville) {
      sql += ', CASE WHEN p.ville = ? THEN 0 ELSE 1 END';
      params.push(user_ville);
    }
    if (sort === 'price_asc') sql += ', p.price ASC';
    else if (sort === 'price_desc') sql += ', p.price DESC';
    else if (sort === 'newest') sql += ', p.created_at DESC';
    else sql += ', p.created_at DESC';

    sql += ' LIMIT ? OFFSET ?';
    params.push(limitNum, offset);

    try {
      const [rows] = await pool.query(sql, params);
      return res.json({ products: rows, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) });
    } catch (e) {
      throw e;
    }
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Public: featured products (only disponible)
router.get('/featured', async (req, res) => {
  try {
    let sql = `SELECT p.*, c.name as category_name, u.store_name as seller_name, u.store_logo as seller_logo, u.avatar as seller_avatar, u.premium as seller_premium
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN users u ON p.seller_id = u.id
       WHERE p.featured = TRUE AND p.active = TRUE AND p.status = 'disponible' AND p.approved = TRUE AND (p.product_type IS NULL OR p.product_type = 'vendor') AND u.id IS NOT NULL
       ORDER BY (u.premium = TRUE AND (u.premium_expires_at IS NULL OR u.premium_expires_at > NOW())) DESC, p.created_at DESC LIMIT 8`;
    try {
      const [rows] = await pool.query(sql);
      return res.json(rows);
    } catch (e) {
      throw e;
    }
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
    let sql = `SELECT p.*, c.name as category_name,
              u.id as seller_id, u.full_name as seller_full_name, u.store_name as seller_name, u.store_logo as seller_logo, u.avatar as seller_avatar, u.premium as seller_premium,
              u.phone as seller_phone,
              (SELECT ROUND(AVG(rating), 1) FROM seller_ratings WHERE seller_id = u.id) as seller_rating_avg,
              (SELECT COUNT(*) FROM seller_ratings WHERE seller_id = u.id) as seller_rating_count
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN users u ON p.seller_id = u.id
       WHERE p.slug = ?`;
    try {
      const [rows] = await pool.query(sql, [req.params.slug]);
      if (rows.length === 0) return res.status(404).json({ message: 'Produit introuvable.' });
      const product = rows[0];
      if (!product.seller_phone) product.seller_phone = '';
      return res.json(product);
    } catch (e) {
      throw e;
    }
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
    const { name, slug, description, price, old_price, category_id, brand, state, warranty, stock, featured, image, gallery, specs, ville, latitude, longitude, product_type } = req.body;
    const sellerId = req.user.role === 'admin' ? (req.body.seller_id || null) : req.user.id;

    const catError = await validateCategory(category_id);
    if (catError) return res.status(400).json({ message: catError });

    // Credit deduction for sellers > 3 months (5% of price)
    if (req.user.role === 'seller' && price) {
      try {
        const [sellers] = await pool.query('SELECT created_at, credit_balance FROM users WHERE id = ?', [sellerId]);
        if (sellers.length > 0) {
          const monthsSinceCreation = (Date.now() - new Date(sellers[0].created_at).getTime()) / (1000 * 60 * 60 * 24 * 30.44);
          if (monthsSinceCreation > 3) {
            const creditCost = Math.ceil(Number(price) * 0.05 * 10);
            if (sellers[0].credit_balance < creditCost) {
              return res.status(400).json({ message: `Credits insuffisants. Besoin de ${creditCost} credits (5% du prix). Ajoutez des credits depuis votre tableau de bord.` });
            }
            await pool.query('UPDATE users SET credit_balance = credit_balance - ? WHERE id = ?', [creditCost, sellerId]);
            await pool.query('INSERT INTO credit_transactions (user_id, type, amount, description) VALUES (?, ?, ?, ?)', [sellerId, 'deduction', -creditCost, `Deduction 5% sur "${name}" (${price} DH)`]);
          }
        }
      } catch (e) {
        console.log('Credit deduction skipped:', e.message);
      }
    }

    try { await pool.query('ALTER TABLE products ADD COLUMN ville VARCHAR(100) DEFAULT NULL'); } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') console.log('ville col:', e.message); }
    try { await pool.query('ALTER TABLE products ADD COLUMN approved TINYINT(1) DEFAULT 1'); } catch {}
    try { await pool.query("ALTER TABLE products ADD COLUMN product_type VARCHAR(10) DEFAULT 'vendor'"); } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') {} }

    const approved = req.user.role === 'admin' ? 1 : 0;
    const ptype = req.user.role === 'admin' && product_type === 'store' ? 'store' : 'vendor';

    const [result] = await pool.query(
      `INSERT INTO products (name, slug, description, price, old_price, category_id, seller_id, brand, state, warranty, stock, featured, image, gallery, specs, status, ville, approved, product_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, slug, description, price, old_price || null, category_id || null, sellerId, brand || null, state || 'tres_bon', warranty || '6 mois', stock || 1, featured || false, image || null, gallery ? JSON.stringify(gallery) : null, specs ? JSON.stringify(specs) : null, 'disponible', ville || null, approved, ptype]
    );
    if (sellerId && req.user.role === 'seller') {
      const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
      logVendorAction({ userId: sellerId, action: 'produit_ajoute', ip, userAgent: req.headers['user-agent'], productId: result.insertId, details: name, latitude, longitude });
      try {
        await pool.query("CREATE TABLE IF NOT EXISTS notifications (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, type VARCHAR(50) DEFAULT 'general', title VARCHAR(200) NOT NULL, message TEXT DEFAULT NULL, link VARCHAR(500) DEFAULT NULL, read_at TIMESTAMP NULL DEFAULT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) DEFAULT CHARSET=utf8mb4");
        await pool.query('INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)',
          [sellerId, 'product_pending', 'Annonce en attente',
           `Votre annonce "${name}" est en cours d'examen par l'équipe d'administration.`,
           '/seller']);
      } catch (nErr) { console.error('Notif failed:', nErr.message); }
    }
    res.status(201).json({ id: result.insertId, message: 'Produit ajouté.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Authenticated: update product (admin or owner seller)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT seller_id, category_id FROM products WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Produit introuvable.' });
    if (req.user.role !== 'admin' && rows[0].seller_id !== req.user.id) {
      return res.status(403).json({ message: 'Vous ne pouvez modifier que vos propres produits.' });
    }
    const { name, slug, description, price, old_price, category_id, brand, state, warranty, stock, featured, image, gallery, specs, status, ville, product_type } = req.body;
    if (category_id) {
      const catError = await validateCategory(category_id);
      if (catError) return res.status(400).json({ message: catError });
    }
    const ptype = req.user.role === 'admin' && product_type === 'store' ? 'store' : 'vendor';
    await pool.query(
      `UPDATE products SET name=?, slug=?, description=?, price=?, old_price=?, category_id=?, brand=?, state=?, warranty=?, stock=?, featured=?, image=?, gallery=?, specs=?, status=?, ville=?, product_type=? WHERE id = ?`,
      [name, slug, description, price, old_price || null, category_id || null, brand || null, state || 'tres_bon', warranty || '6 mois', stock || 1, featured || false, image || null, gallery ? JSON.stringify(gallery) : null, specs ? JSON.stringify(specs) : null, status || 'disponible', ville || null, ptype, req.params.id]
    );
    res.json({ message: 'Produit mis à jour.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Authenticated: quick status update
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT seller_id, price FROM products WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Produit introuvable.' });
    if (req.user.role !== 'admin' && rows[0].seller_id !== req.user.id) {
      return res.status(403).json({ message: 'Vous ne pouvez modifier que vos propres produits.' });
    }
    const { status } = req.body;
    if (!['disponible', 'en_attente', 'vendu'].includes(status)) {
      return res.status(400).json({ message: 'Statut invalide.' });
    }
    await pool.query('UPDATE products SET status = ? WHERE id = ?', [status, req.params.id]);

    if (req.user.role === 'seller') {
      const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
      logVendorAction({ userId: rows[0].seller_id, action: 'statut_' + status, ip, userAgent: req.headers['user-agent'], productId: Number(req.params.id) });
    }

    // Commission logic: when marked as sold
    if (status === 'vendu') {
      try {
        const [sellers] = await pool.query('SELECT created_at FROM users WHERE id = ?', [rows[0].seller_id]);
        if (sellers.length > 0) {
          const monthsSinceCreation = (Date.now() - new Date(sellers[0].created_at).getTime()) / (1000 * 60 * 60 * 24 * 30.44);
          if (monthsSinceCreation > 3) {
            const commissionAmount = Math.round(rows[0].price * 0.05 * 100) / 100;
            await pool.query(
              'INSERT INTO commissions (product_id, seller_id, amount, rate) VALUES (?, ?, ?, ?)',
              [Number(req.params.id), rows[0].seller_id, commissionAmount, 5.00]
            );
          }
        }
      } catch (e) {
        console.log('Commission skipped:', e.message);
      }
    }

    res.json({ message: 'Statut mis à jour.', status });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Authenticated: delete product (admin or owner seller)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT seller_id, image FROM products WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Produit introuvable.' });
    if (req.user.role !== 'admin' && rows[0].seller_id !== req.user.id) {
      return res.status(403).json({ message: 'Vous ne pouvez supprimer que vos propres produits.' });
    }
    const img = rows[0].image;
    if (img) {
      try { fs.unlinkSync(path.join(__dirname, '..', 'uploads', img)); } catch {}
      try {
        if (USE_CLOUDINARY && typeof img === 'string' && img.startsWith('http') && img.includes('/upload/')) {
          const afterUpload = img.split('/upload/')[1];
          if (afterUpload) {
            const publicId = afterUpload.split('?')[0].split('/').slice(1).join('/').replace(/\.[^.]+$/, '');
            if (publicId) cloudDestroy(publicId);
          }
        }
      } catch (e) { console.error('Cloudinary destroy error:', e.message); }
    }
    await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ message: 'Produit supprimé.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.get('/cities', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT DISTINCT ville FROM products WHERE ville IS NOT NULL AND ville != "" AND active = TRUE AND status = "disponible" ORDER BY ville');
    res.json(rows.map(r => r.ville));
  } catch (err) {
    res.json([]);
  }
});

router.get('/brands/list', async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT DISTINCT TRIM(brand) as brand FROM products WHERE brand IS NOT NULL AND brand != '' AND active = TRUE AND status = 'disponible' AND approved = TRUE");
    const seen = new Set();
    const brands = rows.map(r => r.brand).filter(Boolean).map(b => b.trim()).filter(b => {
      const lower = b.toLowerCase();
      if (seen.has(lower)) return false;
      seen.add(lower);
      return true;
    }).sort();
    res.json(brands);
  } catch (err) {
    res.json([]);
  }
});

module.exports = router;
