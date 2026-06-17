const db = require('./config/db');

const productImages = {
  'iphone-14-pro-max-256go-or': 'iphone-14-pro-max-gold.jpg',
  'iphone-13-128go-minuit': 'iphone-13-midnight.jpg',
  'samsung-galaxy-s24-ultra-256go': 's24-ultra-violet.jpg',
  'samsung-galaxy-a55-5g-128go': 'a55-5g-blue.jpg',
  'iphone-12-64go-blanc': 'iphone-12-white.jpg',
  'xiaomi-redmi-note-13-pro-256go': 'redmi-note13-pro.jpg',
  'iphone-11-64go-noir': 'iphone-11-black.jpg',
  'samsung-galaxy-s23-fe-128go': 's23-fe-mint.jpg',
  'iphone-14-plus-128go-bleu': 'iphone-14-plus-blue.jpg',
  'oneplus-12-512go-noir': 'oneplus-12-black.jpg',
};

const products = [
  {
    name: 'iPhone 14 Pro Max 256Go - Or', slug: 'iphone-14-pro-max-256go-or',
    description: 'Smartphone Apple reconditionné, état comme neuf. Écran Super Retina XDR 6.7", puce A16 Bionic, appareil photo 48MP. Parfait pour les professionnels.',
    price: 8500, old_price: 14000, category_id: 1, brand: 'Apple', state: 'comme_neuf', featured: true,
    image: productImages['iphone-14-pro-max-256go-or'],
    specs: { Ecran: '6.7" Super Retina XDR (2796x1290)', Processeur: 'A16 Bionic', Stockage: '256 Go', RAM: '6 Go', Appareil: '48+12+12MP / 12MP', Batterie: '4323 mAh', OS: 'iOS 17', Couleur: 'Or' }
  },
  {
    name: 'iPhone 13 128Go - Minuit', slug: 'iphone-13-128go-minuit',
    description: 'iPhone 13 reconditionné en excellent état. Écran Super Retina XDR 6.1", double appareil photo 12MP. Idéal pour un usage quotidien.',
    price: 4500, old_price: 7500, category_id: 1, brand: 'Apple', state: 'tres_bon', featured: true,
    image: productImages['iphone-13-128go-minuit'],
    specs: { Ecran: '6.1" Super Retina XDR (2532x1170)', Processeur: 'A15 Bionic', Stockage: '128 Go', RAM: '4 Go', Appareil: '12+12MP / 12MP', Batterie: '3095 mAh', OS: 'iOS 17', Couleur: 'Minuit' }
  },
  {
    name: 'Samsung Galaxy S24 Ultra 256Go', slug: 'samsung-galaxy-s24-ultra-256go',
    description: 'Le meilleur de Samsung avec Galaxy AI. Écran Dynamic AMOLED 2X 6.8", S Pen intégré, appareil 200MP et puce Snapdragon 8 Gen 3.',
    price: 7200, old_price: 12500, category_id: 1, brand: 'Samsung', state: 'tres_bon', featured: true,
    image: productImages['samsung-galaxy-s24-ultra-256go'],
    specs: { Ecran: '6.8" Dynamic AMOLED 2X (3120x1440)', Processeur: 'Snapdragon 8 Gen 3', RAM: '12 Go', Stockage: '256 Go', Appareil: '200+50+12+10MP / 12MP', Batterie: '5000 mAh', S_Pen: 'Intégré', Couleur: 'Titanium Violet' }
  },
  {
    name: 'Samsung Galaxy A55 5G 128Go', slug: 'samsung-galaxy-a55-5g-128go',
    description: 'Smartphone milieu de gamme performant. Grand écran Super AMOLED 6.6", triple appareil photo 50MP, batterie 5000 mAh. Idéal rapport qualité-prix.',
    price: 2800, old_price: 4500, category_id: 1, brand: 'Samsung', state: 'comme_neuf', featured: true,
    image: productImages['samsung-galaxy-a55-5g-128go'],
    specs: { Ecran: '6.6" Super AMOLED (2340x1080)', Processeur: 'Exynos 1480', RAM: '8 Go', Stockage: '128 Go', Appareil: '50+12+5MP / 32MP', Batterie: '5000 mAh', '5G': 'Oui', Couleur: 'Bleu' }
  },
  {
    name: 'iPhone 12 64Go - Blanc', slug: 'iphone-12-64go-blanc',
    description: 'iPhone 12 reconditionné en bon état. Écran Super Retina XDR 6.1", compatible 5G. Un excellent téléphone à petit prix.',
    price: 3200, old_price: 5500, category_id: 1, brand: 'Apple', state: 'bon', featured: false,
    image: productImages['iphone-12-64go-blanc'],
    specs: { Ecran: '6.1" Super Retina XDR (2532x1170)', Processeur: 'A14 Bionic', Stockage: '64 Go', RAM: '4 Go', Appareil: '12+12MP / 12MP', Batterie: '2815 mAh', '5G': 'Oui', Couleur: 'Blanc' }
  },
  {
    name: 'Xiaomi Redmi Note 13 Pro 256Go', slug: 'xiaomi-redmi-note-13-pro-256go',
    description: 'Xiaomi Redmi Note 13 Pro reconditionné. Écran AMOLED 120Hz, appareil 200MP, charge rapide 67W. Performances exceptionnelles.',
    price: 2200, old_price: 3800, category_id: 1, brand: 'Xiaomi', state: 'tres_bon', featured: true,
    image: productImages['xiaomi-redmi-note-13-pro-256go'],
    specs: { Ecran: '6.67" AMOLED 120Hz (2712x1220)', Processeur: 'MediaTek Dimensity 7200', RAM: '8 Go', Stockage: '256 Go', Appareil: '200+8+2MP / 16MP', Batterie: '5100 mAh', Charge: '67W Turbo', Couleur: 'Noir' }
  },
  {
    name: 'iPhone 11 64Go - Noir', slug: 'iphone-11-64go-noir',
    description: 'iPhone 11 reconditionné en très bon état. Écran Liquid Retina 6.1", double appareil 12MP. Parfait pour un premier iPhone.',
    price: 2700, old_price: 4500, category_id: 1, brand: 'Apple', state: 'tres_bon', featured: false,
    image: productImages['iphone-11-64go-noir'],
    specs: { Ecran: '6.1" Liquid Retina (1792x828)', Processeur: 'A13 Bionic', Stockage: '64 Go', RAM: '4 Go', Appareil: '12+12MP / 12MP', Batterie: '3110 mAh', OS: 'iOS 17', Couleur: 'Noir' }
  },
  {
    name: 'Samsung Galaxy S23 FE 128Go', slug: 'samsung-galaxy-s23-fe-128go',
    description: 'Samsung Galaxy S23 FE reconditionné. Écran Dynamic AMOLED 120Hz, triple appareil 50MP, puce Exynos 2200. Design premium à prix accessible.',
    price: 3500, old_price: 6000, category_id: 1, brand: 'Samsung', state: 'comme_neuf', featured: true,
    image: productImages['samsung-galaxy-s23-fe-128go'],
    specs: { Ecran: '6.4" Dynamic AMOLED 120Hz (2340x1080)', Processeur: 'Exynos 2200', RAM: '8 Go', Stockage: '128 Go', Appareil: '50+12+8MP / 10MP', Batterie: '4500 mAh', '5G': 'Oui', Couleur: 'Menthe' }
  },
  {
    name: 'iPhone 14 Plus 128Go - Bleu', slug: 'iphone-14-plus-128go-bleu',
    description: 'iPhone 14 Plus reconditionné. Grand écran 6.7", puce A15 Bionic, excellente autonomie. Parfait pour les amateurs de grands formats.',
    price: 6200, old_price: 10500, category_id: 1, brand: 'Apple', state: 'tres_bon', featured: false,
    image: productImages['iphone-14-plus-128go-bleu'],
    specs: { Ecran: '6.7" Super Retina XDR (2778x1284)', Processeur: 'A15 Bionic', Stockage: '128 Go', RAM: '6 Go', Appareil: '12+12MP / 12MP', Batterie: '4325 mAh', OS: 'iOS 17', Couleur: 'Bleu' }
  },
  {
    name: 'OnePlus 12 512Go - Noir', slug: 'oneplus-12-512go-noir',
    description: 'OnePlus 12 reconditionné comme neuf. Écran AMOLED 120Hz 6.82", puce Snapdragon 8 Gen 3, charge rapide 100W. Le flagship killer ultime.',
    price: 5800, old_price: 9500, category_id: 1, brand: 'OnePlus', state: 'comme_neuf', featured: false,
    image: productImages['oneplus-12-512go-noir'],
    specs: { Ecran: '6.82" AMOLED 120Hz (3168x1440)', Processeur: 'Snapdragon 8 Gen 3', RAM: '16 Go', Stockage: '512 Go', Appareil: '50+64+48MP / 32MP', Batterie: '5400 mAh', Charge: '100W SuperVOOC', Couleur: 'Noir' }
  },
];

async function seed() {
  console.log('Seeding database...');
  for (const p of products) {
    const [existing] = await db.query('SELECT id FROM products WHERE slug = ?', [p.slug]);
    const specs = p.specs ? JSON.stringify(p.specs) : null;
    if (existing.length === 0) {
      await db.query(
        `INSERT INTO products (name, slug, description, price, old_price, category_id, brand, state, warranty, stock, featured, image, specs)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
         [p.name, p.slug, p.description, p.price, p.old_price, p.category_id, p.brand, p.state, '12 mois', 1, p.featured || false, p.image || null, specs]
      );
      console.log(`  Added: ${p.name}`);
    } else {
      await db.query('UPDATE products SET specs = ? WHERE slug = ?', [specs, p.slug]);
      console.log(`  Updated specs: ${p.name}`);
    }
  }
  console.log('Seed complete!');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed error:', err.message);
  process.exit(1);
});
