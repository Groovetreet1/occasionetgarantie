const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { Resend } = require('resend');

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const AUDIENCE_ID = 'd755ae5f-37c7-460b-8fec-26487de88023';
const FROM = 'Occasion & Garantie <contact@contact.occasionetgarantie.store>';

if (!RESEND_API_KEY) console.log('[Newsletter] RESEND_API_KEY not set — audience sync disabled');

function getResend() {
  return RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;
}

async function addToResendAudience(email) {
  const r = getResend();
  if (!r) return;
  try {
    await r.contacts.create({ email, audience_id: AUDIENCE_ID });
  } catch (e) {
    console.log('Resend audience add skipped:', e.message);
  }
}

router.get('/status', async (req, res) => {
  try {
    const [subscribers] = await pool.query('SELECT COUNT(*) as cnt FROM newsletter_subscribers WHERE is_active = TRUE');
    res.json({
      resend_key_set: !!RESEND_API_KEY,
      resend_api_key_prefix: RESEND_API_KEY ? RESEND_API_KEY.substring(0, 6) + '...' : null,
      audience_id: AUDIENCE_ID,
      subscribers_db: subscribers[0].cnt,
    });
  } catch (err) {
    res.json({ resend_key_set: !!RESEND_API_KEY, subscribers_db: 0, error: err.message });
  }
});

router.post('/subscribe', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email requis.' });
    try {
      await pool.query('INSERT INTO newsletter_subscribers (email) VALUES (?)', [email]);
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY' || e.errno === 1062) {
        return res.status(200).json({ message: 'Deja inscrit.' });
      }
      if (e.code === 'ER_NO_SUCH_TABLE' || e.errno === 1146) {
        await pool.query(`CREATE TABLE IF NOT EXISTS newsletter_subscribers (
          id INT AUTO_INCREMENT PRIMARY KEY,
          email VARCHAR(255) NOT NULL UNIQUE,
          subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          is_active BOOLEAN DEFAULT TRUE
        )`);
        await pool.query('INSERT INTO newsletter_subscribers (email) VALUES (?)', [email]);
      } else {
        throw e;
      }
    }

    await addToResendAudience(email);

    const r = getResend();
    if (r) {
      const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8f9fc">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fc;padding:40px 16px">
<tr><td align="center">
<table role="presentation" width="100%" style="max-width:480px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06)">
<tr><td style="padding:32px 32px 0" align="center">
<div style="width:56px;height:56px;border-radius:50%;background:rgba(245,158,11,0.10);display:flex;align-items:center;justify-content:center;margin:0 auto">
<span style="font-size:28px">&#10003;</span>
</div>
<h1 style="font-size:20px;font-weight:700;color:#1e293b;margin:16px 0 4px">Merci de votre inscription !</h1>
<p style="font-size:14px;color:#64748b;margin:0 0 24px">Bienvenue dans la newsletter Occasion & Garantie</p>
</td></tr>
<tr><td style="padding:0 32px 32px">
<p style="font-size:14px;color:#1e293b;line-height:1.7;margin:0 0 16px">Vous recevrez desormais nos actualites, nouvelles annonces et offres exclusives directement dans votre boite mail.</p>
<p style="font-size:14px;color:#1e293b;line-height:1.7;margin:0">A tres bientot sur <a href="https://www.occasionetgarantie.store" style="color:#f59e0b;text-decoration:none;font-weight:600">www.occasionetgarantie.store</a> !</p>
</td></tr>
<tr><td style="padding:0 32px 32px" align="center">
<p style="font-size:12px;color:#94a3b8;margin:0">Occasion & Garantie — Votre marche de confiance au Maroc</p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
      try {
        await r.emails.send({ from: FROM, to: email, subject: 'Merci de votre inscription a la newsletter !', html });
      } catch (e) {
        console.log('Welcome email skipped:', e.message);
      }
    }

    res.json({ message: 'Inscription reussie.' });
  } catch (err) {
    console.error('Newsletter subscribe error:', err.message);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.post('/sync-audience', async (req, res) => {
  const r = getResend();
  if (!r) return res.status(500).json({ message: 'RESEND_API_KEY non configure.' });
  try {
    const [subscribers] = await pool.query('SELECT email FROM newsletter_subscribers WHERE is_active = TRUE');
    if (subscribers.length === 0) return res.json({ message: 'Aucun abonne a synchroniser.' });

    let added = 0;
    for (const sub of subscribers) {
      try {
        await r.contacts.create({ email: sub.email, audience_id: AUDIENCE_ID });
        added++;
      } catch (e) {
        console.log(`Sync skip ${sub.email}:`, e.message);
      }
    }
    res.json({ message: `${added}/${subscribers.length} abonnes synchronises vers l audience Resend.` });
  } catch (err) {
    console.error('Sync audience error:', err.message);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;
