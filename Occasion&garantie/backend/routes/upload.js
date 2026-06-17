const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate, adminOnly } = require('../middleware/auth');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Format non supporté. Utilisez JPG, PNG, WebP ou AVIF.'));
  },
});

router.post('/', authenticate, adminOnly, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Aucun fichier envoyé.' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

module.exports = router;
