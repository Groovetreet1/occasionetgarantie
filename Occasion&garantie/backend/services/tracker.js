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

  const json2 = await fetchJson(`http://ip-api.com/json/${ip}?fields=status,isp,org,as,country,regionName,city,lat,lon`);
  if (json2 && json2.status === 'success') {
    const org = (json2.org || json2.isp || json2.as || '').toLowerCase();
    const isDatacenter = !!(org.match(/aws|amazon|google cloud|gcp|azure|microsoft|digitalocean|linode|vultr|hetzner|ovh|scaleway|ionos|netcup|rackspace|softlayer|oracle cloud|ibm cloud|upcloud|kamatera|hostinger|contabo|googledc|datacenter|cloud|hosting|server|colo|dedicated/));
    const result = {
      isp: json2.isp || json2.org || 'Inconnu',
      city: json2.city || null,
      region: json2.regionName || null,
      country: json2.country || null,
      latitude: json2.lat || null,
      longitude: json2.lon || null,
      isVpn: false,
      isDatacenter,
    };
    CACHE[ip] = result;
    return result;
  }

  const json3 = await fetchJson(`https://ipinfo.io/${ip}/json`);
  if (json3 && json3.ip) {
    const org = (json3.org || '').toLowerCase();
    const isDatacenter = !!(org.match(/aws|amazon|google|gcp|azure|microsoft|digitalocean|linode|vultr|hetzner|ovh|scaleway|hostinger|contabo|datacenter|cloud|hosting|server/));
    const result = {
      isp: json3.org || 'Inconnu',
      city: json3.city || null,
      region: json3.region || null,
      country: json3.country || null,
      latitude: json3.loc ? parseFloat(json3.loc.split(',')[0]) : null,
      longitude: json3.loc ? parseFloat(json3.loc.split(',')[1]) : null,
      isVpn: false,
      isDatacenter,
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

        if (info.isVpn) {
          try { await pool.query("ALTER TABLE users ADD COLUMN has_vpn_history TINYINT(1) DEFAULT 0"); } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') {} }
          await pool.query('UPDATE users SET has_vpn_history = 1 WHERE id = ? AND (has_vpn_history IS NULL OR has_vpn_history = 0)', [userId]);
        }

        if (isSuspicious) {
          try { await pool.query('ALTER TABLE users ADD COLUMN suspended TINYINT(1) DEFAULT 0'); } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') {} }
          try { await pool.query("ALTER TABLE users ADD COLUMN suspension_reason VARCHAR(255) DEFAULT NULL"); } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') {} }
          try { await pool.query('ALTER TABLE users ADD COLUMN vpn_warned_at DATETIME DEFAULT NULL'); } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') {} }
          try { await pool.query("ALTER TABLE users ADD COLUMN vpn_strike_count INT DEFAULT 0"); } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') {} }
          try { await pool.query("ALTER TABLE users ADD COLUMN vpn_strike_date DATE DEFAULT NULL"); } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') {} }

          const [rows] = await pool.query('SELECT email, store_name, full_name, vpn_warned_at, suspended, vpn_strike_count, vpn_strike_date FROM users WHERE id = ?', [userId]);
          if (rows.length > 0) {
            const u = rows[0];
            const store = u.store_name || u.full_name || 'Vendeur';
            if (u.suspended) return;

            const today = new Date().toISOString().slice(0, 10);
            let strikes = 0;
            if (u.vpn_strike_date && u.vpn_strike_date.toISOString().slice(0, 10) === today) {
              strikes = (u.vpn_strike_count || 0) + 1;
            } else {
              strikes = 1;
            }
            await pool.query('UPDATE users SET vpn_strike_count = ?, vpn_strike_date = ? WHERE id = ?', [strikes, today, userId]);

            if (strikes >= 4) {
              await pool.query('UPDATE users SET suspended = 1, suspension_reason = ? WHERE id = ?', ['Compte definitivement suspendu - VPN detecte 4 fois', userId]);
              try {
                await emails.send({
                  to: u.email,
                  subject: 'Compte vendeur definitivement suspendu - VPN persistant',
                  html: `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"></head><body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f8f9fc"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px"><tr><td align="center"><table role="presentation" width="100%" style="max-width:480px;background:#fff;border-radius:12px;padding:32px"><tr><td><h1 style="font-size:20px;color:#dc2626;margin:0 0 12px">Compte definitivement suspendu</h1><p style="font-size:14px;color:#64748b;margin:0 0 16px">Bonjour <strong>${store}</strong>,</p><p style="font-size:14px;color:#64748b;margin:0 0 12px">Votre compte vendeur a ete <strong>definitivement suspendu</strong> apres 4 detections VPN aujourd hui.</p><p style="font-size:14px;color:#64748b;margin:0 0 16px">L utilisation repetitive de VPN malgre les avertissements constitue une violation de nos conditions d utilisation.</p><p style="font-size:14px;color:#64748b;margin:0 0 20px">Pour contester cette decision, contactez <strong>contact-occasionetgarantie@proton.me</strong>.</p><hr style="border:none;border-top:1px solid #eee;margin:20px 0"><p style="font-size:12px;color:#888;">Cet email est automatique.</p></td></tr></table></td></tr></table></body></html>`,
                });
              } catch (e) { console.error('VPN 4-strike email failed:', e.message); }
              return;
            }

            if (strikes === 3) {
              await pool.query('UPDATE users SET suspended = 1, suspension_reason = ? WHERE id = ?', ['VPN detecte 3 fois aujourd\'hui - Suspension 1 heure', userId]);
              try {
                await emails.send({
                  to: u.email,
                  subject: 'Compte vendeur suspendu temporairement - VPN detecte a 3 reprises',
                  html: `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"></head><body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f8f9fc"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px"><tr><td align="center"><table role="presentation" width="100%" style="max-width:480px;background:#fff;border-radius:12px;padding:32px"><tr><td><h1 style="font-size:20px;color:#dc2626;margin:0 0 12px">Compte suspendu temporairement</h1><p style="font-size:14px;color:#64748b;margin:0 0 16px">Bonjour <strong>${store}</strong>,</p><p style="font-size:14px;color:#64748b;margin:0 0 12px">Votre compte vendeur a ete suspendu pour <strong>1 heure</strong> car nous avons detecte l utilisation d un VPN a 3 reprises aujourd hui.</p><p style="font-size:13px;color:#64748b;margin:0 0 16px">Pour des raisons de securite, l utilisation de VPN est interdite sur notre plateforme. Vous pourrez vous reconnecter apres 1 heure.</p><p style="font-size:13px;color:#64748b;margin:0 0 20px">Attention : si vous utilisez encore un VPN, votre compte sera definitivement suspendu.</p><hr style="border:none;border-top:1px solid #eee;margin:20px 0"><p style="font-size:12px;color:#888;">Cet email est automatique.</p></td></tr></table></td></tr></table></body></html>`,
                });
              } catch (e) { console.error('VPN 3-strike email failed:', e.message); }
              return;
            }

            if (strikes === 1) {
              await pool.query('UPDATE users SET vpn_warned_at = NOW() WHERE id = ?', [userId]);
              await pool.query('UPDATE vendor_activity_log SET vpn_warned_at = NOW() WHERE id = ?', [logId]);
              try {
                await emails.send({ to: u.email, subject: 'Alerte securite - VPN detecte sur votre compte vendeur', html: VPN_WARN_HTML({ store, ip }) });
                console.log(`VPN warning sent to ${u.email}`);
              } catch (e) { console.error('VPN warn email failed:', e.message); }
            } else if (strikes === 2) {
              try {
                await emails.send({
                  to: u.email,
                  subject: '2eme alerte - Desactivez votre VPN',
                  html: `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"></head><body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f8f9fc"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px"><tr><td align="center"><table role="presentation" width="100%" style="max-width:480px;background:#fff;border-radius:12px;padding:32px"><tr><td><h1 style="font-size:20px;color:#dc2626;margin:0 0 12px">2eme alerte VPN</h1><p style="font-size:14px;color:#64748b;margin:0 0 12px">Bonjour <strong>${store}</strong>,</p><p style="font-size:14px;color:#64748b;margin:0 0 12px">Nous avons detecte une connexion VPN pour la <strong>2eme fois</strong> aujourd hui.</p><p style="font-size:14px;color:#dc2626;margin:0 0 16px"><strong>Attention :</strong> Si cela se reproduit une 3eme fois, votre compte sera automatiquement suspendu pour 1 heure.</p><p style="font-size:13px;color:#64748b;margin:0 0 20px">Veuillez desactiver votre VPN immédiatement.</p><hr style="border:none;border-top:1px solid #eee;margin:20px 0"><p style="font-size:12px;color:#888;">Cet email est automatique.</p></td></tr></table></td></tr></table></body></html>`,
                });
              } catch (e) { console.error('VPN 2nd alert email failed:', e.message); }
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
