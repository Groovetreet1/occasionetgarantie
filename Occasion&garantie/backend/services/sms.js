// Facade SMS : choisit le fournisseur selon SMS_PROVIDER
//   - "gateway"  : telephone Android + SIM (gratuit, auto-heberge)  <-- defaut conseille
//   - "gomobile" : API GoMobile (payant)
// Tous les appelants utilisent sendSms(phone, message) de la meme facon.
const gateway = require('./smsGateway');
const gomobile = require('./gomobile');

function provider() {
  return (process.env.SMS_PROVIDER || 'gomobile').toLowerCase();
}

const BRAND = 'Occasion & Garantie';

// Garantit que le nom de la marque ouvre toujours le SMS.
// (Avec une SIM, le destinataire voit le numero : la marque dans le texte est essentielle.)
function withBrand(message) {
  const m = String(message || '').trim();
  if (!m) return m;
  if (m.toLowerCase().startsWith(BRAND.toLowerCase())) return m;
  return `${BRAND} : ${m}`;
}

async function sendSms(phone, message, opts = {}) {
  const text = withBrand(message);
  if (provider() === 'gateway') {
    return gateway.enqueueAndWait(phone, text, opts.source);
  }
  return gomobile.sendSms(phone, text);
}

module.exports = { sendSms, provider, withBrand };
