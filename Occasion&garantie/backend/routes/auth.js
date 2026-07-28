const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');
const gomobile = require('../services/gomobile');
const { send, verification } = require('../emails');
const { upload: cloudUpload } = require('../services/uploader');
const { logVendorAction } = require('../services/tracker');

const router = express.Router();

const resetCodes = new Map();
const phoneChangeCodes = new Map();
const CODE_EXPIRY = 15 * 60 * 1000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const AVATAR_DIR = path.join(__dirname, '..', 'uploads', 'avatars');
if (!fs.existsSync(AVATAR_DIR)) fs.mkdirSync(AVATAR_DIR, { recursive: true });

const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, AVATAR_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `avatar-${req.user.id}-${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Format non supporte. Utilisez JPG, PNG ou WebP.'));
  },
});

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });
  next();
};

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

router.post('/signup', [
  body('fullName').trim().notEmpty().withMessage('Le nom complet est requis.'),
  body('email').isEmail().withMessage('Email invalide.').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères.'),
  body('phone').trim().notEmpty().withMessage('Le numéro de téléphone est requis.'),
  body('verificationMethod').isIn(['email', 'sms']).withMessage('Methode de verification invalide.'),
  body('termsAccepted').isBoolean().withMessage('Vous devez accepter les conditions generales.'),
], validate, async (req, res) => {
  try {
    const { fullName, email, password, phone, role, storeName, verificationMethod, termsAccepted } = req.body;
    if (!termsAccepted) return res.status(400).json({ message: 'Vous devez accepter les conditions generales.' });
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
    }
    const [phoneCount] = await pool.query('SELECT COUNT(*) as cnt FROM users WHERE phone = ?', [phone]);
    if (phoneCount[0].cnt >= 2) {
      return res.status(400).json({ message: 'Ce numero de telephone a atteint la limite de 2 comptes.' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const code = generateCode();
    const expiresAt = Date.now() + CODE_EXPIRY;
    const userRole = (role === 'seller') ? 'seller' : 'client';

    try { await pool.query('ALTER TABLE users ADD COLUMN verification_method VARCHAR(10) DEFAULT \'sms\''); } catch {}

    const [result] = await pool.query(
      'INSERT INTO users (full_name, email, password, phone, phone_verified, verification_token, verification_expires, role, store_name, terms_accepted, verification_method) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [fullName, email, hashed, phone, false, code, expiresAt, userRole, (role === 'seller' && storeName) ? storeName : null, true, verificationMethod]
    );

    if (verificationMethod === 'email') {
      try {
        await send({
          to: email,
          subject: 'Votre code de verification - Occasion & Garantie',
          html: verification({ code, userName: fullName }),
        });
      } catch (mailErr) {
        console.error('Email failed, trying SMS:', mailErr.message);
        try {
          await gomobile.sendSms(phone, `Votre code de verification Occasion & Garantie : ${code}`);
        } catch (smsErr2) {
          console.error('SMS also failed:', smsErr2.message);
          await pool.query('DELETE FROM users WHERE id = ?', [result.insertId]);
          return res.status(500).json({ message: 'Impossible d\'envoyer le code de verification. Reessayez plus tard.' });
        }
      }
    } else {
      try {
        await gomobile.sendSms(phone, `Votre code de verification Occasion & Garantie : ${code}`);
      } catch (smsErr) {
        console.error('SMS failed, trying email:', smsErr.message);
        try {
          await send({
            to: email,
            subject: 'Votre code de verification - Occasion & Garantie',
            html: verification({ code, userName: fullName }),
          });
        } catch (mailErr2) {
          console.error('Email also failed:', mailErr2.message);
          await pool.query('DELETE FROM users WHERE id = ?', [result.insertId]);
          return res.status(500).json({ message: 'Impossible d\'envoyer le code de verification. Reessayez plus tard.' });
        }
      }
    }

    res.status(201).json({
      message: verificationMethod === 'email' ? 'Un code de verification a ete envoye par email.' : 'Un code de verification a ete envoye par SMS.',
      needsVerification: true,
      email,
      verificationMethod
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.post('/verify-code', [
  body('email').isEmail().withMessage('Email invalide.').normalizeEmail(),
  body('code').trim().isLength({ min: 6, max: 6 }).withMessage('Code invalide.'),
], validate, async (req, res) => {
  try {
    const { email, code } = req.body;
    const [users] = await pool.query('SELECT id, phone_verified, verification_token, verification_expires FROM users WHERE email = ?', [email]);
    if (users.length === 0) return res.status(400).json({ message: 'Utilisateur introuvable.' });

    const user = users[0];
    if (user.phone_verified) return res.json({ message: 'Compte deja verifie.', verified: true });

    if (user.verification_token !== code) return res.status(400).json({ message: 'Code incorrect.' });
    if (Date.now() > user.verification_expires) return res.status(400).json({ message: 'Code expire. Demandez un nouveau code.' });

    await pool.query('UPDATE users SET phone_verified = ? WHERE id = ?', [true, user.id]);
    res.json({ message: 'Telephone verifie avec succes.', verified: true });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.post('/resend-code', [
  body('email').isEmail().withMessage('Email invalide.').normalizeEmail(),
], validate, async (req, res) => {
  try {
    const { email } = req.body;
    const [users] = await pool.query('SELECT id, phone, phone_verified, full_name, COALESCE(verification_method,\'sms\') as verification_method FROM users WHERE email = ?', [email]);
    if (users.length === 0) return res.status(400).json({ message: 'Utilisateur introuvable.' });

    const user = users[0];
    if (user.phone_verified) return res.json({ message: 'Compte deja verifie.' });

    const code = generateCode();
    const expiresAt = Date.now() + CODE_EXPIRY;
    await pool.query('UPDATE users SET verification_token = ?, verification_expires = ? WHERE id = ?', [code, expiresAt, user.id]);

    if (user.verification_method === 'email') {
      try {
        await send({
          to: email,
          subject: 'Votre code de verification - Occasion & Garantie',
          html: verification({ code, userName: user.full_name }),
        });
      } catch (mailErr) {
        console.error('Email failed, trying SMS:', mailErr.message);
        try {
          await gomobile.sendSms(user.phone, `Votre code de verification Occasion & Garantie : ${code}`);
        } catch (smsErr2) {
          console.error('SMS also failed:', smsErr2.message);
          return res.status(500).json({ message: 'Impossible d\'envoyer le code. Reessayez plus tard.' });
        }
      }
    } else {
      try {
        await gomobile.sendSms(user.phone, `Votre code de verification Occasion & Garantie : ${code}`);
      } catch (smsErr) {
        console.error('SMS failed, trying email:', smsErr.message);
        try {
          await send({
            to: email,
            subject: 'Votre code de verification - Occasion & Garantie',
            html: verification({ code, userName: user.full_name }),
          });
        } catch (mailErr2) {
          console.error('Email also failed:', mailErr2.message);
          return res.status(500).json({ message: 'Impossible d\'envoyer le code. Reessayez plus tard.' });
        }
      }
    }

    res.json({ message: user.verification_method === 'email' ? 'Un nouveau code a ete envoye par email.' : 'Un nouveau code a ete envoye par SMS.', verificationMethod: user.verification_method });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.post('/login', [
  body('email').isEmail().withMessage('Email invalide.').normalizeEmail(),
  body('password').notEmpty().withMessage('Mot de passe requis.'),
], validate, async (req, res) => {
  try {
    try { await pool.query("ALTER TABLE users ADD COLUMN suspended TINYINT(1) DEFAULT 0"); } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') console.log('suspended col:', e.message); }
    try { await pool.query("ALTER TABLE users ADD COLUMN suspension_reason VARCHAR(255) DEFAULT NULL"); } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') console.log('suspension_reason col:', e.message); }
    try { await pool.query("ALTER TABLE users ADD COLUMN vpn_warned_at DATETIME DEFAULT NULL"); } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') console.log('vpn_warned_at col:', e.message); }

    const { email, password, latitude, longitude } = req.body;
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(400).json({ message: 'Email ou mot de passe incorrect.' });
    }
    const user = users[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).json({ message: 'Email ou mot de passe incorrect.' });
    }
    if (user.suspended) {
      return res.status(403).json({ message: 'Votre compte a ete suspendu. Raison : ' + (user.suspension_reason || 'Non specifiee') + '. Contactez l\'administration (contact-occasionetgarantie@proton.me).' });
    }
    if (!user.phone_verified && user.role !== 'admin') {
      return res.status(403).json({
        message: 'Compte non active. Veuillez entrer le code de verification recu par SMS.',
        needsVerification: true,
        email: user.email
      });
    }
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '6h' }
    );
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
    logVendorAction({ userId: user.id, action: 'connexion', ip, userAgent: req.headers['user-agent'], latitude, longitude });
    res.json({
      token,
      user: { id: user.id, fullName: user.full_name, email: user.email, phone: user.phone, role: user.role, phoneVerified: true }
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    let user;
    try {
      const [users] = await pool.query('SELECT id, full_name, email, phone, role, phone_verified, created_at, store_name, premium, premium_expires_at, avatar FROM users WHERE id = ?', [req.user.id]);
      if (users.length === 0) return res.status(404).json({ message: 'Utilisateur introuvable.' });
      user = users[0];
    } catch (e) {
      if (e.errno === 1054 || e.code === 'ER_BAD_FIELD_ERROR') {
        const [users] = await pool.query('SELECT id, full_name, email, phone, role, phone_verified, created_at, store_name, avatar FROM users WHERE id = ?', [req.user.id]);
        if (users.length === 0) return res.status(404).json({ message: 'Utilisateur introuvable.' });
        user = { ...users[0], premium: false, premium_expires_at: null };
      } else {
        throw e;
      }
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.put('/profile', authenticate, [
  body('fullName').optional().trim().notEmpty().withMessage('Le nom ne peut pas etre vide.'),
  body('oldPassword').optional(),
  body('newPassword').optional().isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caracteres.'),
], validate, async (req, res) => {
  try {
    const { fullName, oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (newPassword) {
      if (!oldPassword) return res.status(400).json({ message: 'Ancien mot de passe requis.' });
      const [users] = await pool.query('SELECT password FROM users WHERE id = ?', [userId]);
      if (users.length === 0) return res.status(404).json({ message: 'Utilisateur introuvable.' });
      const valid = await bcrypt.compare(oldPassword, users[0].password);
      if (!valid) return res.status(400).json({ message: 'Ancien mot de passe incorrect.' });
    }

    if (fullName) {
      await pool.query('UPDATE users SET full_name = ? WHERE id = ?', [fullName, userId]);
    }

    if (newPassword) {
      const hashed = await bcrypt.hash(newPassword, 10);
      await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, userId]);
    }

    res.json({ message: 'Profil mis a jour avec succes.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.post('/upload-avatar', authenticate, (req, res) => {
  avatarUpload.single('avatar')(req, res, async (err) => {
    try {
      if (err) {
        console.error('Multer error:', err.message);
        return res.status(400).json({ message: err.message });
      }
      if (!req.file) return res.status(400).json({ message: 'Aucun fichier envoye.' });
      console.log('File received:', req.file.path, 'size:', req.file.size);
      const result = await cloudUpload(req.file.path, 'avatars');
      console.log('Upload result:', result);
      await pool.query('UPDATE users SET avatar = ? WHERE id = ?', [result.url, req.user.id]);
      res.json({ avatar: result.url });
    } catch (catchErr) {
      console.error('Avatar upload catch:', catchErr.message || catchErr);
      res.status(500).json({ message: 'Erreur serveur.', detail: catchErr.message });
    }
  });
});

router.post('/send-phone-code', authenticate, [
  body('newPhone').trim().notEmpty().withMessage('Nouveau numero requis.'),
], validate, async (req, res) => {
  try {
    const { newPhone } = req.body;
    const code = crypto.randomInt(100000, 999999).toString();
    phoneChangeCodes.set(req.user.id, { code, newPhone, expiresAt: Date.now() + CODE_EXPIRY });

    try {
      await gomobile.sendSms(newPhone, `Votre code de verification Occasion & Garantie : ${code}. Valable 15 min.`);
    } catch (smsErr) {
      console.error('SMS send failed:', smsErr.message);
    }

    res.json({ message: 'Code de verification envoye au nouveau numero.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.post('/verify-phone-change', authenticate, [
  body('code').notEmpty().withMessage('Code requis.'),
], validate, async (req, res) => {
  try {
    const { code } = req.body;
    const entry = phoneChangeCodes.get(req.user.id);
    if (!entry) return res.status(400).json({ message: 'Aucun code demande.' });
    if (Date.now() > entry.expiresAt) {
      phoneChangeCodes.delete(req.user.id);
      return res.status(400).json({ message: 'Code expire.' });
    }
    if (entry.code !== code) return res.status(400).json({ message: 'Code incorrect.' });

    await pool.query('UPDATE users SET phone = ? WHERE id = ?', [entry.newPhone, req.user.id]);
    await pool.query('UPDATE users SET phone_verified = ? WHERE id = ?', [true, req.user.id]);
    phoneChangeCodes.delete(req.user.id);
    res.json({ message: 'Numero mis a jour avec succes.', phone: entry.newPhone });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

function normalizePhone(val) {
  const digits = val.replace(/\D/g, '');
  if (digits.length === 10 && (digits.startsWith('06') || digits.startsWith('07'))) return '+212' + digits.slice(1);
  if (digits.length === 9 && (digits.startsWith('6') || digits.startsWith('7'))) return '+212' + digits;
  if (digits.length === 12 && digits.startsWith('212')) return '+' + digits;
  if (digits.length === 13 && digits.startsWith('+212')) return '+' + digits.slice(1);
  return val;
}

router.post('/forgot-password', [
  body('identifier').trim().notEmpty().withMessage('Email ou telephone requis.'),
], validate, async (req, res) => {
  try {
    const { identifier, userId } = req.body;
    let users;
    if (identifier.includes('@')) {
      [users] = await pool.query('SELECT id, full_name, email, phone FROM users WHERE email = ?', [identifier]);
      if (users.length === 0) return res.status(404).json({ message: 'Aucun compte trouve avec cet email.' });
      if (!users[0].phone) return res.status(400).json({ message: 'Aucun telephone enregistre sur ce compte.' });
      const code = crypto.randomInt(100000, 999999).toString();
      resetCodes.set(identifier, { code, userId: users[0].id, expiresAt: Date.now() + CODE_EXPIRY });
      try { await gomobile.sendSms(users[0].phone, `Votre code de reinitialisation Occasion & Garantie : ${code}. Valable 15 min.`); } catch (smsErr) { console.error('SMS send failed:', smsErr.message); }
      return res.json({ message: 'Code de verification envoye par SMS.', identifier });
    }

    const inputDigits = identifier.replace(/\D/g, '');
    const [matched] = await pool.query(
      'SELECT id, full_name, email, phone FROM users'
    );
    const unique = matched.filter(u => {
      const pd = (u.phone || '').replace(/\D/g, '');
      return pd === inputDigits || pd.endsWith(inputDigits.slice(-9)) || inputDigits.endsWith(pd.slice(-9));
    });
    if (unique.length === 0) return res.status(404).json({ message: 'Aucun compte trouve avec ce telephone.' });

    if (unique.length > 1 && !userId) {
      const accounts = unique.map(u => ({
        id: u.id,
        full_name: u.full_name,
        email: u.email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + '*'.repeat(b.length) + c),
      }));
      return res.json({ multipleAccounts: true, accounts, message: 'Plusieurs comptes trouves. Selectionnez le compte concerne.' });
    }

    const targetId = userId ? Number(userId) : unique[0].id;
    const target = unique.find(u => u.id === targetId);
    if (!target) return res.status(404).json({ message: 'Compte introuvable.' });
    if (!target.phone) return res.status(400).json({ message: 'Aucun telephone enregistre sur ce compte.' });

    const code = crypto.randomInt(100000, 999999).toString();
    const key = inputDigits + '-' + targetId;
    resetCodes.set(key, { code, userId: targetId, expiresAt: Date.now() + CODE_EXPIRY });

    try {
      await gomobile.sendSms(target.phone, `Votre code de reinitialisation Occasion & Garantie : ${code}. Valable 15 min.`);
    } catch (smsErr) {
      console.error('SMS send failed:', smsErr.message);
    }

    res.json({ message: 'Code de verification envoye par SMS.', identifier, userId: targetId });
  } catch (err) {
    console.error('forgot-password error:', err.message, err.stack?.split('\n').slice(0, 3).join('\n'));
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.post('/verify-reset-code', [
  body('identifier').trim().notEmpty().withMessage('Identifiant requis.'),
  body('code').notEmpty().withMessage('Code requis.'),
], validate, async (req, res) => {
  try {
    const { identifier, code, userId } = req.body;
    const key = userId ? identifier + '-' + userId : identifier;
    const entry = resetCodes.get(key);
    if (!entry) return res.status(400).json({ message: 'Aucun code demande pour cet identifiant.' });
    if (Date.now() > entry.expiresAt) {
      resetCodes.delete(key);
      return res.status(400).json({ message: 'Code expire. Veuillez refaire une demande.' });
    }
    if (entry.code !== code) return res.status(400).json({ message: 'Code incorrect.' });

    res.json({ message: 'Code verifie.', valid: true, identifier, userId: entry.userId });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.post('/reset-password', [
  body('identifier').trim().notEmpty().withMessage('Identifiant requis.'),
  body('code').notEmpty().withMessage('Code requis.'),
  body('newPassword').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caracteres.'),
], validate, async (req, res) => {
  try {
    const { identifier, code, newPassword, userId } = req.body;
    const key = userId ? identifier + '-' + userId : identifier;
    const entry = resetCodes.get(key);
    if (!entry) return res.status(400).json({ message: 'Aucune demande de reinitialisation.' });
    if (Date.now() > entry.expiresAt) {
      resetCodes.delete(key);
      return res.status(400).json({ message: 'Code expire. Veuillez refaire une demande.' });
    }
    if (entry.code !== code) return res.status(400).json({ message: 'Code incorrect.' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, entry.userId]);
    resetCodes.delete(key);

    res.json({ message: 'Mot de passe reinitialise avec succes.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

const sellerUpgradeCodes = new Map();

router.post('/upgrade-seller', authenticate, async (req, res) => {
  try {
    const [users] = await pool.query('SELECT phone, role FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) return res.status(400).json({ message: 'Utilisateur introuvable.' });
    if (users[0].role === 'seller' || users[0].role === 'admin') return res.json({ message: 'Vous êtes déjà vendeur.' });

    const code = generateCode();
    const expiresAt = Date.now() + CODE_EXPIRY;
    sellerUpgradeCodes.set(req.user.id, { code, expiresAt });

    try {
      await gomobile.sendSms(users[0].phone, `Code verification vendeur Occasion & Garantie : ${code}`);
    } catch (smsErr) {
      console.log('SMS upgrade failed:', smsErr.message);
    }

    res.json({ message: 'Code de verification envoye par SMS.', phone: users[0].phone });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.post('/verify-upgrade', authenticate, [
  body('code').trim().isLength({ min: 6, max: 6 }).withMessage('Code invalide.'),
  body('storeName').optional().trim(),
], validate, async (req, res) => {
  try {
    const { code, storeName } = req.body;
    const saved = sellerUpgradeCodes.get(req.user.id);
    if (!saved) return res.status(400).json({ message: 'Aucun code envoye. Demandez un nouveau code.' });
    if (saved.code !== code) return res.status(400).json({ message: 'Code incorrect.' });
    if (Date.now() > saved.expiresAt) return res.status(400).json({ message: 'Code expire. Demandez un nouveau code.' });

    sellerUpgradeCodes.delete(req.user.id);
    await pool.query('UPDATE users SET role = ? WHERE id = ?', ['seller', req.user.id]);
    if (storeName) await pool.query('UPDATE users SET store_name = ? WHERE id = ?', [storeName, req.user.id]);

    const token = jwt.sign(
      { id: req.user.id, email: req.user.email, role: 'seller' },
      process.env.JWT_SECRET,
      { expiresIn: '6h' }
    );
    const [users] = await pool.query('SELECT id, full_name, email, phone, role, phone_verified, created_at, store_name, premium, premium_expires_at, avatar FROM users WHERE id = ?', [req.user.id]);
    res.json({ message: 'Compte vendeur active avec succes.', token, user: users[0] });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

const CREDIT_BANK_INFO = {
  bank: 'CIH Bank',
  holder: 'OCCASION ET GARANTIE BOUTIQUE',
  rib: '230780409210621100460062',
};

router.post('/buy-credits', authenticate, async (req, res) => {
  try {
    const { amount } = req.body;
    const creditAmount = Number(amount);
    if (!creditAmount || creditAmount < 50) return res.status(400).json({ message: 'Montant minimum: 50 DH.' });

    const credits = creditAmount * 10;

    try {
      await pool.query('ALTER TABLE credit_purchases ADD COLUMN screenshot VARCHAR(255) DEFAULT NULL');
    } catch {}

    const [result] = await pool.query(
      'INSERT INTO credit_purchases (user_id, amount_dh, credits) VALUES (?, ?, ?)',
      [req.user.id, creditAmount, credits]
    );

    const [users] = await pool.query('SELECT credit_balance FROM users WHERE id = ?', [req.user.id]);

    res.json({
      message: `Versez ${creditAmount} DH sur le compte ci-dessous.`,
      purchaseId: result.insertId,
      credits,
      amount_dh: creditAmount,
      bank: CREDIT_BANK_INFO,
      credit_balance: users[0]?.credit_balance || 0
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

const CREDIT_SCREENSHOT_DIR = path.join(__dirname, '..', 'uploads', 'credits');
if (!fs.existsSync(CREDIT_SCREENSHOT_DIR)) fs.mkdirSync(CREDIT_SCREENSHOT_DIR, { recursive: true });

const creditUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, CREDIT_SCREENSHOT_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `credit-${req.user.id}-${Date.now()}${ext}`);
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

router.post('/upload-credit-screenshot', authenticate, creditUpload.single('screenshot'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Fichier requis.' });
    const { purchaseId } = req.body;
    if (!purchaseId) return res.status(400).json({ message: 'ID de demande requis.' });

    const [purchases] = await pool.query('SELECT * FROM credit_purchases WHERE id = ? AND user_id = ?', [purchaseId, req.user.id]);
    if (purchases.length === 0) return res.status(404).json({ message: 'Demande introuvable.' });
    if (purchases[0].status !== 'en_attente') return res.status(400).json({ message: 'Deja traitee.' });

    const result = await cloudUpload(req.file.path, 'credits');
    await pool.query('UPDATE credit_purchases SET screenshot = ? WHERE id = ?', [result.url, purchaseId]);

    try {
      const [adminRow] = await pool.query('SELECT email FROM users WHERE role = ?', ['admin']);
      if (adminRow.length > 0 && adminRow[0].email) {
        const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"></head><body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f8f9fc"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px"><tr><td align="center"><table role="presentation" width="100%" style="max-width:480px;background:#fff;border-radius:12px;padding:32px"><tr><td align="center"><div style="width:56px;height:56px;border-radius:50%;background:rgba(245,158,11,0.12);display:flex;align-items:center;justify-content:center;margin:0 auto"><span style="font-size:24px;color:#f59e0b">&#9888;</span></div><h1 style="font-size:18px;color:#1e293b;margin:16px 0 4px">Nouvel achat de crédits</h1><p style="font-size:14px;color:#64748b;margin:0 0 20px">Un client a envoyé un paiement, à confirmer</p></td></tr><tr><td><table width="100%" cellpadding="8" style="background:#f0f1f5;border-radius:8px;margin-bottom:20px"><tr><td style="font-size:13px;color:#64748b">Demande</td><td style="font-size:14px;font-weight:600;color:#1e293b" align="right">#${purchaseId}</td></tr><tr><td style="font-size:13px;color:#64748b">Crédits</td><td style="font-size:14px;font-weight:600;color:#1e293b" align="right">${purchases[0].credits}</td></tr><tr><td style="font-size:13px;color:#64748b">Montant</td><td style="font-size:14px;font-weight:600;color:#1e293b" align="right">${purchases[0].amount_dh} DH</td></tr></table><a href="https://www.occasionetgarantie.store/admin/credits" style="display:block;text-align:center;padding:14px;background:linear-gradient(135deg, #f59e0b, #d97706);color:#fff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600">Confirmer la demande</a></td></tr><tr><td style="padding-top:16px" align="center"><p style="font-size:12px;color:#94a3b8;margin:0">Occasion &amp; Garantie — Admin</p></td></tr></table></td></tr></table></body></html>`;
        await send({ to: adminRow[0].email, subject: `Nouvel achat de credits #${purchaseId} - ${purchases[0].amount_dh} DH`, html });
      }
    } catch (notifErr) { console.error('Admin email failed:', notifErr.message); }

    res.json({ message: 'Screenshot envoye. En attente de confirmation par l\'administrateur.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.get('/my-credits', authenticate, async (req, res) => {
  try {
    let balance = 0;
    try {
      const [users] = await pool.query('SELECT credit_balance FROM users WHERE id = ?', [req.user.id]);
      balance = users[0]?.credit_balance || 0;
    } catch (e) {
      if (e.errno === 1054 || e.code === 'ER_BAD_FIELD_ERROR') {
        try { await pool.query('ALTER TABLE users ADD COLUMN credit_balance DECIMAL(10,2) DEFAULT 0'); } catch {}
        balance = 0;
      } else throw e;
    }
    let txns = [];
    try {
      const [rows] = await pool.query(
        'SELECT * FROM credit_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
        [req.user.id]
      );
      txns = rows;
    } catch (e) {
      if (e.errno === 1146 || e.code === 'ER_NO_SUCH_TABLE') txns = [];
      else throw e;
    }
    res.json({ credit_balance: balance, transactions: txns, debug_user_id: req.user.id, debug_email: req.user.email });
  } catch (err) {
    console.error('/my-credits error:', err.sqlMessage || err.message);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.post('/request-installment', authenticate, async (req, res) => {
  try {
    const { product_id, months } = req.body;
    if (!product_id || !months || ![3, 6, 12].includes(months)) {
      return res.status(400).json({ message: 'Parametres invalides. Mois: 3, 6 ou 12.' });
    }

    const [products] = await pool.query('SELECT id, price, seller_id, name FROM products WHERE id = ?', [product_id]);
    if (products.length === 0) return res.status(404).json({ message: 'Produit introuvable.' });

    const totalPrice = Number(products[0].price);
    const downPayment = Math.round(totalPrice * 0.3);
    const remaining = totalPrice - downPayment;
    const monthlyAmount = Math.round(remaining / months);

    await pool.query(
      'INSERT INTO installments (product_id, buyer_id, seller_id, total_price, down_payment, monthly_amount, months) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [product_id, req.user.id, products[0].seller_id, totalPrice, downPayment, monthlyAmount, months]
    );

    res.json({
      message: 'Demande de paiement echelonne envoyee.',
      details: { totalPrice, downPayment, monthlyAmount, months }
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.delete('/account', authenticate, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ message: 'Mot de passe requis pour supprimer le compte.' });

    const [users] = await pool.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) return res.status(404).json({ message: 'Utilisateur introuvable.' });

    const valid = await bcrypt.compare(password, users[0].password);
    if (!valid) return res.status(400).json({ message: 'Mot de passe incorrect.' });

    await pool.query('DELETE FROM users WHERE id = ?', [req.user.id]);

    res.json({ message: 'Compte supprime avec succes.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;
