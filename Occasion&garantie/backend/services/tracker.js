const https = require('https');
const http = require('http');
const pool = require('../config/db');
const emails = require('../emails');

const GEO_CACHE = {};

const VPN_WARN_HTML = ({ store, ip }) => `
  <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:20px">
    <h2 style="color:#ef4444;">Alerte securite - VPN detecte</h2>
    <p>Bonjour <strong>${store}</strong>,</p>
    <p>Nous avons detecte une connexion depuis une adresse IP suspecte (VPN / proxy) :</p>
    <p style="background:#fef2f2;padding:12px;border-radius:8px;font-size:14px;">
      <strong>IP :</strong> ${ip}<br>
      <strong>Methode :</strong> VPN / Proxy detecte
    </p>
    <p>Pour des raisons de securite, veuillez desactiver votre VPN et vous reconnecter depuis votre connexion normale.</p>
    <p><strong>Important :</strong> Si vous restez connecte via VPN plus d'une heure, votre compte sera automatiquement suspendu.</p>
    <hr style="border:none;border-top:1px solid #eee;margin:20px 0">
    <p style="font-size:12px;color:#888;">Cet email est automatique. Merci de ne pas y repondre.</p>
  </div>`;

const VPN_SUSPEND_HTML = ({ store, ip }) => `
  <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:20px">
    <h2 style="color:#dc2626;">Compte suspendu - VPN persistant</h2>
    <p>Bonjour <strong>${store}</strong>,</p>
    <p>Votre compte vendeur a ete suspendu car vous utilisez un VPN / proxy depuis plus d'une heure.</p>
    <p style="background:#fef2f2;padding:12px;border-radius:8px;font-size:14px;">
      <strong>IP :</strong> ${ip}<br>
      <strong>Motif :</strong> VPN / proxy detecte pendant plus d'une heure
    </p>
    <p>Pour reactiver votre compte, veuillez contacter l'administration via <strong>contact-occasionetgarantie@proton.me</strong>.</p>
    <hr style="border:none;border-top:1px solid #eee;margin:20px 0">
    <p style="font-size:12px;color:#888;">Cet email est automatique. Merci de ne pas y repondre.</p>
  </div>`;

async function detectVPN(ip) {
  if (!ip || ip === 'unknown' || ip === '127.0.0.1' || ip === '::1') return false;
  if (GEO_CACHE[ip] && GEO_CACHE[ip]._vpn !== undefined) return GEO_CACHE[ip]._vpn;
  return new Promise((resolve) => {
    const req = https.get(`https://api.ipapi.is/?q=${ip}`, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(data);
          const isVpn = !!(j.is_vpn || j.is_proxy || j.is_tor);
          if (!GEO_CACHE[ip]) GEO_CACHE[ip] = {};
          GEO_CACHE[ip]._vpn = isVpn;
          resolve(isVpn);
        } catch { resolve(false); }
      });
    });
    req.on('error', () => resolve(false));
    req.setTimeout(3000, () => { req.destroy(); resolve(false); });
  });
}

async function lookupGeo(ip) {
  if (GEO_CACHE[ip] && GEO_CACHE[ip]._geo) return GEO_CACHE[ip]._geo;
  const fallback = { isp: 'Inconnu', city: null, region: null, country: null };
  if (!ip || ip === 'unknown' || ip === '127.0.0.1' || ip === '::1') return { ...fallback, isp: 'Local' };
  return new Promise((resolve) => {
    const client = ip.startsWith('192.') || ip.startsWith('10.') || ip.startsWith('172.') ? http : https;
    client.get(`http://ip-api.com/json/${ip}?fields=isp,org,country,regionName,city`, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(data);
          const geo = { isp: j.isp || j.org || 'Inconnu', city: j.city || null, region: j.regionName || null, country: j.country || null };
          if (!GEO_CACHE[ip]) GEO_CACHE[ip] = {};
          GEO_CACHE[ip]._geo = geo;
          resolve(geo);
        } catch { resolve(fallback); }
      });
    }).on('error', () => resolve(fallback));
  });
}

