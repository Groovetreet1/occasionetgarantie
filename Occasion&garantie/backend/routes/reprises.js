const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { upload } = require('../services/uploader');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const REP_DIR = path.join(__dirname, '..', 'uploads', 'reprises');
if (!fs.existsSync(REP_DIR)) fs.mkdirSync(REP_DIR, { recursive: true });

const repUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, REP_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `reprise-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Format non supporte. Utilisez JPG, PNG ou WebP.'));
  },
});

const uploadFields = repUpload.fields([
  { name: 'front', maxCount: 1 },
  { name: 'back', maxCount: 1 },
  { name: 'side', maxCount: 1 },
  { name: 'screen', maxCount: 1 },
]);

function ensureTable() {
  return pool.query(`CREATE TABLE IF NOT EXISTS reprises (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(200) NOT NULL,
    imei VARCHAR(20) DEFAULT NULL,
    photos JSON DEFAULT NULL,
    status ENUM('en_attente','estime','accepte','refuse','converti') DEFAULT 'en_attente',
    estimated_price DECIMAL(10,2) DEFAULT NULL,
    vendor_id INT DEFAULT NULL,
    vendor_notes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`);
}

router.post('/', authenticate, async (req, res) => {
  try {
    await ensureTable();
    uploadFields(req, res, async (err) => {
      if (err) return res.status(400).json({ message: err.message });

      const { brand, model, imei } = req.body;
      if (!brand || !model) return res.status(400).json({ message: 'Marque et modele requis.' });

      const photos = {};
      for (const key of ['front', 'back', 'side', 'screen']) {
        if (req.files?.[key]) photos[key] = `/uploads/reprises/${req.files[key][0].filename}`;
      }

      const [result] = await pool.query(
        'INSERT INTO reprises (user_id, brand, model, imei, photos) VALUES (?, ?, ?, ?, ?)',
        [req.user.id, brand, model, imei || null, Object.keys(photos).length ? JSON.stringify(photos) : null]
      );

      res.status(201).json({ id: result.insertId, message: 'Reprise soumise avec succes.' });
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    await ensureTable();
    let query, params;

    if (req.user.role === 'admin') {
      query = `SELECT r.*, u.full_name, u.email, u.phone, u.store_name
               FROM reprises r JOIN users u ON r.user_id = u.id ORDER BY r.created_at DESC`;
      params = [];
    } else if (req.user.role === 'seller') {
      query = `SELECT r.*, u.full_name, u.email, u.phone, u.store_name
               FROM reprises r JOIN users u ON r.user_id = u.id
               WHERE r.vendor_id = ? OR r.vendor_id IS NULL ORDER BY r.created_at DESC`;
      params = [req.user.id];
    } else {
      query = `SELECT r.* FROM reprises r WHERE r.user_id = ? ORDER BY r.created_at DESC`;
      params = [req.user.id];
    }

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    await ensureTable();
    const [rows] = await pool.query(
      `SELECT r.*, u.full_name, u.email, u.phone, u.store_name
       FROM reprises r JOIN users u ON r.user_id = u.id WHERE r.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Reprise introuvable.' });
    if (req.user.role !== 'admin' && req.user.id !== rows[0].user_id && req.user.role !== 'seller')
      return res.status(403).json({ message: 'Acces refuse.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    await ensureTable();
    const [rows] = await pool.query('SELECT * FROM reprises WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Reprise introuvable.' });

    if (req.user.role !== 'admin' && req.user.role !== 'seller')
      return res.status(403).json({ message: 'Acces refuse.' });

    const { estimated_price, status, vendor_notes } = req.body;

    await pool.query(
      'UPDATE reprises SET estimated_price = ?, status = ?, vendor_notes = ?, vendor_id = COALESCE(vendor_id, ?) WHERE id = ?',
      [estimated_price || null, status || rows[0].status, vendor_notes || null, req.user.id, req.params.id]
    );

    res.json({ message: 'Reprise mise a jour.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

router.post('/:id/convert', authenticate, async (req, res) => {
  try {
    await ensureTable();
    if (req.user.role !== 'admin' && req.user.role !== 'seller')
      return res.status(403).json({ message: 'Acces refuse.' });

    const [rows] = await pool.query('SELECT * FROM reprises WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Reprise introuvable.' });
    if (rows[0].status !== 'accepte')
      return res.status(400).json({ message: 'La reprise doit etre acceptee avant conversion.' });

    const r = rows[0];
    const photos = JSON.parse(r.photos || '{}');
    const mainPhoto = photos.front || null;

    const [prod] = await pool.query(
      `INSERT INTO products (user_id, seller_id, title, description, price, category, images, status, type, imei, reprise_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [r.user_id, req.user.id, `${r.brand} ${r.model}`, `Reprise: ${r.brand} ${r.model} | IMEI: ${r.imei || 'N/A'}`, r.estimated_price || 0, 'Smartphones', mainPhoto ? JSON.stringify([mainPhoto]) : '[]', 'disponible', 'reprise', r.imei, r.id]
    );

    await pool.query('UPDATE reprises SET status = ? WHERE id = ?', ['converti', req.params.id]);

    res.json({ id: prod.insertId, message: 'Telephone converti en produit.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

module.exports = router;
