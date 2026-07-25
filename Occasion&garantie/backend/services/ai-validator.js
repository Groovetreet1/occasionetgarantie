const https = require('https');
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const MODELS = [
  'google/vit-base-patch16-224',
  'microsoft/resnet-50',
  'facebook/deit-small-patch16-224',
];

const ENDPOINTS = [
  (m) => ({ host: 'api-inference.huggingface.co', path: '/models/' + m }),
  (m) => ({ host: 'router.huggingface.co', path: '/hf-inference/models/' + m }),
  (m) => ({ host: 'huggingface.co', path: '/api/models/' + m }),
];

const ELECTRONICS_LABELS = [
  'cellular telephone', 'mobile phone', 'cellphone', 'smartphone',
  'notebook', 'laptop', 'laptop computer', 'desktop computer', 'desktop', 'pc',
  'tablet', 'ipad', 'tablet computer', 'handheld computer',
  'monitor', 'computer monitor', 'display', 'screen',
  'headphones', 'earphone', 'microphone', 'headset',
  'keyboard', 'computer keyboard', 'mechanical keyboard',
  'mouse', 'computer mouse',
  'printer', 'scanner', 'photocopier',
  'hard disk', 'hard drive', 'ssd', 'cd player', 'dvd player', 'blu-ray',
  'modem', 'router', 'network hardware', 'network switch', 'hub', 'access point',
  'camera', 'digital camera', 'webcam', 'camcorder', 'photocamera', 'dslr', 'mirrorless',
  'speaker', 'loudspeaker', 'bluetooth speaker',
  'game controller', 'joystick', 'playstation', 'xbox', 'nintendo switch', 'console', 'gamepad',
  'television', 'tv', 'led tv', 'oled tv', 'smart tv',
  'smart watch', 'smartwatch', 'wearable computer', 'fitbit', 'apple watch',
  'charger', 'power bank', 'battery', 'adapter', 'power supply', 'charger cable',
  'cable', 'usb cable', 'hdmi cable', 'charger cable', 'data cable',
  'flash drive', 'memory card', 'sim card', 'usb flash drive', 'thumb drive', 'sd card',
  'smart speaker', 'google home', 'amazon echo', 'alexa',
  'drone', 'quadcopter', 'rc helicopter', 'gimbal',
  'electronic device', 'gadget', 'electronics',
  'microwave', 'refrigerator', 'washing machine', 'vacuum cleaner', 'appliance',
  'electric fan', 'air conditioner', 'space heater', 'heater',
  'projector', 'video projector', 'beamer',
  'video game console', 'handheld game console',
  'electric shaver', 'electric toothbrush', 'hair dryer', 'hair straightener', 'curling iron',
  'wi-fi router', 'router',
  'calculator', 'digital clock', 'alarm clock digital',
  'e-reader', 'kindle', 'ereader', 'ebook reader',
  'gps', 'navigation device', 'garmin',
  'computer tower', 'server', 'workstation', 'mini pc', 'all-in-one',
  'external hard drive', 'nas', 'raid',
  'graphics card', 'gpu', 'ram', 'motherboard', 'cpu', 'processor', 'cooler', 'fan',
  'smart home', 'smart device', 'smart plug', 'smart bulb',
  'airpods', 'earbuds', 'wireless earbuds', 'true wireless',
  'phone case', 'screen protector', 'phone stand', 'phone holder',
  'gaming mouse', 'gaming keyboard', 'gaming headset', 'gaming chair', 'gaming desk',
  'tablet stand', 'laptop stand', 'laptop bag', 'laptop sleeve',
  'webcam', 'microphone', 'audio interface', 'mixer',
  'action camera', 'gopro', 'insta360',
  'smart lock', 'doorbell camera', 'security camera', 'ip camera', 'cctv',
  'router', 'mesh wifi', 'range extender', 'powerline',
  'solar charger', 'solar panel portable',
];

