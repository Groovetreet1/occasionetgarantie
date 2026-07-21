const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');
const gomobile = require('../services/gomobile');

const router = express.Router();

const verificationCodes = new Map();
const resetCodes = new Map();
const CODE_EXPIRY = 15 * 60 * 1000;

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });
  next();
};

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
    const token = jwt.sign(
      { id: result.insertId, email, role: 'client' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const code = crypto.randomInt(100000, 999999).toString();
    verificationCodes.set(result.insertId, { code, expiresAt: Date.now() + CODE_EXPIRY });

    try {
      await gomobile.sendSms(phone, `Votre code de verification Occasion & Garantie : ${code}. Valable 15 min.`);
    } catch (smsErr) {
      console.error('SMS send failed:', smsErr.message);
    }

    res.status(201).json({
      token,
      user: { id: result.insertId, fullName, email, phone, role: 'client', phoneVerified: false },
      message: 'Un code de verification a ete envoye par SMS.'
    });
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
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({
      token,
      user: { id: user.id, fullName: user.full_name, email: user.email, phone: user.phone, role: user.role, phoneVerified: !!user.phone_verified }
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

router.post('/verify-phone', authenticate, [
  body('code').notEmpty().withMessage('Code requis.'),
], validate, async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user.id;
    const entry = verificationCodes.get(userId);
    if (!entry) return res.status(400).json({ message: 'Aucun code envoye. Demandez un nouveau code.' });
    if (Date.now() > entry.expiresAt) {
      verificationCodes.delete(userId);
      return res.status(400).json({ message: 'Code expire. Veuillez demander un nouveau code.' });
    }
    if (entry.code !== code) return res.status(400).json({ message: 'Code incorrect.' });

    await pool.query('UPDATE users SET phone_verified = ? WHERE id = ?', [true, userId]);
    verificationCodes.delete(userId);
    res.json({ message: 'Telephone verifie avec succes.', phoneVerified: true });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.post('/resend-sms-code', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const [users] = await pool.query('SELECT phone FROM users WHERE id = ?', [userId]);
    if (users.length === 0) return res.status(404).json({ message: 'Utilisateur introuvable.' });
    if (!users[0].phone) return res.status(400).json({ message: 'Aucun telephone enregistre.' });

    const code = crypto.randomInt(100000, 999999).toString();
    verificationCodes.set(userId, { code, expiresAt: Date.now() + CODE_EXPIRY });

    await gomobile.sendSms(users[0].phone, `Votre code de verification Occasion & Garantie : ${code}. Valable 15 min.`);
    res.json({ message: 'Nouveau code envoye par SMS.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.put('/profile', authenticate, [
  body('fullName').optional().trim().notEmpty().withMessage('Le nom ne peut pas être vide.'),
  body('email').optional().isEmail().withMessage('Email invalide.').normalizeEmail(),
  body('phone').optional().trim(),
  body('password').optional().isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères.'),
], validate, async (req, res) => {
  try {
    const { fullName, email, phone, password } = req.body;
    const userId = req.user.id;

    if (email) {
      const [existing] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]);
      if (existing.length > 0) return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
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
    res.json({ message: 'Profil mis à jour avec succès.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.post('/forgot-password', [
  body('email').isEmail().withMessage('Email invalide.').normalizeEmail(),
], validate, async (req, res) => {
  try {
    const { email } = req.body;
    const [users] = await pool.query('SELECT id, full_name, phone FROM users WHERE email = ?', [email]);
    if (users.length === 0) return res.status(404).json({ message: 'Aucun compte trouvé avec cet email.' });
    if (!users[0].phone) return res.status(400).json({ message: 'Aucun telephone enregistre sur ce compte.' });

    const code = crypto.randomInt(100000, 999999).toString();
    resetCodes.set(email, { code, expiresAt: Date.now() + CODE_EXPIRY });

    try {
      await gomobile.sendSms(users[0].phone, `Votre code de reinitialisation Occasion & Garantie : ${code}. Valable 15 min.`);
    } catch (smsErr) {
      console.error('SMS send failed:', smsErr.message);
    }

    res.json({ message: 'Code de verification envoye par SMS.', email });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.post('/verify-reset-code', [
  body('email').isEmail().withMessage('Email invalide.').normalizeEmail(),
  body('code').notEmpty().withMessage('Code requis.'),
], validate, async (req, res) => {
  try {
    const { email, code } = req.body;
    const entry = resetCodes.get(email);
    if (!entry) return res.status(400).json({ message: 'Aucun code demandé pour cet email.' });
    if (Date.now() > entry.expiresAt) {
      resetCodes.delete(email);
      return res.status(400).json({ message: 'Code expiré. Veuillez refaire une demande.' });
    }
    if (entry.code !== code) return res.status(400).json({ message: 'Code incorrect.' });

    res.json({ message: 'Code vérifié.', valid: true });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.post('/reset-password', [
  body('email').isEmail().withMessage('Email invalide.').normalizeEmail(),
  body('code').notEmpty().withMessage('Code requis.'),
  body('newPassword').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères.'),
], validate, async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    const entry = resetCodes.get(email);
    if (!entry) return res.status(400).json({ message: 'Aucune demande de réinitialisation.' });
    if (Date.now() > entry.expiresAt) {
      resetCodes.delete(email);
      return res.status(400).json({ message: 'Code expiré. Veuillez refaire une demande.' });
    }
    if (entry.code !== code) return res.status(400).json({ message: 'Code incorrect.' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = ? WHERE email = ?', [hashed, email]);
    resetCodes.delete(email);

    res.json({ message: 'Mot de passe réinitialisé avec succès.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;
