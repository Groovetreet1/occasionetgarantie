const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { sendSms } = require('../utils/sms');

const router = express.Router();

const depositDir = path.join(__dirname, '..', 'uploads', 'deposits');
if (!fs.existsSync(depositDir)) fs.mkdirSync(depositDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, depositDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `dep-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Bank details config endpoint
router.get('/bank-info', (req, res) => {
  res.json({
    rib: process.env.BANK_RIB || 'Non configuré',
    bank: process.env.BANK_NAME || 'Non configuré',
    holder: process.env.BANK_HOLDER || 'Non configuré',
  });
});

// Submit a deposit (authenticated user)
router.post('/', authenticate, upload.single('screenshot'), async (req, res) => {
  try {
    const { productSlug } = req.body;
    if (!productSlug) return res.status(400).json({ message: 'Produit requis.' });

    const [products] = await pool.query(
      'SELECT id, name, slug, price FROM products WHERE slug = ? AND active = TRUE',
      [productSlug]
    );
    if (products.length === 0) return res.status(404).json({ message: 'Produit introuvable.' });

    const product = products[0];

    // Look up user details from DB (JWT only has id/email/role)
    const [users] = await pool.query('SELECT id, full_name, phone FROM users WHERE id = ?', [req.user.id]);
    const userData = users[0] || {};
    const clientName = userData.full_name || req.user.email;
    const clientPhone = userData.phone || 'Non renseigné';

    const screenshotFile = req.file ? req.file.filename : null;

    // Store deposit record
    const [result] = await pool.query(
      'INSERT INTO deposits (user_id, product_id, product_name, screenshot, status, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [req.user.id, product.id, product.name, screenshotFile, 'en_attente']
    );

    // Notify admin via SMS (sans URL directe de la capture)
    const adminPhone = process.env.ADMIN_PHONE || '212669017295';
    const adminMsg =
      `Nouvel acompte 200DH !\n` +
      `Produit: ${product.name} (${product.price}DH)\n` +
      `Client: ${clientName}\n` +
      `Tél: ${clientPhone}\n` +
      `Capture d'écran reçue`;

    let smsError = null;
    try {
      const smsResult = await sendSms(adminPhone, adminMsg);
      if (!smsResult.success) smsError = smsResult.error;
    } catch (e) {
      smsError = e.message;
    }

    res.json({
      message: 'Acompte enregistré avec succès. Le vendeur vous contactera sous 24h.',
      depositId: result.insertId,
      smsNotified: !smsError,
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

module.exports = router;
