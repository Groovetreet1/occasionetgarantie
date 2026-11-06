// Journal unifie des envois SMS + emails.
// Les SMS sont deja historises dans sms_gateway_queue ; on ajoute email_logs
// pour compter et afficher aussi les emails envoyes (Resend).
const pool = require('../config/db');

let _emailTableReady = false;

async function ensureEmailTable() {
  if (_emailTableReady) return;
  await pool.query(`CREATE TABLE IF NOT EXISTS email_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recipient VARCHAR(190) NOT NULL,
    subject VARCHAR(255) DEFAULT NULL,
    status ENUM('sent','failed') NOT NULL DEFAULT 'sent',
    error VARCHAR(255) DEFAULT NULL,
    source VARCHAR(60) DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email_created (created_at),
    INDEX idx_email_status (status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  _emailTableReady = true;
  console.log('email_logs table ready');
}

function normalizeRecipient(to) {
  if (Array.isArray(to)) return to.join(', ').slice(0, 190);
  return String(to || 'inconnu').slice(0, 190);
}

// N'echoue jamais : le journal ne doit pas casser l'envoi d'un email.
async function logEmail({ to, subject, status = 'sent', error = null, source = null }) {
  try {
    await ensureEmailTable();
    await pool.query(
      'INSERT INTO email_logs (recipient, subject, status, error, source) VALUES (?, ?, ?, ?, ?)',
      [
        normalizeRecipient(to),
        String(subject || '').slice(0, 255),
        status === 'sent' ? 'sent' : 'failed',
        error ? String(error).slice(0, 250) : null,
        source ? String(source).slice(0, 60) : null,
      ]
    );
  } catch (e) {
    console.error('email log failed:', e.message);
  }
}

function clampDays(days) {
  const n = parseInt(days, 10);
  if (!Number.isFinite(n)) return 30;
  return Math.min(Math.max(n, 1), 365);
}

async function summary(days = 30) {
  const d = clampDays(days);
  await ensureEmailTable();
  const [smsPeriod] = await pool.query(
    "SELECT status, COUNT(*) AS cnt FROM sms_gateway_queue WHERE created_at >= (NOW() - INTERVAL ? DAY) GROUP BY status",
    [d]
  );
  const [emailPeriod] = await pool.query(
    "SELECT status, COUNT(*) AS cnt FROM email_logs WHERE created_at >= (NOW() - INTERVAL ? DAY) GROUP BY status",
    [d]
  );
  const [[smsAll]] = await pool.query(
    "SELECT SUM(status = 'sent') AS sent, SUM(status = 'failed') AS failed, COUNT(*) AS total FROM sms_gateway_queue"
  );
  const [[emailAll]] = await pool.query(
    "SELECT SUM(status = 'sent') AS sent, SUM(status = 'failed') AS failed, COUNT(*) AS total FROM email_logs"
  );

  const sms = { sent: 0, failed: 0, pending: 0, sending: 0, total: 0 };
  for (const r of smsPeriod) {
    sms[r.status] = Number(r.cnt);
    sms.total += Number(r.cnt);
  }
  const email = { sent: 0, failed: 0, total: 0 };
  for (const r of emailPeriod) {
    email[r.status] = Number(r.cnt);
    email.total += Number(r.cnt);
  }

  return {
    days: d,
    sms,
    email,
    allTime: {
      smsSent: Number(smsAll.sent || 0),
      smsFailed: Number(smsAll.failed || 0),
      smsTotal: Number(smsAll.total || 0),
      emailSent: Number(emailAll.sent || 0),
      emailFailed: Number(emailAll.failed || 0),
      emailTotal: Number(emailAll.total || 0),
    },
  };
}

async function unified(days = 30, limit = 200) {
  const d = clampDays(days);
  const max = Math.min(Math.max(parseInt(limit, 10) || 200, 1), 1000);
  await ensureEmailTable();
  const [smsRows] = await pool.query(
    `SELECT id, phone AS recipient, message AS content, status, error, source, created_at, sent_at
     FROM sms_gateway_queue
     WHERE created_at >= (NOW() - INTERVAL ? DAY)
     ORDER BY id DESC LIMIT ?`,
    [d, max]
  );
  const [emailRows] = await pool.query(
    `SELECT id, recipient, subject AS content, status, error, source, created_at
     FROM email_logs
     WHERE created_at >= (NOW() - INTERVAL ? DAY)
     ORDER BY id DESC LIMIT ?`,
    [d, max]
  );

  const entries = [
    ...smsRows.map((r) => ({ ...r, type: 'sms' })),
    ...emailRows.map((r) => ({ ...r, type: 'email', sent_at: r.status === 'sent' ? r.created_at : null })),
  ];
  entries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return entries.slice(0, max).map((e) => ({
    ...e,
    created_at: e.created_at,
    sent_at: e.sent_at || null,
  }));
}

module.exports = { ensureEmailTable, logEmail, summary, unified, clampDays };
