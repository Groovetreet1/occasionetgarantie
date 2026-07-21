const BASE_URL = 'https://api.gomobile.ma/api';

function getApiKey() {
  const key = process.env.SMS_API_KEY;
  if (!key) throw new Error('SMS_API_KEY not configured');
  return key;
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
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.message || `GoMobile API error ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

let senderIdCache = null;

async function getSenderId() {
  if (senderIdCache) return senderIdCache;
  const data = await apiFetch('/sender-ids/available?limit=1');
  const ids = data?.data || [];
  if (ids.length === 0) throw new Error('No available sender ID found');
  senderIdCache = ids[0].id;
  return senderIdCache;
}

async function findOrCreateContact(phone) {
  try {
    const data = await apiFetch('/contact', {
      method: 'POST',
      body: JSON.stringify({ primaryPhone: phone }),
    });
    return data.id;
  } catch (err) {
    if (err.status === 409) {
      const data = await apiFetch(`/contact?search=${encodeURIComponent(phone)}&limit=1`);
      const contacts = data?.data || [];
      if (contacts.length > 0) return contacts[0].id;
    }
    throw err;
  }
}

async function sendSms(phone, message) {
  const [contactId, senderId] = await Promise.all([
    findOrCreateContact(phone),
    getSenderId(),
  ]);
  const data = await apiFetch('/sms/send', {
    method: 'POST',
    body: JSON.stringify({ contactId, senderId, messageTemplate: message }),
  });
  return data;
}

module.exports = { sendSms, getSenderId, findOrCreateContact };
