const https = require('https');

const MODELS = [
  'google/vit-base-patch16-224',
  'microsoft/resnet-50',
  'facebook/deit-small-patch16-224',
];

const ELECTRONICS_LABELS = [
  'cellular telephone', 'mobile phone', 'cellphone', 'smartphone',
  'notebook', 'laptop', 'laptop computer', 'desktop computer', 'desktop', 'pc',
  'tablet', 'ipad', 'tablet computer', 'handheld computer',
  'monitor', 'computer monitor', 'display', 'screen',
  'headphones', 'earphone', 'microphone', 'headset',
  'keyboard', 'computer keyboard',
  'mouse', 'computer mouse',
  'printer', 'scanner', 'photocopier',
  'hard disk', 'hard drive', 'ssd', 'cd player', 'dvd player',
  'modem', 'router', 'network hardware', 'network switch', 'hub',
  'camera', 'digital camera', 'webcam', 'camcorder', 'photocamera',
  'speaker', 'loudspeaker',
  'game controller', 'joystick', 'playstation', 'xbox', 'nintendo switch', 'console',
  'television', 'tv',
  'smart watch', 'smartwatch', 'wearable computer',
  'charger', 'power bank', 'battery', 'adapter', 'power supply',
  'cable', 'usb cable', 'hdmi cable', 'charger cable',
  'flash drive', 'memory card', 'sim card', 'usb flash drive', 'thumb drive',
  'smart speaker', 'google home', 'amazon echo',
  'drone', 'quadcopter', 'rc helicopter',
  'electronic device', 'gadget', 'electronics',
  'microwave', 'refrigerator', 'washing machine', 'vacuum cleaner', 'appliance',
  'electric fan', 'air conditioner', 'space heater',
  'projector', 'video projector',
  'video game console', 'handheld game console',
  'electric shaver', 'electric toothbrush', 'hair dryer',
  'wi-fi router', 'access point',
  'calculator', 'digital clock', 'alarm clock digital',
  'e-reader', 'kindle', 'ereader',
  'gps', 'navigation device', 'fitbit', 'activity tracker',
  'computer tower', 'server', 'workstation',
  'external hard drive', 'nas',
  'graphics card', 'gpu', 'ram', 'motherboard', 'cpu', 'processor',
  'smart home', 'smart device', 'smart plug',
  'airpods', 'earbuds', 'wireless earbuds',
  'phone case', 'screen protector', 'phone stand',
  'gaming mouse', 'gaming keyboard', 'gaming headset', 'gaming chair',
];

