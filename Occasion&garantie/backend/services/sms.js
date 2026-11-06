// Facade SMS : choisit le fournisseur selon SMS_PROVIDER
//   - "gateway"  : telephone Android + SIM (gratuit, auto-heberge)  <-- defaut conseille
//   - "gomobile" : API GoMobile (payant)
// Deux interrupteurs admin (table app_settings) :
//   - sms_enabled      : coupe TOUS les SMS
//   - otp_sms_enabled  : coupe uniquement les codes de verification par SMS
const gateway = require('./smsGateway');
const gomobile = require('./gomobile');
const settings = require('./settings');

const BRAND = 'Occasion & Garantie';

function provider() {
  return (process.env.SMS_PROVIDER || 'gomobile').toLowerCase();
}

// Garantit que le nom de la marque ouvre toujours le SMS.
// (Avec une SIM, le destinataire voit le numero : la marque dans le texte est essentielle.)
function withBrand(message) {
  const m = String(message || '').trim();
  if (!m) return m;
  if (m.toLowerCase().startsWith(BRAND.toLowerCase())) return m;
  return `${BRAND} : ${m}`;
}

async function isSmsEnabled() {
  return settings.getBool('sms_enabled', true);
}

async function isOtpSmsEnabled() {
  return settings.getBool('otp_sms_enabled', true);
}

async function sendSms(phone, message, opts = {}) {
  if (!(await isSmsEnabled())) {
    throw new Error('SMS desactives par l administration');
  }
  if (opts.purpose === 'otp' && !(await isOtpSmsEnabled())) {
    throw new Error('OTP par SMS desactive par l administration');
  }
  const text = withBrand(message);
  if (provider() === 'gateway') {
    return gateway.enqueueAndWait(phone, text, opts.source);
  }
  return gomobile.sendSms(phone, text);
}

// A utiliser pour tous les codes de verification (respecte l'interrupteur OTP).
async function sendOtp(phone, message, opts = {}) {
  return sendSms(phone, message, { ...opts, purpose: 'otp' });
}

module.exports = { sendSms, sendOtp, provider, withBrand, isSmsEnabled, isOtpSmsEnabled };
