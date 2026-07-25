const https = require('https');

const HF_MODEL = 'google/vit-base-patch16-224';
const HF_API = 'https://api-inference.huggingface.co/models/' + HF_MODEL;

const ELECTRONICS_LABELS = [
  'cellular telephone', 'mobile phone', 'cellphone', 'smartphone',
  'notebook', 'laptop', 'laptop computer', 'desktop computer', 'desktop',
  'tablet', 'ipad', 'tablet computer',
  'monitor', 'computer monitor', 'display',
  'headphones', 'earphone', 'microphone', 'headset',
  'keyboard', 'computer keyboard',
  'mouse', 'computer mouse',
  'printer', 'scanner',
  'hard disk', 'hard drive', 'cd player', 'dvd player',
  'modem', 'router', 'network hardware', 'network switch',
  'camera', 'digital camera', 'webcam', 'camcorder', 'photocamera',
  'speaker', 'loudspeaker',
  'game controller', 'joystick', 'playstation', 'xbox', 'nintendo switch',
  'television', 'tv', 'screen', 'flat panel',
  'smart watch', 'smartwatch', 'wearable computer',
  'charger', 'power bank', 'battery', 'adapter',
  'cable', 'usb cable', 'hdmi cable',
  'flash drive', 'memory card', 'sim card', 'usb flash drive',
  'smart speaker', 'google home', 'amazon echo',
  'drone', 'quadcopter',
  'electronic device', 'gadget', 'electronics',
  'hand-held computer', 'pda',
  'microwave', 'washing machine', 'refrigerator', 'home appliance',
  'electric fan', 'air conditioner', 'vacuum cleaner',
  'hard disk', 'ssd', 'external drive',
  'projector', 'video projector',
  'tablet computer', 'handheld computer',
  'video game console', 'handheld game console',
  'electric shaver', 'electric toothbrush',
  'router', 'wi-fi router',
  'computer keyboard', 'keyboard',
];

const FORBIDDEN_LABELS = [
  'shoe', 'sneaker', 'boot', 'sandal', 'footwear', 'loafer', 'pump',
  'dress', 'shirt', 'trouser', 'jean', 'jacket', 'coat', 'suit', 'tie', 'hat', 'cap', 'hoodie', 'sweater', 'shorts', 'skirt', 'blouse', 'uniform', 'vest', 'underwear', 'sock',
  'handbag', 'purse', 'wallet', 'backpack', 'baggage', 'suitcase', 'luggage', 'bag',
  'food', 'pizza', 'sandwich', 'cake', 'bread', 'fruit', 'vegetable', 'meal', 'pasta', 'rice', 'soup', 'salad', 'cheese', 'meat', 'fish', 'egg', 'dessert', 'chocolate', 'cookie', 'donut',
  'beverage', 'drink', 'coffee', 'tea', 'wine', 'beer', 'cocktail', 'juice', 'soda', 'water bottle',
  'chair', 'table', 'sofa', 'couch', 'bed', 'furniture', 'cabinet', 'shelf', 'desk', 'bench', 'stool', 'drawer', 'wardrobe', 'dresser',
  'car', 'truck', 'bus', 'motorcycle', 'bicycle', 'vehicle', 'automobile', 'van', 'suv', 'train', 'airplane', 'boat', 'ship',
  'house', 'building', 'apartment', 'room', 'kitchen', 'bathroom', 'bedroom', 'garage', 'office',
  'flower', 'plant', 'tree', 'garden', 'landscape', 'mountain', 'beach', 'ocean', 'river', 'lake', 'forest',
  'pet', 'dog', 'cat', 'bird', 'fish', 'animal', 'horse', 'cow', 'sheep', 'pig', 'chicken', 'duck', 'rabbit',
  'book', 'magazine', 'paper', 'document', 'notebook writing', 'envelope', 'letter',
  'cosmetic', 'lipstick', 'perfume', 'bottle perfume', 'makeup', 'foundation', 'eyeshadow', 'nail polish',
  'jewelry', 'necklace', 'ring', 'watch', 'bracelet', 'earring', 'brooch',
  'toy', 'doll', 'ball', 'stuffed animal', 'teddy bear', 'action figure', 'building block', 'lego',
  'sports equipment', 'racket', 'baseball bat', 'golf club', 'ski', 'skateboard', 'surfboard', 'kayak', 'canoe',
  'human face', 'person', 'man', 'woman', 'child', 'baby', 'portrait', 'selfie', 'face', 'head', 'eye', 'nose', 'mouth', 'hair',
  'hand', 'foot', 'arm', 'leg', 'body',
  'plate', 'bowl', 'cup', 'glass', 'mug', 'fork', 'spoon', 'knife', 'pan', 'pot', 'kitchen appliance',
  'towel', 'pillow', 'blanket', 'curtain', 'cushion',
  'clock', 'wall clock', 'alarm clock',
  'lamp', 'light fixture', 'chandelier', 'candle',
  'painting', 'picture frame', 'photograph', 'artwork', 'sculpture',
  'pen', 'pencil', 'marker', 'crayon', 'scissors', 'tape', 'glue',
  'umbrella', 'cane', 'walking stick',
  'bottle', 'jar', 'can', 'container', 'box', 'crate',
  'flag', 'balloon', 'ribbon', 'wrapping paper',
  'wheel', 'tire', 'helmet', 'glove', 'sunglasses', 'glasses',
  'tree', 'leaf', 'branch', 'grass', 'rock', 'stone', 'sand',
];