const FORBIDDEN_LABELS = [
  'shoe', 'sneaker', 'boot', 'sandal', 'footwear', 'loafer', 'pump', 'slipper', 'cleat', 'heel',
  'dress', 'shirt', 'trouser', 'pant', 'jean', 'jacket', 'coat', 'suit', 'tie', 'hat', 'cap', 'hoodie', 'sweater', 'shorts', 'skirt', 'blouse', 'uniform', 'vest', 'underwear', 'sock', 'tights', 'leggings', 'pajama', 'robe', 'scarf', 'glove', 'mitten', 'belt', 'swimsuit', 'bikini',
  'handbag', 'purse', 'wallet', 'backpack', 'baggage', 'suitcase', 'luggage', 'bag', 'tote', 'clutch', 'duffel', 'satchel', 'messenger bag',
  'food', 'pizza', 'sandwich', 'cake', 'bread', 'fruit', 'vegetable', 'meal', 'pasta', 'rice', 'soup', 'salad', 'cheese', 'meat', 'fish', 'egg', 'dessert', 'chocolate', 'cookie', 'donut', 'candy', 'cake', 'pie', 'muffin', 'croissant', 'bagel', 'pancake', 'waffle', 'french fries', 'hamburger', 'hot dog', 'taco', 'burrito', 'sushi', 'steak', 'chicken', 'pork', 'lamb', 'seafood', 'shrimp', 'lobster', 'crab', 'bacon', 'sausage', 'ham', 'turkey',
  'beverage', 'drink', 'coffee', 'tea', 'wine', 'beer', 'cocktail', 'juice', 'soda', 'water bottle', 'champagne', 'whiskey', 'vodka', 'rum', 'martini', 'margarita', 'milkshake', 'smoothie',
  'chair', 'table', 'sofa', 'couch', 'bed', 'furniture', 'cabinet', 'shelf', 'desk', 'bench', 'stool', 'drawer', 'wardrobe', 'dresser', 'nightstand', 'coffee table', 'dining table', 'bookshelf', 'bookcase', 'armchair', 'recliner', 'ottoman', 'cushion', 'pillow', 'mattress', 'headboard', 'mirror', 'rug', 'carpet', 'curtain', 'drapes', 'blinds',
  'car', 'truck', 'bus', 'motorcycle', 'bicycle', 'vehicle', 'automobile', 'van', 'suv', 'coupe', 'sedan', 'convertible', 'hatchback', 'pickup', 'minivan', 'crossover', 'jeep', 'trailer', 'rv', 'camper', 'train', 'airplane', 'aircraft', 'boat', 'ship', 'yacht', 'sailboat', 'kayak', 'canoe', 'jet ski', 'snowmobile', 'atv', 'scooter', 'moped',
  'house', 'building', 'apartment', 'condo', 'room', 'kitchen', 'bathroom', 'bedroom', 'garage', 'office', 'hallway', 'stairs', 'corridor', 'door', 'window', 'wall', 'floor', 'ceiling', 'roof', 'fence', 'gate', 'pool', 'garden', 'patio', 'balcony', 'deck', 'porch', 'driveway', 'sidewalk', 'road', 'street', 'highway', 'bridge', 'tunnel',
  'flower', 'plant', 'tree', 'garden', 'landscape', 'mountain', 'beach', 'ocean', 'sea', 'river', 'lake', 'forest', 'jungle', 'desert', 'island', 'waterfall', 'volcano', 'cave', 'cliff', 'hill', 'valley', 'field', 'meadow', 'swamp', 'marsh',
  'pet', 'dog', 'cat', 'bird', 'fish', 'animal', 'horse', 'cow', 'sheep', 'pig', 'chicken', 'duck', 'goose', 'rabbit', 'hamster', 'guinea pig', 'rat', 'mouse', 'lizard', 'snake', 'turtle', 'frog', 'toad', 'insect', 'spider', 'butterfly', 'bee', 'ant', 'fly', 'mosquito', 'worm', 'snail',
  'book', 'magazine', 'paper', 'document', 'notebook writing', 'envelope', 'letter', 'newspaper', 'comic book', 'manga', 'journal', 'diary', 'folder', 'binder', 'clipboard', 'file', 'cardboard', 'card',
  'cosmetic', 'lipstick', 'lip gloss', 'perfume', 'cologne', 'bottle perfume', 'makeup', 'foundation', 'eyeshadow', 'eyeliner', 'mascara', 'blush', 'concealer', 'powder', 'bronzer', 'highlighter', 'nail polish', 'moisturizer', 'sunscreen', 'lotion', 'cream', 'serum', 'toner', 'face wash', 'shampoo', 'conditioner', 'soap', 'body wash', 'deodorant', 'toothbrush', 'toothpaste', 'floss', 'mouthwash',
  'jewelry', 'necklace', 'ring', 'watch wristwatch', 'bracelet', 'earring', 'brooch', 'pendant', 'chain', 'anklet', 'cufflink', 'tie pin', 'lapel pin', 'crown', 'tiara', 'gemstone', 'diamond', 'gold', 'silver', 'platinum',
  'toy', 'doll', 'ball', 'stuffed animal', 'teddy bear', 'action figure', 'building block', 'lego', 'puzzle', 'board game', 'card game', 'kite', 'yo-yo', 'slinky', 'frisbee', 'jump rope', 'hula hoop', 'marble', 'top', 'toy car', 'toy train', 'toy plane', 'toy boat', 'toy soldier', 'puppet', 'mask', 'costume', 'cape', 'wand', 'play money', 'play food',
  'sports equipment', 'racket', 'tennis racket', 'badminton racket', 'baseball bat', 'baseball glove', 'basketball hoop', 'basketball', 'football', 'soccer ball', 'volleyball', 'golf club', 'golf ball', 'hockey stick', 'hockey puck', 'ski', 'snowboard', 'skateboard', 'longboard', 'surfboard', 'paddleboard', 'wakeboard', 'waterski', 'bowling ball', 'bowling pin', 'pool cue', 'dart', 'dartboard', 'fishing rod', 'fishing reel', 'boxing glove', 'punching bag', 'dumbbell', 'barbell', 'kettlebell', 'resistance band', 'yoga mat', 'jump rope fitness',
  'human', 'person', 'man', 'woman', 'child', 'baby', 'portrait', 'selfie', 'face', 'head', 'eye', 'nose', 'mouth', 'lip', 'ear', 'cheek', 'chin', 'forehead', 'eyebrow', 'eyelash', 'skin', 'hair', 'beard', 'mustache', 'hand', 'finger', 'thumb', 'fist', 'palm', 'wrist', 'arm', 'elbow', 'shoulder', 'foot', 'toe', 'ankle', 'leg', 'knee', 'thigh', 'hip', 'waist', 'chest', 'back', 'neck', 'body', 'torso', 'abdomen', 'stomach', 'navel', 'buttocks', 'bottom', 'muscle', 'bone', 'skeleton', 'skull', 'brain', 'heart', 'lung', 'stomach organ', 'intestine',
  'plate', 'bowl', 'cup', 'glass', 'mug', 'goblet', 'flute', 'tumbler', 'stein', 'pitcher', 'jug', 'vase', 'fork', 'spoon', 'knife', 'spatula', 'ladle', 'whisk', 'rolling pin', 'pan', 'pot', 'skillet', 'saucepan', 'stockpot', 'baking sheet', 'casserole', 'colander', 'strainer', 'grater', 'peeler', 'measuring cup', 'cutting board', 'kitchen knife', 'chef knife', 'paring knife', 'bread knife', 'cleaver', 'butcher knife',
  'towel', 'bath towel', 'hand towel', 'washcloth', 'pillow', 'blanket', 'comforter', 'duvet', 'quilt', 'throw', 'afghan', 'curtain', 'drapes', 'cushion', 'throw pillow', 'bedspread', 'sheet', 'fitted sheet', 'flat sheet', 'pillowcase', 'bed skirt', 'mattress pad', 'mattress protector', 'tablecloth', 'napkin', 'placemat', 'oven mitt', 'pot holder', 'apron',
  'clock', 'wall clock', 'alarm clock', 'grandfather clock', 'cuckoo clock', 'stopwatch', 'timer', 'hourglass', 'sundial',
  'lamp', 'light fixture', 'chandelier', 'candle', 'candle holder', 'lantern', 'flashlight', 'night light', 'string light', 'fairy light', 'lava lamp', 'floor lamp', 'desk lamp', 'table lamp', 'wall sconce', 'ceiling light', 'pendant light', 'track light', 'recessed light',
  'painting', 'picture frame', 'photograph', 'artwork', 'sculpture', 'statue', 'figurine', 'ornament', 'decoration', 'decor', 'wall art', 'canvas', 'print', 'poster', 'drawing', 'sketch', 'watercolor', 'oil painting', 'acrylic painting',
  'pen', 'pencil', 'marker', 'highlighter', 'crayon', 'colored pencil', 'pastel', 'chalk', 'scissors', 'tape', 'glue', 'rubber band', 'paper clip', 'stapler', 'staple remover', 'hole punch', 'push pin', 'thumbtack', 'binder clip', 'clothespin', 'clip', 'ruler', 'compass drawing', 'protractor', 'eraser', 'sharpener', 'correction fluid', 'label', 'sticker', 'stamp', 'ink pad',
  'umbrella', 'cane', 'walking stick', 'crutch', 'wheelchair', 'walker', 'stroller', 'pram',
  'bottle', 'jar', 'can', 'container', 'box', 'crate', 'bucket', 'barrel', 'bin', 'trash can', 'wastebasket', 'recycling bin', 'dustbin',
  'flag', 'balloon', 'ribbon', 'wrapping paper', 'gift wrap', 'gift bag', 'gift box', 'confetti', 'streamer', 'banner', 'sign', 'placard', 'poster promotional',
  'wheel', 'tire', 'helmet', 'bicycle helmet', 'motorcycle helmet', 'sunglasses', 'glasses', 'eyeglasses', 'reading glasses', 'safety glasses', 'goggles', 'monocle', 'contact lenses', 'contact lens case', 'glasses case',
  'tree', 'leaf', 'branch', 'twig', 'log', 'wood', 'bark', 'trunk', 'root', 'grass', 'weed', 'moss', 'fern', 'cactus', 'succulent', 'bush', 'shrub', 'hedge', 'vine', 'flower', 'petal', 'blossom', 'bloom', 'rose', 'tulip', 'daisy', 'sunflower', 'lily', 'orchid', 'lavender', 'hydrangea', 'peony', 'daffodil', 'chrysanthemum', 'marigold', 'pansy', 'violet', 'iris', 'lotus', 'jasmine', 'hibiscus', 'cherry blossom', 'apple blossom', 'orange blossom',
  'rock', 'stone', 'pebble', 'boulder', 'gravel', 'sand', 'dirt', 'soil', 'mud', 'clay', 'dust', 'ash', 'charcoal', 'coal',
  'pipe', 'tube', 'wire', 'chain', 'rope', 'string', 'thread', 'yarn', 'fabric', 'textile', 'cloth', 'leather', 'fur', 'feather', 'wool', 'cotton', 'silk', 'linen', 'polyester', 'nylon', 'velvet', 'satin', 'lace', 'denim', 'corduroy', 'tweed', 'plaid', 'striped', 'polka dot', 'checkered', 'solid', 'patterned',
];

