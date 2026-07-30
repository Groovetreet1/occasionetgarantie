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

async function ensureTable() {
  await pool.query(`CREATE TABLE IF NOT EXISTS reprises (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(200) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`);
  const cols = ['product_id INT DEFAULT NULL', 'imei VARCHAR(20) DEFAULT NULL', 'photos JSON DEFAULT NULL', 'client_notes TEXT DEFAULT NULL', `status ENUM('en_attente','estime','accepte','refuse','converti') DEFAULT 'en_attente'`, 'estimated_price DECIMAL(10,2) DEFAULT NULL', 'vendor_id INT DEFAULT NULL', 'vendor_notes TEXT DEFAULT NULL'];
  for (const col of cols) { try { await pool.query(`ALTER TABLE reprises ADD COLUMN ${col}`); } catch {} }
}

router.post('/', authenticate, (req, res) => {
  uploadFields(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });

    (async () => {
      try {
        await ensureTable();
        const { brand, model, imei, product_id, client_notes } = req.body;
        if (!brand || !model) return res.status(400).json({ message: 'Marque et modele requis.' });

        const photos = {};
        for (const key of ['front', 'back', 'side', 'screen']) {
          if (req.files?.[key]) {
            const f = req.files[key][0];
            const b64 = fs.readFileSync(f.path).toString('base64');
            const mime = f.mimetype || 'image/jpeg';
            photos[key] = `data:${mime};base64,${b64}`;
            try { fs.unlinkSync(f.path); } catch {}
          }
        }

        const [result] = await pool.query(
          'INSERT INTO reprises (user_id, product_id, brand, model, imei, photos, client_notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [req.user.id, product_id || null, brand, model, imei || null, Object.keys(photos).length ? JSON.stringify(photos) : null, client_notes || null]
        );

        res.status(201).json({ id: result.insertId, message: 'Reprise soumise avec succes.' });

        // Notify product owner if reprise is linked to a product
        if (product_id) {
          try {
            const [prodRow] = await pool.query('SELECT seller_id, name FROM products WHERE id = ?', [product_id]);
            if (prodRow.length > 0) {
              const [clientRow] = await pool.query('SELECT full_name FROM users WHERE id = ?', [req.user.id]);
              const cName = clientRow[0]?.full_name || 'Un client';
              await pool.query(
                'INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)',
                [prodRow[0].seller_id, 'reprise_new', 'Nouvelle demande de reprise',
                 `${cName} a soumis une reprise pour ${prodRow[0].name} (${brand} ${model}).`,
                 '/reprise/list']
              );
            }
          } catch (nErr) {
            console.error('Notification creation failed:', nErr.message);
          }
        }
      } catch (dbErr) {
        console.error('Reprise insert error:', dbErr.message);
        if (!res.headersSent) res.status(500).json({ message: 'Erreur lors de l\'envoi. Veuillez reessayer.', error: dbErr.message });
      }
    })();
  });
});

router.get('/', authenticate, async (req, res) => {
  try {
    await ensureTable();

    // Auto-reject pending reprises older than 5 days
    await pool.query(
      `UPDATE reprises SET status = 'refuse', vendor_notes = 'Automatiquement refuse - delai de 5 jours depasse'
       WHERE status = 'en_attente' AND created_at < NOW() - INTERVAL 5 DAY`
    );

    let query, params;

    let selectCols = `r.id, r.user_id, r.product_id, r.brand, r.model, r.imei, r.status, r.estimated_price, r.vendor_id, r.vendor_notes, r.client_notes, r.created_at, r.updated_at, r.photos IS NOT NULL AND JSON_LENGTH(r.photos) > 0 AS has_photos,
               u.full_name, u.email, u.phone, u.store_name,
               p.name AS product_name, p.images AS product_images`;

    if (req.user.role === 'admin') {
      query = `SELECT ${selectCols}
               FROM reprises r
               JOIN users u ON r.user_id = u.id
               LEFT JOIN products p ON r.product_id = p.id`;
      params = [];
    } else if (req.user.role === 'seller') {
      query = `SELECT ${selectCols}
               FROM reprises r
               JOIN users u ON r.user_id = u.id
               LEFT JOIN products p ON r.product_id = p.id
               WHERE r.vendor_id = ? OR r.user_id = ? OR (r.vendor_id IS NULL AND r.product_id IS NOT NULL AND EXISTS (SELECT 1 FROM products WHERE id = r.product_id AND seller_id = ?))`;
      params = [req.user.id, req.user.id, req.user.id];
    } else {
      query = `SELECT ${selectCols}
               FROM reprises r
               JOIN users u ON r.user_id = u.id
               LEFT JOIN products p ON r.product_id = p.id
               WHERE r.user_id = ?`;
      params = [req.user.id];
    }

    let rows;
    try {
      [rows] = await pool.query(query, params);
    } catch (e) {
      console.error('Reprise list query error:', e.message);
      [rows] = [];
    }

    // Sort in JS to avoid MySQL sort buffer overflow
    rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    if (req.query.product_id) {
      rows = rows.filter(r => r.product_id == req.query.product_id);
    }

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

// Check if user already has a pending reprise for a product
router.get('/check/:productId', authenticate, async (req, res) => {
  try {
    await ensureTable();
    const [rows] = await pool.query(
      `SELECT id, status FROM reprises
       WHERE user_id = ? AND product_id = ? AND status IN ('en_attente','estime','accepte')
       LIMIT 1`,
      [req.user.id, req.params.productId]
    );
    res.json({ exists: rows.length > 0, reprise: rows[0] || null });
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

    // Create notification for client
    if (status && rows[0].status !== status) {
      try {
        const [vendorRow] = await pool.query('SELECT store_name FROM users WHERE id = ?', [req.user.id]);
        const vName = vendorRow[0]?.store_name || 'Le vendeur';
        const notifTitle = status === 'accepte' ? 'Reprise acceptee' : status === 'refuse' ? 'Reprise refuse' : 'Reprise mise a jour';
        const notifMsg = status === 'accepte'
          ? `${vName} a accepte votre demande de reprise pour ${rows[0].brand} ${rows[0].model}. Il vous contactera bientot.`
          : status === 'refuse'
            ? `${vName} a refuse votre demande de reprise pour ${rows[0].brand} ${rows[0].model}.${rows[0].vendor_notes ? ' Raison: ' + rows[0].vendor_notes : ''}`
            : `Votre reprise ${rows[0].brand} ${rows[0].model} a ete mise a jour.`;
        await pool.query(
          'INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)',
          [rows[0].user_id, `reprise_${status}`, notifTitle, notifMsg, '/reprise/list']
        );
      } catch (notifErr) {
        console.error('Notification creation failed:', notifErr.message);
      }
    }

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

router.delete('/:id', authenticate, async (req, res) => {
  try {
    await ensureTable();
    const [rows] = await pool.query('SELECT * FROM reprises WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Reprise introuvable.' });
    if (req.user.role !== 'admin' && req.user.role !== 'seller')
      return res.status(403).json({ message: 'Acces refuse.' });
    await pool.query('DELETE FROM reprises WHERE id = ?', [req.params.id]);
    res.json({ message: 'Reprise supprimee.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

module.exports = router;
