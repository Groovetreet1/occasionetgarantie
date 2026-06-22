const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const EP_DIR = path.join(__dirname, '..', 'ep_scraped');
const PRODUCTS_JSON = path.join(EP_DIR, 'products.json');
const IMG_DIR = path.join(EP_DIR, 'images');
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const CATEGORY_ID = 1; // Smartphones

function slugify(text) {
  return text.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 190);
}

function makeSlugUnique(base, usedSlugs) {
  let slug = base;
  let i = 1;
  while (usedSlugs.has(slug)) { slug = `${base}-${i}`; i++; }
  usedSlugs.add(slug);
  return slug;
}

function detectState(name) {
  const n = name.toLowerCase();
  if (n.includes('reconditionné') || n.includes('occasion')) return 'tres_bon';
  return 'neuf';
}

function generateDescription(product) {
  const name = product.name;
  const brand = product.brand || 'Marque';
  return `${name} - ${brand}. Smartphone disponible chez Occasion & Garantie. Qualité garantie avec 6 mois de garantie.`;
}

(async () => {
  if (!fs.existsSync(PRODUCTS_JSON)) { console.error('Run scrape_ep.js first'); process.exit(1); }
  const products = JSON.parse(fs.readFileSync(PRODUCTS_JSON, 'utf8'));
  console.log(`Importing ${products.length} products from Electroplanet...`);

  // MySQL connection
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'occasion_garantie',
    waitForConnections: true, connectionLimit: 5, queueLimit: 0,
    ssl: process.env.DB_SSL === 'true' ? {} : undefined,
  });

  // Get existing slugs to avoid conflicts
  const [existing] = await pool.query('SELECT slug FROM products');
  const usedSlugs = new Set(existing.map((r) => r.slug));

  let imported = 0, skipped = 0, copied = 0;
  for (const p of products) {
    // Check if product with same sku/name already exists
    const [dup] = await pool.query('SELECT id FROM products WHERE slug = ? OR name = ?',
      [slugify(p.name), p.name]);
    if (dup.length > 0) { skipped++; continue; }

    // Build slug
    const baseSlug = slugify(p.name) || `ep-${p.sku}`;
    const slug = makeSlugUnique(baseSlug, usedSlugs);

    // Copy image to uploads
    let imageFile = null;
    if (p.localImage && fs.existsSync(path.join(IMG_DIR, p.localImage))) {
      const ext = path.extname(p.localImage) || '.jpg';
      const newName = `${slug}${ext}`;
      const dest = path.join(UPLOADS_DIR, newName);
      if (!fs.existsSync(dest)) {
        fs.copyFileSync(path.join(IMG_DIR, p.localImage), dest);
        copied++;
      }
      imageFile = newName;
    }

    const price = p.price;
    const oldPrice = p.oldPrice && p.oldPrice > price ? p.oldPrice : Math.round(price * 1.25);

    await pool.query(
      `INSERT INTO products (name, slug, description, price, old_price, category_id, image, brand, state, warranty, stock, featured, active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [p.name, slug, generateDescription(p), price, oldPrice, CATEGORY_ID, imageFile, p.brand || '', detectState(p.name), '6 mois', 1, 0, 1]
    );
    imported++;
    process.stdout.write(`\r  Imported: ${imported}, skipped: ${skipped}, images: ${copied}`);
  }

  console.log(`\n\nDone! ${imported} imported, ${skipped} skipped, ${copied} images copied.`);
  await pool.end();
})();
