const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');
const gomobile = require('../services/gomobile');

const router = express.Router();

const verifyTokens = new Map();
const resetCodes = new Map();
const CODE_EXPIRY = 15 * 60 * 1000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

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
  if (!token) return res.redirect(`${CLIENT_URL}/login?verified=error`);

  const entry = verifyTokens.get(token);
  if (!entry) return res.redirect(`${CLIENT_URL}/login?verified=invalid`);
  if (Date.now() > entry.expiresAt) {
    verifyTokens.delete(token);
    return res.redirect(`${CLIENT_URL}/login?verified=expired`);
  }

  await pool.query('UPDATE users SET phone_verified = ? WHERE id = ?', [true, entry.userId]);
  verifyTokens.delete(token);

  res.redirect(`${CLIENT_URL}/login?verified=success`);
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
    if (!user.phone_verified) {
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
  body('email').optional().isEmail().withMessage('Email invalide.').normalizeEmail(),
  body('phone').optional().trim(),
  body('password').optional().isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caracteres.'),
], validate, async (req, res) => {
  try {
    const { fullName, email, phone, password } = req.body;
    const userId = req.user.id;

    if (email) {
      const [existing] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]);
      if (existing.length > 0) return res.status(400).json({ message: 'Cet email est deja utilise.' });
    }

    let query = 'UPDATE users SET full_name = ?, email = ?, phone = ?';
    const params = [fullName, email, phone || null];

    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      query += ', password = ?';
      params.push(hashed);
    }

    query += ' WHERE id = ?';
    params.push(userId);

    await pool.query(query, params);
    res.json({ message: 'Profil mis a jour avec succes.' });
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