function checkLabels(predictions) {
  const scores = predictions.map(p => ({ label: p.label.toLowerCase(), score: p.score }));
  const topLabel = scores[0]?.label || '';

  const forbiddenMatch = scores.find(s =>
    FORBIDDEN_LABELS.some(f => s.label.includes(f) || f.includes(s.label)) &&
    s.score > 0.15
  );
  if (forbiddenMatch) {
    return { valid: false, reason: `Image non valide: "${forbiddenMatch.label}" detecte (${(forbiddenMatch.score * 100).toFixed(0)}%). Veuillez uploader une photo de produit electronique seulement.` };
  }

  const electronicsMatch = scores.some(s =>
    ELECTRONICS_LABELS.some(e => s.label.includes(e) || e.includes(s.label)) &&
    s.score > 0.08
  );
  if (!electronicsMatch) {
    return { valid: false, reason: `Image refuse: aucun produit electronique detecte ("${topLabel}", ${(scores[0]?.score * 100 || 0).toFixed(0)}%). Photos autorisees: smartphones, tablettes, PC, accessoires tech, gaming.` };
  }

  return { valid: true };
}

function fetchImageBuffer(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const opts = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'GET',
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    };
    https.get(opts, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchImageBuffer(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error('HTTP ' + res.statusCode));
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject).on('timeout', function () { this.destroy(); reject(new Error('timeout')); });
  });
}

function queryHF(imageBuffer) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    const urlObj = new URL(HF_API);
    const opts = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/octet-stream',
        'Content-Length': imageBuffer.length,
      },
      timeout: 20000,
    };
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch { reject(new Error('Invalid JSON response')); }
      });
    });
    req.on('error', reject);
    req.on('timeout', function () { this.destroy(); reject(new Error('timeout')); });
    req.write(imageBuffer);
    req.end();
  });
}

async function classifyImage(imageUrl) {
  if (!process.env.HUGGINGFACE_API_KEY) return { valid: true, skipped: true };

  try {
    const buffer = await fetchImageBuffer(imageUrl);
    const result = await queryHF(buffer);

    if (!Array.isArray(result) && result.error) {
      console.warn('HF API error:', result.error);
      if (result.error.includes('loading')) {
        return { valid: true, skipped: true };
      }
      return { valid: true, skipped: true };
    }

    const predictions = Array.isArray(result) && Array.isArray(result[0]) ? result[0] : result;
    if (!Array.isArray(predictions) || predictions.length === 0) {
      return { valid: true, skipped: true };
    }

    return checkLabels(predictions);
  } catch (e) {
    console.warn('AI image validation failed:', e.message);
    return { valid: true, skipped: true };
  }
}

module.exports = { classifyImage };
