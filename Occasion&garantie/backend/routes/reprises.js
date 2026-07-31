const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { uploadBuffer } = require('../services/uploader');
const { analyzeCondition } = require('../services/huggingface');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

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
        const { brand, model, imei, product_id, client_notes, estimated_price } = req.body;
        if (!brand || !model) return res.status(400).json({ message: 'Marque et modele requis.' });

        const photos = {};
        for (const key of ['front', 'back', 'side', 'screen']) {
          if (req.files?.[key]) {
            const f = req.files[key][0];
            try {
              const buf = fs.readFileSync(f.path);
              const resized = await sharp(buf).resize(300, 300, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 60 }).toBuffer();
              try {
                const { url } = await uploadBuffer(resized, 'reprise_' + key + '.jpg', 'reprises');
                photos[key] = url;
              } catch {
                const b64 = resized.toString('base64');
                photos[key] = `data:image/jpeg;base64,${b64}`;
              }
            } catch (upErr) {
              console.error(`Upload error for ${key}:`, upErr.message);
            }
            try { fs.unlinkSync(f.path); } catch {}
          }
        }

        const [result] = await pool.query(
          'INSERT INTO reprises (user_id, product_id, brand, model, imei, photos, client_notes, estimated_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [req.user.id, product_id || null, brand, model, imei || null, Object.keys(photos).length ? JSON.stringify(photos) : null, client_notes || null, estimated_price ? Number(estimated_price) : null]
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

// Public: simulate market value of a device using Hugging Face vision analysis
router.post('/estimate', (req, res) => {
  uploadFields(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message });
    try {
      const { brand, model, year } = req.body;
      if (!brand || !model) return res.status(400).json({ message: 'Marque et modele requis.' });

      // 1) Analyze condition with Hugging Face (from the uploaded photos)
      const front = req.files?.front?.[0] || req.files?.back?.[0] || req.files?.side?.[0] || req.files?.screen?.[0];
      let condition = null;
      if (front) {
        try {
          const buf = fs.readFileSync(front.path);
          const resized = await sharp(buf).resize(512, 512, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer();
          condition = await analyzeCondition(resized);
        } catch (hfErr) {
          console.error('Estimate analysis error:', hfErr.message);
        }
      }

      // 2) Reference price: model match -> brand match -> category average (smartphones)
      let referencePrice = null;
      let referenceSource = 'heuristic';
      try {
        let prices = [];
        const [rows] = await pool.query(
          `SELECT price FROM products WHERE active = TRUE AND status = 'disponible' AND approved = TRUE AND product_type = 'store' AND category_id = 1 AND brand LIKE ? AND name LIKE ? ORDER BY price ASC`,
          [`%${brand}%`, `%${model}%`]
        );
        prices = rows.map(r => Number(r.price)).filter(p => p > 0);
        if (prices.length === 0) {
          const [rows2] = await pool.query(
            `SELECT price FROM products WHERE active = TRUE AND status = 'disponible' AND approved = TRUE AND product_type = 'store' AND category_id = 1 AND brand LIKE ? ORDER BY price ASC`,
            [`%${brand}%`]
          );
          prices = rows2.map(r => Number(r.price)).filter(p => p > 0);
        }
        if (prices.length === 0) {
          const [rows3] = await pool.query(
            `SELECT price FROM products WHERE active = TRUE AND status = 'disponible' AND approved = TRUE AND product_type = 'store' AND category_id = 1 ORDER BY price ASC`
          );
          prices = rows3.map(r => Number(r.price)).filter(p => p > 0);
        }
        if (prices.length > 0) {
          prices.sort((a, b) => a - b);
          const mid = Math.floor(prices.length / 2);
          referencePrice = prices.length % 2 ? prices[mid] : (prices[mid - 1] + prices[mid]) / 2;
          referenceSource = 'catalog';
        }
      } catch (e) { referencePrice = null; }

      if (!referencePrice) referencePrice = 4500;

      // 3) Depreciation by age
      const currentYear = new Date().getFullYear();
      const age = Math.max(1, currentYear - (parseInt(year, 10) || currentYear));
      const AGE_FACTOR = [1, 0.85, 0.72, 0.6, 0.5, 0.42, 0.35, 0.3, 0.26, 0.22, 0.18, 0.15];
      const ageFactor = AGE_FACTOR[Math.min(age, AGE_FACTOR.length - 1)];

      // 4) Brand demand factor
      const BRAND_FACTOR = {
        apple: 1.15, samsung: 1.0, google: 0.98, pixel: 0.98, oneplus: 0.95,
        xiaomi: 0.85, redmi: 0.85, poco: 0.85, oppo: 0.82, realme: 0.82, vivo: 0.82,
        huawei: 0.88, honor: 0.85, sony: 0.9, motorola: 0.8, nokia: 0.75, lg: 0.8,
      };
      const brandFactor = BRAND_FACTOR[String(brand).toLowerCase()] ?? 0.9;

      // 5) Condition factor (from HF, or default)
      const conditionFactor = condition ? condition.factor : 0.83;
      const conditionState = condition ? condition.state : 'tres_bon';
      const conditionLabel = condition ? condition.label : 'Etat estime par defaut';

      let estimate = referencePrice * ageFactor * conditionFactor * brandFactor;
      estimate = Math.round(estimate / 50) * 50;
      const rangeMin = Math.round((estimate * 0.88) / 50) * 50;
      const rangeMax = Math.round((estimate * 1.12) / 50) * 50;

      res.json({
        estimated_price: estimate,
        range_min: rangeMin,
        range_max: rangeMax,
        reference_price: Math.round(referencePrice),
        reference_source: referenceSource,
        age_years: age,
        condition: conditionState,
        condition_label: conditionLabel,
        condition_score: condition ? condition.score : null,
        condition_source: condition ? 'huggingface' : 'default',
        factors: { age: ageFactor, state: conditionFactor, brand: brandFactor },
        message: 'Estimation indicative basee sur l analyse des photos et les prix du marche.',
      });
    } catch (e) {
      console.error('Estimate error:', e.message);
      if (!res.headersSent) res.status(500).json({ message: 'Erreur serveur.' });
    } finally {
      for (const key of Object.keys(req.files || {})) {
        for (const f of req.files[key] || []) { try { fs.unlinkSync(f.path); } catch {} }
      }
    }
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

    let selectCols = `r.id, r.user_id, r.product_id, r.brand, r.model, r.imei, r.status, r.estimated_price, r.vendor_id, r.vendor_notes, r.client_notes, r.created_at, r.updated_at, CASE WHEN r.photos IS NOT NULL THEN JSON_LENGTH(r.photos) ELSE 0 END AS photo_count,
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
    res.status(500).json({ message: 'Erreur serveur.' });
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
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Batch fetch photos for multiple reprises
router.get('/photos/batch', authenticate, async (req, res) => {
  try {
    const ids = req.query.ids;
    if (!ids) return res.json({});
    const idArr = ids.split(',').map(Number).filter(Boolean);
    if (idArr.length === 0) return res.json({});
    const placeholders = idArr.map(() => '?').join(',');
    const [rows] = await pool.query(
      `SELECT id, photos FROM reprises WHERE id IN (${placeholders})`,
      idArr
    );
    const result = {};
    for (const r of rows) {
      if (!r.photos) continue;
      const p = typeof r.photos === 'object' ? r.photos : (() => { try { return JSON.parse(r.photos || '{}'); } catch { return {}; } })();
      const resized = {};
      for (let [key, val] of Object.entries(p)) {
        if (typeof val === 'string' && val.startsWith('http')) {
          resized[key] = val;
        } else if (typeof val === 'string' && val.startsWith('data:')) {
          try {
            const raw = Buffer.from(val.split(',')[1], 'base64');
            const small = await sharp(raw).resize(200, 200, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 50 }).toBuffer();
            resized[key] = `data:image/jpeg;base64,${small.toString('base64')}`;
          } catch {}
        }
      }
      if (Object.keys(resized).length > 0) result[r.id] = resized;
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
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
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    await ensureTable();
    const [rows] = await pool.query('SELECT * FROM reprises WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Reprise introuvable.' });

    if (req.user.role !== 'admin' && req.user.role !== 'seller')
      return res.status(403).json({ message: 'Acces refuse.' });

    // Verify ownership for non-admin sellers
    if (req.user.role === 'seller') {
      if (rows[0].vendor_id && rows[0].vendor_id !== req.user.id) {
        const [prod] = await pool.query('SELECT seller_id FROM products WHERE id = ?', [rows[0].product_id]);
        if (!prod.length || prod[0].seller_id !== req.user.id)
          return res.status(403).json({ message: 'Cette reprise ne vous appartient pas.' });
      }
    }

    const { estimated_price, status, vendor_notes } = req.body;

    const priceVal = estimated_price !== undefined && estimated_price !== null && estimated_price !== '' ? Number(estimated_price) : null;
    const notesVal = vendor_notes !== undefined ? vendor_notes : null;

    await pool.query(
      'UPDATE reprises SET estimated_price = ?, status = ?, vendor_notes = ?, vendor_id = COALESCE(vendor_id, ?) WHERE id = ?',
      [priceVal, status || rows[0].status, notesVal, req.user.id, req.params.id]
    );

    // Create notification for client
    if (status && rows[0].status !== status) {
      try {
        const [vendorRow] = await pool.query('SELECT store_name FROM users WHERE id = ?', [req.user.id]);
        const vName = vendorRow[0]?.store_name || 'Le vendeur';
        const notifTitle = status === 'accepte' ? 'Reprise acceptee' : status === 'refuse' ? 'Reprise refuse' : 'Reprise mise a jour';
        const reason = notesVal || rows[0].vendor_notes || '';
        const notifMsg = status === 'accepte'
          ? `${vName} a accepte votre demande de reprise pour ${rows[0].brand} ${rows[0].model}. Il vous contactera bientot.`
          : status === 'refuse'
            ? `${vName} a refuse votre demande de reprise pour ${rows[0].brand} ${rows[0].model}.${reason ? ' Raison: ' + reason : ''}`
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
    res.status(500).json({ message: 'Erreur serveur.' });
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
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    await ensureTable();
    const [rows] = await pool.query('SELECT * FROM reprises WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Reprise introuvable.' });
    if (req.user.role !== 'admin' && req.user.role !== 'seller')
      return res.status(403).json({ message: 'Acces refuse.' });
    if (req.user.role === 'seller') {
      if (rows[0].vendor_id && rows[0].vendor_id !== req.user.id) {
        const [prod] = await pool.query('SELECT seller_id FROM products WHERE id = ?', [rows[0].product_id]);
        if (!prod.length || prod[0].seller_id !== req.user.id)
          return res.status(403).json({ message: 'Cette reprise ne vous appartient pas.' });
      }
    }
    await pool.query('DELETE FROM reprises WHERE id = ?', [req.params.id]);
    res.json({ message: 'Reprise supprimee.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;
