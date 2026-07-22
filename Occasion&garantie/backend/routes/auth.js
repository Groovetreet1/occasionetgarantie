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

const verifyTokens = new Map();
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

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

router.post('/signup', [
  body('fullName').trim().notEmpty().withMessage('Le nom complet est requis.'),
  body('email').isEmail().withMessage('Email invalide.').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères.'),
  body('phone').trim().notEmpty().withMessage('Le numéro de téléphone est requis.'),
], validate, async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (full_name, email, password, phone, phone_verified) VALUES (?, ?, ?, ?, ?)',
      [fullName, email, hashed, phone, false]
    );

    const token = generateToken();
    verifyTokens.set(token, { userId: result.insertId, email, expiresAt: Date.now() + CODE_EXPIRY });

    const verifyUrl = `${req.protocol}://${req.get('host')}/api/auth/verify-phone?token=${token}`;
    try {
      await gomobile.sendSms(phone, `Activez votre compte Occasion & Garantie en cliquant ici : ${verifyUrl}`);
    } catch (smsErr) {
      console.error('SMS send failed:', smsErr.message);
    }

    res.status(201).json({
      message: 'Un lien d\'activation a ete envoye par SMS. Verifiez votre telephone.'
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.get('/verify-phone', async (req, res) => {
  const { token } = req.query;
  let status = 'success';

  if (!token) {
    status = 'error';
  } else {
    const entry = verifyTokens.get(token);
    if (!entry) {
      status = 'invalid';
    } else if (Date.now() > entry.expiresAt) {
      verifyTokens.delete(token);
      status = 'expired';
    } else {
      await pool.query('UPDATE users SET phone_verified = ? WHERE id = ?', [true, entry.userId]);
      verifyTokens.delete(token);
    }
  }

  const SITE_NAME = 'Occasion & Garantie';
  const LOGIN_URL = `${CLIENT_URL}/login`;

  const messages = {
    success: { title: 'Compte active !', desc: 'Votre compte a ete verifie avec succes. Vous pouvez maintenant vous connecter.', icon: '✅' },
    expired: { title: 'Lien expire', desc: 'Ce lien de verification a expire. Veuillez refaire une inscription.', icon: '⏰' },
    invalid: { title: 'Lien invalide', desc: 'Ce lien de verification n\'est pas valide.', icon: '❌' },
    error: { title: 'Erreur', desc: 'Aucun token de verification fourni.', icon: '⚠️' },
  };

  const m = messages[status] || messages.error;

  res.send(`<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${SITE_NAME} - Verification</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
    background:linear-gradient(135deg,#667eea,#764ba2);min-height:100vh;
    display:flex;align-items:center;justify-content:center;padding:20px}
  .card{background:#fff;border-radius:20px;padding:40px;max-width:420px;
    width:100%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.3)}
  .icon{font-size:64px;margin-bottom:16px}
  h1{font-size:24px;margin-bottom:12px;color:#1a1a2e}
  p{font-size:16px;color:#666;margin-bottom:24px;line-height:1.5}
  .btn{display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#667eea,#764ba2);
    color:#fff;text-decoration:none;border-radius:12px;font-weight:600;font-size:16px}
  .btn:hover{opacity:0.9}
  .footer{margin-top:24px;font-size:13px;color:#999}
</style></head>
<body>
  <div class="card">
    <div class="icon">${m.icon}</div>
    <h1>${m.title}</h1>
    <p>${m.desc}</p>
    <a href="${LOGIN_URL}" class="btn">Se connecter</a>
    <div class="footer">${SITE_NAME}</div>
  </div>
</body>
</html>`);
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
      return res.status(403).json({ message: 'Compte non active. Veuillez verifier votre telephone via le lien recu par SMS.' });
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
    const [users] = await pool.query('SELECT id, full_name, email, phone, role, phone_verified, created_at FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) return res.status(404).json({ message: 'Utilisateur introuvable.' });
    res.json(users[0]);
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

module.exports = router;
