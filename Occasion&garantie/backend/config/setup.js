const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function setup() {
  const dbName = process.env.DB_NAME || 'occasion_garantie';

  // Skip if DB_HOST not set (will fail later in db.js)
  if (!process.env.DB_HOST) return;

  // Connect without database to create it
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true' ? {} : undefined,
  });

  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
  console.log(`Database "${dbName}" ready.`);
  await conn.query(`USE \`${dbName}\``);

  // Create tables
  await conn.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      slug VARCHAR(100) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      full_name VARCHAR(100) NOT NULL,
      email VARCHAR(150) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      phone VARCHAR(20),
      role ENUM('client', 'admin') DEFAULT 'client',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      slug VARCHAR(200) NOT NULL UNIQUE,
      description TEXT,
      price DECIMAL(10,2) NOT NULL,
      old_price DECIMAL(10,2),
      category_id INT,
      image VARCHAR(255),
      brand VARCHAR(100),
      state ENUM('neuf', 'comme_neuf', 'tres_bon', 'bon', 'acceptable') DEFAULT 'tres_bon',
      warranty VARCHAR(100) DEFAULT '6 mois',
      stock INT DEFAULT 1,
      featured BOOLEAN DEFAULT FALSE,
      active BOOLEAN DEFAULT TRUE,
      specs JSON,
      gallery JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS deposits (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      product_id INT,
      product_name VARCHAR(200),
      screenshot VARCHAR(255),
      status VARCHAR(50) DEFAULT 'en_attente',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Migrate users from data.json if users table is empty
  const [existingUsers] = await conn.query('SELECT COUNT(*) as count FROM users');
  if (existingUsers[0].count === 0) {
    const dataPath = path.join(__dirname, '..', 'data.json');
    if (fs.existsSync(dataPath)) {
      try {
        let raw = fs.readFileSync(dataPath, 'utf8');
        if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
        const data = JSON.parse(raw);
        if (data.users && data.users.length > 0) {
          for (const u of data.users) {
            await conn.query(
              `INSERT IGNORE INTO users (id, full_name, email, password, phone, role, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [u.id, u.full_name, u.email, u.password, u.phone || null, u.role || 'client', u.created_at || new Date().toISOString()]
            );
          }
          console.log(`Migrated ${data.users.length} users from data.json`);
        }
      } catch (err) {
        console.log('Error migrating users from data.json:', err.message);
      }
    }
  }

  // Seed categories
  const [existingCategories] = await conn.query('SELECT COUNT(*) as count FROM categories');
  if (existingCategories[0].count === 0) {
    await conn.query(`INSERT INTO categories (name, slug) VALUES
      ('Smartphones', 'smartphones'),
      ('Tablettes', 'tablettes'),
      ('Ordinateurs', 'ordinateurs'),
      ('Accessoires', 'accessoires'),
      ('Gaming', 'gaming')
    `);
    console.log('Categories seeded.');
  }

  // Migrate products from data.json if products table is empty
  const [existingProducts] = await conn.query('SELECT COUNT(*) as count FROM products');
  if (existingProducts[0].count === 0) {
    const dataPath = path.join(__dirname, '..', 'data.json');
    if (fs.existsSync(dataPath)) {
      try {
        let raw = fs.readFileSync(dataPath, 'utf8');
        if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
        const data = JSON.parse(raw);
        if (data.products && data.products.length > 0) {
          for (const p of data.products) {
            const gallery = p.gallery ? (typeof p.gallery === 'string' ? p.gallery : JSON.stringify(p.gallery)) : null;
            const specs = p.specs ? (typeof p.specs === 'string' ? p.specs : JSON.stringify(p.specs)) : null;
            await conn.query(
              `INSERT INTO products (id, name, slug, description, price, old_price, category_id, image, brand, state, warranty, stock, featured, active, specs, gallery, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [p.id, p.name, p.slug, p.description || '', p.price, p.old_price || null, p.category_id || null,
               p.image || null, p.brand || null, p.state || 'tres_bon', p.warranty || '6 mois', p.stock || 1,
               p.featured || false, p.active !== false, specs, gallery, p.created_at || new Date().toISOString()]
            );
          }
          console.log(`Migrated ${data.products.length} products from data.json`);
        }
      } catch (err) {
        console.log('Error migrating data.json:', err.message);
      }
    }
  }

  await conn.end();
  console.log('Database setup complete.');
}

module.exports = setup;

// Allow running directly: node config/setup.js
if (require.main === module) {
  setup().catch((err) => {
    console.error('Setup failed:', err.message);
    process.exit(1);
  });
}
