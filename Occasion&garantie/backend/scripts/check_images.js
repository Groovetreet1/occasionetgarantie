require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mysql = require('mysql2/promise');

(async () => {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT),
    user: process.env.DB_USER, password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME, ssl: process.env.DB_SSL === 'true' ? {} : undefined,
  });
  const [total] = await c.query('SELECT COUNT(*) as t FROM products');
  const [nullImg] = await c.query("SELECT COUNT(*) as t FROM products WHERE image IS NULL OR image = ''");
  const [withImg] = await c.query("SELECT COUNT(*) as t FROM products WHERE image IS NOT NULL AND image != ''");
  console.log(`Total: ${total[0].t}, With images: ${withImg[0].t}, Without: ${nullImg[0].t}`);
  if (nullImg[0].t > 0) {
    const [missing] = await c.query("SELECT id, name, image FROM products WHERE image IS NULL OR image = ''");
    for (const p of missing) console.log(`  ${p.id}: ${p.name.substring(0, 60)}`);
  }
  await c.end();
})();
