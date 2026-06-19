const https = require('https');

function sendSms(to, message) {
  return new Promise((resolve, reject) => {
    if (!process.env.SMS_API_KEY) {
      return reject(new Error('SMS_API_KEY not configured'));
    }
    const data = JSON.stringify({
      to,
      senderId: process.env.SMS_SENDER_ID || 'GOMOBILE',
      message,
    });
    const options = {
      hostname: 'gomobile-frontend.vercel.app',
      path: '/api/sms/send',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.SMS_API_KEY,
        'Content-Length': Buffer.byteLength(data),
      },
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch { resolve({ success: false, error: body }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

module.exports = { sendSms };
