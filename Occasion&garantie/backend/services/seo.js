const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

const SITE_URL = process.env.SITE_URL || 'https://www.occasionetgarantie.store';

const CRAWLER_RE = /bot|googlebot|bingbot|slurp|duckduckbot|baiduspider|yandex|facebookexternalhit|facebot|twitterbot|linkedinbot|whatsapp|telegram|pinterest|reddit|discord|applebot|vkShare|semrush|ahrefs|mj12bot|sogou|exabot|ia_archiver/i;

function isCrawler(ua) {
  if (!ua) return false;
  return CRAWLER_RE.test(ua);
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const fmtDH = (n) => `${new Intl.NumberFormat('fr-FR').format(Number(n) || 0)} DH`;

function conditionFor(state) {
  if (state === 'neuf') return 'https://schema.org/NewCondition';
  if (state === 'comme_neuf') return 'https://schema.org/RefurbishedCondition';
  return 'https://schema.org/UsedCondition';
}

const DEFAULT_META = {
  title: "Occasion & Garantie - Acheter et vendre de l'electronique d'occasion au Maroc",
  description: "Occasion & Garantie : marketplace marocaine de produits electroniques d'occasion. Achetez et vendez smartphones, tablettes, PC, gaming et accessoires tech en toute securite.",
  keywords: 'occasion, garantie, maroc, casablanca, smartphone, iphone, samsung, xiaomi, tablette, pc, gaming, electronique, reconditionne',
  image: `${SITE_URL}/logo.png`,
  type: 'website',
  noindex: false,
  jsonLd: [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Occasion & Garantie',
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
      description: 'Marketplace marocaine de produits electroniques d\'occasion avec garantie.',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Occasion & Garantie',
      url: SITE_URL,
      inLanguage: 'fr-MA',
    },
  ],
};

const STATIC_PAGES = {
  '/about': {
    title: "A propos - Occasion & Garantie | L'electronique d'occasion au Maroc",
    description: "Decouvrez Occasion & Garantie : la plateforme marocaine dediee a l'achat et la vente de produits electroniques d'occasion avec garantie.",
    keywords: 'a propos, occasion et garantie, maroc, plateforme',
  },
  '/vendre': {
    title: 'Vendre votre electronique d\'occasion au Maroc - Occasion & Garantie',
    description: 'Vendez vos smartphones, tablettes, PC et accessoires d\'occasion au Maroc en toute securite sur Occasion & Garantie. Inscription gratuite.',
    keywords: 'vendre, occasion, maroc, smartphone, electronique',
  },
  '/reprise': {
    title: 'Reprise de votre electronique - Occasion & Garantie',
    description: 'Faites estimer et reprendre votre smartphone ou autre electronique d\'occasion au Maroc. Estimation gratuite en quelques minutes.',
    keywords: 'reprise, estimation, occasion, maroc, smartphone',
  },
  '/privacy': {
    title: 'Politique de confidentialite - Occasion & Garantie',
    description: 'Politique de confidentialite et protection des donnees d\'Occasion & Garantie.',
    keywords: 'confidentialite, occasion et garantie',
  },
  '/legal': {
    title: 'Mentions legales - Occasion & Garantie',
    description: 'Mentions legales du site Occasion & Garantie, marketplace marocaine d\'electronique d\'occasion.',
    keywords: 'mentions legales, occasion et garantie',
  },
  '/products': {
    title: 'Tous les produits electroniques d\'occasion au Maroc - Occasion & Garantie',
    description: "Parcourez des centaines de smartphones, tablettes, PC et accessoires d'occasion au Maroc. Achetez en toute securite avec garantie.",
    keywords: 'occasion, maroc, smartphone, tablette, pc, accessoires, gaming',
  },
  '/boutique': {
    title: 'Boutique Officielle - Electronique d\'occasion - Occasion & Garantie',
    description: 'La Boutique Officielle Occasion & Garantie : produits electroniques d\'occasion verifies, testes et garantis, disponibles au Maroc.',
    keywords: 'boutique officielle, occasion, garantie, maroc',
  },
};

let baseHtmlCache = null;

