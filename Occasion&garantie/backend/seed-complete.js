const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const mysqlPath = path.join(__dirname, '..', '.usemysql');
const useMySQL = fs.existsSync(mysqlPath);

const productsData = [
  { name: 'Samsung Galaxy A07 2026', brand: 'Samsung', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 10, slug: 'samsung-galaxy-a07-2026', price: 1, description: 'Le Samsung Galaxy A07 2026 est un smartphone d\'entrée de gamme avec écran HD+ 6.5 pouces, batterie 5000mAh et double appareil photo 50MP+2MP.' },
  { name: 'Samsung Galaxy A17 2026', brand: 'Samsung', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 10, slug: 'samsung-galaxy-a17-2026', price: 1, description: 'Le Samsung Galaxy A17 2026 offre un écran Super AMOLED 6.6 pouces 90Hz, processeur octa-core et triple appareil photo 50MP+5MP+2MP.' },
  { name: 'Samsung Galaxy S26', brand: 'Samsung', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 5, slug: 'samsung-galaxy-s26', price: 1, description: 'Le Samsung Galaxy S26 2026 est un flagship avec écran Dynamic AMOLED 6.7 pouces 120Hz, processeur Exynos 2600 et quadruple appareil photo 200MP+50MP+12MP+10MP.' },
  { name: 'Samsung Galaxy S26 Ultra', brand: 'Samsung', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 3, slug: 'samsung-galaxy-s26-ultra', price: 1, description: 'Le Samsung Galaxy S26 Ultra 2026 est le smartphone le plus avancé avec écran 6.9 pouces 120Hz LTPO AMOLED, processeur Exynos 2600, stylet S-PEN intégré et appareil photo 300MP avec zoom spatial 100x.' },
  { name: 'Samsung Galaxy A26 2026', brand: 'Samsung', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 10, slug: 'samsung-galaxy-a26-2026', price: 1, description: 'Smartphone Samsung Galaxy A26 2026 avec écran Super AMOLED 6.7 pouces 120Hz, batterie 5000mAh et charge rapide 25W.' },
  { name: 'Samsung Galaxy A56 2026', brand: 'Samsung', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 8, slug: 'samsung-galaxy-a56-2026', price: 1, description: 'Samsung Galaxy A56 2026 avec écran Super AMOLED 120Hz, processeur Exynos 1580 et appareil photo 50MP OIS + 12MP + 5MP.' },
  { name: 'Samsung Galaxy Tab S10 FE 2026', brand: 'Samsung', category_id: 2, state: 'neuf', warranty: '12 mois', stock: 5, slug: 'samsung-galaxy-tab-s10-fe-2026', price: 1, description: 'Tablette Samsung Galaxy Tab S10 FE 2026 avec écran TFT 10.9 pouces, processeur Exynos 1580 et batterie 8000mAh.' },
  { name: 'Xiaomi Redmi Note 17T', brand: 'Xiaomi', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 10, slug: 'xiaomi-redmi-note-17t', price: 1, description: 'Xiaomi Redmi Note 17T 2026 avec écran AMOLED 120Hz 6.7 pouces 1.5K, batterie 5500mAh et charge rapide 67W.' },
  { name: 'Xiaomi Redmi Note 17T Pro', brand: 'Xiaomi', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 8, slug: 'xiaomi-redmi-note-17t-pro', price: 1, description: 'Xiaomi Redmi Note 17T Pro 2026 avec processeur Dimensity 8400 Ultra, écran AMOLED 1.5K 120Hz et appareil photo 200MP OIS.' },
  { name: 'Xiaomi Redmi A7 Pro', brand: 'Xiaomi', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 15, slug: 'xiaomi-redmi-a7-pro', price: 1, description: 'Xiaomi Redmi A7 Pro 2026 avec écran HD+ 6.7 pouces 90Hz, batterie 5200mAh et processeur octa-core Helio G81.' },
  { name: 'Xiaomi 15T 2026', brand: 'Xiaomi', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 6, slug: 'xiaomi-15t-2026', price: 1, description: 'Xiaomi 15T 2026 avec écran AMOLED 144Hz 1.5K, processeur Snapdragon 8 Gen 4 et triple appareil photo Leica 50MP+50MP+12MP.' },
  { name: 'Xiaomi 15T Pro 2026', brand: 'Xiaomi', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 4, slug: 'xiaomi-15t-pro-2026', price: 1, description: 'Xiaomi 15T Pro 2026 flagship avec processeur Snapdragon 8 Gen 4, écran AMOLED 2K 144Hz et batterie 6000mAh avec charge rapide 120W.' },
  { name: 'Xiaomi Pad 7S 2026', brand: 'Xiaomi', category_id: 2, state: 'neuf', warranty: '12 mois', stock: 5, slug: 'xiaomi-pad-7s-2026', price: 1, description: 'Tablette Xiaomi Pad 7S 2026 avec écran LCD 11 pouces 120Hz, processeur Snapdragon 8 Gen 4 et batterie 8850mAh.' },
  { name: 'OPPO Find N6 2026', brand: 'OPPO', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 3, slug: 'oppo-find-n6-2026', price: 1, description: 'OPPO Find N6 2026 smartphone pliable avec écran pliable 7.8 pouces AMOLED 120Hz, processeur Snapdragon 8 Gen 4 et triple appareil photo Hasselblad.' },
  { name: 'OPPO Find X9 Pro 2026', brand: 'OPPO', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 4, slug: 'oppo-find-x9-pro-2026', price: 1, description: 'OPPO Find X9 Pro 2026 flagship avec écran AMOLED 6.8 pouces 120Hz LTPO, processeur Snapdragon 8 Gen 4 et quadruple appareil photo Hasselblad 50MP+50MP+50MP+50MP.' },
  { name: 'OPPO Reno 15 2026', brand: 'OPPO', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 8, slug: 'oppo-reno-15-2026', price: 1, description: 'OPPO Reno 15 2026 avec écran AMOLED 120Hz, charge rapide 80W et appareil photo 50MP avec portrait expert IA.' },
  { name: 'OPPO Reno 15 Pro 2026', brand: 'OPPO', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 6, slug: 'oppo-reno-15-pro-2026', price: 1, description: 'OPPO Reno 15 Pro 2026 avec écran AMOLED 120Hz, processeur Dimensity 8400 et triple appareil photo 50MP+8MP+2MP.' },
  { name: 'OPPO A80 2026', brand: 'OPPO', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 15, slug: 'oppo-a80-2026', price: 1, description: 'OPPO A80 2026 smartphone d\'entrée de gamme avec écran HD+ 6.7 pouces 90Hz et batterie 5100mAh.' },
  { name: 'Motorola Edge 60 Ultra 2026', brand: 'Motorola', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 4, slug: 'motorola-edge-60-ultra-2026', price: 1, description: 'Motorola Edge 60 Ultra 2026 flagship avec écran pOLED 144Hz, processeur Snapdragon 8 Gen 4 et appareil photo 200MP OIS.' },
  { name: 'Motorola Edge 60 2026', brand: 'Motorola', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 6, slug: 'motorola-edge-60-2026', price: 1, description: 'Motorola Edge 60 2026 avec écran pOLED 144Hz, batterie 5000mAh et processeur MediaTek Dimensity 8300.' },
  { name: 'Motorola Moto G85 2026', brand: 'Motorola', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 12, slug: 'motorola-moto-g85-2026', price: 1, description: 'Motorola Moto G85 2026 avec écran pOLED 120Hz, batterie 5000mAh et appareil photo 50MP OIS.' },
  { name: 'Motorola Moto G35 2026', brand: 'Motorola', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 15, slug: 'motorola-moto-g35-2026', price: 1, description: 'Motorola Moto G35 2026 avec écran LCD 90Hz HD+, batterie 5000mAh et appareil photo 50MP.' },
  { name: 'Motorola Razr 60 2026', brand: 'Motorola', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 3, slug: 'motorola-razr-60-2026', price: 1, description: 'Motorola Razr 60 2026 smartphone pliable avec écran pliable pOLED 6.9 pouces 120Hz et écran externe 3.6 pouces.' },
  { name: 'Infinix Note 50 2026', brand: 'Infinix', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 12, slug: 'infinix-note-50-2026', price: 1, description: 'Infinix Note 50 2026 avec écran AMOLED 120Hz, batterie 6000mAh et charge rapide 33W.' },
  { name: 'Infinix Note 50 Pro 2026', brand: 'Infinix', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 10, slug: 'infinix-note-50-pro-2026', price: 1, description: 'Infinix Note 50 Pro 2026 avec écran AMOLED 120Hz, processeur Helio G100 Ultimate et triple appareil photo 108MP+2MP+2MP.' },
  { name: 'Infinix Hot 50 2026', brand: 'Infinix', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 20, slug: 'infinix-hot-50-2026', price: 1, description: 'Infinix Hot 50 2026 avec écran HD+ 90Hz et batterie 6000mAh.' },
  { name: 'Infinix Hot 50 Pro 2026', brand: 'Infinix', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 15, slug: 'infinix-hot-50-pro-2026', price: 1, description: 'Infinix Hot 50 Pro 2026 avec écran AMOLED 120Hz et appareil photo 108MP.' },
  { name: 'Infinix Zero 50 2026', brand: 'Infinix', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 8, slug: 'infinix-zero-50-2026', price: 1, description: 'Infinix Zero 50 2026 flagship avec écran AMOLED 144Hz, processeur MediaTek Dimensity 8300 et appareil photo 108MP OIS.' },
];

