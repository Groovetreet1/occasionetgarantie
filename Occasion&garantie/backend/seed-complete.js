const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const mysqlPath = path.join(__dirname, '..', '.usemysql');
const useMySQL = fs.existsSync(mysqlPath);

const GSM = 'https://fdn2.gsmarena.com/vv/bigpic/';
const productsData = [
  { name: 'Samsung Galaxy A07 2026', brand: 'Samsung', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 10, slug: 'samsung-galaxy-a07-2026', price: 1, description: 'Le Samsung Galaxy A07 2026 est un smartphone d\'entrée de gamme avec écran HD+ 6.5 pouces, batterie 5000mAh et double appareil photo 50MP+2MP.', image: GSM + 'samsung-galaxy-a07-5g.jpg' },
  { name: 'Samsung Galaxy A17 2026', brand: 'Samsung', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 10, slug: 'samsung-galaxy-a17-2026', price: 1, description: 'Le Samsung Galaxy A17 2026 offre un écran Super AMOLED 6.6 pouces 90Hz, processeur octa-core et triple appareil photo 50MP+5MP+2MP.', image: GSM + 'samsung-galaxy-a17-5g.jpg' },
  { name: 'Samsung Galaxy S26', brand: 'Samsung', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 5, slug: 'samsung-galaxy-s26', price: 1, description: 'Le Samsung Galaxy S26 2026 est un flagship avec écran Dynamic AMOLED 6.7 pouces 120Hz, processeur Exynos 2600 et quadruple appareil photo 200MP+50MP+12MP+10MP.', image: GSM + 'samsung-galaxy-s26.jpg' },
  { name: 'Samsung Galaxy S26 Ultra', brand: 'Samsung', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 3, slug: 'samsung-galaxy-s26-ultra', price: 1, description: 'Le Samsung Galaxy S26 Ultra 2026 est le smartphone le plus avancé avec écran 6.9 pouces 120Hz LTPO AMOLED, processeur Exynos 2600, stylet S-PEN intégré et appareil photo 300MP avec zoom spatial 100x.', image: GSM + 'samsung-galaxy-s26-ultra-new.jpg' },
  { name: 'Samsung Galaxy A26 2026', brand: 'Samsung', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 10, slug: 'samsung-galaxy-a26-2026', price: 1, description: 'Smartphone Samsung Galaxy A26 2026 avec écran Super AMOLED 6.7 pouces 120Hz, batterie 5000mAh et charge rapide 25W.', image: GSM + 'samsung-galaxy-a26.jpg' },
  { name: 'Samsung Galaxy A56 2026', brand: 'Samsung', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 8, slug: 'samsung-galaxy-a56-2026', price: 1, description: 'Samsung Galaxy A56 2026 avec écran Super AMOLED 120Hz, processeur Exynos 1580 et appareil photo 50MP OIS + 12MP + 5MP.', image: GSM + 'samsung-galaxy-a56-.jpg' },
  { name: 'Samsung Galaxy Tab S10 FE 2026', brand: 'Samsung', category_id: 2, state: 'neuf', warranty: '12 mois', stock: 5, slug: 'samsung-galaxy-tab-s10-fe-2026', price: 1, description: 'Tablette Samsung Galaxy Tab S10 FE 2026 avec écran TFT 10.9 pouces, processeur Exynos 1580 et batterie 8000mAh.', image: GSM + 'samsung-galaxy-tab-s10-fe.jpg' },
  { name: 'Xiaomi Redmi Note 17T', brand: 'Xiaomi', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 10, slug: 'xiaomi-redmi-note-17t', price: 1, description: 'Xiaomi Redmi Note 17T 2026 avec écran AMOLED 120Hz 6.7 pouces 1.5K, batterie 5500mAh et charge rapide 67W.', image: GSM + 'xiaomi-redmi-note17-cn.jpg' },
  { name: 'Xiaomi Redmi Note 17T Pro', brand: 'Xiaomi', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 8, slug: 'xiaomi-redmi-note-17t-pro', price: 1, description: 'Xiaomi Redmi Note 17T Pro 2026 avec processeur Dimensity 8400 Ultra, écran AMOLED 1.5K 120Hz et appareil photo 200MP OIS.', image: GSM + 'xiaomi-redmi-note17-cn.jpg' },
  { name: 'Xiaomi Redmi A7 Pro', brand: 'Xiaomi', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 15, slug: 'xiaomi-redmi-a7-pro', price: 1, description: 'Xiaomi Redmi A7 Pro 2026 avec écran HD+ 6.7 pouces 90Hz, batterie 5200mAh et processeur octa-core Helio G81.', image: GSM + 'xiaomi-redmi-a7-pro.jpg' },
  { name: 'Xiaomi 15T 2026', brand: 'Xiaomi', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 6, slug: 'xiaomi-15t-2026', price: 1, description: 'Xiaomi 15T 2026 avec écran AMOLED 144Hz 1.5K, processeur Snapdragon 8 Gen 4 et triple appareil photo Leica 50MP+50MP+12MP.', image: GSM + 'xiaomi-15t.jpg' },
  { name: 'Xiaomi 15T Pro 2026', brand: 'Xiaomi', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 4, slug: 'xiaomi-15t-pro-2026', price: 1, description: 'Xiaomi 15T Pro 2026 flagship avec processeur Snapdragon 8 Gen 4, écran AMOLED 2K 144Hz et batterie 6000mAh avec charge rapide 120W.', image: GSM + 'xiaomi-15t-pro.jpg' },
  { name: 'Xiaomi Pad 7S 2026', brand: 'Xiaomi', category_id: 2, state: 'neuf', warranty: '12 mois', stock: 5, slug: 'xiaomi-pad-7s-2026', price: 1, description: 'Tablette Xiaomi Pad 7S 2026 avec écran LCD 11 pouces 120Hz, processeur Snapdragon 8 Gen 4 et batterie 8850mAh.', image: GSM + 'xiaomi-pad-7s-pro-125.jpg' },
  { name: 'OPPO Find N6 2026', brand: 'OPPO', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 3, slug: 'oppo-find-n6-2026', price: 1, description: 'OPPO Find N6 2026 smartphone pliable avec écran pliable 7.8 pouces AMOLED 120Hz, processeur Snapdragon 8 Gen 4 et triple appareil photo Hasselblad.', image: GSM + 'oppo-find-n6.jpg' },
  { name: 'OPPO Find X9 Pro 2026', brand: 'OPPO', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 4, slug: 'oppo-find-x9-pro-2026', price: 1, description: 'OPPO Find X9 Pro 2026 flagship avec écran AMOLED 6.8 pouces 120Hz LTPO, processeur Snapdragon 8 Gen 4 et quadruple appareil photo Hasselblad 50MP+50MP+50MP+50MP.', image: GSM + 'oppo-find-x9-pro.jpg' },
  { name: 'OPPO Reno 15 2026', brand: 'OPPO', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 8, slug: 'oppo-reno-15-2026', price: 1, description: 'OPPO Reno 15 2026 avec écran AMOLED 120Hz, charge rapide 80W et appareil photo 50MP avec portrait expert IA.', image: GSM + 'oppo-reno15-global.jpg' },
  { name: 'OPPO Reno 15 Pro 2026', brand: 'OPPO', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 6, slug: 'oppo-reno-15-pro-2026', price: 1, description: 'OPPO Reno 15 Pro 2026 avec écran AMOLED 120Hz, processeur Dimensity 8400 et triple appareil photo 50MP+8MP+2MP.', image: GSM + 'oppo-reno15-pro.jpg' },
  { name: 'OPPO A80 2026', brand: 'OPPO', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 15, slug: 'oppo-a80-2026', price: 1, description: 'OPPO A80 2026 smartphone d\'entrée de gamme avec écran HD+ 6.7 pouces 90Hz et batterie 5100mAh.', image: GSM + 'oppo-a80.jpg' },
  { name: 'Motorola Edge 60 Ultra 2026', brand: 'Motorola', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 4, slug: 'motorola-edge-60-ultra-2026', price: 1, description: 'Motorola Edge 60 Ultra 2026 flagship avec écran pOLED 144Hz, processeur Snapdragon 8 Gen 4 et appareil photo 200MP OIS.', image: GSM + 'motorola-edge-60-fusion.jpg' },
  { name: 'Motorola Edge 60 2026', brand: 'Motorola', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 6, slug: 'motorola-edge-60-2026', price: 1, description: 'Motorola Edge 60 2026 avec écran pOLED 144Hz, batterie 5000mAh et processeur MediaTek Dimensity 8300.', image: GSM + 'motorola-edge-60.jpg' },
  { name: 'Motorola Moto G85 2026', brand: 'Motorola', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 12, slug: 'motorola-moto-g85-2026', price: 1, description: 'Motorola Moto G85 2026 avec écran pOLED 120Hz, batterie 5000mAh et appareil photo 50MP OIS.', image: GSM + 'motorola-moto-g85.jpg' },
  { name: 'Motorola Moto G35 2026', brand: 'Motorola', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 15, slug: 'motorola-moto-g35-2026', price: 1, description: 'Motorola Moto G35 2026 avec écran LCD 90Hz HD+, batterie 5000mAh et appareil photo 50MP.', image: GSM + 'motorola-moto-g35-5g.jpg' },
  { name: 'Motorola Razr 60 2026', brand: 'Motorola', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 3, slug: 'motorola-razr-60-2026', price: 1, description: 'Motorola Razr 60 2026 smartphone pliable avec écran pliable pOLED 6.9 pouces 120Hz et écran externe 3.6 pouces.', image: GSM + 'motorola-razr-60.jpg' },
  { name: 'Infinix Note 50 2026', brand: 'Infinix', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 12, slug: 'infinix-note-50-2026', price: 1, description: 'Infinix Note 50 2026 avec écran AMOLED 120Hz, batterie 6000mAh et charge rapide 33W.', image: GSM + 'infinix-note50.jpg' },
  { name: 'Infinix Note 50 Pro 2026', brand: 'Infinix', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 10, slug: 'infinix-note-50-pro-2026', price: 1, description: 'Infinix Note 50 Pro 2026 avec écran AMOLED 120Hz, processeur Helio G100 Ultimate et triple appareil photo 108MP+2MP+2MP.', image: GSM + 'infinix-note50-pro.jpg' },
  { name: 'Infinix Hot 50 2026', brand: 'Infinix', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 20, slug: 'infinix-hot-50-2026', price: 1, description: 'Infinix Hot 50 2026 avec écran HD+ 90Hz et batterie 6000mAh.', image: GSM + 'infinix-hot-50-4g.jpg' },
  { name: 'Infinix Hot 50 Pro 2026', brand: 'Infinix', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 15, slug: 'infinix-hot-50-pro-2026', price: 1, description: 'Infinix Hot 50 Pro 2026 avec écran AMOLED 120Hz et appareil photo 108MP.', image: GSM + 'infinix-hot-50-4g.jpg' },
  { name: 'Infinix Zero 50 2026', brand: 'Infinix', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 8, slug: 'infinix-zero-50-2026', price: 1, description: 'Infinix Zero 50 2026 flagship avec écran AMOLED 144Hz, processeur MediaTek Dimensity 8300 et appareil photo 108MP OIS.', image: GSM + 'infinix-hot-50-4g.jpg' },
  // ---- Ordinateurs (PC portables & de bureau) ----
  { name: 'Apple MacBook Air M4 2026', brand: 'Apple', category_id: 3, state: 'neuf', warranty: '12 mois', stock: 4, slug: 'apple-macbook-air-m4-2026', price: 1, description: 'Apple MacBook Air M4 2026 avec puce Apple M4, écran Liquid Retina 13.6 pouces, 16 Go RAM unifiée et SSD 256 Go.' },
  { name: 'HP Pavilion 15 2026', brand: 'HP', category_id: 3, state: 'neuf', warranty: '12 mois', stock: 8, slug: 'hp-pavilion-15-2026', price: 1, description: 'HP Pavilion 15 2026 avec processeur Intel Core i5, écran 15.6 pouces Full HD, 16 Go RAM et SSD 512 Go.' },
  { name: 'Dell Inspiron 16 2026', brand: 'Dell', category_id: 3, state: 'neuf', warranty: '12 mois', stock: 6, slug: 'dell-inspiron-16-2026', price: 1, description: 'Dell Inspiron 16 2026 avec processeur Intel Core i7, écran 16 pouces 2K, 16 Go RAM et SSD 1 To.' },
  { name: 'Lenovo IdeaPad 5 2026', brand: 'Lenovo', category_id: 3, state: 'neuf', warranty: '12 mois', stock: 7, slug: 'lenovo-ideapad-5-2026', price: 1, description: 'Lenovo IdeaPad 5 2026 avec processeur AMD Ryzen 7, écran 15.6 pouces Full HD IPS, 16 Go RAM et SSD 512 Go.' },
  { name: 'ASUS Vivobook 16 2026', brand: 'ASUS', category_id: 3, state: 'neuf', warranty: '12 mois', stock: 5, slug: 'asus-vivobook-16-2026', price: 1, description: 'ASUS Vivobook 16 2026 avec processeur Intel Core i5, écran 16 pouces OLED, 16 Go RAM et SSD 512 Go.' },
  { name: 'Acer Aspire 5 2026', brand: 'Acer', category_id: 3, state: 'neuf', warranty: '12 mois', stock: 10, slug: 'acer-aspire-5-2026', price: 1, description: 'Acer Aspire 5 2026 avec processeur Intel Core i5, écran 15.6 pouces Full HD, 8 Go RAM et SSD 256 Go.' },
  { name: 'HP Victus 16 2026', brand: 'HP', category_id: 3, state: 'neuf', warranty: '12 mois', stock: 3, slug: 'hp-victus-16-2026', price: 1, description: 'HP Victus 16 2026 PC gaming avec processeur Intel Core i7, GPU NVIDIA GeForce RTX 4060, 16 Go RAM et SSD 1 To.' },
  { name: 'Lenovo Legion 5 2026', brand: 'Lenovo', category_id: 3, state: 'neuf', warranty: '12 mois', stock: 3, slug: 'lenovo-legion-5-2026', price: 1, description: 'Lenovo Legion 5 2026 PC gaming avec processeur AMD Ryzen 7, GPU NVIDIA RTX 4070, écran 16 pouces 165Hz, 32 Go RAM et SSD 1 To.' },
  // ---- Tablettes supplémentaires ----
  { name: 'Apple iPad 11 (A16) 2025', brand: 'Apple', category_id: 2, state: 'neuf', warranty: '12 mois', stock: 10, slug: 'apple-ipad-11-a16-2025', price: 1, description: 'Apple iPad 11e génération avec puce A16 Bionic, écran Liquid Retina 11 pouces, 128 Go stockage.', image: GSM + 'apple-ipad-11-inch-2025.jpg' },
  { name: 'Apple iPad Air 11 (M3) 2025', brand: 'Apple', category_id: 2, state: 'neuf', warranty: '12 mois', stock: 6, slug: 'apple-ipad-air-11-m3-2025', price: 1, description: 'Apple iPad Air 11 pouces avec puce M3, écran Liquid Retina, 128 Go stockage.', image: GSM + 'apple-ipad-air-11-2025.jpg' },
  { name: 'Apple iPad Air 13 (M4) 2026', brand: 'Apple', category_id: 2, state: 'neuf', warranty: '12 mois', stock: 4, slug: 'apple-ipad-air-13-m4-2026', price: 1, description: 'Apple iPad Air 13 pouces avec puce M4, écran Liquid Retina, 12 Go RAM, 128 Go stockage.', image: GSM + 'apple-ipad-air-13-2025.jpg' },
  { name: 'Samsung Galaxy Tab S10+ 2026', brand: 'Samsung', category_id: 2, state: 'neuf', warranty: '12 mois', stock: 4, slug: 'samsung-galaxy-tab-s10-plus-2026', price: 1, description: 'Samsung Galaxy Tab S10+ 2026 avec écran Dynamic AMOLED 12.4 pouces 120Hz, processeur Dimensity 9300+, batterie 10090mAh.', image: GSM + 'samsung-galaxy-tab-s10-plus.jpg' },
  { name: 'Lenovo Tab P12 2026', brand: 'Lenovo', category_id: 2, state: 'neuf', warranty: '12 mois', stock: 5, slug: 'lenovo-tab-p12-2026', price: 1, description: 'Lenovo Tab P12 2026 avec écran 12.7 pouces 3K, processeur MediaTek Dimensity 7050, 8 Go RAM, 256 Go stockage.', image: GSM + 'lenovo-tab-p12.jpg' },
  { name: 'Huawei MatePad 11.5 S 2026', brand: 'Huawei', category_id: 2, state: 'neuf', warranty: '12 mois', stock: 6, slug: 'huawei-matepad-115-s-2026', price: 1, description: 'Huawei MatePad 11.5 S avec écran PaperMatte 11.5 pouces 144Hz, processeur Kirin 9000WL, batterie 8800mAh.', image: GSM + 'huawei-matepad-115-s.jpg' },
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
          const { name, brand, category_id, state, warranty, stock, slug, price, description, image } = p;
          try {
            const [existing] = await db.query('SELECT id, image FROM products WHERE slug = ?', [slug]);
            if (existing.length > 0) {
              if (!existing[0].image && image) {
                await db.query('UPDATE products SET image = ? WHERE id = ?', [image, existing[0].id]);
                console.log('  Image added:', name);
              } else { console.log('  Exists:', name); }
              continue;
            }
          await db.query(
            `INSERT INTO products (name, slug, description, price, category_id, seller_id, brand, state, warranty, stock, featured, specs, status, ville, approved, product_type, active, image)
              VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, 1, ?, 'disponible', 'Casablanca', 1, 'store', 1, ?)`,
            [name, slug, description, price, category_id, brand, state, warranty, stock, JSON.stringify(specs), image || null]
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
      const { name, brand, category_id, state, warranty, stock, slug, price, description, image } = p;
      const existingMock = data.products.find(x => x.slug === slug);
      if (existingMock) {
        if (!existingMock.image && image) {
          existingMock.image = image;
          console.log('  Image added:', name);
        } else { console.log('  Exists:', name); }
        continue;
      }
      const id = data.nextId.products++;
      data.products.push({
        id, name, slug, description, price, category_id, seller_id: 1, brand, state, warranty, stock,
        featured: true, specs: JSON.stringify(specs), status: 'disponible', ville: 'Casablanca',
        approved: 1, product_type: 'store', active: true, image: image || null, gallery: null, old_price: null,
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
