const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const zlib = require('zlib');

const EP_DIR = path.join(__dirname, '..', 'ep_scraped');
const PRODUCTS_JSON = path.join(EP_DIR, 'products.json');
const IMG_DIR = path.join(EP_DIR, 'images');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

if (!fs.existsSync(IMG_DIR)) fs.mkdirSync(IMG_DIR, { recursive: true });

function fetch(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, {
      headers: { 'User-Agent': UA, 'Accept-Encoding': 'gzip', 'Accept': 'text/html,application/xhtml+xml', 'Accept-Language': 'fr-FR,fr' }
    }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        const enc = res.headers['content-encoding'];
        if (enc === 'gzip') zlib.gunzip(buf, (err, d) => resolve(err ? buf.toString('utf8') : d.toString('utf8')));
        else if (enc === 'deflate') zlib.inflate(buf, (err, d) => resolve(err ? buf.toString('utf8') : d.toString('utf8')));
        else resolve(buf.toString('utf8'));
      });
    });
    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

function extractMainImage(html) {
  // Try multiple patterns used by Magento
  const patterns = [
    /<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i,
    /class="product media"[^>]*>[\s\S]*?<img[^>]*src="([^"]+)"/i,
    /class="gallery-placeholder"[^>]*>[\s\S]*?<img[^>]*src="([^"]+)"/i,
    /class="fotorama-item"[^>]*>[\s\S]*?<img[^>]*src="([^"]+)"/i,
    /class="product-image-photo"[^>]*src="([^"]+)"/i,
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m) return m[1].split('?')[0];
  }
  return null;
}

(async () => {
  const products = JSON.parse(fs.readFileSync(PRODUCTS_JSON, 'utf8'));
  const missing = products.filter((p) => !p.localImage || !fs.existsSync(path.join(IMG_DIR, p.localImage)));
  console.log(`Products needing images: ${missing.length}`);

  let ok = 0, fail = 0;
  for (let i = 0; i < missing.length; i++) {
    const p = missing[i];
    if (!p.url) { fail++; continue; }

    try {
      const html = await fetch(p.url);
      const imgUrl = extractMainImage(html);

      if (imgUrl && imgUrl.startsWith('http')) {
        p.image = imgUrl;
        const ext = path.extname(imgUrl.split('/').pop()) || '.jpg';
        const imgName = `${p.sku}${ext}`;
        const imgPath = path.join(IMG_DIR, imgName);
        p.localImage = imgName;

        if (!fs.existsSync(imgPath)) {
          await new Promise((resolve) => {
            const mod = imgUrl.startsWith('https') ? https : http;
            const file = fs.createWriteStream(imgPath);
            const req = mod.get(imgUrl, { headers: { 'User-Agent': UA } }, (res) => {
              if (res.statusCode === 200) { res.pipe(file); file.on('finish', () => { file.close(); resolve(); }); }
              else { file.close(); fs.unlinkSync(imgPath); resolve(); }
            });
            req.on('error', () => { file.close(); if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath); resolve(); });
            req.setTimeout(15000, () => { req.destroy(); file.close(); if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath); resolve(); });
          });
        }
        ok++;
        process.stdout.write(`\r  ${ok} OK, ${fail} failed - ${p.sku}`);

        // Re-save after each success
        for (const orig of products) {
          if (orig.sku === p.sku) {
            orig.image = p.image;
            orig.localImage = p.localImage;
            break;
          }
        }
        fs.writeFileSync(PRODUCTS_JSON, JSON.stringify(products, null, 2));
      } else {
        fail++;
        process.stdout.write(`\r  ${ok} OK, ${fail} failed - ${p.sku} (no image)`);
      }
    } catch (e) {
      fail++;
      process.stdout.write(`\r  ${ok} OK, ${fail} failed - ${p.sku} (${e.message.substring(0, 30)})`);
    }
  }

  console.log(`\n\nDone! ${ok} images downloaded, ${fail} failed.`);
  fs.writeFileSync(PRODUCTS_JSON, JSON.stringify(products, null, 2));
})();
