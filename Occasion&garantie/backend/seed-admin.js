const bcrypt = require('bcryptjs');
const db = require('./config/db');

async function seedAdmin() {
  const email = 'contact@contact.occasionetgarantie.store';
  const oldEmail = 'admin@og.fr';

  // Migrate existing admin from old email
  const [oldAdmin] = await db.query('SELECT id FROM users WHERE email = ?', [oldEmail]);
  if (oldAdmin.length > 0) {
    await db.query('UPDATE users SET email = ?, full_name = ? WHERE email = ?', [email, 'Admin', oldEmail]);
    console.log('Admin email migrated to ' + email);
    process.exit(0);
  }

  const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length > 0) {
    console.log('Admin already exists.');
    process.exit(0);
  }

  const password = await bcrypt.hash('admin123', 10);
  await db.query(
    'INSERT INTO users (full_name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)',
    ['Admin', email, password, '0669017295', 'admin']
  );
  console.log('Admin created: ' + email + ' / admin123');
  process.exit(0);
}

seedAdmin().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
