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

// Serve screenshot by deposit ID
router.get('/:id/screenshot', async (req, res) => {
  try {
    const [deposits] = await pool.query('SELECT * FROM deposits WHERE id = ?', [Number(req.params.id)]);
    if (deposits.length === 0) return res.status(404).json({ message: 'Acompte introuvable.' });
    const deposit = deposits[0];
    if (!deposit.screenshot) return res.status(404).json({ message: 'Aucune capture.' });
    const filePath = path.join(depositDir, deposit.screenshot);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'Fichier introuvable.' });
    res.sendFile(filePath);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

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

    // Notify admin via SMS
    const screenshotUrl = screenshotFile
      ? `${req.protocol}://${req.get('host')}/api/deposits/${result.insertId}/screenshot`
      : null;
    const adminPhone = process.env.ADMIN_PHONE || '212669017295';
    const adminMsg =
      `Nouvel acompte 200DH !\n` +
      `Produit: ${product.name} (${product.price}DH)\n` +
      `Client: ${clientName}\n` +
      `Tél: ${clientPhone}\n` +
      `Voir capture: ${screenshotUrl || 'Pas de capture'}`;

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
