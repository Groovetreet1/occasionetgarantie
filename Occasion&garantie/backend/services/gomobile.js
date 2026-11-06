const BASE_URL = 'https://api.gomobile.ma/api';

function getApiKey() {
  const key = process.env.SMS_API_KEY;
  if (!key) throw new Error('SMS_API_KEY not configured');
  return key;
}

function normalizePhone(phone) {
  if (!phone) return phone;
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10 && (digits.startsWith('06') || digits.startsWith('07'))) return '+212' + digits.slice(1);
  if (digits.length === 9 && (digits.startsWith('6') || digits.startsWith('7'))) return '+212' + digits;
  if (digits.length === 12 && digits.startsWith('212')) return '+' + digits;
  if (String(phone).startsWith('+')) return String(phone);
  return phone;
}

async function apiFetch(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'x-api-key': getApiKey(),
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; }
  catch { data = { raw: text }; }
  if (!res.ok) {
    const err = new Error(data.message || data.error || `GoMobile API error ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

async function getSenderName() {
  // API /sms/send attend le NOM du sender ID (ex: "OCCASION"), pas l'UUID.
  // Aucun fallback sur "GOMOBILE" : ce sender ID appartient a Gomobile (marque tierce),
  // l'utiliser serait une usurpation de marque (refuse par l'API: SENDER_ID_NOT_ACCESSIBLE).
  const configured = (process.env.SMS_SENDER_NAME || '').trim();
  if (configured) return configured;
  try {
    const r = await apiFetch('/sender-ids/available?limit=20', { method: 'GET' });
    const list = Array.isArray(r) ? r : (r.data || []);
    const match = list.find((s) => s.status === 'active') || list[0];
    if (match && match.senderId) return match.senderId;
  } catch {}
  throw new Error('Aucun Sender ID actif pour cette organisation Gomobile (SMS_SENDER_NAME non configure)');
}

async function sendSms(phone, message) {
  const to = normalizePhone(phone);
  const senderId = await getSenderName();
  const data = await apiFetch('/sms/send', {
    method: 'POST',
    body: JSON.stringify({ to, senderId, message }),
  });
  // L'API GoMobile repond 201 meme quand l'operateur refuse l'envoi (success: false,
  // creditCharged: 0). Sans ce controle, l'app croit que le SMS est parti.
  if (data && data.success === false) {
    const err = new Error(data.error || "Echec de l'envoi du SMS");
    err.status = 502;
    err.data = data;
    throw err;
  }
  return data;
}

module.exports = { sendSms, normalizePhone, getSenderName };