function checkLabels(predictions) {
  const scores = predictions.map(p => ({ label: p.label.toLowerCase(), score: p.score }));
  const topLabel = scores[0]?.label || '';
  const topScore = scores[0]?.score || 0;

  const forbiddenMatch = scores.find(s =>
    s.score > 0.12 &&
    FORBIDDEN_LABELS.some(f => s.label === f || s.label.startsWith(f + ',') || s.label.startsWith(f + ' ') || s.label.includes(', ' + f))
  );
  if (forbiddenMatch) {
    return { valid: false, reason: `Image non valide: "${forbiddenMatch.label}" detecte (${(forbiddenMatch.score * 100).toFixed(0)}%). Veuillez uploader une photo de produit electronique uniquement (smartphone, tablette, PC, accessoire tech, gaming).` };
  }

  const electronicsMatch = scores.some(s =>
    s.score > 0.06 &&
    ELECTRONICS_LABELS.some(e => s.label === e || s.label.startsWith(e + ',') || s.label.startsWith(e + ' ') || s.label.includes(', ' + e))
  );
  if (!electronicsMatch) {
    return { valid: false, reason: `Image refuse: aucun produit electronique detecte ("${topLabel}", ${(topScore * 100).toFixed(0)}%). Seules les photos de smartphones, tablettes, PC, accessoires tech et gaming sont autorisees.` };
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
    const urlStr = 'https://api-inference.huggingface.co/models/' + model;
    const urlObj = new URL(urlStr);
    const opts = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/octet-stream',
        'Content-Length': imageBuffer.length,
      },
      timeout: 30000,
    };
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error('Invalid JSON from HF')); }
      });
    });
    req.on('error', reject);
    req.on('timeout', function () { this.destroy(); reject(new Error('HF timeout')); });
    req.write(imageBuffer);
    req.end();
  });
}

