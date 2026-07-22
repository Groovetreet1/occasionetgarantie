const fs = require('fs');
const path = require('path');
require('dotenv').config();

const mysqlPath = path.join(__dirname, '..', '..', '.usemysql');

if (fs.existsSync(mysqlPath)) {
  try {
    const mysql = require('mysql2/promise');
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'occasion_garantie',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    };
    if (process.env.DB_SSL === 'true') dbConfig.ssl = { rejectUnauthorized: false };
    const pool = mysql.createPool(dbConfig);
    console.log('Using MySQL database');
    module.exports = pool;
    return;
  } catch {
    console.log('MySQL config found but error, falling back to mock');
  }
}

console.log('Using mock database (data.json) - create .usemysql file to switch to MySQL');
module.exports = require('./db.mock');