const specs = { Ecran: '6.7 pouces', Processeur: 'Octa-core 2.5GHz', RAM: '8 Go', Stockage: '256 Go', Batterie: '5000mAh', Couleur: 'Noir Cosmic' };

async function seed() {
  let usingMock = false;
  if (useMySQL) {
    try {
      require('dotenv').config({ path: './.env' });
      const mysql = require('mysql2/promise');
      const dbConfig = {
        host: process.env.DB_HOST || 'localhost', port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'occasion_garantie',
        waitForConnections: true,
      };
      if (process.env.DB_SSL === 'true') dbConfig.ssl = { rejectUnauthorized: false };
      const db = await mysql.createPool(dbConfig);
      await db.query('SELECT 1');
      let count = 0;
      for (const p of productsData) {
        const { name, brand, category_id, state, warranty, stock, slug, price, description } = p;
        try {
          const [existing] = await db.query('SELECT id FROM products WHERE slug = ?', [slug]);
          if (existing.length > 0) { console.log('  Exists:', name); continue; }
          await db.query(
            `INSERT INTO products (name, slug, description, price, category_id, seller_id, brand, state, warranty, stock, featured, specs, status, ville, approved, product_type, active)
             VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, 1, ?, 'disponible', 'Casablanca', 1, 'store', 1)`,
            [name, slug, description, price, category_id, brand, state, warranty, stock, JSON.stringify(specs)]
          );
          count++;
          console.log('  Created:', name);
        } catch (err) {
          console.error('  Error:', name, '-', err.sqlMessage || err.message);
        }
      }
      console.log(`\nDone! ${count} products created in MySQL.`);
      await db.end();
      return;
    } catch (err) {
      console.log('MySQL unavailable, falling back to mock data.json:', err.message);
      usingMock = true;
    }
  }
  if (usingMock || !useMySQL) {
    const DB_PATH = path.join(__dirname, 'data.json');
    let data = { users: [], products: [], categories: [
      { id: 1, name: 'Smartphones', slug: 'smartphones' },
      { id: 2, name: 'Tablettes', slug: 'tablettes' },
      { id: 3, name: 'Ordinateurs', slug: 'ordinateurs' },
      { id: 4, name: 'Accessoires', slug: 'accessoires' },
      { id: 5, name: 'Gaming', slug: 'gaming' },
    ], orders: [], order_items: [], product_images: [], premium_payments: [], credit_purchases: [], credit_transactions: [], installments: [], nextId: { users: 1, products: 1, orders: 1, order_items: 1, product_images: 1, premium_payments: 1, credit_purchases: 1, credit_transactions: 1, installments: 1 } };
    if (fs.existsSync(DB_PATH)) {
      data = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    }
    const adminUser = data.users.find(u => u.role === 'admin');
    if (!adminUser) {
      const hash = await bcrypt.hash('admin123', 10);
      data.users.push({ id: data.nextId.users++, full_name: 'Admin', email: 'admin@og.ma', password: hash, phone: '0600000000', role: 'admin', phone_verified: true, created_at: new Date().toISOString() });
      console.log('  Admin user created (admin@og.ma / admin123)');
    }
    let count = 0;
    for (const p of productsData) {
      if (data.products.find(x => x.slug === p.slug)) { console.log('  Exists:', p.name); continue; }
      const { name, brand, category_id, state, warranty, stock, slug, price, description } = p;
      const id = data.nextId.products++;
      data.products.push({
        id, name, slug, description, price, category_id, seller_id: 1, brand, state, warranty, stock,
        featured: true, specs: JSON.stringify(specs), status: 'disponible', ville: 'Casablanca',
        approved: 1, product_type: 'store', active: true, image: null, gallery: null, old_price: null,
        created_at: new Date().toISOString(),
      });
      count++;
      console.log('  Created:', name);
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    console.log(`\nDone! ${count} products created in data.json`);
  }
}

seed().catch(console.error);
