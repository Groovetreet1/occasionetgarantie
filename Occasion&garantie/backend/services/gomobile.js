const BASE_URL = 'https://gateway.gomobile.ma/api';

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

async function sendSms(phone, message) {
  const data = await apiFetch('/sms/send', {
    method: 'POST',
    body: JSON.stringify({ to: phone, senderId: 'GOMOBILE', message }),
  });
  return data;
}

module.exports = { sendSms };
