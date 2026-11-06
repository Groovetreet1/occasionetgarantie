const { Resend } = require('resend');
const verification = require('./verification');
const reset = require('./reset');
const creditConfirmed = require('./credit-confirmed');
const newsletter = require('./newsletter');
const messageLogs = require('../services/messageLogs');

const FROM = 'Occasion & Garantie <contact@contact.occasionetgarantie.store>';

let _resend = null;
function getResend() {
  if (!_resend && process.env.RESEND_API_KEY) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

async function send({ to, subject, html, source }) {
  const r = getResend();
  if (!r) {
    await messageLogs.logEmail({ to, subject, status: 'failed', error: 'RESEND_API_KEY not configured', source });
    throw new Error('RESEND_API_KEY not configured');
  }
  try {
    const result = await r.emails.send({ from: FROM, to, subject, html });
    if (result && result.error) {
      throw new Error(result.error.message || 'Resend error');
    }
    await messageLogs.logEmail({ to, subject, status: 'sent', source });
  } catch (e) {
    await messageLogs.logEmail({ to, subject, status: 'failed', error: e.message, source });
    console.log('Email send failed:', e.message);
    throw e;
  }
}

module.exports = { send, verification, reset, creditConfirmed, newsletter };
