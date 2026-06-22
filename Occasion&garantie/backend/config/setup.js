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
      avatar VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Add avatar column if missing (for existing DBs)
  try {
    await conn.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar VARCHAR(255)`);
  } catch {}

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

  // Seed categories (idempotent)
  const categories = [
    ['Smartphones', 'smartphones'],
    ['Tablettes', 'tablettes'],
    ['Ordinateurs', 'ordinateurs'],
    ['Accessoires', 'accessoires'],
    ['Gaming', 'gaming'],
    ['Accessoires Gaming', 'accessoires-gaming'],
  ];
  for (const [name, slug] of categories) {
    await conn.query('INSERT IGNORE INTO categories (name, slug) VALUES (?, ?)', [name, slug]);
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

  // Import Electroplanet products from scraped JSON files
  const epDir = path.join(__dirname, '..', 'ep_scraped');
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const importJobs = [
    { file: 'products.json', catSlug: 'smartphones' },
    { file: 'ep_extra.json', catSlug: null }, // category is in each product
  ];

  for (const job of importJobs) {
    const jsonPath = path.join(epDir, job.file);
    if (!fs.existsSync(jsonPath)) continue;
    const items = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    let imported = 0;
    for (const p of items) {
      const [dup] = await conn.query('SELECT id FROM products WHERE sku = ?', [p.sku]);
      if (dup.length > 0) continue;

      // Determine category
      let catId = null;
      if (job.catSlug) {
        const [c] = await conn.query('SELECT id FROM categories WHERE slug = ?', [job.catSlug]);
        if (c.length > 0) catId = c[0].id;
      } else if (p.category) {
        const catSlug = p.category.toLowerCase().replace(/\s+/g, '-');
        const [c] = await conn.query('SELECT id FROM categories WHERE slug = ?', [catSlug]);
        if (c.length > 0) catId = c[0].id;
      }

      // Copy image (find by localImage field or by SKU in images dir)
      let imageFile = null;
      let localImg = p.localImage;
      if (!localImg) {
        const files = fs.readdirSync(path.join(epDir, 'images')).filter(f => f.startsWith(p.sku));
        if (files.length > 0) localImg = files[0];
      }
      if (localImg) {
        const src = path.join(epDir, 'images', localImg);
        const ext = path.extname(localImg) || '.jpg';
        const slug = (p.sku + '-' + p.name).toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').substring(0, 60);
        const newName = `${slug}${ext}`;
        const dest = path.join(uploadsDir, newName);
        if (fs.existsSync(src) && !fs.existsSync(dest)) fs.copyFileSync(src, dest);
        imageFile = newName;
      }

      const price = p.price;
      const oldPrice = p.oldPrice && p.oldPrice > price ? p.oldPrice : Math.round(price * 1.25);
      const desc = `${p.name} - ${p.brand || 'Marque'}. Produit disponible chez Occasion & Garantie. Qualité garantie avec 6 mois de garantie.`;
      const slug = p.sku + '-' + p.name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').substring(0, 190);

      await conn.query(
        `INSERT INTO products (sku, name, slug, description, price, old_price, category_id, image, brand, state, warranty, stock, featured, active, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [p.sku, p.name, slug, desc, price, oldPrice, catId, imageFile, p.brand || '', 'neuf', '6 mois', 1, 0, 1]
      );
      imported++;
    }
    if (imported > 0) console.log(`Imported ${imported} products from ${job.file}`);
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
