const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const mysqlPath = path.join(__dirname, '..', '.usemysql');

async function seed() {
  const useMySQL = fs.existsSync(mysqlPath);

  let db;
  if (useMySQL) {
    const mysql = require('mysql2/promise');
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'occasion_garantie',
      waitForConnections: true,
    };
    if (process.env.DB_SSL === 'true') dbConfig.ssl = { rejectUnauthorized: false };
    db = await mysql.createPool(dbConfig);
  } else {
    db = { query: async (sql, params) => { console.log('Mock mode - would insert:', sql, params); return [[], {}]; } };
  }

  const products = [
    // Samsung
    { name: 'Samsung Galaxy A07 2026', brand: 'Samsung', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 10, slug: 'samsung-galaxy-a07-2026', description: 'Le Samsung Galaxy A07 2026 est un smartphone d\'entrée de gamme avec écran HD+ 6.5 pouces, batterie 5000mAh et double appareil photo.' },
    { name: 'Samsung Galaxy A17 2026', brand: 'Samsung', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 10, slug: 'samsung-galaxy-a17-2026', description: 'Le Samsung Galaxy A17 2026 offre un écran Super AMOLED 6.6 pouces, processeur octa-core et triple appareil photo 50MP.' },
    { name: 'Samsung Galaxy S26', brand: 'Samsung', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 5, slug: 'samsung-galaxy-s26', description: 'Le Samsung Galaxy S26 2026 est un flagship avec écran Dynamic AMOLED 120Hz, processeur Exynos 2600 et quadruple appareil photo 200MP.' },
    { name: 'Samsung Galaxy S26 Ultra', brand: 'Samsung', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 3, slug: 'samsung-galaxy-s26-ultra', description: 'Le Samsung Galaxy S26 Ultra 2026 est le smartphone le plus avancé avec écran 6.9 pouces 120Hz LTPO, processeur Exynos 2600, stylet S-Pen intégré et appareil photo 300MP avec zoom spatial.' },
    { name: 'Samsung Galaxy A26 2026', brand: 'Samsung', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 10, slug: 'samsung-galaxy-a26-2026', description: 'Smartphone Samsung Galaxy A26 2026 avec écran Super AMOLED 6.7 pouces, batterie 5000mAh et charge rapide 25W.' },
    { name: 'Samsung Galaxy A56 2026', brand: 'Samsung', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 8, slug: 'samsung-galaxy-a56-2026', description: 'Samsung Galaxy A56 2026 avec écran 120Hz, processeur Exynos 1580 et appareil photo 50MP OIS.' },
    { name: 'Samsung Galaxy Tab S10 FE 2026', brand: 'Samsung', category_id: 2, state: 'neuf', warranty: '12 mois', stock: 5, slug: 'samsung-galaxy-tab-s10-fe-2026', description: 'Tablette Samsung Galaxy Tab S10 FE 2026 avec écran TFT 10.9 pouces, processeur Exynos et batterie 8000mAh.' },

    // Xiaomi
    { name: 'Xiaomi Redmi Note 17T', brand: 'Xiaomi', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 10, slug: 'xiaomi-redmi-note-17t', description: 'Xiaomi Redmi Note 17T 2026 avec écran AMOLED 120Hz 6.7 pouces, batterie 5500mAh et charge rapide 67W.' },
    { name: 'Xiaomi Redmi Note 17T Pro', brand: 'Xiaomi', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 8, slug: 'xiaomi-redmi-note-17t-pro', description: 'Xiaomi Redmi Note 17T Pro 2026 avec processeur Dimensity 8400, écran AMOLED 1.5K 120Hz et appareil photo 200MP OIS.' },
    { name: 'Xiaomi Redmi A7 Pro', brand: 'Xiaomi', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 15, slug: 'xiaomi-redmi-a7-pro', description: 'Xiaomi Redmi A7 Pro 2026 avec écran HD+ 6.7 pouces, batterie 5200mAh et processeur octa-core.' },
    { name: 'Xiaomi 15T 2026', brand: 'Xiaomi', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 6, slug: 'xiaomi-15t-2026', description: 'Xiaomi 15T 2026 avec écran AMOLED 144Hz, processeur Snapdragon 8 Gen 4 et triple appareil photo Leica.' },
    { name: 'Xiaomi 15T Pro 2026', brand: 'Xiaomi', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 4, slug: 'xiaomi-15t-pro-2026', description: 'Xiaomi 15T Pro 2026 flagship avec processeur Snapdragon 8 Gen 4, écran AMOLED 2K 144Hz et batterie 6000mAh.' },
    { name: 'Xiaomi Pad 7S 2026', brand: 'Xiaomi', category_id: 2, state: 'neuf', warranty: '12 mois', stock: 5, slug: 'xiaomi-pad-7s-2026', description: 'Tablette Xiaomi Pad 7S 2026 avec écran LCD 11 pouces 120Hz et batterie 8850mAh.' },

    // OPPO
    { name: 'OPPO Find N6 2026', brand: 'OPPO', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 3, slug: 'oppo-find-n6-2026', description: 'OPPO Find N6 2026 pliable avec écran pliable 7.8 pouces AMOLED 120Hz et processeur Snapdragon 8 Gen 4.' },
    { name: 'OPPO Find X9 Pro 2026', brand: 'OPPO', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 4, slug: 'oppo-find-x9-pro-2026', description: 'OPPO Find X9 Pro 2026 flagship avec écran AMOLED 6.8 pouces 120Hz LTPO, processeur Snapdragon 8 Gen 4 et quadruple appareil photo Hasselblad.' },
    { name: 'OPPO Reno 15 2026', brand: 'OPPO', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 8, slug: 'oppo-reno-15-2026', description: 'OPPO Reno 15 2026 avec écran AMOLED 120Hz, charge rapide 80W et appareil photo 50MP avec portrait expert.' },
    { name: 'OPPO Reno 15 Pro 2026', brand: 'OPPO', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 6, slug: 'oppo-reno-15-pro-2026', description: 'OPPO Reno 15 Pro 2026 avec écran AMOLED 120Hz, processeur Dimensity 8400 et triple appareil photo 50MP + 8MP + 2MP.' },
    { name: 'OPPO A80 2026', brand: 'OPPO', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 15, slug: 'oppo-a80-2026', description: 'OPPO A80 2026 smartphone d\'entrée de gamme avec écran HD+ 6.7 pouces et batterie 5100mAh.' },

    // Motorola
    { name: 'Motorola Edge 60 Ultra 2026', brand: 'Motorola', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 4, slug: 'motorola-edge-60-ultra-2026', description: 'Motorola Edge 60 Ultra 2026 flagship avec écran pOLED 144Hz, processeur Snapdragon 8 Gen 4 et appareil photo 200MP.' },
    { name: 'Motorola Edge 60 2026', brand: 'Motorola', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 6, slug: 'motorola-edge-60-2026', description: 'Motorola Edge 60 2026 avec écran pOLED 144Hz, batterie 5000mAh et processeur MediaTek Dimensity 8300.' },
    { name: 'Motorola Moto G85 2026', brand: 'Motorola', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 12, slug: 'motorola-moto-g85-2026', description: 'Motorola Moto G85 2026 avec écran pOLED 120Hz, batterie 5000mAh et appareil photo 50MP OIS.' },
    { name: 'Motorola Moto G35 2026', brand: 'Motorola', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 15, slug: 'motorola-moto-g35-2026', description: 'Motorola Moto G35 2026 avec écran LCD 90Hz HD+, batterie 5000mAh et appareil photo 50MP.' },
    { name: 'Motorola Razr 60 2026', brand: 'Motorola', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 3, slug: 'motorola-razr-60-2026', description: 'Motorola Razr 60 2026 pliable avec écran pliable pOLED 6.9 pouces 120Hz et écran externe 3.6 pouces.' },

    // Infinix
    { name: 'Infinix Note 50 2026', brand: 'Infinix', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 12, slug: 'infinix-note-50-2026', description: 'Infinix Note 50 2026 avec écran AMOLED 120Hz, batterie 6000mAh et charge rapide 33W.' },
    { name: 'Infinix Note 50 Pro 2026', brand: 'Infinix', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 10, slug: 'infinix-note-50-pro-2026', description: 'Infinix Note 50 Pro 2026 avec écran AMOLED 120Hz, processeur Helio G100 et triple appareil photo 108MP.' },
    { name: 'Infinix Hot 50 2026', brand: 'Infinix', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 20, slug: 'infinix-hot-50-2026', description: 'Infinix Hot 50 2026 avec écran HD+ 90Hz et batterie 6000mAh.' },
    { name: 'Infinix Hot 50 Pro 2026', brand: 'Infinix', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 15, slug: 'infinix-hot-50-pro-2026', description: 'Infinix Hot 50 Pro 2026 avec écran AMOLED 120Hz et appareil photo 108MP.' },
    { name: 'Infinix Zero 50 2026', brand: 'Infinix', category_id: 1, state: 'neuf', warranty: '12 mois', stock: 8, slug: 'infinix-zero-50-2026', description: 'Infinix Zero 50 2026 flagship avec écran AMOLED 144Hz, processeur MediaTek Dimensity 8300 et appareil photo 108MP OIS.' },
  ];

  const specs = {
    neuf: { Ecran: '6.7 pouces', Processeur: 'Octa-core', RAM: '8 Go', Stockage: '256 Go', Batterie: '5000mAh', Couleur: 'Noir' }
  };

  const adminId = 1;
  const price = 1;

  for (const p of products) {
    const { name, brand, category_id, state, warranty, stock, slug, description } = p;
    try {
      if (useMySQL) {
        await db.query(
          `INSERT IGNORE INTO products (name, slug, description, price, old_price, category_id, seller_id, brand, state, warranty, stock, featured, image, gallery, specs, status, ville, approved, product_type, active)
           VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, 1, NULL, NULL, ?, 'disponible', 'Casablanca', 1, 'store', 1)`,
          [name, slug, description, price, category_id, adminId, brand, state, warranty, stock, JSON.stringify(specs)]
        );
        console.log('  Created:', name);
      } else {
        console.log('  Would create:', name);
      }
    } catch (err) {
      console.error('  Error creating', name, ':', err.sqlMessage || err.message);
    }
  }

  if (useMySQL) {
    console.log('\nAll products created successfully in MySQL!');
  } else {
    console.log('\nMock mode - no database connected.');
    console.log('To run with MySQL: make sure .usemysql has your connection details and DB is running');
  }

  if (db.end) await db.end();
}

seed().catch(console.error);
