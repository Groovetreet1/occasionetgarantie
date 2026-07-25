function newsletterTemplate({ title, content, unsubscribeLink }) {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8f9fc">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fc;padding:40px 16px">
<tr><td align="center">
<table role="presentation" width="100%" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06)">
<tr><td style="background:linear-gradient(135deg, #f59e0b, #d97706);padding:24px 32px" align="center">
<h1 style="font-size:18px;font-weight:700;color:#fff;margin:0">Occasion & Garantie</h1>
<p style="font-size:13px;color:rgba(255,255,255,0.8);margin:4px 0 0">Newsletter</p>
</td></tr>
<tr><td style="padding:32px">
<h2 style="font-size:22px;font-weight:700;color:#1e293b;margin:0 0 16px">${title}</h2>
<div style="font-size:15px;color:#1e293b;line-height:1.8">${content}</div>
</td></tr>
<tr><td style="padding:0 32px 32px" align="center">
<p style="font-size:12px;color:#94a3b8;margin:0">Vous recevez cet email car vous êtes inscrit à la newsletter Occasion & Garantie.</p>
${unsubscribeLink ? `<p style="font-size:12px;margin:8px 0 0"><a href="${unsubscribeLink}" style="color:#f59e0b">Se désinscrire</a></p>` : ''}
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

module.exports = newsletterTemplate;