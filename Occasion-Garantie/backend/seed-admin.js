const bcrypt = require('bcryptjs');
const db = require('./config/db');

async function seedAdmin() {
  const email = 'admin@og.fr';
  const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length > 0) {
    console.log('Admin already exists.');
    process.exit(0);
  }

  const password = await bcrypt.hash('admin123', 10);
  await db.query(
    'INSERT INTO users (full_name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)',
    ['Admin', email, password, '0600000000', 'admin']
  );
  console.log('Admin created: admin@og.fr / admin123');
  process.exit(0);
}

seedAdmin().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
