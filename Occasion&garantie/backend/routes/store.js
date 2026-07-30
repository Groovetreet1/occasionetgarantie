const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const emails = require('../emails');

const ensureColumn = async () => {
  try { await pool.query("ALTER TABLE products ADD COLUMN product_type VARCHAR(10) DEFAULT 'vendor'"); } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') console.log('product_type col:', e.message); }
};

router.get('/products', async (req, res) => {
  try {
    await ensureColumn();
    const { category, page, limit } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const offset = (pageNum - 1) * limitNum;
    let where = " WHERE p.active = TRUE AND p.status = 'disponible' AND p.approved = TRUE AND p.product_type = 'store'";
    const params = [];
    if (category) { where += ' AND LOWER(c.name) = ?'; params.push(category.toLowerCase()); }
    const [countRows] = await pool.query(`SELECT COUNT(*) as total FROM products p LEFT JOIN categories c ON p.category_id = c.id${where}`, params);
    const total = countRows[0].total;
    const [rows] = await pool.query(
      `SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id${where} ORDER BY p.featured DESC, p.created_at DESC LIMIT ? OFFSET ?`,
      [...params, limitNum, offset]
    );
    res.json({ products: rows, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.get('/products/featured', async (req, res) => {
  try {
    await ensureColumn();
    const [rows] = await pool.query(
      `SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.active = TRUE AND p.status = 'disponible' AND p.approved = TRUE AND p.product_type = 'store' ORDER BY p.featured DESC, p.created_at DESC LIMIT 8`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.get('/products/:slug', async (req, res) => {
  try {
    await ensureColumn();
    const [rows] = await pool.query(
      `SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.slug = ? AND p.product_type = 'store'`,
      [req.params.slug]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Produit boutique introuvable.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.post('/contact', async (req, res) => {
  try {
    const { productId, name, phone, message, productName } = req.body;
    if (!productId || !name || !phone) return res.status(400).json({ message: 'Nom, telephone et produit requis.' });
    const [rows] = await pool.query("SELECT id, name, price FROM products WHERE id = ? AND product_type = 'store'", [productId]);
    if (rows.length === 0) return res.status(404).json({ message: 'Produit boutique introuvable.' });

    await pool.query(
      `CREATE TABLE IF NOT EXISTS store_contacts (id INT AUTO_INCREMENT PRIMARY KEY, product_id INT NOT NULL, product_name VARCHAR(200) DEFAULT NULL, client_name VARCHAR(100) NOT NULL, client_phone VARCHAR(20) NOT NULL, message TEXT DEFAULT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`
    );
    try { await pool.query("ALTER TABLE store_contacts ADD COLUMN status VARCHAR(20) DEFAULT 'en_attente'"); } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') {} }
    await pool.query(
      'INSERT INTO store_contacts (product_id, product_name, client_name, client_phone, message) VALUES (?, ?, ?, ?, ?)',
      [productId, productName || rows[0].name, name, phone, message || null]
    );

    try {
      const [adminRow] = await pool.query("SELECT email FROM users WHERE role = 'admin'");
      if (adminRow.length > 0 && adminRow[0].email) {
        const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"></head><body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f8f9fc"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px"><tr><td align="center"><table role="presentation" width="100%" style="max-width:480px;background:#fff;border-radius:12px;padding:32px"><tr><td><h1 style="font-size:18px;color:#1e293b;margin:0 0 16px">Nouveau contact Boutique Officielle</h1><p style="font-size:14px;color:#64748b;margin:0 0 8px"><strong>Client :</strong> ${name}</p><p style="font-size:14px;color:#64748b;margin:0 0 8px"><strong>Telephone :</strong> ${phone}</p><p style="font-size:14px;color:#64748b;margin:0 0 8px"><strong>Produit :</strong> ${productName || rows[0].name} (${rows[0].price} DH)</p><p style="font-size:14px;color:#64748b;margin:0 0 8px"><strong>Message :</strong> ${message || 'Aucun message'}</p><hr style="border:none;border-top:1px solid #eee;margin:20px 0"><p style="font-size:12px;color:#888;">Boutique Officielle - Occasion &amp; Garantie</p></td></tr></table></td></tr></table></body></html>`;
        await emails.send({ to: adminRow[0].email, subject: `Nouveau contact Boutique: ${name} - ${productName || rows[0].name}`, html });
      }
    } catch (notifErr) { console.error('Store contact email failed:', notifErr.message); }

    res.json({ message: 'Message envoye. Nous vous contacterons dans les plus brefs delais.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;