const FORBIDDEN_LABELS = [
  'shoe', 'sneaker', 'boot', 'sandal', 'footwear', 'loafer', 'pump', 'slipper', 'cleat', 'heel', 'wedge', 'flip flop', 'moccasin', 'espadrille', 'ballet flat',
  'dress', 'shirt', 'trouser', 'pant', 'jean', 'jacket', 'coat', 'suit', 'tie', 'hat', 'cap', 'hoodie', 'sweater', 'shorts', 'skirt', 'blouse', 'uniform', 'vest', 'underwear', 'sock', 'tights', 'leggings', 'pajama', 'robe', 'scarf', 'glove', 'mitten', 'belt', 'swimsuit', 'bikini', 'trunks', 'boxer', 'brief', 'bra', 'panty', 'lingerie', 'nightgown', 'bathrobe', 'kimono', 'poncho', 'cape clothing', 'tank top', 'crop top', 'bodysuit', 'romper', 'jumpsuit', 'overalls', 'dungaree',
  'handbag', 'purse', 'wallet', 'backpack', 'baggage', 'suitcase', 'luggage', 'bag', 'tote', 'clutch', 'duffel', 'satchel', 'messenger bag', 'sling bag', 'crossbody bag', 'shoulder bag', 'bucket bag', 'hobo bag', 'drawstring bag', 'briefcase', 'portfolio',
  'food', 'pizza', 'sandwich', 'cake', 'bread', 'fruit', 'vegetable', 'meal', 'pasta', 'rice', 'soup', 'salad', 'cheese', 'meat', 'fish', 'egg', 'dessert', 'chocolate', 'cookie', 'donut', 'candy', 'cake', 'pie', 'muffin', 'croissant', 'bagel', 'pancake', 'waffle', 'french fries', 'hamburger', 'hot dog', 'taco', 'burrito', 'sushi', 'steak', 'chicken', 'pork', 'lamb', 'seafood', 'shrimp', 'lobster', 'crab', 'bacon', 'sausage', 'ham', 'turkey', 'roast', 'grill', 'bbq', 'barbecue',
  'beverage', 'drink', 'coffee', 'tea', 'wine', 'beer', 'cocktail', 'juice', 'soda', 'water bottle', 'champagne', 'whiskey', 'vodka', 'rum', 'martini', 'margarita', 'milkshake', 'smoothie', 'liquor', 'brandy', 'gin', 'tequila',
  'chair', 'table', 'sofa', 'couch', 'bed', 'furniture', 'cabinet', 'shelf', 'desk', 'bench', 'stool', 'drawer', 'wardrobe', 'dresser', 'nightstand', 'coffee table', 'dining table', 'bookshelf', 'bookcase', 'armchair', 'recliner', 'ottoman', 'cushion', 'pillow', 'mattress', 'headboard', 'mirror', 'rug', 'carpet', 'curtain', 'drapes', 'blinds', 'shutter', 'vanity', 'buffet', 'sideboard', 'credenza', 'hutch', 'china cabinet', 'display cabinet',
  'car', 'truck', 'bus', 'motorcycle', 'bicycle', 'vehicle', 'automobile', 'van', 'suv', 'coupe', 'sedan', 'convertible', 'hatchback', 'pickup', 'minivan', 'crossover', 'jeep', 'trailer', 'rv', 'camper', 'train', 'airplane', 'aircraft', 'boat', 'ship', 'yacht', 'sailboat', 'kayak', 'canoe', 'jet ski', 'snowmobile', 'atv', 'scooter', 'moped', 'trike', 'golf cart', 'segway', 'hoverboard',
  'house', 'building', 'apartment', 'condo', 'room', 'kitchen', 'bathroom', 'bedroom', 'garage', 'office', 'hallway', 'stairs', 'corridor', 'door', 'window', 'wall', 'floor', 'ceiling', 'roof', 'fence', 'gate', 'pool', 'garden', 'patio', 'balcony', 'deck', 'porch', 'driveway', 'sidewalk', 'road', 'street', 'highway', 'bridge', 'tunnel', 'staircase', 'elevator', 'escalator',
  'flower', 'plant', 'tree', 'garden', 'landscape', 'mountain', 'beach', 'ocean', 'sea', 'river', 'lake', 'forest', 'jungle', 'desert', 'island', 'waterfall', 'volcano', 'cave', 'cliff', 'hill', 'valley', 'field', 'meadow', 'swamp', 'marsh', 'prairie', 'tundra', 'savanna', 'grassland',
  'pet', 'dog', 'cat', 'bird', 'fish', 'animal', 'horse', 'cow', 'sheep', 'pig', 'chicken', 'duck', 'goose', 'rabbit', 'hamster', 'guinea pig', 'rat', 'mouse', 'lizard', 'snake', 'turtle', 'frog', 'toad', 'insect', 'spider', 'butterfly', 'bee', 'ant', 'fly', 'mosquito', 'worm', 'snail', 'slug', 'caterpillar', 'cricket', 'grasshopper', 'beetle', 'dragonfly', 'moth',
  'book', 'magazine', 'paper', 'document', 'notebook writing', 'envelope', 'letter', 'newspaper', 'comic book', 'manga', 'journal', 'diary', 'folder', 'binder', 'clipboard', 'file', 'cardboard', 'card', 'index card', 'flash card',
  'cosmetic', 'lipstick', 'lip gloss', 'perfume', 'cologne', 'bottle perfume', 'makeup', 'foundation', 'eyeshadow', 'eyeliner', 'mascara', 'blush', 'concealer', 'powder', 'bronzer', 'highlighter', 'nail polish', 'moisturizer', 'sunscreen', 'lotion', 'cream', 'serum', 'toner', 'face wash', 'shampoo', 'conditioner', 'soap', 'body wash', 'deodorant', 'toothbrush', 'toothpaste', 'floss', 'mouthwash', 'face mask', 'sheet mask', 'eye cream', 'night cream', 'day cream', 'anti aging',
  'jewelry', 'necklace', 'ring', 'watch wristwatch', 'bracelet', 'earring', 'brooch', 'pendant', 'chain', 'anklet', 'cufflink', 'tie pin', 'lapel pin', 'crown', 'tiara', 'gemstone', 'diamond', 'gold', 'silver', 'platinum', 'pearl', 'ruby', 'sapphire', 'emerald', 'opal', 'amethyst', 'turquoise', 'coral', 'ivory',
  'toy', 'doll', 'ball', 'stuffed animal', 'teddy bear', 'action figure', 'building block', 'lego', 'puzzle', 'board game', 'card game', 'kite', 'yo-yo', 'slinky', 'frisbee', 'jump rope', 'hula hoop', 'marble', 'top', 'toy car', 'toy train', 'toy plane', 'toy boat', 'toy soldier', 'puppet', 'mask', 'costume', 'cape', 'wand', 'play money', 'play food', 'play doh', 'slime', 'putty',
  'sports equipment', 'racket', 'tennis racket', 'badminton racket', 'baseball bat', 'baseball glove', 'basketball hoop', 'basketball', 'football', 'soccer ball', 'volleyball', 'golf club', 'golf ball', 'hockey stick', 'hockey puck', 'ski', 'snowboard', 'skateboard', 'longboard', 'surfboard', 'paddleboard', 'wakeboard', 'waterski', 'bowling ball', 'bowling pin', 'pool cue', 'dart', 'dartboard', 'fishing rod', 'fishing reel', 'boxing glove', 'punching bag', 'dumbbell', 'barbell', 'kettlebell', 'resistance band', 'yoga mat', 'jump rope fitness',
  'human', 'person', 'man', 'woman', 'child', 'baby', 'portrait', 'selfie', 'face', 'head', 'eye', 'nose', 'mouth', 'lip', 'ear', 'cheek', 'chin', 'forehead', 'eyebrow', 'eyelash', 'skin', 'hair', 'beard', 'mustache', 'hand', 'finger', 'thumb', 'fist', 'palm', 'wrist', 'arm', 'elbow', 'shoulder', 'foot', 'toe', 'ankle', 'leg', 'knee', 'thigh', 'hip', 'waist', 'chest', 'back', 'neck', 'body', 'torso', 'abdomen', 'stomach', 'navel',
  'plate', 'bowl', 'cup', 'glass', 'mug', 'goblet', 'flute', 'tumbler', 'stein', 'pitcher', 'jug', 'vase', 'fork', 'spoon', 'knife', 'spatula', 'ladle', 'whisk', 'rolling pin', 'pan', 'pot', 'skillet', 'saucepan', 'stockpot', 'baking sheet', 'casserole', 'colander', 'strainer', 'grater', 'peeler', 'measuring cup', 'cutting board', 'kitchen knife',
  'towel', 'bath towel', 'hand towel', 'washcloth', 'pillow', 'blanket', 'comforter', 'duvet', 'quilt', 'throw', 'afghan', 'curtain', 'cushion', 'throw pillow', 'bedspread', 'sheet', 'pillowcase',
  'clock', 'wall clock', 'alarm clock', 'grandfather clock', 'cuckoo clock', 'stopwatch', 'timer', 'hourglass', 'sundial',
  'lamp', 'light fixture', 'chandelier', 'candle', 'candle holder', 'lantern', 'flashlight',
  'painting', 'picture frame', 'photograph', 'artwork', 'sculpture', 'statue', 'figurine', 'ornament', 'decoration',
  'pen', 'pencil', 'marker', 'highlighter', 'crayon', 'scissors', 'tape', 'glue',
  'umbrella', 'cane', 'walking stick', 'crutch', 'wheelchair', 'walker', 'stroller', 'pram',
  'bottle', 'jar', 'can', 'container', 'box', 'crate', 'bucket', 'barrel', 'bin',
  'flag', 'balloon', 'ribbon', 'wrapping paper', 'gift wrap', 'confetti', 'streamer', 'banner', 'sign',
  'wheel', 'tire', 'helmet', 'sunglasses', 'glasses', 'eyeglasses', 'goggles',
  'tree', 'leaf', 'branch', 'grass', 'weed', 'moss', 'fern', 'cactus', 'succulent', 'bush', 'shrub', 'hedge', 'vine',
  'rock', 'stone', 'pebble', 'boulder', 'gravel', 'sand', 'dirt', 'soil', 'mud', 'clay',
  'fabric', 'textile', 'cloth', 'leather', 'fur', 'feather', 'wool', 'cotton', 'silk', 'linen',
  'tool', 'hammer', 'screwdriver', 'wrench', 'pliers', 'drill', 'saw', 'level', 'tape measure',
  'instrument', 'guitar', 'piano', 'violin', 'drum', 'flute', 'trumpet', 'saxophone',
  'cooking utensil', 'kitchen tool', 'baking tool',
];

