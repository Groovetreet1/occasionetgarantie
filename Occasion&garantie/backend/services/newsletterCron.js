const cron = require('node-cron');
const pool = require('../config/db');
const { send, newsletter } = require('../emails');
const API_BASE = process.env.CLIENT_URL || 'https://www.occasionetgarantie.store';

function buildProductCards(products) {
  if (!products || products.length === 0) return '<p style="font-size:15px;color:#64748b;line-height:1.8">Découvrez les nouvelles annonces sur notre plateforme.</p>';
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

function buildContent(latestProducts) {
  return `
    <p style="font-size:15px;color:#1e293b;line-height:1.8;margin:0 0 16px">Bonjour,</p>
    <p style="font-size:15px;color:#1e293b;line-height:1.8;margin:0 0 20px">Voici les dernières annonces ajoutées sur Occasion & Garantie :</p>
    ${buildProductCards(latestProducts)}
    <p style="font-size:15px;color:#1e293b;line-height:1.8;margin:20px 0 0">
      <a href="${API_BASE}/products" style="color:#f59e0b;font-weight:600;text-decoration:none">Voir toutes les annonces →</a>
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
    const title = `Nouveautés du ${today}`;

    const [subscribers] = await pool.query('SELECT email FROM newsletter_subscribers WHERE is_active = TRUE');
    if (subscribers.length === 0) {
      console.log(`[NewsletterCron] No active subscribers.`);
      return;
    }

    let sent = 0;
    for (const sub of subscribers) {
      const unsubscribeLink = `${API_BASE}/unsubscribe?email=${encodeURIComponent(sub.email)}`;
      const html = newsletter({ title, content, unsubscribeLink });
      try {
        await send({ to: sub.email, subject: title, html });
        sent++;
      } catch (e) {
        console.log(`[NewsletterCron] Failed for ${sub.email}:`, e.message);
      }
      await new Promise(r => setTimeout(r, 200));
    }
    console.log(`[NewsletterCron] Sent to ${sent}/${subscribers.length} subscribers.`);
  } catch (err) {
    console.error('[NewsletterCron] Error:', err.message);
  }
}

function startNewsletterCron() {
  cron.schedule('0 9 */3 * *', () => {
    console.log('[NewsletterCron] Running automated newsletter...');
    sendNewsletterToAll();
  });
  console.log('[NewsletterCron] Scheduled: every 3 days at 09:00');
}

module.exports = { startNewsletterCron, sendNewsletterToAll };
