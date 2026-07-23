require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'occasion_garantie',
  };
  if (process.env.DB_SSL === 'true') dbConfig.ssl = { rejectUnauthorized: false };

  const pool = mysql.createPool(dbConfig);

  try {
    await pool.query(`ALTER TABLE users ADD COLUMN premium BOOLEAN DEFAULT FALSE`);
    console.log('✓ Column premium added to users');
  } catch (e) {
    if (e.errno === 1060) console.log('→ Column premium already exists');
    else throw e;
  }

  try {
    await pool.query(`ALTER TABLE users ADD COLUMN premium_expires_at DATETIME DEFAULT NULL`);
    console.log('✓ Column premium_expires_at added to users');
  } catch (e) {
    if (e.errno === 1060) console.log('→ Column premium_expires_at already exists');
    else throw e;
  }

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS premium_payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        amount DECIMAL(10,2) NOT NULL DEFAULT 50.00,
        screenshot VARCHAR(255),
        status ENUM('en_attente', 'actif') DEFAULT 'en_attente',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ Table premium_payments created');
  } catch (e) {
    if (e.errno === 1050) console.log('→ Table premium_payments already exists');
    else throw e;
  }

  console.log('\nMigration completed successfully!');
  await pool.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
