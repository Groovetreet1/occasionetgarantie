const { Resend } = require('resend');
const verification = require('./verification');
const creditConfirmed = require('./credit-confirmed');
const newsletter = require('./newsletter');

const FROM = 'Occasion & Garantie <contact@occasionetgarantie.store>';

let _resend = null;
function getResend() {
  if (!_resend && process.env.RESEND_API_KEY) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

async function send({ to, subject, html }) {
  const r = getResend();
  if (!r) return;
  try {
    await r.emails.send({ from: FROM, to, subject, html });
  } catch (e) {
    console.log('Email send skipped:', e.message);
  }
}

module.exports = { send, verification, creditConfirmed, newsletter };