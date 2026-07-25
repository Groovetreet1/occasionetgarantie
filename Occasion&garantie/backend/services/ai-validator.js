const https = require('https');

const HF_MODEL = 'microsoft/resnet-50';
const HF_API = 'https://api-inference.huggingface.co/models/' + HF_MODEL;

const ELECTRONICS_LABELS = [
  'cellular telephone', 'mobile phone', 'cellphone', 'smartphone',
  'notebook', 'laptop', 'laptop computer', 'desktop computer', 'desktop',
  'tablet', 'ipad', 'tablet computer',
  'monitor', 'computer monitor', 'display',
  'headphones', 'earphone', 'microphone',
  'keyboard', 'computer keyboard',
  'mouse', 'computer mouse',
  'printer', 'scanner',
  'hard disk', 'hard drive', 'cd player', 'dvd player',
  'modem', 'router', 'network hardware',
  'camera', 'digital camera', 'webcam', 'camcorder',
  'speaker', 'loudspeaker', 'headset',
  'game controller', 'joystick', 'playstation', 'xbox', 'nintendo',
  'television', 'tv', 'screen',
  'smart watch', 'smartwatch', 'wearable',
  'charger', 'power bank', 'battery', 'adapter',
  'cable', 'usb cable', 'hdmi',
  'memory card', 'sim card', 'usb flash drive',
  'smart display', 'smart speaker',
  'drone', 'quadcopter',
  'router', 'switch', 'hub',
  'electronic device', 'gadget', 'electronics',
  'earphone', 'headphone',
  'hand-held computer', 'pda',
  'microwave', 'washing machine', 'refrigerator',
];

const FORBIDDEN_LABELS = [
  'shoe', 'sneaker', 'boot', 'sandal', 'footwear',
  'dress', 'shirt', 'trouser', 'jean', 'jacket', 'coat', 'suit', 'tie', 'hat', 'cap',
  'handbag', 'purse', 'wallet', 'backpack', 'baggage',
  'food', 'pizza', 'sandwich', 'cake', 'bread', 'fruit', 'vegetable', 'meal',
  'beverage', 'drink', 'coffee', 'tea', 'wine', 'beer', 'bottle',
  'chair', 'table', 'sofa', 'couch', 'bed', 'furniture', 'cabinet', 'shelf', 'desk',
  'car', 'truck', 'bus', 'motorcycle', 'bicycle', 'vehicle', 'automobile',
  'house', 'building', 'apartment', 'room', 'kitchen', 'bathroom',
  'flower', 'plant', 'tree', 'garden', 'landscape',
  'pet', 'dog', 'cat', 'bird', 'fish', 'animal', 'horse', 'cow',
  'book', 'magazine', 'paper', 'document',
  'cosmetic', 'lipstick', 'perfume', 'bottle',
  'jewelry', 'necklace', 'ring', 'watch', 'bracelet',
  'toy', 'doll', 'ball', 'stuffed animal',
  'sports equipment', 'ball', 'racket', 'bicycle',
];

function checkLabels(predictions) {
  const labels = predictions.map(p => p.label.toLowerCase());
  const scores = predictions.map(p => ({ label: p.label.toLowerCase(), score: p.score }));

  const topLabel = labels[0] || '';

  const forbiddenMatch = scores.find(s =>
    FORBIDDEN_LABELS.some(f => s.label.includes(f) || f.includes(s.label)) &&
    s.score > 0.3
  );
  if (forbiddenMatch) {
    return { valid: false, reason: `Image non valide : "${forbiddenMatch.label}" detecte (${(forbiddenMatch.score * 100).toFixed(0)}%). Veuillez uploader une photo de produit electronique.` };
  }

  const electronicsMatch = scores.some(s =>
    ELECTRONICS_LABELS.some(e => s.label.includes(e) || e.includes(s.label)) &&
    s.score > 0.1
  );
  if (!electronicsMatch) {
    return { valid: false, reason: `L'image ne semble pas correspondre a un produit electronique. Detection: "${topLabel}" (${(scores[0].score * 100).toFixed(0)}%). Veuillez uploader une photo de smartphone, tablette, ordinateur ou accessoire tech.` };
  }

  return { valid: true };
}

function classifyImage(imageUrl) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      return resolve({ valid: true, skipped: true });
    }

    const urlObj = new URL(HF_API);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    };

    const body = JSON.stringify({ inputs: imageUrl });

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (res.statusCode !== 200) {
            console.warn('HuggingFace API error:', result);
            return resolve({ valid: true, skipped: true });
          }
          const predictions = Array.isArray(result) ? result[0] : result;
          if (!Array.isArray(predictions) || predictions.length === 0) {
            return resolve({ valid: true, skipped: true });
          }
          resolve(checkLabels(predictions));
        } catch (e) {
          console.warn('HuggingFace parse error:', e.message);
          resolve({ valid: true, skipped: true });
        }
      });
    });

    req.on('error', (e) => {
      console.warn('HuggingFace request error:', e.message);
      resolve({ valid: true, skipped: true });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ valid: true, skipped: true });
    });

    req.write(body);
    req.end();
  });
}

module.exports = { classifyImage };
