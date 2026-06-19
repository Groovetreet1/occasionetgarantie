const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const https = require('https');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const resetCodes = new Map();
const pendingSignups = new Map();
const CODE_EXPIRY = 15 * 60 * 1000;
const SIGNUP_EXPIRY = 15 * 60 * 1000;

async function sendSms(to, message) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      to,
      senderId: process.env.SMS_SENDER_ID || 'GOMOBILE',
      message,
    });
    const options = {
      hostname: 'gomobile-frontend.vercel.app',
      path: '/api/sms/send',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.SMS_API_KEY,
        'Content-Length': Buffer.byteLength(data),
      },
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch { resolve({ success: false, error: body }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

router.post('/signup', async (req, res) => {
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
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

router.post('/login', async (req, res) => {
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
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, full_name, email, phone, role FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) return res.status(404).json({ message: 'Utilisateur introuvable.' });
    res.json(users[0]);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Forgot password via SMS
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email requis.' });

    const [users] = await pool.query('SELECT id, full_name, phone FROM users WHERE email = ?', [email]);
    if (users.length === 0) return res.status(404).json({ message: 'Aucun compte trouvé avec cet email.' });

    const user = users[0];
    if (!user.phone) return res.status(400).json({ message: 'Aucun numéro de téléphone associé à ce compte. Contactez le support.' });

    const code = crypto.randomInt(100000, 999999).toString();
    resetCodes.set(email, { code, expiresAt: Date.now() + CODE_EXPIRY });

    if (!process.env.SMS_API_KEY) {
      resetCodes.delete(email);
      return res.status(500).json({ message: 'Service SMS non configuré. Contactez le support.' });
    }

    const smsResult = await sendSms(
      user.phone,
      `Bonjour ${user.full_name || ''} ! Votre code de réinitialisation O&G : ${code}. Valable 15 min. Ne le partagez pas.`
    );

    if (!smsResult.success) {
      resetCodes.delete(email);
      return res.status(500).json({ message: 'Erreur lors de l\'envoi du SMS. Réessayez plus tard.', error: smsResult.error });
    }

    res.json({ message: 'Code envoyé par SMS.', email });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

// Verify reset code
router.post('/verify-reset-code', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ message: 'Email et code requis.' });

    const entry = resetCodes.get(email);
    if (!entry) return res.status(400).json({ message: 'Aucun code demandé pour cet email.' });
    if (Date.now() > entry.expiresAt) {
      resetCodes.delete(email);
      return res.status(400).json({ message: 'Code expiré. Veuillez refaire une demande.' });
    }
    if (entry.code !== code) return res.status(400).json({ message: 'Code incorrect.' });

    res.json({ message: 'Code vérifié.', valid: true });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) return res.status(400).json({ message: 'Tous les champs sont requis.' });
    if (newPassword.length < 6) return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères.' });

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
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

// Send verification SMS for signup
router.post('/send-verification', async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;
    if (!fullName || !email || !password || !phone) {
      return res.status(400).json({ message: 'Tous les champs sont requis (nom, email, mot de passe, téléphone).' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères.' });
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
    }

    if (!process.env.SMS_API_KEY) {
      return res.status(500).json({ message: 'Service SMS non configuré. Contactez le support.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    pendingSignups.set(token, {
      fullName, email, password, phone,
      expiresAt: Date.now() + SIGNUP_EXPIRY
    });

    const verifyUrl = `${req.protocol}://${req.get('host')}/verify-account?token=${encodeURIComponent(token)}`;

    const smsResult = await sendSms(
      phone,
      `Bienvenue chez O&G ${fullName} ! Confirmez votre inscription : ${verifyUrl}. Ce lien expire dans 15 min.`
    );

    if (!smsResult.success) {
      pendingSignups.delete(token);
      return res.status(500).json({ message: 'Erreur lors de l\'envoi du SMS.', error: smsResult.error });
    }

    res.json({ message: 'SMS de confirmation envoyé.', email });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

// Verify signup token
router.post('/verify-signup', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'Token requis.' });

    const entry = pendingSignups.get(token);
    if (!entry) return res.status(400).json({ message: 'Lien de vérification invalide ou expiré.' });
    if (Date.now() > entry.expiresAt) {
      pendingSignups.delete(token);
      return res.status(400).json({ message: 'Lien expiré. Veuillez refaire une inscription.' });
    }

    // Double-check email still available
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [entry.email]);
    if (existing.length > 0) {
      pendingSignups.delete(token);
      return res.status(400).json({ message: 'Cet email est déjà utilisé (inscription concurrente).' });
    }

    const hashed = await bcrypt.hash(entry.password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (full_name, email, password, phone) VALUES (?, ?, ?, ?)',
      [entry.fullName, entry.email, hashed, entry.phone]
    );

    pendingSignups.delete(token);

    const jwtToken = jwt.sign(
      { id: result.insertId, email: entry.email, role: 'client' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Compte créé avec succès.',
      token: jwtToken,
      user: { id: result.insertId, fullName: entry.fullName, email: entry.email, role: 'client' }
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

module.exports = router;
