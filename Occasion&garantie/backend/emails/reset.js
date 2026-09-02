function resetTemplate({ code, userName, resetLink }) {
  const fallbackUrl = resetLink || '#';
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8f9fc">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fc;padding:40px 16px">
<tr><td align="center">
<table role="presentation" width="100%" style="max-width:480px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06)">
<tr><td style="padding:32px 32px 0" align="center">
<img src="https://www.occasionetgarantie.store/logo.png" alt="Occasion & Garantie" width="48" height="48" style="border-radius:12px">
<h1 style="font-size:20px;font-weight:800;color:#1e293b;margin:16px 0 4px">Réinitialisation du mot de passe</h1>
<p style="font-size:14px;color:#64748b;margin:0 0 24px">Bonjour ${userName ? userName : ''}, voici votre code</p>
</td></tr>
<tr><td style="padding:0 32px" align="center">
<!-- Code box : large, selectable, one-tap copy on mobile -->
<div style="background:rgba(245,158,11,0.10);border-radius:14px;padding:22px 16px;margin-bottom:16px;border:1px solid #f59e0b;user-select:all;-webkit-user-select:all">
<span style="font-size:38px;font-weight:800;color:#d97706;letter-spacing:8px;font-family:monospace;display:inline-block;user-select:all;-webkit-user-select:all">${code}</span>
</div>
<p style="font-size:12px;color:#94a3b8;margin:0 0 20px">Appuyez longuement sur le code pour le copier — ou cliquez sur le bouton ci-dessous pour aller directement à la page.</p>
<!-- CTA bouton avec token/code déjà saisi -->
<a href="${fallbackUrl}" style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#000;text-decoration:none;border-radius:999px;font-size:15px;font-weight:800;box-shadow:0 8px 20px rgba(245,158,11,0.30)">Réinitialiser mon mot de passe →</a>
<p style="font-size:12px;color:#64748b;line-height:1.6;margin:20px 0 0">Ce code expire dans 15 minutes.<br>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
<p style="font-size:11px;color:#94a3b8;margin:16px 0 0;word-break:break-all">Lien direct: <a href="${fallbackUrl}" style="color:#d97706;word-break:break-all">${fallbackUrl}</a></p>
</td></tr>
<tr><td style="padding:24px 32px 32px" align="center">
<p style="font-size:12px;color:#94a3b8;margin:0">Occasion & Garantie — Votre marché de confiance au Maroc</p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

module.exports = resetTemplate;
