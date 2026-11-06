// Passerelle SMS auto-hebergee : le serveur met les SMS en file d'attente,
// un telephone Android (Termux + SIM marocaine) les recupere et les envoie.
// Aucun IP publique / port forwarding necessaire : le telephone fait du polling.
const pool = require('../config/db');
const { normalizePhone } = require('./gomobile');

const MAX_ATTEMPTS = 3;
const CLAIM_TIMEOUT_SEC = 120; // si le telephone ne repond pas, on remet en file
const QUEUE_TTL_HOURS = 24;
const MAX_MESSAGE_LEN = 1000;
const DEFAULT_WAIT_MS = parseInt(process.env.SMS_GATEWAY_WAIT_MS || '12000', 10);

let _tablesReady = false;

async function ensureTables() {
  if (_tablesReady) return;
  await pool.query(`CREATE TABLE IF NOT EXISTS sms_gateway_queue (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('pending','sending','sent','failed') NOT NULL DEFAULT 'pending',
    attempts INT NOT NULL DEFAULT 0,
    device_id VARCHAR(100) DEFAULT NULL,
    error VARCHAR(255) DEFAULT NULL,
    source VARCHAR(60) DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    claimed_at DATETIME NULL,
    sent_at DATETIME NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status, created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  // Battement de coeur des telephones : permet d'afficher "connecte" meme
  // quand la file est vide (le telephone appelle /pull toutes les 5 s).
  await pool.query(`CREATE TABLE IF NOT EXISTS sms_gateway_devices (
    device_id VARCHAR(100) PRIMARY KEY,
    last_seen DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  _tablesReady = true;
  console.log('sms_gateway_queue table ready');
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function enqueue(phone, message, source) {
  await ensureTables();
  const to = normalizePhone(phone);
  if (!to) throw new Error('Numero de telephone manquant');
  const text = String(message || '').slice(0, MAX_MESSAGE_LEN);
  if (!text) throw new Error('Message SMS vide');
  const [r] = await pool.query(
    'INSERT INTO sms_gateway_queue (phone, message, source) VALUES (?, ?, ?)',
    [to, text, source || null]
  );
  return r.insertId;
}

// Met en file et attend l'accuse de reception du telephone (max ~12s).
// Si la passerelle est hors ligne, on leve une erreur -> les appelants
// retombent automatiquement sur l'email (comportement deja present).
async function enqueueAndWait(phone, message, source) {
  const id = await enqueue(phone, message, source);
  const waitMs = DEFAULT_WAIT_MS;
  const deadline = Date.now() + waitMs;
  while (Date.now() < deadline) {
    await sleep(800);
    const [[row]] = await pool.query('SELECT status, error FROM sms_gateway_queue WHERE id = ?', [id]);
    if (!row) break;
    if (row.status === 'sent') return { queued: true, delivered: true, id };
    if (row.status === 'failed') {
      throw new Error(row.error || "Echec de l'envoi du SMS (passerelle)");
    }
  }
  // Timeout : on annule seulement si le telephone ne l'a pas encore pris.
  await pool.query(
    "UPDATE sms_gateway_queue SET status='failed', error='Timeout: passerelle injoignable' WHERE id = ? AND status = 'pending'",
    [id]
  );
  throw new Error('Passerelle SMS indisponible (telephone non connecte)');
}

async function pull(deviceId, limit = 10) {
  await ensureTables();
  const device = deviceId || 'unknown';
  try {
    await pool.query(
      'INSERT INTO sms_gateway_devices (device_id, last_seen) VALUES (?, NOW()) ON DUPLICATE KEY UPDATE last_seen = NOW()',
      [device]
    );
  } catch {}
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    // Remet en file les messages restes bloques en 'sending' (telephone deconnecte)
    await conn.query(
      "UPDATE sms_gateway_queue SET status='pending', claimed_at=NULL WHERE status='sending' AND claimed_at < (NOW() - INTERVAL ? SECOND)",
      [CLAIM_TIMEOUT_SEC]
    );
    const [rows] = await conn.query(
      `SELECT id, phone, message FROM sms_gateway_queue
       WHERE status='pending' AND created_at > (NOW() - INTERVAL ? HOUR)
       ORDER BY id ASC LIMIT ? FOR UPDATE SKIP LOCKED`,
      [QUEUE_TTL_HOURS, Number(limit) || 10]
    );
    if (rows.length) {
      const ids = rows.map((r) => r.id);
      await conn.query(
        "UPDATE sms_gateway_queue SET status='sending', device_id=?, claimed_at=NOW(), attempts=attempts+1 WHERE id IN (?)",
        [deviceId || 'unknown', ids]
      );
    }
    await conn.commit();
    return rows;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

async function ack(deviceId, results = []) {
  await ensureTables();
  let updated = 0;
  for (const item of results) {
    const id = Number(item && item.id);
    if (!id) continue;
    const ok = item.status === 'sent';
    if (ok) {
      const [r] = await pool.query(
        "UPDATE sms_gateway_queue SET status='sent', sent_at=NOW(), error=NULL, device_id=? WHERE id=? AND status IN ('sending','pending')",
        [deviceId || 'unknown', id]
      );
      updated += r.affectedRows;
    } else {
      const err = String(item.error || 'Echec inconnu').slice(0, 250);
      const [r] = await pool.query(
        `UPDATE sms_gateway_queue
         SET error=?, device_id=?, status = IF(attempts >= ?, 'failed', 'pending'), claimed_at=NULL
         WHERE id=? AND status IN ('sending','pending')`,
        [err, deviceId || 'unknown', MAX_ATTEMPTS, id]
      );
      updated += r.affectedRows;
    }
  }
  return updated;
}

async function stats() {
  await ensureTables();
  const [rows] = await pool.query(
    `SELECT status, COUNT(*) AS cnt, MIN(created_at) AS oldest, MAX(updated_at) AS last_update
     FROM sms_gateway_queue GROUP BY status`
  );
  const out = { pending: 0, sending: 0, sent: 0, failed: 0 };
  let oldestPending = null;
  let lastActivity = null;
  for (const r of rows) {
    out[r.status] = Number(r.cnt);
    if (r.status === 'pending' && r.oldest) oldestPending = r.oldest;
    if (r.last_update && (!lastActivity || r.last_update > lastActivity)) lastActivity = r.last_update;
  }
  const [[dev]] = await pool.query(
    'SELECT device_id, last_seen FROM sms_gateway_devices ORDER BY last_seen DESC LIMIT 1'
  );
  let lastDevice = dev ? { id: dev.device_id, lastSeen: dev.last_seen } : null;
  if (!lastDevice) {
    const [[oldDev]] = await pool.query(
      "SELECT device_id, MAX(claimed_at) AS last_seen FROM sms_gateway_queue WHERE device_id IS NOT NULL GROUP BY device_id ORDER BY last_seen DESC LIMIT 1"
    );
    if (oldDev) lastDevice = { id: oldDev.device_id, lastSeen: oldDev.last_seen };
  }
  return {
    counts: out,
    oldestPending,
    lastActivity,
    lastDevice,
  };
}

async function recent(limit = 50) {
  await ensureTables();
  const [rows] = await pool.query(
    'SELECT id, phone, message, status, attempts, device_id, error, source, created_at, sent_at FROM sms_gateway_queue ORDER BY id DESC LIMIT ?',
    [Number(limit) || 50]
  );
  return rows;
}

// Prochain id AUTO_INCREMENT (pour délimiter une campagne d'envoi en masse).
async function peekNextId() {
  await ensureTables();
  const [[row]] = await pool.query('SELECT COALESCE(MAX(id), 0) + 1 AS nextId FROM sms_gateway_queue');
  return Number(row.nextId);
}

// Nettoyage : garde 7 jours d'historique
async function cleanup() {
  try {
    await pool.query("DELETE FROM sms_gateway_queue WHERE status IN ('sent','failed') AND updated_at < (NOW() - INTERVAL 7 DAY)");
  } catch {}
}

module.exports = { ensureTables, enqueue, enqueueAndWait, pull, ack, stats, recent, cleanup, peekNextId, MAX_ATTEMPTS };
