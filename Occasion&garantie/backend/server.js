require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const authRoutes = require('./routes/auth');
const { authenticate, adminOnly } = require('./middleware/auth');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const uploadRoutes = require('./routes/upload');
const reservationRoutes = require('./routes/reservations');
const adminRoutes = require('./routes/admin');
const premiumRoutes = require('./routes/premium');
const sellerRoutes = require('./routes/seller');
const chatRoutes = require('./routes/chat');
const contactRoutes = require('./routes/contact');
const pool = require('./config/db');
const { ensureTables } = require('./services/tracker');
const seo = require('./services/seo');

(async () => {
  await ensureTables();
  try {
    await pool.query('ALTER TABLE users ADD COLUMN premium BOOLEAN DEFAULT FALSE');
  } catch {}
  try {
    await pool.query('ALTER TABLE users ADD COLUMN premium_expires_at DATETIME NULL');
  } catch {}
  try {
    await pool.query('ALTER TABLE users ADD COLUMN avatar VARCHAR(255) DEFAULT NULL');
  } catch {}
  try {
    await pool.query('ALTER TABLE users ADD COLUMN terms_accepted BOOLEAN DEFAULT FALSE');
  } catch {}
  try {
    await pool.query('ALTER TABLE users ADD COLUMN credit_balance DECIMAL(10,2) DEFAULT 0');
  } catch {}
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS credit_transactions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      type VARCHAR(20) NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      description VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    console.log('credit_transactions table ready');
  } catch (e) {
    console.log('credit_transactions table check skipped:', e.message);
  }
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS credit_purchases (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      amount_dh DECIMAL(10,2) NOT NULL,
      credits INT NOT NULL,
      status VARCHAR(20) DEFAULT 'en_attente',
      rejection_reason VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      confirmed_at TIMESTAMP NULL
    )`);
    console.log('credit_purchases table ready');
  } catch (e) {
    console.log('credit_purchases table check skipped:', e.message);
  }
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS reprises (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      product_id INT DEFAULT NULL,
      brand VARCHAR(100) NOT NULL,
      model VARCHAR(200) NOT NULL,
      imei VARCHAR(20) DEFAULT NULL,
      photos JSON DEFAULT NULL,
      client_notes TEXT DEFAULT NULL,
      status ENUM('en_attente','estime','accepte','refuse','converti') DEFAULT 'en_attente',
      estimated_price DECIMAL(10,2) DEFAULT NULL,
      vendor_id INT DEFAULT NULL,
      vendor_notes TEXT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);
    console.log('reprises table ready');
  } catch (e) {
    console.log('reprises table check skipped:', e.message);
  }
  try { await pool.query("ALTER TABLE products ADD COLUMN type ENUM('vente','reprise') DEFAULT 'vente'"); } catch (e) { if (e.errno !== 1060) console.log('type col:', e.message); }
  try { await pool.query("ALTER TABLE products ADD COLUMN imei VARCHAR(20) DEFAULT NULL"); } catch (e) { if (e.errno !== 1060) console.log('imei col:', e.message); }
  try { await pool.query("ALTER TABLE products ADD COLUMN reprise_id INT DEFAULT NULL"); } catch (e) { if (e.errno !== 1060) console.log('reprise_id col:', e.message); }
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS installments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      buyer_id INT NOT NULL,
      seller_id INT NOT NULL,
      total_price DECIMAL(10,2) NOT NULL,
      down_payment DECIMAL(10,2) DEFAULT 0,
      monthly_amount DECIMAL(10,2) NOT NULL,
      months INT NOT NULL DEFAULT 3,
      status VARCHAR(20) DEFAULT 'en_attente',
      paid_months INT DEFAULT 0,
      rejection_reason VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);
    console.log('installments table ready');
  } catch (e) {
    console.log('installments table check skipped:', e.message);
  }
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS negotiations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      buyer_id INT NOT NULL,
      seller_id INT NOT NULL,
      offered_price DECIMAL(10,2) NOT NULL,
      counter_price DECIMAL(10,2) NULL,
      counter_by INT NULL,
      message VARCHAR(500),
      status VARCHAR(20) DEFAULT 'en_attente',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);
    console.log('negotiations table ready');
  } catch (e) {
    console.log('negotiations table check skipped:', e.message);
  }
  try {
    await pool.query("UPDATE users SET email = 'contact@contact.occasionetgarantie.store' WHERE email = 'admin@og.fr'");
    console.log('Admin email migrated');
  } catch {}
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      is_active BOOLEAN DEFAULT TRUE
    )`);
    console.log('newsletter_subscribers table ready');
  } catch (e) {
    console.log('newsletter_subscribers table check skipped:', e.message);
  }

  const app = express();
  app.set('trust proxy', 1);
  const PORT = process.env.PORT || 5000;

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: { message: 'Trop de requêtes. Réessayez dans 15 minutes.' },
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    message: { message: 'Trop de tentatives. Réessayez dans 15 minutes.' },
  });

  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
  }));
  app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
  app.use(express.json({ limit: '10mb' }));
  app.use('/api/', limiter);

  app.get('/robots.txt', (req, res) => {
    res.type('text/plain').send(`User-agent: *\nAllow: /\n\nSitemap: ${seo.SITE_URL}/sitemap.xml\n`);
  });

  app.get('/sitemap.xml', async (req, res) => {
    try {
      const xml = await seo.buildSitemap();
      res.type('application/xml').send(xml);
    } catch (err) {
      console.error('sitemap failed:', err.message);
      res.type('application/xml').send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
    }
  });

  app.use(async (req, res, next) => {
    if (req.method !== 'GET') return next();
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.includes('.')) return next();
    if (!seo.isCrawler(req.get('user-agent'))) return next();
    try {
      const meta = await seo.buildMeta(req);
      const html = seo.renderSeoHtml(meta);
      if (html) return res.type('html').send(html);
    } catch (err) {
      console.error('SEO prerender failed:', err.message);
    }
    next();
  });

  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
  app.use(express.static(path.join(__dirname, 'public')));
  app.get('/favicon.ico', (req, res) => res.redirect(301, '/favicon.png'));

  app.get('/demo', (req, res) => res.redirect('/demo/marketing-demo-embedded.html'));
  app.get('/demo/full', (req, res) => res.redirect('/demo/marketing-demo-site.html'));
  app.use('/demo', express.static(path.join(__dirname, 'demo')));
  app.get('/marketing-demo-embedded.html', (req, res) => res.redirect('/demo'));
  app.get('/marketing-demo-site.html', (req, res) => res.redirect('/demo/full'));

  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/upload', uploadRoutes);
  app.use('/api/reservations', reservationRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/premium', premiumRoutes);
  app.use('/api/seller', sellerRoutes);
  app.use('/api/chat', chatRoutes);
  app.use('/api/contact', contactRoutes);
  app.use('/api/newsletter', require('./routes/newsletter'));
  app.use('/api/ratings', require('./routes/ratings'));
  app.use('/api/public', require('./routes/public'));
  app.use('/api/reprises', require('./routes/reprises'));
  app.use('/api/negotiations', require('./routes/negotiations'));
  app.use('/api/notifications', require('./routes/notifications'));
  app.use('/api/store', require('./routes/store'));

  const { startNewsletterCron, sendNewsletterToAll } = require('./services/newsletterCron');
  app.post('/api/newsletter/trigger', authenticate, adminOnly, async (req, res) => {
    try {
      await sendNewsletterToAll();
      res.json({ message: 'Newsletter envoyee.' });
    } catch (err) {
      res.status(500).json({ message: 'Erreur.' });
    }
  });

  app.get('/ads.txt', (req, res) => {
    res.type('text/plain').send('google.com, pub-3266333749754332, DIRECT, f08c47fec0942fa0');
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Occasion&Garantie API running' });
  });

  app.get('/api/stats', async (req, res) => {
    try {
      const [prod] = await pool.query('SELECT COUNT(*) as cnt FROM products WHERE active = TRUE AND status = \'disponible\'');
      const [clients] = await pool.query('SELECT COUNT(*) as cnt FROM users WHERE role = \'client\'');
      const [ratings] = await pool.query('SELECT ROUND(AVG(rating), 1) as avg FROM seller_ratings');
      const satisfaction = ratings[0]?.avg ? Math.round((ratings[0].avg / 5) * 100) : 98;
      res.json({ products: prod[0].cnt, clients: clients[0].cnt, satisfaction });
    } catch (e) {
      res.status(500).json({ message: 'Erreur serveur.' });
    }
  });

  app.use('/api/*', (req, res) => {
    res.status(404).json({ message: 'Endpoint API introuvable.' });
  });

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  });

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('AI image validator: active (sharp local analysis)');
    try { startNewsletterCron(); } catch (e) { console.log('Newsletter cron init:', e.message); }
  });
})();
