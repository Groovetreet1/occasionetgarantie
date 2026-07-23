const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');
const gomobile = require('../services/gomobile');

// Auto-create premium_payments table if missing
(async () => {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS premium_payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      amount DECIMAL(10,2) NOT NULL DEFAULT 50.00,
      screenshot VARCHAR(255),
      status ENUM('en_attente','actif','rejete') DEFAULT 'en_attente',
      rejection_reason VARCHAR(500) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);
    console.log('premium_payments table ready');
  } catch (e) {
    console.log('premium_payments table check skipped:', e.message);
  }
})();

const PREMIUM_AMOUNT = 50;
const ADMIN_PHONE = process.env.ADMIN_PHONE;

const BANK_INFO = {
  bank: 'CIH Bank',
  holder: 'OCCASION ET GARANTIE BOUTIQUE',
  rib: '230780409210621100460062',
  amount: PREMIUM_AMOUNT,
};

const SCREENSHOT_DIR = path.join(__dirname, '..', 'uploads', 'premium');
if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

const screenshotUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, SCREENSHOT_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `premium-${req.user.id}-${Date.now()}${ext}`);
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

router.get('/status', authenticate, async (req, res) => {
  try {
    try {
      const [users] = await pool.query('SELECT premium, premium_expires_at FROM users WHERE id = ?', [req.user.id]);
      if (users.length === 0) return res.status(404).json({ message: 'Utilisateur introuvable.' });
      const user = users[0];
      const isPremium = user.premium === 1 && (!user.premium_expires_at || new Date(user.premium_expires_at) > new Date());
      return res.json({ premium: isPremium, expiresAt: user.premium_expires_at });
    } catch (e) {
      if (e.errno === 1054 || e.code === 'ER_BAD_FIELD_ERROR') {
        return res.json({ premium: false, expiresAt: null });
      }
      throw e;
    }
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.post('/initiate', authenticate, async (req, res) => {
  try {
    try {
      const [users] = await pool.query('SELECT premium, premium_expires_at FROM users WHERE id = ?', [req.user.id]);
      if (users.length === 0) return res.status(404).json({ message: 'Utilisateur introuvable.' });
      if (users[0].premium === 1 && (!users[0].premium_expires_at || new Date(users[0].premium_expires_at) > new Date())) {
        return res.status(400).json({ message: 'Vous avez deja un abonnement premium actif.' });
      }
    } catch (e) {
      if (!(e.errno === 1054 || e.code === 'ER_BAD_FIELD_ERROR')) throw e;
    }

    try {
      const [existing] = await pool.query('SELECT id FROM premium_payments WHERE user_id = ? AND status = ?', [req.user.id, 'en_attente']);
      if (existing.length > 0) {
        return res.json({
          message: `Vous avez deja une demande en attente. Versez ${PREMIUM_AMOUNT} DH sur le compte ci-dessous.`,
          paymentId: existing[0].id,
          amount: PREMIUM_AMOUNT,
          bank: BANK_INFO,
        });
      }
    } catch (e) {
      if (!(e.errno === 1146 || e.code === 'ER_NO_SUCH_TABLE')) throw e;
    }

    try {
      const [result] = await pool.query(
        'INSERT INTO premium_payments (user_id, amount, status) VALUES (?, ?, ?)',
        [req.user.id, PREMIUM_AMOUNT, 'en_attente']
      );
      return res.status(201).json({
        message: `Demande creee. Versez ${PREMIUM_AMOUNT} DH sur le compte ci-dessous.`,
        paymentId: result.insertId,
        amount: PREMIUM_AMOUNT,
        bank: BANK_INFO,
      });
    } catch (e) {
      if (e.errno === 1146 || e.code === 'ER_NO_SUCH_TABLE') {
        return res.json({
          message: `Versez ${PREMIUM_AMOUNT} DH sur le compte ci-dessous. Contactez le support apres le virement.`,
          paymentId: null,
          amount: PREMIUM_AMOUNT,
          bank: BANK_INFO,
        });
      }
      throw e;
    }
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.post('/activate', authenticate, screenshotUpload.single('screenshot'), async (req, res) => {
  try {
    let paymentRow;
    try {
      const [payments] = await pool.query(
        'SELECT p.*, u.full_name, u.phone FROM premium_payments p JOIN users u ON p.user_id = u.id WHERE p.user_id = ? AND p.status = ? ORDER BY p.id DESC LIMIT 1',
        [req.user.id, 'en_attente']
      );
      if (payments.length === 0) return res.status(404).json({ message: 'Aucune demande en attente.' });
      paymentRow = payments[0];
    } catch (e) {
      if (e.errno === 1146 || e.code === 'ER_NO_SUCH_TABLE') return res.status(400).json({ message: 'Systeme de paiement non configure. Contactez le support.' });
      throw e;
    }

    if (!req.file) return res.status(400).json({ message: 'Fichier requis.' });

    const filename = req.file.filename;
    await pool.query('UPDATE premium_payments SET screenshot = ? WHERE id = ?', [filename, paymentRow.id]);

    try {
      let adminPhone = ADMIN_PHONE;
      const [admins] = await pool.query('SELECT phone FROM users WHERE role = ?', ['admin']);
      if (admins.length > 0 && admins[0].phone) adminPhone = admins[0].phone;
      if (adminPhone) {
        const msg = `Premium #${paymentRow.id} ${paymentRow.full_name} ${paymentRow.phone} 50DH recu, confirmer sur admin`;
        await gomobile.sendSms(adminPhone, msg);
      }
    } catch (smsErr) {
      console.error('Admin SMS failed:', smsErr.message);
    }

    res.json({ message: 'Screenshot envoye. En attente de confirmation par l\'administrateur.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;