function checkLabels(predictions) {
  const scores = predictions.map(p => ({ label: p.label.toLowerCase(), score: p.score }));
  const topLabel = scores[0]?.label || '';
  const topScore = scores[0]?.score || 0;

  const forbiddenMatch = scores.find(s =>
    s.score > 0.08 &&
    FORBIDDEN_LABELS.some(f => s.label === f || s.label.startsWith(f + ',') || s.label.startsWith(f + ' ') || s.label.includes(', ' + f))
  );
  if (forbiddenMatch) {
    return { valid: false, reason: `Image non valide: "${forbiddenMatch.label}" detecte (${(forbiddenMatch.score * 100).toFixed(0)}%). Veuillez uploader une photo de produit electronique uniquement (smartphone, tablette, PC, accessoire tech, gaming).` };
  }

  const electronicsMatch = scores.some(s =>
    s.score > 0.04 &&
    ELECTRONICS_LABELS.some(e => s.label === e || s.label.startsWith(e + ',') || s.label.startsWith(e + ' ') || s.label.includes(', ' + e))
  );
  if (!electronicsMatch) {
    return { valid: false, reason: `Image refusee: aucun produit electronique detecte ("${topLabel}", ${(topScore * 100).toFixed(0)}%). Seules les photos de smartphones, tablettes, PC, accessoires tech et gaming sont autorisees.` };
  }

  return { valid: true };
}

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