function loadBaseHtml() {
  if (baseHtmlCache) return baseHtmlCache;
  const file = path.join(__dirname, '..', 'public', 'index.html');
  if (!fs.existsSync(file)) return null;
  baseHtmlCache = fs.readFileSync(file, 'utf8');
  return baseHtmlCache;
}

async function getProductMeta(segments, isStore) {
  const slug = segments[1];
  if (!slug) return null;
  const [rows] = await pool.query(
    `SELECT p.*, c.name AS category_name
     FROM products p LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.slug = ? LIMIT 1`,
    [slug]
  );
  if (rows.length === 0) return null;
  const p = rows[0];
  const base = isStore ? '/boutique' : '/products';
  const canonical = `${SITE_URL}${base}/${p.slug}`;
  const image = p.image && !/^https?:\/\//i.test(p.image) ? `${SITE_URL}${p.image.startsWith('/') ? '' : '/'}${p.image}` : p.image;
  const storePart = isStore ? ' de la Boutique Officielle' : '';
  const title = `${p.name} - ${fmtDH(p.price)}${storePart} | Occasion & Garantie`;
  const description = `${p.name}${p.brand ? ` (${p.brand})` : ''} d'occasion${storePart.toLowerCase()} a ${fmtDH(p.price)}${p.ville ? ` a ${p.ville}` : ''} au Maroc avec garantie. Achetez en toute securite sur Occasion & Garantie.`;
  const offer = {
    '@type': 'Offer',
    priceCurrency: 'MAD',
    price: Number(p.price),
    url: canonical,
    availability: 'https://schema.org/InStock',
    itemCondition: conditionFor(p.state),
  };
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: p.name,
      image: image || undefined,
      description: (p.description || '').slice(0, 300),
      brand: p.brand ? { '@type': 'Brand', name: p.brand } : undefined,
      category: p.category_name,
      offers: offer,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: p.category_name || 'Produits', item: `${SITE_URL}/products?category=${encodeURIComponent((p.category_name || '').toLowerCase())}` },
        { '@type': 'ListItem', position: 3, name: p.name, item: canonical },
      ],
    },
  ];
  return {
    title,
    description,
    keywords: `${p.name}, ${p.brand || ''}, ${p.category_name || ''}, occasion, ${p.ville || 'maroc'}, garantie`,
    image: image || DEFAULT_META.image,
    type: 'product',
    noindex: false,
    canonical,
    jsonLd,
  };
}

async function buildMeta(req) {
  const url = new URL(req.url, SITE_URL);
  const pathname = url.pathname.replace(/\/+$/, '') || '/';
  const segments = pathname.split('/').filter(Boolean);
  const query = url.searchParams;

  if (pathname === '/') {
    return { ...DEFAULT_META, canonical: `${SITE_URL}/`, jsonLd: DEFAULT_META.jsonLd };
  }

  if (segments[0] === 'products') {
    if (segments.length > 1) {
      const meta = await getProductMeta(segments, false);
      if (meta) return meta;
    }
    const category = query.get('category');
    const brand = query.get('brand');
    let title = DEFAULT_META.title;
    let description = DEFAULT_META.description;
    let keywords = DEFAULT_META.keywords;
    if (category) {
      title = `${category.charAt(0).toUpperCase() + category.slice(1)} d'occasion au Maroc - Occasion & Garantie`;
      description = `Achetez des ${category.toLowerCase()} d'occasion au Maroc avec garantie sur Occasion & Garantie : smartphones, tablettes, PC, accessoires et gaming.`;
      keywords = `${category}, occasion, maroc, garantie, electronique`;
    } else if (brand) {
      title = `${brand.charAt(0).toUpperCase() + brand.slice(1)} d'occasion au Maroc - Occasion & Garantie`;
      description = `Trouvez des produits ${brand.charAt(0).toUpperCase() + brand.slice(1)} d'occasion au Maroc avec garantie sur Occasion & Garantie.`;
      keywords = `${brand}, occasion, maroc, garantie`;
    }
    return {
      ...DEFAULT_META,
      title,
      description,
      keywords,
      canonical: `${SITE_URL}${pathname}${url.search}`,
      jsonLd: DEFAULT_META.jsonLd,
    };
  }

  if (segments[0] === 'boutique') {
    if (segments.length > 1) {
      const meta = await getProductMeta(segments, true);
      if (meta) return meta;
    }
    const base = STATIC_PAGES['/boutique'];
    return {
      ...DEFAULT_META,
      ...base,
      canonical: `${SITE_URL}/boutique${url.search}`,
      jsonLd: DEFAULT_META.jsonLd,
    };
  }

  if (STATIC_PAGES[pathname]) {
    return {
      ...DEFAULT_META,
      ...STATIC_PAGES[pathname],
      canonical: `${SITE_URL}${pathname}`,
      jsonLd: DEFAULT_META.jsonLd,
    };
  }

  if (/^\/(login|signup|verify-code|forgot-password|reset-password|admin|seller|messenger|profile|offres|notifications|reprise\/list)/.test(pathname)) {
    return { ...DEFAULT_META, title: DEFAULT_META.title, description: DEFAULT_META.description, noindex: true, canonical: `${SITE_URL}${pathname}` };
  }

  return { ...DEFAULT_META, canonical: `${SITE_URL}${pathname}` };
}

