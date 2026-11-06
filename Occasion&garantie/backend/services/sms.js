// Facade SMS : choisit le fournisseur selon SMS_PROVIDER
//   - "gateway"  : telephone Android + SIM (gratuit, auto-heberge)  <-- defaut conseille
//   - "gomobile" : API GoMobile (payant)
// Tous les appelants utilisent sendSms(phone, message) de la meme facon.
const gateway = require('./smsGateway');
const gomobile = require('./gomobile');

function provider() {
  return (process.env.SMS_PROVIDER || 'gomobile').toLowerCase();
}

async function sendSms(phone, message, opts = {}) {
  if (provider() === 'gateway') {
    return gateway.enqueueAndWait(phone, message, opts.source);
  }
  return gomobile.sendSms(phone, message);
}

module.exports = { sendSms, provider };
