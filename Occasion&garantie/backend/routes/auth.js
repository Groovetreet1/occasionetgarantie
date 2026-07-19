const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const resetCodes = new Map();
const CODE_EXPIRY = 15 * 60 * 1000;
const WHATSAPP_NUMBER = '212669017295';

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });
  next();
};

router.post('/signup', [
  body('fullName').trim().notEmpty().withMessage('Le nom complet est requis.'),
  body('email').isEmail().withMessage('Email invalide.').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères.'),
  body('phone').optional().trim(),
], validate, async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (full_name, email, password, phone) VALUES (?, ?, ?, ?)',
      [fullName, email, hashed, phone || null]
    );
    const token = jwt.sign(
      { id: result.insertId, email, role: 'client' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.status(201).json({
      token,
      user: { id: result.insertId, fullName, email, role: 'client' }
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
      user: { id: user.id, fullName: user.full_name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, full_name, email, phone, role, created_at FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) return res.status(404).json({ message: 'Utilisateur introuvable.' });
    res.json(users[0]);
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
    const [users] = await pool.query('SELECT id, full_name FROM users WHERE email = ?', [email]);
    if (users.length === 0) return res.status(404).json({ message: 'Aucun compte trouvé avec cet email.' });

    const code = crypto.randomInt(100000, 999999).toString();
    resetCodes.set(email, { code, expiresAt: Date.now() + CODE_EXPIRY });

    const waMsg = encodeURIComponent(
      `Bonjour ${users[0].full_name || ''} !\n\n` +
      `Voici votre code de réinitialisation de mot de passe : ${code}\n\n` +
      `Ce code expire dans 15 minutes. Ne le partagez avec personne.\n\n` +
      `Pour réinitialiser votre mot de passe, rendez-vous sur :\n` +
      `${req.protocol}://${req.get('host')}/reset-password?email=${encodeURIComponent(email)}`
    );
    const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${waMsg}`;

    res.json({ message: 'Code envoyé via WhatsApp.', waUrl, email });
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