async function logVendorAction({ userId, action, ip, userAgent, productId, details }) {
  try {
    try { await pool.query('ALTER TABLE vendor_activity_log ADD COLUMN details TEXT DEFAULT NULL'); } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') console.log('details col:', e.message); }
    try { await pool.query('ALTER TABLE vendor_activity_log ADD COLUMN product_id INT DEFAULT NULL'); } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') console.log('product_id col:', e.message); }
    try { await pool.query('ALTER TABLE vendor_activity_log ADD COLUMN city VARCHAR(100) DEFAULT NULL'); } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') console.log('city col:', e.message); }
    try { await pool.query('ALTER TABLE vendor_activity_log ADD COLUMN region VARCHAR(100) DEFAULT NULL'); } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') console.log('region col:', e.message); }
    try { await pool.query('ALTER TABLE vendor_activity_log ADD COLUMN country VARCHAR(100) DEFAULT NULL'); } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') console.log('country col:', e.message); }
    try { await pool.query('ALTER TABLE vendor_activity_log ADD COLUMN is_vpn TINYINT(1) DEFAULT 0'); } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') console.log('is_vpn col:', e.message); }
    try { await pool.query('ALTER TABLE vendor_activity_log ADD COLUMN vpn_warned_at DATETIME DEFAULT NULL'); } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') console.log('vpn_warned_at col:', e.message); }

    const [geo, isVpn] = await Promise.all([lookupGeo(ip), detectVPN(ip)]);

    await pool.query(
      `INSERT INTO vendor_activity_log (user_id, action, ip_address, isp, city, region, country, is_vpn, user_agent, product_id, details) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, action, ip, geo.isp, geo.city, geo.region, geo.country, isVpn ? 1 : 0, userAgent || null, productId || null, details || null]
    );

    if (isVpn) {
      try {
        try { await pool.query('ALTER TABLE users ADD COLUMN suspended TINYINT(1) DEFAULT 0'); } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') console.log('suspended col:', e.message); }
        try { await pool.query("ALTER TABLE users ADD COLUMN suspension_reason VARCHAR(255) DEFAULT NULL"); } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') console.log('suspension_reason col:', e.message); }
        try { await pool.query('ALTER TABLE users ADD COLUMN vpn_warned_at DATETIME DEFAULT NULL'); } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') console.log('vpn_warned_at col:', e.message); }

        const [rows] = await pool.query('SELECT email, store_name, full_name, vpn_warned_at, suspended FROM users WHERE id = ?', [userId]);
        if (rows.length > 0) {
          const user = rows[0];
          const store = user.store_name || user.full_name || 'Vendeur';

          if (user.suspended) return;

          if (!user.vpn_warned_at) {
            await pool.query('UPDATE users SET vpn_warned_at = NOW() WHERE id = ?', [userId]);
            await pool.query('UPDATE vendor_activity_log SET vpn_warned_at = NOW() WHERE user_id = ? AND is_vpn = 1 AND vpn_warned_at IS NULL', [userId]);

            try {
              await emails.send({
                to: user.email,
                subject: 'Alerte securite - VPN detecte sur votre compte vendeur',
                html: VPN_WARN_HTML({ store, ip }),
              });
              console.log(`VPN warning sent to ${user.email}`);
            } catch (mailErr) {
              console.error('VPN warn email failed:', mailErr.message);
            }
          } else if (user.vpn_warned_at) {
            const warnedAt = new Date(user.vpn_warned_at).getTime();
            const now = Date.now();
            if (now - warnedAt > 60 * 60 * 1000) {
              await pool.query('UPDATE users SET suspended = 1, suspension_reason = ? WHERE id = ?', ['VPN detecte pendant plus d\'une heure', userId]);
              await pool.query('UPDATE vendor_activity_log SET vpn_warned_at = NOW() WHERE user_id = ? AND is_vpn = 1 AND vpn_warned_at IS NULL', [userId]);
              try {
                await emails.send({
                  to: user.email,
                  subject: 'Compte vendeur suspendu - VPN persistant',
                  html: VPN_SUSPEND_HTML({ store, ip }),
                });
                console.log(`VPN suspension sent to ${user.email}`);
              } catch (mailErr) {
                console.error('VPN suspend email failed:', mailErr.message);
              }
            }
          }
        }
      } catch (e) {
        console.error('VPN handler error:', e.message);
      }
    }
  } catch (err) {
    console.error('logVendorAction error:', err.message);
  }
}

module.exports = { logVendorAction, lookupGeo, detectVPN };
