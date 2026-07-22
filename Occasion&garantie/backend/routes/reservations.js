const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');
const gomobile = require('../services/gomobile');

const RESERVATION_AMOUNT = 200;
const ADMIN_PHONE = process.env.ADMIN_PHONE;

const BANK_INFO = {
  bank: 'CIH Bank',
  holder: 'OCCASION ET GARANTIE BOUTIQUE',
  rib: '230780409210621100460062',
  amount: RESERVATION_AMOUNT,
};

const SCREENSHOT_DIR = path.join(__dirname, '..', 'uploads', 'reservations');
if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

const screenshotUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, SCREENSHOT_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `reservation-${req.params.id}-${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Format non supporte. Utilisez JPG, PNG ou WebP.'));
  },
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ message: 'ID produit requis.' });

    const [products] = await pool.query('SELECT id, name, price FROM products WHERE id = ? AND active = TRUE', [productId]);
    if (products.length === 0) return res.status(404).json({ message: 'Produit introuvable.' });

    const [existing] = await pool.query('SELECT id FROM reservations WHERE user_id = ? AND product_id = ? AND status = ?', [req.user.id, productId, 'en_attente']);
    if (existing.length > 0) return res.status(400).json({ message: 'Vous avez deja une reservation en attente pour ce produit.' });

    const [result] = await pool.query(
      'INSERT INTO reservations (user_id, product_id, amount, status) VALUES (?, ?, ?, ?)',
      [req.user.id, productId, RESERVATION_AMOUNT, 'en_attente']
    );

    res.status(201).json({
      message: `Reservation creee. Versez ${RESERVATION_AMOUNT} DH sur le compte ci-dessous.`,
      reservationId: result.insertId,
      amount: RESERVATION_AMOUNT,
      bank: BANK_INFO,
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.post('/:id/screenshot', authenticate, screenshotUpload.single('screenshot'), async (req, res) => {
  try {
    const reservationId = Number(req.params.id);
    const [rows] = await pool.query('SELECT r.*, u.full_name, u.phone FROM reservations r JOIN users u ON r.user_id = u.id WHERE r.id = ? AND r.user_id = ?', [reservationId, req.user.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Reservation introuvable.' });
    if (!req.file) return res.status(400).json({ message: 'Fichier requis.' });

    const filename = req.file.filename;
    await pool.query('UPDATE reservations SET screenshot = ?, status = ? WHERE id = ?', [filename, 'confirmee', reservationId]);

    const screenshotUrl = `${req.protocol}://${req.get('host')}/api/reservations/${reservationId}/screenshot`;
    const clientName = rows[0].full_name;
    const clientPhone = rows[0].phone;

    try {
      let adminPhone = ADMIN_PHONE;
      const [admins] = await pool.query('SELECT phone FROM users WHERE role = ?', ['admin']);
      if (admins.length > 0 && admins[0].phone) {
        adminPhone = admins[0].phone;
      }
      if (adminPhone) {
        const smsMessage = `Nouveau versement - Reservation #${reservationId} Client: ${clientName} Tel: ${clientPhone} Photo: ${screenshotUrl}`;
        await gomobile.sendSms(adminPhone, smsMessage);
      }
    } catch (smsErr) {
      console.error('Admin SMS failed:', smsErr.message);
    }

    res.json({ message: 'Screenshot envoye. Reservation confirmee.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.get('/:id/screenshot', async (req, res) => {
  try {
    const reservationId = Number(req.params.id);
    const [rows] = await pool.query('SELECT screenshot FROM reservations WHERE id = ?', [reservationId]);
    if (rows.length === 0 || !rows[0].screenshot) return res.status(404).json({ message: 'Screenshot introuvable.' });

    const filePath = path.join(SCREENSHOT_DIR, rows[0].screenshot);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'Fichier introuvable.' });

    res.sendFile(filePath);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.get('/mine', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT r.*, p.name as product_name, p.price as product_price FROM reservations r JOIN products p ON r.product_id = p.id WHERE r.user_id = ? ORDER BY r.created_at DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;
