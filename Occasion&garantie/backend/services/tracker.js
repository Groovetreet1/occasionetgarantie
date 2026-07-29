const pool = require('../config/db');
const emails = require('../emails');

const CACHE = {};

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

async function fetchJson(url, timeoutMs = 5000) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) { console.error('fetchJson', url, 'status:', res.status); return null; }
    return await res.json();
  } catch (e) {
    console.error('fetchJson error for', url.substring(0, 60), ':', e.message);
    return null;
  }
}

async function resolveIp(ip, force) {
  if (!force && CACHE[ip]) return CACHE[ip];
  const def = { isp: 'Inconnu', city: null, region: null, country: null, latitude: null, longitude: null, isVpn: false, isDatacenter: false };
  if (!ip || ip === 'unknown' || ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1') return { ...def, isp: 'Local' };

  const json = await fetchJson(`https://api.ipapi.is/?q=${ip}`);
  if (json && json.ip) {
    const result = {
      isp: json.company?.name || json.isp || json.org || json.asn?.descr || 'Inconnu',
      city: json.city || json.location?.city || null,
      region: json.regionName || json.location?.state || null,
      country: json.country || json.location?.country || null,
      latitude: json.location?.latitude ?? json.latitude ?? null,
      longitude: json.location?.longitude ?? json.longitude ?? null,
      isVpn: !!(json.is_vpn || json.is_proxy || json.is_tor),
      isDatacenter: !!(json.is_datacenter || json.company?.type === 'hosting'),
    };
    CACHE[ip] = result;
    return result;
  }

  const json2 = await fetchJson(`http://ip-api.com/json/${ip}?fields=status,isp,org,country,regionName,city,lat,lon`);
  if (json2 && json2.status === 'success') {
    const result = {
      isp: json2.isp || json2.org || 'Inconnu',
      city: json2.city || null,
      region: json2.regionName || null,
      country: json2.country || null,
      latitude: json2.lat || null,
      longitude: json2.lon || null,
      isVpn: false,
      isDatacenter: false,
    };
    CACHE[ip] = result;
    return result;
  }

  CACHE[ip] = def;
  return def;
}

async function logVendorAction({ userId, action, ip, userAgent, productId, details, latitude, longitude }) {
  try {
    try { await pool.query('ALTER TABLE vendor_activity_log ADD COLUMN details TEXT DEFAULT NULL'); } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') {} }
    try { await pool.query('ALTER TABLE vendor_activity_log ADD COLUMN product_id INT DEFAULT NULL'); } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') {} }
    try { await pool.query('ALTER TABLE vendor_activity_log ADD COLUMN city VARCHAR(100) DEFAULT NULL'); } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') {} }
    try { await pool.query('ALTER TABLE vendor_activity_log ADD COLUMN region VARCHAR(100) DEFAULT NULL'); } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') {} }
    try { await pool.query('ALTER TABLE vendor_activity_log ADD COLUMN country VARCHAR(100) DEFAULT NULL'); } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') {} }
    try { await pool.query('ALTER TABLE vendor_activity_log ADD COLUMN is_vpn TINYINT(1) DEFAULT 0'); } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') {} }
    try { await pool.query('ALTER TABLE vendor_activity_log ADD COLUMN vpn_warned_at DATETIME DEFAULT NULL'); } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') {} }
    try { await pool.query("ALTER TABLE vendor_activity_log ADD COLUMN is_datacenter TINYINT(1) DEFAULT 0"); } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') {} }
    try { await pool.query("ALTER TABLE vendor_activity_log ADD COLUMN latitude DECIMAL(10,7) DEFAULT NULL"); } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') {} }
    try { await pool.query("ALTER TABLE vendor_activity_log ADD COLUMN longitude DECIMAL(10,7) DEFAULT NULL"); } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') {} }

    const [result] = await pool.query(
      `INSERT INTO vendor_activity_log (user_id, action, ip_address, user_agent, product_id, details, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, action, ip, userAgent || null, productId || null, details || null, latitude || null, longitude || null]
    );
    const logId = result.insertId;

    resolveIp(ip).then(async (info) => {
      try {
        await pool.query(
          `UPDATE vendor_activity_log SET isp = ?, city = ?, region = ?, country = ?, is_vpn = ?, is_datacenter = ?, latitude = COALESCE(latitude, ?), longitude = COALESCE(longitude, ?) WHERE id = ?`,
          [info.isp, info.city, info.region, info.country, info.isVpn ? 1 : 0, info.isDatacenter ? 1 : 0, info.latitude, info.longitude, logId]
        );

        const isSuspicious = info.isVpn || info.isDatacenter;

        if (isSuspicious) {
          try { await pool.query('ALTER TABLE users ADD COLUMN suspended TINYINT(1) DEFAULT 0'); } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') {} }
          try { await pool.query("ALTER TABLE users ADD COLUMN suspension_reason VARCHAR(255) DEFAULT NULL"); } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') {} }
          try { await pool.query('ALTER TABLE users ADD COLUMN vpn_warned_at DATETIME DEFAULT NULL'); } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') {} }

          const [rows] = await pool.query('SELECT email, store_name, full_name, vpn_warned_at, suspended FROM users WHERE id = ?', [userId]);
          if (rows.length > 0) {
            const u = rows[0];
            const store = u.store_name || u.full_name || 'Vendeur';
            if (u.suspended) return;

            if (!u.vpn_warned_at) {
              await pool.query('UPDATE users SET vpn_warned_at = NOW() WHERE id = ?', [userId]);
              await pool.query('UPDATE vendor_activity_log SET vpn_warned_at = NOW() WHERE id = ?', [logId]);
              try {
                await emails.send({ to: u.email, subject: 'Alerte securite - VPN detecte sur votre compte vendeur', html: VPN_WARN_HTML({ store, ip }) });
                console.log(`VPN warning sent to ${u.email}`);
              } catch (e) { console.error('VPN warn email failed:', e.message); }
            } else {
              const diff = Date.now() - new Date(u.vpn_warned_at).getTime();
              if (diff > 60 * 60 * 1000) {
                await pool.query('UPDATE users SET suspended = 1, suspension_reason = ? WHERE id = ?', ['VPN detecte pendant plus d\'une heure', userId]);
                await pool.query('UPDATE vendor_activity_log SET vpn_warned_at = NOW() WHERE id = ?', [logId]);
                try {
                  await emails.send({ to: u.email, subject: 'Compte vendeur suspendu - VPN persistant', html: VPN_SUSPEND_HTML({ store, ip }) });
                  console.log(`VPN suspension sent to ${u.email}`);
                } catch (e) { console.error('VPN suspend email failed:', e.message); }
              }
            }
          }
        }
      } catch (e) { console.error('VPN/geo enrichment error:', e.message); }
    });
  } catch (err) {
    console.error('logVendorAction error:', err.message);
  }
}

module.exports = { logVendorAction, resolveIp, fetchJson };
