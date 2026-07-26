const https = require('https');
const http = require('http');
const pool = require('../config/db');

const GEO_CACHE = {};

async function lookupGeo(ip) {
  if (GEO_CACHE[ip]) return GEO_CACHE[ip];
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
          GEO_CACHE[ip] = geo;
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

    const geo = await lookupGeo(ip);
    await pool.query(
      `INSERT INTO vendor_activity_log (user_id, action, ip_address, isp, city, region, country, user_agent, product_id, details) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, action, ip, geo.isp, geo.city, geo.region, geo.country, userAgent || null, productId || null, details || null]
    );
  } catch (err) {
    console.error('logVendorAction error:', err.message);
  }
}

module.exports = { logVendorAction, lookupGeo };
