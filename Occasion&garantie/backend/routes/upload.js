const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate, sellerOrAdmin } = require('../middleware/auth');
const { upload: cloudUpload } = require('../services/uploader');

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
    else cb(new Error('Format non supporte. Utilisez JPG, PNG, WebP ou AVIF.'));
  },
});

router.post('/', authenticate, sellerOrAdmin, async (req, res) => {
  const single = req.query.single === 'true';
  const uploader = single ? upload.single('image') : upload.array('images', 10);
  uploader(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message });
    try {
      if (single) {
        if (!req.file) return res.status(400).json({ message: 'Aucun fichier envoye.' });
        const result = await cloudUpload(req.file.path, 'products');
        return res.json({ url: result.url });
      }
      if (!req.files || req.files.length === 0) return res.status(400).json({ message: 'Aucun fichier envoye.' });
      const urls = await Promise.all(req.files.map((f) => cloudUpload(f.path, 'products').then((r) => r.url)));
      res.json({ urls });
    } catch (e) {
      res.status(500).json({ message: 'Erreur upload.', error: e.message });
    }
  });
});

module.exports = router;