function renderSeoHtml(meta) {
  const base = loadBaseHtml();
  if (!base) return null;
  const { title, description, keywords, image, type, noindex, canonical, jsonLd } = meta;

  let html = base
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${esc(title)}</title>`)
    .replace(/<meta name="description"[^>]*>/i, `<meta name="description" content="${esc(description)}" />`)
    .replace(/<meta name="keywords"[^>]*>/i, `<meta name="keywords" content="${esc(keywords)}" />`)
    .replace(/<meta name="robots"[^>]*>/i, `<meta name="robots" content="${noindex ? 'noindex, nofollow' : 'index, follow'}" />`);

  const head = [
    `<link rel="canonical" href="${esc(canonical || SITE_URL)}" />`,
    `<meta property="og:site_name" content="Occasion & Garantie" />`,
    `<meta property="og:type" content="${type === 'product' ? 'product' : 'website'}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${esc(canonical || SITE_URL)}" />`,
    `<meta property="og:locale" content="fr_MA" />`,
    `<meta property="og:image" content="${esc(image || DEFAULT_META.image)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    `<meta name="twitter:image" content="${esc(image || DEFAULT_META.image)}" />`,
  ];
  if (Array.isArray(jsonLd) && jsonLd.length) {
    jsonLd.forEach((ld, i) => {
      head.push(`<script type="application/ld+json" data-seo-ld="${i}">${JSON.stringify(ld)}</script>`);
    });
  } else if (jsonLd && typeof jsonLd === 'object') {
    head.push(`<script type="application/ld+json" data-seo-ld="0">${JSON.stringify(jsonLd)}</script>`);
  }

  return html.replace('</head>', `${head.join('\n    ')}\n  </head>`);
}

async function buildSitemap() {
  const entries = [];
  const add = (loc, lastmod) => {
    entries.push({ loc: `${SITE_URL}${loc}`, lastmod });
  };

  add('/', null);
  ['products', 'boutique', 'about', 'vendre', 'reprise', 'privacy', 'legal'].forEach((p) => add(`/${p}`, null));

  const [cats] = await pool.query('SELECT slug FROM categories');
  cats.forEach((c) => add(`/products?category=${encodeURIComponent(c.slug)}`, null));

  const [prods] = await pool.query(
    "SELECT slug, product_type, created_at FROM products WHERE active = TRUE AND status = 'disponible' AND approved = TRUE"
  );
  prods.forEach((p) => {
    const base = p.product_type === 'store' ? '/boutique' : '/products';
    const lastmod = p.created_at ? new Date(p.created_at).toISOString() : null;
    add(`${base}/${p.slug}`, lastmod);
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries
    .map((e) => `  <url>\n    <loc>${esc(e.loc)}</loc>${e.lastmod ? `\n    <lastmod>${e.lastmod}</lastmod>` : ''}\n  </url>`)
    .join('\n')}\n</urlset>`;
  return xml;
}

module.exports = { isCrawler, buildMeta, renderSeoHtml, buildSitemap, SITE_URL };
