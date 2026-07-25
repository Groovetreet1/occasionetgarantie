function verificationTemplate({ code, userName }) {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f7fa">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:40px 16px">
<tr><td align="center">
<table role="presentation" width="100%" style="max-width:480px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06)">
<tr><td style="padding:32px 32px 0" align="center">
<img src="https://occasionetgarantie.store/logo.png" alt="Occasion & Garantie" width="48" height="48" style="border-radius:12px">
<h1 style="font-size:20px;font-weight:700;color:#1a1a2e;margin:16px 0 4px">Vérification de compte</h1>
<p style="font-size:14px;color:#64748b;margin:0 0 24px">Bonjour ${userName || ''}, voici votre code de vérification</p>
</td></tr>
<tr><td style="padding:0 32px" align="center">
<div style="background:#f0f7ff;border-radius:12px;padding:24px;margin-bottom:24px;border:1px solid #dbeafe">
<span style="font-size:40px;font-weight:800;color:#2563eb;letter-spacing:8px;font-family:monospace">${code}</span>
</div>
<p style="font-size:13px;color:#64748b;line-height:1.6">Ce code expire dans 10 minutes.<br>Si vous n'avez pas demandé cette vérification, ignorez cet email.</p>
</td></tr>
<tr><td style="padding:24px 32px 32px" align="center">
<p style="font-size:12px;color:#94a3b8;margin:0">Occasion & Garantie — Votre marché de confiance au Maroc</p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

module.exports = verificationTemplate;