function queryHF(model, imageBuffer) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) return reject(new Error('No API key'));
    const endpoints = ENDPOINTS.map(fn => fn(model));
    tryNextEndpoint(0, endpoints, imageBuffer, apiKey, resolve, reject);
  });
}

function tryNextEndpoint(idx, endpoints, imageBuffer, apiKey, resolve, reject) {
  if (idx >= endpoints.length) return reject(new Error('All endpoints failed'));
  const ep = endpoints[idx];
  const opts = {
    hostname: ep.host,
    path: ep.path,
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + apiKey,
      'Content-Type': 'application/octet-stream',
      'Content-Length': imageBuffer.length,
    },
    timeout: 25000,
  };
  const req = https.request(opts, (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
      try { resolve(JSON.parse(data)); }
      catch { tryNextEndpoint(idx + 1, endpoints, imageBuffer, apiKey, resolve, reject); }
    });
  });
  req.on('error', () => tryNextEndpoint(idx + 1, endpoints, imageBuffer, apiKey, resolve, reject));
  req.on('timeout', function () { this.destroy(); tryNextEndpoint(idx + 1, endpoints, imageBuffer, apiKey, resolve, reject); });
  req.write(imageBuffer);
  req.end();
}

const sharp = require('sharp');

function detectSkinAndBg(buffer) {
  return sharp(buffer)
    .resize(100, 100, { fit: 'cover' })
    .raw()
    .toBuffer({ resolveWithObject: true })
    .then(({ data }) => {
      let skinPixels = 0, brightPixels = 0, grayPixels = 0;
      const total = data.length / 3;
      for (let i = 0; i < data.length; i += 3) {
        const r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b), diff = max - min;
        let h = 0;
        if (diff > 0.01) {
          if (max === r) h = 60 * (((g - b) / diff) % 6);
          else if (max === g) h = 60 * ((b - r) / diff + 2);
          else h = 60 * ((r - g) / diff + 4);
          if (h < 0) h += 360;
        }
        const s = diff > 0.01 ? diff / max : 0;
        if (h <= 30 || h >= 330) {
          if (s >= 0.08 && s <= 0.65 && max >= 0.15 && max <= 0.90) skinPixels++;
        }
        if (max > 0.88 && s < 0.06) brightPixels++;
        if (s < 0.03) grayPixels++;
      }
      return { skinRatio: skinPixels / total, brightRatio: brightPixels / total, grayRatio: grayPixels / total };
    });
}

