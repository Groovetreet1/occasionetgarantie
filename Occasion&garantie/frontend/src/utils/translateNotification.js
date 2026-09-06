export function translateNotification(n, t) {
  if (!n) return { title: '', message: '' };
  const type = n.type || '';
  const rawTitle = (n.title || '').trim();
  const rawMessage = n.message || '';

  // Helper to extract product name from French message like 'Votre annonce "XXX" ...'
  const extractQuoted = (msg) => {
    const m = msg.match(/"([^"]+)"/);
    return m ? m[1] : '';
  };

  const extractPrice = (msg) => {
    const m = msg.match(/(\d+(?:\.\d+)?)\s*DH/);
    return m ? m[1] : '';
  };
  const extractName = (msg) => {
    // Try "XXX propose YYY" or first word before propose/a
    const m = msg.match(/^([^ ]+(?: [^ ]+)?)\s+(?:propose|a\s)/);
    if (m) return m[1].trim();
    const q = extractQuoted(msg);
    if (q) return q;
    return msg.split(' ')[0] || '';
  };

  // Map by type first (most reliable), fallback to title matching for old records
  const map = {
    product_approved: () => ({
      title: t('notif.productApprovedTitle'),
      message: t('notif.productApprovedMessage', { name: extractQuoted(rawMessage) || '' })
    }),
    product_rejected: () => ({
      title: t('notif.productRejectedTitle'),
      message: t('notif.productRejectedMessage', { name: extractQuoted(rawMessage) || '' })
    }),
    product_pending: () => ({
      title: t('notif.productPendingTitle'),
      message: t('notif.productPendingMessage', { name: extractQuoted(rawMessage) || rawMessage })
    }),
    negociation_new: () => {
      const prod = extractQuoted(rawMessage);
      const price = extractPrice(rawMessage);
      const name = rawMessage.split(' propose')[0] || '';
      return { title: t('notif.offerNewTitle'), message: t('notif.offerNewMessage', { name, product: prod, price }) };
    },
    negociation_annulee: () => {
      const prod = extractQuoted(rawMessage);
      const price = extractPrice(rawMessage);
      return { title: t('notif.offerCancelledTitle'), message: t('notif.offerCancelledMessage', { price, product: prod }) };
    },
    negociation_contreoffre: () => {
      const prod = extractQuoted(rawMessage);
      const price = extractPrice(rawMessage);
      const name = rawMessage.split(' propose')[0] || '';
      return { title: t('notif.offerCounterTitle'), message: t('notif.offerCounterMessage', { name, product: prod, price }) };
    },
    negociation_acceptee: () => {
      const prod = extractQuoted(rawMessage);
      const price = extractPrice(rawMessage);
      const name = rawMessage.split(' a accept')[0] || rawMessage.split(' Vous avez')[0] || '';
      return { title: t('notif.offerAcceptedTitle'), message: t('notif.offerAcceptedMessage', { name: name.trim() || '', product: prod, price }) };
    },
    negociation_refusee: () => {
      const prod = extractQuoted(rawMessage);
      const price = extractPrice(rawMessage);
      const name = rawMessage.split(' a refus')[0] || '';
      return { title: t('notif.offerRefusedTitle'), message: t('notif.offerRefusedMessage', { name: name.trim() || '', product: prod, price }) };
    },
    reprise_new: () => {
      const prod = rawMessage.split(' pour ')[1]?.replace(/[." ]+$/, '').trim() || extractQuoted(rawMessage) || '';
      const name = rawMessage.split(' a soumis')[0] || '';
      return { title: t('notif.repriseNewTitle'), message: t('notif.repriseNewMessage', { name: name.trim(), product: prod }) };
    },
    reprise_accepte: () => ({
      title: t('notif.repriseAcceptedTitle'),
      message: t('notif.repriseAcceptedMessage', { name: '', product: extractQuoted(rawMessage) || '' })
    }),
    reprise_refuse: () => ({
      title: t('notif.repriseRefusedTitle'),
      message: t('notif.repriseRefusedMessage', { name: '', product: extractQuoted(rawMessage) || '' })
    }),
    reprise_update: () => ({
      title: t('notif.repriseUpdateTitle'),
      message: t('notif.repriseUpdateMessage', { product: extractQuoted(rawMessage) || '' })
    }),
  };

  if (map[type]) {
    try { return map[type](); } catch {}
  }

  // Fallback: map French titles for old records where type may be generic
  const titleMap = {
    'Annonce approuvée': t('notif.productApprovedTitle'),
    'Annonce refusée': t('notif.productRejectedTitle'),
    'Annonce en attente': t('notif.productPendingTitle'),
    'Nouvelle offre de prix': t('notif.offerNewTitle'),
    'Offre annulée': t('notif.offerCancelledTitle'),
    'Nouvelle contre-offre': t('notif.offerCounterTitle'),
    'Offre acceptée !': t('notif.offerAcceptedTitle'),
    'Offre acceptée': t('notif.offerAcceptedTitle'),
    'Offre refusée': t('notif.offerRefusedTitle'),
    'Nouvelle demande de reprise': t('notif.repriseNewTitle'),
    'Reprise acceptée': t('notif.repriseAcceptedTitle'),
    'reprise acceptée': t('notif.repriseAcceptedTitle'),
    'Reprise refusée': t('notif.repriseRefusedTitle'),
    'Reprise mise à jour': t('notif.repriseUpdateTitle'),
  };

  const translatedTitle = titleMap[rawTitle] || rawTitle;
  return { title: translatedTitle, message: rawMessage };
}
