const cron = require('node-cron');
const { Resend } = require('resend');
const pool = require('../config/db');
const { newsletter } = require('../emails');
const API_BASE = process.env.CLIENT_URL || 'https://www.occasionetgarantie.store';
const AUDIENCE_ID = 'd755ae5f-37c7-460b-8fec-26487de88023';
const FROM = 'Occasion & Garantie <contact@contact.occasionetgarantie.store>';

function buildProductCards(products) {
  if (!products || products.length === 0) return '<p style="font-size:15px;color:#64748b;line-height:1.8">Decouvrez les nouvelles annonces sur notre plateforme.</p>';
  return products.map(p => `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;background:#f0f1f5;border-radius:10px;overflow:hidden">
      <tr>
        <td width="90" style="padding:8px">
          <img src="${API_BASE}/uploads/${p.image || ''}" alt="${p.name}" style="width:80px;height:80px;object-fit:cover;border-radius:8px;display:block">
        </td>
        <td style="padding:8px 12px;vertical-align:middle">
          <h3 style="font-size:14px;font-weight:600;color:#1e293b;margin:0 0 4px">${p.name}</h3>
          <p style="font-size:13px;color:#f59e0b;font-weight:700;margin:0">${Number(p.price).toLocaleString('fr-FR')} DH</p>
        </td>
      </tr>
    </table>
  `).join('');
}

function buildContent(products) {
  return `
    <p style="font-size:15px;color:#1e293b;line-height:1.8;margin:0 0 16px">Bonjour,</p>
    <p style="font-size:15px;color:#1e293b;line-height:1.8;margin:0 0 20px">Voici les dernieres annonces ajoutees sur Occasion & Garantie :</p>
    ${buildProductCards(products)}
    <p style="font-size:15px;color:#1e293b;line-height:1.8;margin:20px 0 0">
      <a href="${API_BASE}/products" style="color:#f59e0b;font-weight:600;text-decoration:none">Voir toutes les annonces \u2192</a>
    </p>
  `;
}

async function sendNewsletterToAll() {
  try {
    const [products] = await pool.query(
      'SELECT name, price, image, slug FROM products WHERE active = TRUE AND status = ? ORDER BY created_at DESC LIMIT 6',
      ['disponible']
    );

    const content = buildContent(products);
    const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    const title = `Nouveautes du ${today}`;
    const unsubscribeBlock = `<p style="font-size:12px;margin:8px 0 0"><a href="{{{unsubscribeUrl}}}" style="color:#f59e0b">Se desinscrire</a></p>`;
    const html = newsletter({ title: `${title}`, content, unsubscribeLink: unsubscribeBlock });

    if (!process.env.RESEND_API_KEY) return;
    const resend = new Resend(process.env.RESEND_API_KEY);

    const broadcast = await resend.broadcasts.create({
      name: title,
      audience_id: AUDIENCE_ID,
      from: FROM,
      subject: title,
      html,
    });

    if (broadcast?.id) {
      await resend.broadcasts.send(broadcast.id);
      console.log(`[NewsletterCron] Broadcast "${title}" sent to audience.`);
    }
  } catch (err) {
    console.error('[NewsletterCron] Error:', err.message);
  }
}

function startNewsletterCron() {
  cron.schedule('0 9 */3 * *', () => {
    console.log('[NewsletterCron] Running automated newsletter...');
    sendNewsletterToAll();
  });
  console.log('[NewsletterCron] Scheduled: every 3 days at 09:00 via Resend Broadcast');
}

module.exports = { startNewsletterCron, sendNewsletterToAll };
