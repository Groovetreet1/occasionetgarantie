const https = require('https');
const sharp = require('sharp');

function fetchImageBuffer(url) {
  return new Promise((resolve, reject) => {
    try {
      const u = new URL(url);
      const opts = {
        hostname: u.hostname,
        path: u.pathname + u.search,
        method: 'GET',
        timeout: 15000,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OGBot/1.0)' },
      };
      https.get(opts, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return fetchImageBuffer(res.headers.location).then(resolve).catch(reject);
        }
        if (res.statusCode !== 200) {
          return reject(new Error('HTTP ' + res.statusCode + ' for ' + url));
        }
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      }).on('error', reject).on('timeout', function () { this.destroy(); reject(new Error('Fetch timeout')); });
    } catch (e) {
      reject(new Error('Invalid URL: ' + e.message));
    }
  });
}

const SKIN_HUE_RANGES = [
  [0, 30],    // red/orange tones 
  [330, 360], // red tones near 0
];

const SKIN_SAT_MIN = 0.08;
const SKIN_SAT_MAX = 0.65;
const SKIN_BRIGHT_MIN = 0.15;
const SKIN_BRIGHT_MAX = 0.90;

function isSkinTone(h, s, v) {
  const hueOk = SKIN_HUE_RANGES.some(([lo, hi]) => h >= lo && h <= hi);
  return hueOk && s >= SKIN_SAT_MIN && s <= SKIN_SAT_MAX && v >= SKIN_BRIGHT_MIN && v <= SKIN_BRIGHT_MAX;
}

async function classifyImage(imageUrl) {
  let errorMsg = null;

  try {
    const buffer = await fetchImageBuffer(imageUrl);
    const metadata = await sharp(buffer).metadata();
    const { width, height } = metadata;
    const totalPixels = width * height;

    if (totalPixels < 10000) {
      return { valid: false, reason: 'Image trop petite pour un produit. Veuillez uploader une photo de produit nette et de bonne qualite.' };
    }

    const stats = await sharp(buffer)
      .resize(100, 100, { fit: 'cover' })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const pixels = stats.data;
    const pixelCount = pixels.length / 3;
    let skinPixels = 0;
    let brightPixels = 0;
    let darkPixels = 0;
    let saturatedPixels = 0;
    let grayPixels = 0;

    for (let i = 0; i < pixels.length; i += 3) {
      const r = pixels[i] / 255;
      const g = pixels[i + 1] / 255;
      const b = pixels[i + 2] / 255;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const diff = max - min;

      let h = 0;
      let s = 0;
      const v = max;

      if (diff > 0.01) {
        s = diff / max;
        if (max === r) h = 60 * (((g - b) / diff) % 6);
        else if (max === g) h = 60 * ((b - r) / diff + 2);
        else h = 60 * ((r - g) / diff + 4);
        if (h < 0) h += 360;
      }

      if (isSkinTone(h, s, v)) skinPixels++;

      if (v > 0.85 && s < 0.08) brightPixels++;
      if (v < 0.15) darkPixels++;
      if (s > 0.7 && v > 0.4) saturatedPixels++;
      if (s < 0.05) grayPixels++;
    }

    const skinRatio = skinPixels / pixelCount;
    const brightRatio = brightPixels / pixelCount;
    const darkRatio = darkPixels / pixelCount;
    const satRatio = saturatedPixels / pixelCount;
    const grayRatio = grayPixels / pixelCount;

    if (skinRatio > 0.25) {
      errorMsg = 'Image non valide: visage ou peau detectee (' + (skinRatio * 100).toFixed(0) + '%). Veuillez uploader une photo de produit electronique seulement.';
    } else if (brightRatio > 0.85 && grayRatio > 0.70) {
      errorMsg = 'Image non valide: fond blanc vide. Veuillez uploader une photo reelle de votre produit electronique.';
    } else if (darkRatio > 0.85) {
      errorMsg = 'Image trop sombre. Veuillez uploader une photo claire de votre produit.';
    } else if (satRatio > 0.25 && skinRatio < 0.01) {
    }

    if (errorMsg) {
      console.log('AI validator: REJECTED -', errorMsg, '(skin=' + (skinRatio * 100).toFixed(1) + '%, bright=' + (brightRatio * 100).toFixed(1) + '%, dark=' + (darkRatio * 100).toFixed(1) + '%)');
      return { valid: false, reason: errorMsg };
    }

    console.log('AI validator: ACCEPTED (skin=' + (skinRatio * 100).toFixed(1) + '%, bright=' + (brightRatio * 100).toFixed(1) + '%, gray=' + (grayRatio * 100).toFixed(1) + '%)');
    return { valid: true };
  } catch (e) {
    console.warn('AI validator: error processing image:', e.message);
    return { valid: true, skipped: true };
  }
}

module.exports = { classifyImage };
