const express = require('express');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');
const { destroy: cloudDestroy, USE_CLOUDINARY } = require('../services/uploader');
const { classifyImage } = require('../services/ai-validator');

const router = express.Router();

function isAdminOrSeller(req) {
  return req.user && (req.user.role === 'admin' || req.user.role === 'seller');
}

const ALLOWED_CATEGORY_IDS = [1, 2, 3, 4, 5];

const CATEGORY_KEYWORDS = {
  1: ['smartphone','iphone','samsung','xiaomi','huawei','oppo','oneplus','pixel','telephone','téléphone','mobile','galaxy','redmi','realme','nokia','sony','lg','honor','nothing phone','poco','motorola','fold','flip'],
  2: ['tablette','tablet','ipad','samsung tab','huawei matepad','lenovo tab','amazon fire','surface','galaxy tab','xiaomi pad','ipad air','ipad pro'],
  3: ['ordinateur','pc portable','pc','laptop','macbook','mac book','portable','gamer','dell','hp','lenovo','asus','acer','msi','thinkpad','imac','mac pro','mac mini','surface pro','chromebook','ecran','moniteur','clavier','souris','sourie'],
  4: ['accessoire','chargeur','coque','ecouteur','écouteur','casque','cable','câble','adaptateur','batterie','powerbank','support','etui','étui','film','protection','housse','sacoche','stand','dock','hub','usb','hdmi','enceinte','haut-parleur'],
  5: ['gaming','playstation','ps4','ps5','xbox','nintendo','switch','manette','jeu video','console','casque gaming','clavier gaming','souris gaming','gamer','siege','siège','volant','simulateur'],
};

const FORBIDDEN_KEYWORDS = [
  'vetement','vêtement','chaussure','sac à main','bijou','montre','parfum',
  'nourriture','aliment','boisson','meuble','table','chaise','canapé','lit','armoire',
  'voiture','moto','velo','vélo','maison','appartement','terrain','location',
  'jouet','livre','cd','dvd','disque','instrument','musique',
  'animal','chien','chat','plante','decoration','décoration',
  'cosmetique','cosmétique','maquillage','crème','shampoing',
  'service','cours','formation','billet','ticket','abonnement',
];

async function validateProductContent(name, description, categoryId) {
  const text = `${name} ${description || ''}`.toLowerCase();

  for (const word of FORBIDDEN_KEYWORDS) {
    if (text.includes(word)) {
      return `Ce produit ne correspond pas aux categories autorisees (electronique uniquement). Mot non autorise detecte: "${word}".`;
    }
  }

  const keywords = CATEGORY_KEYWORDS[Number(categoryId)] || [];
  const found = keywords.filter(k => text.includes(k.toLowerCase()));
  if (found.length === 0) {
    const catNames = { 1: 'Smartphones', 2: 'Tablettes', 3: 'Ordinateurs', 4: 'Accessoires', 5: 'Gaming' };
    return `Le titre ou la description ne correspond pas a la categorie "${catNames[categoryId] || ''}". Veuillez decrire un produit electronique valide.`;
  }
  return null;
}

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
    const { category, search, min, max, state, sort, seller } = req.query;
    let sql = `
      SELECT p.*, c.name as category_name,
             u.store_name as seller_name, u.store_logo as seller_logo, u.avatar as seller_avatar
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.seller_id = u.id
      WHERE p.active = TRUE AND p.status = 'disponible' AND u.id IS NOT NULL
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
    else sql += ' ORDER BY p.featured DESC, p.created_at DESC';

    try {
      const [rows] = await pool.query(sql, params);
      return res.json(rows);
    } catch (e) {
      throw e;
    }
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

// Public: featured products (only disponible)
router.get('/featured', async (req, res) => {
  try {
    let sql = `SELECT p.*, c.name as category_name, u.store_name as seller_name, u.store_logo as seller_logo, u.avatar as seller_avatar
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN users u ON p.seller_id = u.id
       WHERE p.featured = TRUE AND p.active = TRUE AND p.status = 'disponible' AND u.id IS NOT NULL
       ORDER BY p.created_at DESC LIMIT 8`;
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
              u.id as seller_id, u.full_name as seller_full_name, u.store_name as seller_name, u.store_logo as seller_logo, u.avatar as seller_avatar,
              u.phone as seller_phone
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN users u ON p.seller_id = u.id
       WHERE p.slug = ?`;
    try {
      const [rows] = await pool.query(sql, [req.params.slug]);
      if (rows.length === 0) return res.status(404).json({ message: 'Produit introuvable.' });
      const product = rows[0];
      if (!product.seller_phone) product.seller_phone = '212669017295';
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
    const { name, slug, description, price, old_price, category_id, brand, state, warranty, stock, featured, image, gallery, specs } = req.body;
    const sellerId = req.user.role === 'admin' ? (req.body.seller_id || null) : req.user.id;

    const catError = await validateCategory(category_id);
    if (catError) return res.status(400).json({ message: catError });

    const contentError = await validateProductContent(name, description, category_id);
    if (contentError) return res.status(400).json({ message: contentError });

    if (image) {
      const imgResult = await classifyImage(image);
      if (!imgResult.valid) return res.status(400).json({ message: imgResult.reason });
    }
    if (gallery && Array.isArray(gallery)) {
      for (const img of gallery) {
        const imgResult = await classifyImage(img);
        if (!imgResult.valid) return res.status(400).json({ message: 'Galerie - ' + imgResult.reason });
      }
    }

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
    const [rows] = await pool.query('SELECT seller_id, category_id FROM products WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Produit introuvable.' });
    if (req.user.role !== 'admin' && rows[0].seller_id !== req.user.id) {
      return res.status(403).json({ message: 'Vous ne pouvez modifier que vos propres produits.' });
    }
    const { name, slug, description, price, old_price, category_id, brand, state, warranty, stock, featured, image, gallery, specs, status } = req.body;
    if (category_id) {
      const catError = await validateCategory(category_id);
      if (catError) return res.status(400).json({ message: catError });
    }
    if (name) {
      const contentError = await validateProductContent(name, description || '', category_id || rows[0].category_id);
      if (contentError) return res.status(400).json({ message: contentError });
    }
    if (image) {
      const imgResult = await classifyImage(image);
      if (!imgResult.valid) return res.status(400).json({ message: imgResult.reason });
    }
    if (gallery && Array.isArray(gallery)) {
      for (const img of gallery) {
        const imgResult = await classifyImage(img);
        if (!imgResult.valid) return res.status(400).json({ message: 'Galerie - ' + imgResult.reason });
      }
    }
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
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
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
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

module.exports = router;
