const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const zlib = require('zlib');

const BASE = 'https://www.electroplanet.ma';
const OUT_DIR = path.join(__dirname, '..', 'ep_scraped');
const IMG_DIR = path.join(OUT_DIR, 'images');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

const CATEGORIES = [
  { name: 'iPhone', path: '/smartphone-tablette-gps/smartphone/iphone', cat: 'Smartphones' },
  { name: 'iPad', path: '/smartphone-tablette-gps/tablettes/ipad', cat: 'Tablettes' },
  { name: 'Tablette Android', path: '/smartphone-tablette-gps/tablettes/tablettes-android', cat: 'Tablettes' },
  { name: 'Manettes', path: '/jeux-consoles/accessoires-gaming/manettes', cat: 'Accessoires Gaming' },
  { name: 'Casques Gamers', path: '/jeux-consoles/accessoires-gaming/casques-gamers', cat: 'Accessoires Gaming' },
  { name: 'Claviers Gaming', path: '/jeux-consoles/accessoires-gaming/claviers', cat: 'Accessoires Gaming' },
  { name: 'Souris Gaming', path: '/jeux-consoles/accessoires-gaming/souris-gamers', cat: 'Accessoires Gaming' },
];

if (!fs.existsSync(IMG_DIR)) fs.mkdirSync(IMG_DIR, { recursive: true });

function fetch(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, {
      headers: { 'User-Agent': UA, 'Accept-Encoding': 'gzip, deflate', 'Accept': 'text/html,application/xhtml+xml', 'Accept-Language': 'fr-FR,fr' }
    }, (res) => {
      const chunks = [];
      const encoding = res.headers['content-encoding'];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        if (encoding === 'gzip') zlib.gunzip(buf, (err, dec) => resolve(err ? buf.toString('utf8') : dec.toString('utf8')));
        else if (encoding === 'deflate') zlib.inflate(buf, (err, dec) => resolve(err ? buf.toString('utf8') : dec.toString('utf8')));
        else resolve(buf.toString('utf8'));
      });
    });
    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

function decodeEntities(str) {
  return str.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(d))
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'").replace(/\s+/g, ' ').trim();
}

function extractProducts(html, category) {
  const products = [];
  const blocks = html.split('<div class="product-item-info"');
  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];
    const skuM = block.match(/data-product-sku="([^"]+)"/);
    if (!skuM) continue;
    const priceM = block.match(/data-price-amount="([^"]+)"/);
    const altM = block.match(/alt="([^"]+)"/);
    const imgM = block.match(/<img[^>]*src="([^"]+)"/);
    const urlM = block.match(/<a[^>]*class="product-item-link"[^>]*href="([^"]+)"/);
    const nm = block.match(/class="product-item-link"[^>]*>[\s\S]*?<span class="brand">([^<]*)<\/span>\s*<span class="ref">([^<]*)<\/span>/);
    const brand = nm ? nm[1].trim() : '';
    const name = altM ? decodeEntities(altM[1]) : (brand && nm ? `${brand} ${nm[2].trim()}` : skuM[1]);
    products.push({
      sku: skuM[1], url: urlM ? (urlM[1].startsWith('http') ? urlM[1] : BASE + urlM[1]) : '',
      name, brand, category: category.cat,
      price: priceM ? parseFloat(priceM[1]) : 0,
      image: imgM ? imgM[1].split('?')[0] : '',
    });
  }
  return products;
}

function downloadImage(url, dest) {
  return new Promise((resolve) => {
    if (!url) return resolve(false);
    https.get(url, {
      headers: { 'User-Agent': UA, 'Accept': 'image/webp,image/jpeg,image/png,*/*' }
    }, (res) => {
      if (res.statusCode !== 200) { res.resume(); return resolve(false); }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(true); });
    }).on('error', () => resolve(false));
  });
}

(async () => {
  let allProducts = [];
  for (const cat of CATEGORIES) {
    const url = BASE + cat.path;
    console.log(`Scraping ${cat.name}...`);
    const html = await fetch(url);
    const products = extractProducts(html, cat);
    console.log(`  Found ${products.length} products`);
    
    for (const p of products) {
      const imgExt = path.extname(p.image.split('?')[0]) || '.jpg';
      const imgPath = path.join(IMG_DIR, `${p.sku}${imgExt}`);
      console.log(`  [${p.sku}] ${p.name.substring(0, 50)}...`);
      const ok = await downloadImage(p.image, imgPath);
      p.localImage = ok ? `${p.sku}${imgExt}` : '';
      console.log(`    ${ok ? '✓' : '✗'}`);
    }
    allProducts = allProducts.concat(products);
  }

  const outPath = path.join(OUT_DIR, 'ep_extra.json');
  fs.writeFileSync(outPath, JSON.stringify(allProducts, null, 2), 'utf8');
  console.log(`\nDone! ${allProducts.length} products saved to ep_extra.json`);
})();
