// API utilisee par le telephone Android (passerelle SMS).
// Authentification : header x-gateway-key = SMS_GATEWAY_KEY
const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const gateway = require('../services/smsGateway');

function requireKey(req, res, next) {
  const expected = process.env.SMS_GATEWAY_KEY || '';
  if (!expected) {
    return res.status(503).json({ message: 'SMS_GATEWAY_KEY non configure sur le serveur.' });
  }
  const given = String(req.get('x-gateway-key') || '');
  const a = Buffer.from(expected);
  const b = Buffer.from(given);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(401).json({ message: 'Cle de passerelle invalide.' });
  }
  next();
}

// Le telephone demande les SMS en attente
router.post('/pull', requireKey, async (req, res) => {
  try {
    const deviceId = String(req.body && req.body.deviceId || 'phone').slice(0, 100);
    const limit = Math.min(Math.max(parseInt(req.body && req.body.limit, 10) || 10, 1), 25);
    const messages = await gateway.pull(deviceId, limit);
    res.json({ messages });
  } catch (err) {
    console.error('sms gateway pull error:', err.message);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Le telephone confirme l'envoi (ou l'echec)
router.post('/ack', requireKey, async (req, res) => {
  try {
    const deviceId = String(req.body && req.body.deviceId || 'phone').slice(0, 100);
    const results = Array.isArray(req.body && req.body.results) ? req.body.results : [];
    const updated = await gateway.ack(deviceId, results);
    gateway.cleanup();
    res.json({ updated });
  } catch (err) {
    console.error('sms gateway ack error:', err.message);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Etat de la passerelle (utilise par le telephone pour verifier la cle / le lien)
router.get('/health', requireKey, async (req, res) => {
  try {
    const s = await gateway.stats();
    res.json({ ok: true, ...s });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;
