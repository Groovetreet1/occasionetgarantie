const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const zlib = require('zlib');

const BASE = 'https://www.electroplanet.ma';
const CAT_URL = '/smartphone-tablette-gps/smartphone/telephone-android';
const OUT_DIR = path.join(__dirname, '..', 'ep_scraped');
const IMG_DIR = path.join(OUT_DIR, 'images');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

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

function extractProducts(html) {
  const products = [];
  const blocks = html.split('<div class="product-item-info"');
  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];
    const skuM = block.match(/data-product-sku="([^"]+)"/);
    if (!skuM) continue;

    const priceM = block.match(/data-price-amount="([^"]+)"/);
    const oldM = block.match(/old-price[\s\S]*?data-price-amount="([^"]+)"/);
    const altM = block.match(/alt="([^"]+)"/);
    const imgM = block.match(/<img[^>]*src="([^"]+)"/);
    const urlM = block.match(/<a[^>]*class="product-item-link"[^>]*href="([^"]+)"/);
    const nm = block.match(/class="product-item-link"[^>]*>[\s\S]*?<span class="brand">([^<]*)<\/span>\s*<span class="ref">([^<]*)<\/span>/);

    const brand = nm ? nm[1].trim() : '';
    const name = altM ? decodeEntities(altM[1]) : (brand && nm ? `${brand} ${nm[2].trim()}` : skuM[1]);

    products.push({
      sku: skuM[1],
      url: urlM ? (urlM[1].startsWith('http') ? urlM[1] : BASE + urlM[1]) : '',
      name,
      brand,
      price: priceM ? parseFloat(priceM[1]) : 0,
      oldPrice: oldM ? parseFloat(oldM[1]) : null,
      image: imgM ? imgM[1].split('?')[0] : '',
    });
  }
  return products;
}

(async () => {
  let allProducts = [];
  let page = 1;

  while (true) {
    const url = page === 1 ? BASE + CAT_URL : BASE + CAT_URL + `?p=${page}`;
    console.log(`Page ${page}...`);
    const html = await fetch(url);
    const products = extractProducts(html);
    if (products.length === 0) { console.log('  No more products'); break; }
    console.log(`  ${products.length} products`);
    allProducts = allProducts.concat(products);
    if (!html.includes(`?p=${page + 1}`)) { console.log('  No next page'); break; }
    page++;
  }

  const unique = new Map();
  for (const p of allProducts) unique.set(p.sku, p);
  const products = [...unique.values()];
  console.log(`\nTotal: ${products.length} unique products`);

  products.slice(0, 5).forEach((p) => console.log(`  ${p.sku}: ${p.name} - ${p.price} DH (old: ${p.oldPrice || '-'})`));

  const jsonPath = path.join(OUT_DIR, 'products.json');
  fs.writeFileSync(jsonPath, JSON.stringify(products, null, 2));
  console.log(`\nSaved to ${jsonPath}`);

  // Download images
  let ok = 0, fail = 0;
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    if (!p.image) { p.localImage = ''; continue; }
    const ext = path.extname(p.image.split('/').pop()) || '.jpg';
    const imgName = `${p.sku}${ext}`;
    const imgPath = path.join(IMG_DIR, imgName);
    p.localImage = imgName;
    if (fs.existsSync(imgPath)) { ok++; continue; }
    try {
      await new Promise((resolve) => {
        const mod = p.image.startsWith('https') ? https : http;
        const file = fs.createWriteStream(imgPath);
        const req = mod.get(p.image, { headers: { 'User-Agent': UA } }, (res) => {
          if (res.statusCode === 200) { res.pipe(file); file.on('finish', () => { file.close(); resolve(); }); }
          else { file.close(); fs.unlinkSync(imgPath); resolve(); }
        });
        req.on('error', () => { file.close(); if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath); resolve(); });
        req.setTimeout(15000, () => { req.destroy(); file.close(); if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath); resolve(); });
      });
      ok++;
    } catch { fail++; }
    process.stdout.write(`\r  Images: ${ok} OK, ${fail} failed / ${products.length}`);
  }
  console.log(`\nDone!`);

  // Re-save with localImage field
  fs.writeFileSync(jsonPath, JSON.stringify(products, null, 2));
})();