async function classifyImage(imageUrl) {
  if (!process.env.HUGGINGFACE_API_KEY) {
    console.log('AI validator: HUGGINGFACE_API_KEY not set, using sharp local analysis only');
    return classifyLocal(imageUrl);
  }

  console.log('AI validator: key found, trying HF inference for:', imageUrl.substring(0, 80));

  try {
    const buffer = await fetchImageBuffer(imageUrl);
    console.log('AI validator: image downloaded, size=' + buffer.length + ' bytes');

    for (const model of MODELS) {
      try {
        const result = await queryHF(model, buffer);
        if (result && result.error) {
          console.warn('AI validator: HF error for ' + model + ':', typeof result.error === 'string' ? result.error.substring(0, 80) : 'unknown');
          continue;
        }
        const predictions = Array.isArray(result) && Array.isArray(result[0]) ? result[0] :
                           Array.isArray(result) ? result : null;
        if (!predictions || predictions.length === 0) continue;
        console.log('AI validator: HF top:', predictions.slice(0, 3).map(p => p.label + ' (' + (p.score * 100).toFixed(1) + '%)').join(', '));
        const verdict = checkLabels(predictions);
        if (!verdict.valid) return verdict;
        return { valid: true };
      } catch (e) {
        console.warn('AI validator: model ' + model + ' failed:', e.message);
      }
    }

    console.log('AI validator: all HF models failed, falling back to sharp analysis');
    return await classifyLocalWithBuffer(buffer);
  } catch (e) {
    console.warn('AI validator: error:', e.message);
    return classifyLocal(imageUrl);
  }
}

async function classifyLocalWithBuffer(buffer) {
  try {
    const meta = await sharp(buffer).metadata();
    if ((meta.width || 0) * (meta.height || 0) < 10000) {
      return { valid: false, reason: 'Image trop petite pour un produit.' };
    }
    const { skinRatio, brightRatio, grayRatio } = await detectSkinAndBg(buffer);
    if (skinRatio > 0.25) return { valid: false, reason: 'Image non valide: visage detecte (' + (skinRatio * 100).toFixed(0) + '%). Veuillez uploader une photo de produit electronique.' };
    if (brightRatio > 0.85 && grayRatio > 0.70) return { valid: false, reason: 'Image non valide: fond blanc vide. Veuillez uploader une photo reelle de votre produit.' };
    console.log('AI validator: sharp ACCEPTED (skin=' + (skinRatio * 100).toFixed(1) + '%)');
    return { valid: true };
  } catch {
    return { valid: true, skipped: true };
  }
}

async function classifyLocal(imageUrl) {
  try {
    const buffer = await fetchImageBuffer(imageUrl);
    return await classifyLocalWithBuffer(buffer);
  } catch (e) {
    console.warn('AI validator: local fallback error:', e.message);
    return { valid: true, skipped: true };
  }
}

module.exports = { classifyImage };
