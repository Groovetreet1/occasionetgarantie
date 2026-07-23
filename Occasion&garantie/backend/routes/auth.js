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
], validate, async (req, res) => {
  try {
    const { fullName, email, password, phone, role, storeName } = req.body;
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const code = generateCode();
    const expiresAt = Date.now() + CODE_EXPIRY;
    const userRole = (role === 'seller') ? 'seller' : 'client';

    const [result] = await pool.query(
      'INSERT INTO users (full_name, email, password, phone, phone_verified, verification_token, verification_expires, role, store_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [fullName, email, hashed, phone, false, code, expiresAt, userRole, (role === 'seller' && storeName) ? storeName : null]
    );

    try {
      await gomobile.sendSms(phone, `Votre code de verification Occasion & Garantie : ${code}`);
    } catch (smsErr) {
      console.error('SMS send failed:', smsErr.message);
    }

    res.status(201).json({
      message: 'Un code de verification a ete envoye par SMS.',
      needsVerification: true,
      email
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
    const [users] = await pool.query('SELECT id, phone, phone_verified FROM users WHERE email = ?', [email]);
    if (users.length === 0) return res.status(400).json({ message: 'Utilisateur introuvable.' });

    const user = users[0];
    if (user.phone_verified) return res.json({ message: 'Compte deja verifie.' });

    const code = generateCode();
    const expiresAt = Date.now() + CODE_EXPIRY;
    await pool.query('UPDATE users SET verification_token = ?, verification_expires = ? WHERE id = ?', [code, expiresAt, user.id]);

    try {
      await gomobile.sendSms(user.phone, `Votre code de verification Occasion & Garantie : ${code}`);
    } catch (smsErr) {
      console.error('SMS send failed:', smsErr.message);
    }

    res.json({ message: 'Un nouveau code a ete envoye par SMS.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.post('/login', [
  body('email').isEmail().withMessage('Email invalide.').normalizeEmail(),
  body('password').notEmpty().withMessage('Mot de passe requis.'),
], validate, async (req, res) => {
  try {
    const { email, password } = req.body;
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(400).json({ message: 'Email ou mot de passe incorrect.' });
    }
    const user = users[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).json({ message: 'Email ou mot de passe incorrect.' });
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
      { expiresIn: '7d' }
    );
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
      const [users] = await pool.query('SELECT id, full_name, email, phone, role, phone_verified, created_at, store_name, premium, premium_expires_at FROM users WHERE id = ?', [req.user.id]);
      if (users.length === 0) return res.status(404).json({ message: 'Utilisateur introuvable.' });
      user = users[0];
    } catch (e) {
      if (e.errno === 1054 || e.code === 'ER_BAD_FIELD_ERROR') {
        const [users] = await pool.query('SELECT id, full_name, email, phone, role, phone_verified, created_at, store_name FROM users WHERE id = ?', [req.user.id]);
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
    if (err) return res.status(400).json({ message: err.message });
    if (!req.file) return res.status(400).json({ message: 'Aucun fichier envoye.' });
    try {
      await pool.query('UPDATE users SET avatar = ? WHERE id = ?', [req.file.filename, req.user.id]);
      res.json({ avatar: req.file.filename });
    } catch (dbErr) {
      res.status(500).json({ message: 'Erreur serveur.' });
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

router.post('/forgot-password', [
  body('identifier').trim().notEmpty().withMessage('Email ou telephone requis.'),
], validate, async (req, res) => {
  try {
    const { identifier } = req.body;
    let users;
    if (identifier.includes('@')) {
      [users] = await pool.query('SELECT id, full_name, phone FROM users WHERE email = ?', [identifier]);
    } else {
      [users] = await pool.query('SELECT id, full_name, phone FROM users WHERE phone = ?', [identifier]);
    }
    if (users.length === 0) return res.status(404).json({ message: 'Aucun compte trouve avec cet email ou telephone.' });
    if (!users[0].phone) return res.status(400).json({ message: 'Aucun telephone enregistre sur ce compte.' });

    const code = crypto.randomInt(100000, 999999).toString();
    resetCodes.set(identifier, { code, userId: users[0].id, expiresAt: Date.now() + CODE_EXPIRY });

    try {
      await gomobile.sendSms(users[0].phone, `Votre code de reinitialisation Occasion & Garantie : ${code}. Valable 15 min.`);
    } catch (smsErr) {
      console.error('SMS send failed:', smsErr.message);
    }

    res.json({ message: 'Code de verification envoye par SMS.', identifier });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.post('/verify-reset-code', [
  body('identifier').trim().notEmpty().withMessage('Identifiant requis.'),
  body('code').notEmpty().withMessage('Code requis.'),
], validate, async (req, res) => {
  try {
    const { identifier, code } = req.body;
    const entry = resetCodes.get(identifier);
    if (!entry) return res.status(400).json({ message: 'Aucun code demande pour cet identifiant.' });
    if (Date.now() > entry.expiresAt) {
      resetCodes.delete(identifier);
      return res.status(400).json({ message: 'Code expire. Veuillez refaire une demande.' });
    }
    if (entry.code !== code) return res.status(400).json({ message: 'Code incorrect.' });

    res.json({ message: 'Code verifie.', valid: true, identifier });
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
    const { identifier, code, newPassword } = req.body;
    const entry = resetCodes.get(identifier);
    if (!entry) return res.status(400).json({ message: 'Aucune demande de reinitialisation.' });
    if (Date.now() > entry.expiresAt) {
      resetCodes.delete(identifier);
      return res.status(400).json({ message: 'Code expire. Veuillez refaire une demande.' });
    }
    if (entry.code !== code) return res.status(400).json({ message: 'Code incorrect.' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, entry.userId]);
    resetCodes.delete(identifier);

    res.json({ message: 'Mot de passe reinitialise avec succes.' });
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
