// Break-glass EXTERNE: desactiver la 2FA d'un compte (ex: Authenticator perdu).
// Ne touche pas au site, se lance a part. Le mot de passe n'est jamais affiche.
//
// Usage (local, avec .env + fichier .usemysql pour MySQL):
//   cd backend && node reset-2fa.js admin@example.com
// Usage (Render Shell, onglet Shell du service, env deja present):
//   cd "Occasion&garantie/backend" && node reset-2fa.js admin@example.com
require('dotenv').config();
const pool = require('./config/db');

async function main() {
  const email = process.argv[2];
  if (!email || email.startsWith('--')) {
    console.error('Usage: node reset-2fa.js <email-du-compte>');
    process.exitCode = 1;
    return;
  }
  try {
    try { await pool.query('ALTER TABLE users ADD COLUMN totp_gen INT DEFAULT 0'); } catch (e) {}
    const [rows] = await pool.query(
      'SELECT id, full_name, email, role, totp_enabled FROM users WHERE email = ?',
      [email]
    );
    if (rows.length === 0) {
      console.error('Aucun compte trouve avec cet email.');
      process.exitCode = 1;
      return;
    }
    const u = rows[0];
    console.log(`Compte: #${u.id} ${u.full_name} <${u.email}> role=${u.role} 2FA=${u.totp_enabled ? 'ON' : 'OFF'}`);
    if (!u.totp_enabled) {
      console.log('2FA deja desactivee. Rien a faire.');
      return;
    }
    await pool.query(
      'UPDATE users SET totp_secret = NULL, totp_enabled = 0, totp_backup = NULL, totp_gen = COALESCE(totp_gen, 0) + 1 WHERE id = ?',
      [u.id]
    );
    console.log('OK: 2FA desactivee. L\'utilisateur peut se connecter avec mot de passe uniquement.');
    console.log('Note: les appareils memorises (trust 30j) sont invalides.');
  } catch (e) {
    console.error('Erreur:', e.message);
    process.exitCode = 1;
  } finally {
    try { await pool.end(); } catch (e) {}
  }
}

main();
