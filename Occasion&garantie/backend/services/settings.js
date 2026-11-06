// Reglages dynamiques stockes en base (table app_settings) avec cache court.
// Permet d'activer/desactiver des fonctions depuis l'admin sans redeployer.
const pool = require('../config/db');

const TTL_MS = 15000;
const cache = new Map();

async function ensureTable() {
  await pool.query(
    'CREATE TABLE IF NOT EXISTS app_settings (`key` VARCHAR(100) PRIMARY KEY, `value` TEXT, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)'
  );
}

async function get(key, fallback = null) {
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && now - hit.at < TTL_MS) return hit.value;
  try {
    const [rows] = await pool.query('SELECT `value` FROM app_settings WHERE `key` = ?', [key]);
    const value = rows.length ? rows[0].value : fallback;
    cache.set(key, { value, at: now });
    return value;
  } catch (e) {
    return fallback;
  }
}

async function getBool(key, fallback = true) {
  const v = await get(key, fallback ? '1' : '0');
  if (v === null || v === undefined) return fallback;
  const s = String(v).toLowerCase();
  return !(s === '0' || s === 'false' || s === 'off' || s === '');
}

async function set(key, value) {
  await ensureTable();
  await pool.query(
    'INSERT INTO app_settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)',
    [key, String(value)]
  );
  cache.delete(key);
}

module.exports = { get, getBool, set, ensureTable };