async function classifyImage(imageUrl) {
  if (!process.env.HUGGINGFACE_API_KEY) {
    console.log('AI validator: HUGGINGFACE_API_KEY not set, skipping image validation');
    return { valid: true, skipped: true };
  }

  console.log('AI validator: key found, validating image:', imageUrl.substring(0, 80));

  for (const model of MODELS) {
    try {
      const buffer = await fetchImageBuffer(imageUrl);
      console.log('AI validator: image downloaded, size=' + buffer.length + ' bytes, model=' + model);

      const result = await queryHF(model, buffer);

      if (result && result.error) {
        console.warn('AI validator: HF error for ' + model + ':', result.error);
        if (result.error.includes('loading')) {
          console.log('AI validator: model loading, trying next model...');
          continue;
        }
        continue;
      }

      const predictions = Array.isArray(result) && Array.isArray(result[0]) ? result[0] : 
                          Array.isArray(result) ? result : null;

      if (!predictions || predictions.length === 0) {
        console.warn('AI validator: empty predictions from ' + model);
        continue;
      }

      console.log('AI validator: top predictions:', predictions.slice(0, 3).map(p => p.label + ' (' + (p.score * 100).toFixed(1) + '%)').join(', '));
      return checkLabels(predictions);
    } catch (e) {
      console.warn('AI validator: error with model ' + model + ':', e.message);
    }
  }

  console.log('AI validator: all models failed, allowing product without AI validation');
  return { valid: true, skipped: true };
}

module.exports = { classifyImage };
