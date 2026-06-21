require('dotenv').config();
const mysql = require('mysql2/promise');

if (!process.env.DB_HOST) {
  console.error('DB_HOST not set. Configure TiDB credentials in .env');
  process.exit(1);
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'occasion_garantie',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: process.env.DB_SSL === 'true' ? {} : undefined,
});

console.log(`Connected to TiDB: ${process.env.DB_HOST}:${process.env.DB_PORT || 3306}`);

module.exports = pool;
