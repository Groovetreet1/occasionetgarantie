const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

async function ensureNotifications() {
  await pool.query(`CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type VARCHAR(50) DEFAULT 'general',
    title VARCHAR(200) NOT NULL,
    message TEXT DEFAULT NULL,
    link VARCHAR(500) DEFAULT NULL,
    read_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) DEFAULT CHARSET=utf8mb4`);
}

// Buyer: create a price offer on a product
router.post('/', authenticate, async (req, res) => {
  try {
    const { product_id, offered_price, message } = req.body;
    if (!product_id) return res.status(400).json({ message: 'Produit requis.' });
    const price = parseFloat(offered_price);
    if (!price || price <= 0) return res.status(400).json({ message: 'Prix proposé invalide.' });
    if (message && message.length > 500) return res.status(400).json({ message: 'Message limité à 500 caractères.' });

    const [prods] = await pool.query('SELECT seller_id, name, price FROM products WHERE id = ?', [product_id]);
    if (prods.length === 0) return res.status(404).json({ message: 'Produit introuvable.' });
    const prod = prods[0];
    if (prod.seller_id === req.user.id) return res.status(400).json({ message: 'Vous ne pouvez pas négocier votre propre produit.' });

    const [result] = await pool.query(
      'INSERT INTO negotiations (product_id, buyer_id, seller_id, offered_price, message, status) VALUES (?, ?, ?, ?, ?, ?)',
      [product_id, req.user.id, prod.seller_id, price, message || null, 'en_attente']
    );

    try {
      await ensureNotifications();
      const [buyers] = await pool.query('SELECT full_name FROM users WHERE id = ?', [req.user.id]);
      const bName = buyers[0]?.full_name || 'Un client';
      await pool.query(
        'INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)',
        [prod.seller_id, 'negociation_new', 'Nouvelle offre de prix',
         `${bName} propose ${price} DH pour "${prod.name}".`,
         '/seller']
      );
    } catch (nErr) { console.error('Notification failed:', nErr.message); }

    res.status(201).json({ id: result.insertId, message: 'Offre envoyée au vendeur.' });
  } catch (err) {
    console.error('POST /negotiations:', err.message);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Buyer: list my offers
router.get('/mine', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT n.*, p.name as product_name, p.image as product_image, p.slug as product_slug
       FROM negotiations n
       LEFT JOIN products p ON n.product_id = p.id
       WHERE n.buyer_id = ?
       ORDER BY n.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /negotiations/mine:', err.message);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Seller: list offers on my products
router.get('/vendor', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT n.*, p.name as product_name, p.image as product_image, p.slug as product_slug,
              u.full_name as buyer_name
       FROM negotiations n
       LEFT JOIN products p ON n.product_id = p.id
       LEFT JOIN users u ON n.buyer_id = u.id
       WHERE n.seller_id = ?
       ORDER BY CASE WHEN n.status = 'en_attente' THEN 0 ELSE 1 END, n.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /negotiations/vendor:', err.message);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Seller: accept or refuse an offer
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['acceptee', 'refusee'].includes(status)) return res.status(400).json({ message: 'Statut invalide.' });

    const [rows] = await pool.query('SELECT * FROM negotiations WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Offre introuvable.' });
    const neg = rows[0];
    if (req.user.role !== 'admin' && neg.seller_id !== req.user.id) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }
    if (neg.status !== 'en_attente') return res.status(400).json({ message: 'Cette offre a déjà été traitée.' });

    await pool.query('UPDATE negotiations SET status = ? WHERE id = ?', [status, req.params.id]);

    try {
      await ensureNotifications();
      const [prods] = await pool.query('SELECT name FROM products WHERE id = ?', [neg.product_id]);
      const pName = prods[0]?.name || 'Produit';
      const [sellers] = await pool.query('SELECT full_name FROM users WHERE id = ?', [neg.seller_id]);
      const sName = sellers[0]?.full_name || 'Le vendeur';
      if (status === 'acceptee') {
        await pool.query(
          'INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)',
          [neg.buyer_id, 'negociation_acceptee', 'Offre acceptée !',
           `${sName} a accepté votre offre de ${neg.offered_price} DH pour "${pName}".`,
           '/messenger']
        );
      } else {
        await pool.query(
          'INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)',
          [neg.buyer_id, 'negociation_refusee', 'Offre refusée',
           `Votre offre de ${neg.offered_price} DH pour "${pName}" a été refusée.`,
           '/products']
        );
      }
    } catch (nErr) { console.error('Notification failed:', nErr.message); }

    res.json({ message: status === 'acceptee' ? 'Offre acceptée.' : 'Offre refusée.' });
  } catch (err) {
    console.error('PUT /negotiations/:id:', err.message);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;
