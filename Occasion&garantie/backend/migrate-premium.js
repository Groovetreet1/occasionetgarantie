const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  try {
    const pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'occasion_garantie',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0
    });

    await pool.query("ALTER TABLE premium_payments MODIFY COLUMN status ENUM('en_attente','actif','rejete') DEFAULT 'en_attente'");

    console.log('status ENUM altered');

    await pool.query('ALTER TABLE premium_payments ADD COLUMN IF NOT EXISTS rejection_reason VARCHAR(500) DEFAULT NULL AFTER status');
    console.log('rejection_reason column added');

    await pool.end();
    console.log('Migration done');
    process.exit(0);
  } catch (e) {
    console.error('Migration error:', e.message, e.code, e.sqlMessage);
    process.exit(1);
  }
})();
