const https = require('https');
const http = require('http');
const pool = require('../config/db');

const ISP_CACHE = {};

async function lookupISP(ip) {
  if (ISP_CACHE[ip]) return ISP_CACHE[ip];
  if (!ip || ip === 'unknown' || ip === '127.0.0.1' || ip === '::1') return 'Local';
  return new Promise((resolve) => {
    const client = ip.startsWith('192.') || ip.startsWith('10.') || ip.startsWith('172.') ? http : https;
    client.get(`http://ip-api.com/json/${ip}?fields=isp,org,country,regionName,city`, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(data);
          const isp = j.isp || j.org || 'Inconnu';
          ISP_CACHE[ip] = isp;
          resolve(isp);
        } catch { resolve('Inconnu'); }
      });
    }).on('error', () => resolve('Inconnu'));
  });
}

async function logVendorAction({ userId, action, ip, userAgent, productId, details }) {
  try {
    try { await pool.query('ALTER TABLE vendor_activity_log ADD COLUMN details TEXT DEFAULT NULL'); } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') console.log('details col:', e.message); }
    try { await pool.query('ALTER TABLE vendor_activity_log ADD COLUMN product_id INT DEFAULT NULL'); } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') console.log('product_id col:', e.message); }

    const isp = await lookupISP(ip);
    await pool.query(
      `INSERT INTO vendor_activity_log (user_id, action, ip_address, isp, user_agent, product_id, details) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, action, ip, isp, userAgent || null, productId || null, details || null]
    );
  } catch (err) {
    console.error('logVendorAction error:', err.message);
  }
}

module.exports = { logVendorAction, lookupISP };
