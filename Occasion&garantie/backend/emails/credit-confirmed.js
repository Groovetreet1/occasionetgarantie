function creditConfirmedTemplate({ userName, credits, amountDH, newBalance }) {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f7fa">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:40px 16px">
<tr><td align="center">
<table role="presentation" width="100%" style="max-width:480px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06)">
<tr><td style="padding:32px 32px 0" align="center">
<div style="width:56px;height:56px;border-radius:50%;background:#ecfdf5;display:flex;align-items:center;justify-content:center;margin:0 auto">
<span style="font-size:28px">✅</span>
</div>
<h1 style="font-size:20px;font-weight:700;color:#1a1a2e;margin:16px 0 4px">Achat de crédits confirmé</h1>
<p style="font-size:14px;color:#64748b;margin:0 0 24px">Bonjour ${userName || ''}, votre achat a été approuvé</p>
</td></tr>
<tr><td style="padding:0 32px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;padding:16px;margin-bottom:20px">
<tr><td style="padding:8px 0;font-size:13px;color:#64748b">Crédits achetés</td><td align="right" style="font-size:15px;font-weight:600;color:#1a1a2e">${credits} crédits</td></tr>
<tr><td style="padding:8px 0;font-size:13px;color:#64748b">Montant</td><td align="right" style="font-size:15px;font-weight:600;color:#1a1a2e">${amountDH} DH</td></tr>
<tr><td style="padding:8px 0;font-size:13px;color:#64748b;border-top:1px solid #e2e8f0">Nouveau solde</td><td align="right" style="padding:8px 0;font-size:16px;font-weight:700;color:#2563eb;border-top:1px solid #e2e8f0">${newBalance} crédits</td></tr>
</table>
<a href="https://www.occasionetgarantie.store/seller" style="display:inline-block;padding:12px 32px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600">Voir mon solde</a>
</td></tr>
<tr><td style="padding:32px" align="center">
<p style="font-size:12px;color:#94a3b8;margin:0">Occasion & Garantie — Votre marché de confiance au Maroc</p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

module.exports = creditConfirmedTemplate;