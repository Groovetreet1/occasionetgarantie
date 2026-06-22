const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const EP_DIR = path.join(__dirname, '..', 'ep_scraped');
const PRODUCTS_JSON = path.join(EP_DIR, 'products.json');
const IMG_DIR = path.join(EP_DIR, 'images');
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

function slugify(text) {
  return text.toLowerCase()
    .replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
    .replace(/-+/g, '-').replace(/^-|-$/g, '').substring(0, 190);
}

(async () => {
  const products = JSON.parse(fs.readFileSync(PRODUCTS_JSON, 'utf8'));
  console.log(`Processing ${products.length} products...`);

  const pool = mysql.createPool({
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT),
    user: process.env.DB_USER, password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME, ssl: process.env.DB_SSL === 'true' ? {} : undefined,
    waitForConnections: true, connectionLimit: 5, queueLimit: 0,
  });

  // Get all products from DB that match EP products (by name pattern or recently added)
  const [dbProducts] = await pool.query(
    'SELECT id, name, slug, image FROM products ORDER BY id DESC LIMIT 100'
  );
  const dbByName = {};
  for (const p of dbProducts) dbByName[slugify(p.name)] = p;

  let updated = 0, copied = 0;

  for (const p of products) {
    if (!p.localImage) continue;
    const srcImg = path.join(IMG_DIR, p.localImage);
    if (!fs.existsSync(srcImg)) continue;

    const s = slugify(p.name);
    const match = dbByName[s];
    if (!match) continue;
    if (match.image) continue; // already has image

    // Copy to uploads
    const ext = path.extname(p.localImage) || '.jpg';
    const newName = `${s}${ext}`;
    const dest = path.join(UPLOADS_DIR, newName);
    if (!fs.existsSync(dest)) {
      fs.copyFileSync(srcImg, dest);
      copied++;
    }

    await pool.query('UPDATE products SET image = ? WHERE id = ?', [newName, match.id]);
    updated++;
    process.stdout.write(`\r  Updated: ${updated}, images copied: ${copied}`);
  }

  console.log(`\nDone! ${updated} products updated, ${copied} images copied.`);
  await pool.end();
})();
