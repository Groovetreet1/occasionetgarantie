const express = require('express');
const pool = require('../config/db');
const { authenticate, sellerOrAdmin } = require('../middleware/auth');

const router = express.Router();

function maskName(name) {
  if (!name) return 'U***';
  return String(name).trim().split(/\s+/).filter(Boolean).map(w => {
    if (w.length <= 1) return '*';
    if (w.length === 2) return w[0] + '*';
    return w.slice(0, 2) + '***';
  }).join(' ');
}

function maskEmail(email) {
  if (!email || !email.includes('@')) return '***@***';
  const [local, domain] = String(email).split('@');
  const l = local.length <= 1 ? '*' : local.length === 2 ? local[0] + '*' : local.slice(0, 2) + '***';
  const parts = domain.split('.');
  const d0 = parts[0] || '';
  const d = d0.length <= 1 ? '*' : d0[0] + '***';
  const tld = parts.length > 1 ? '.' + parts.slice(1).join('.') : '';
  return `${l}@${d}${tld}`;
}

// Get seller's own profile + stats
router.get('/me', authenticate, async (req, res) => {
  if (req.user.role !== 'seller' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Accès réservé aux vendeurs.' });
  }
  try {
    const [users] = await pool.query(
      'SELECT id, full_name, email, phone, store_name, store_logo, avatar, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (users.length === 0) return res.status(404).json({ message: 'Utilisateur introuvable.' });
    const [products] = await pool.query(
      'SELECT COUNT(*) as total, SUM(CASE WHEN active=TRUE THEN 1 ELSE 0 END) as active_count FROM products WHERE seller_id = ?',
      [req.user.id]
    );
    const [recent] = await pool.query(
      'SELECT id, name, price, active, created_at FROM products WHERE seller_id = ? ORDER BY created_at DESC LIMIT 5',
      [req.user.id]
    );
    res.json({ ...users[0], stats: products[0], recentProducts: recent });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Update seller profile
router.put('/me', authenticate, async (req, res) => {
  if (req.user.role !== 'seller' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Accès réservé aux vendeurs.' });
  }
  try {
    const { store_name, store_logo } = req.body;
    await pool.query('UPDATE users SET store_name = ?, store_logo = ? WHERE id = ?', [store_name || null, store_logo || null, req.user.id]);
    res.json({ message: 'Profil vendeur mis à jour.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Get seller's own products (including inactive)
router.get('/me/products', authenticate, async (req, res) => {
  if (req.user.role !== 'seller' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Accès réservé aux vendeurs.' });
  }
  try {
    const [rows] = await pool.query(
      `SELECT p.*, c.name as category_name FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.seller_id = ? ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Public seller profile
router.get('/:id', async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, full_name, store_name, store_logo, avatar, created_at, premium FROM users WHERE id = ? AND role = ?',
      [req.params.id, 'seller']
    );
    if (users.length === 0) return res.status(404).json({ message: 'Vendeur introuvable.' });
    const [count] = await pool.query(
      'SELECT COUNT(*) as total FROM products WHERE seller_id = ? AND active = TRUE',
      [req.params.id]
    );
    const [rating] = await pool.query(
      'SELECT COUNT(*) as rating_count, ROUND(AVG(rating), 1) as rating_avg FROM seller_ratings WHERE seller_id = ?',
      [req.params.id]
    );
    res.json({ ...users[0], productCount: count[0].total, ...rating[0] });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Public seller products
router.get('/:id/products', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, c.name as category_name, u.premium as seller_premium FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       JOIN users u ON u.id = p.seller_id
       WHERE p.seller_id = ? AND p.active = TRUE ORDER BY RAND()`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Get seller commissions
router.get('/me/commissions', authenticate, async (req, res) => {
  if (req.user.role !== 'seller' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Accès réservé aux vendeurs.' });
  }
  try {
    const [rows] = await pool.query(
      `SELECT c.*, p.name as product_name FROM commissions c
       LEFT JOIN products p ON c.product_id = p.id
       WHERE c.seller_id = ? ORDER BY c.created_at DESC`,
      [req.user.id]
    );
    const [totalRow] = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as total_commission, COUNT(*) as count FROM commissions WHERE seller_id = ?',
      [req.user.id]
    );
    res.json({ commissions: rows, summary: totalRow[0] });
  } catch (err) {
    if (err.errno === 1146 || err.code === 'ER_NO_SUCH_TABLE') {
      return res.json({ commissions: [], summary: { total_commission: 0, count: 0 } });
    }
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Referral stats for current seller
router.get('/me/referrals', authenticate, async (req, res) => {
  if (req.user.role !== 'seller' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Accès réservé aux vendeurs.' });
  }
  try {
    try { await pool.query("ALTER TABLE users ADD COLUMN referral_code VARCHAR(20) DEFAULT NULL"); } catch {}
    try { await pool.query("ALTER TABLE users ADD COLUMN referred_by INT DEFAULT NULL"); } catch {}
    const [me] = await pool.query('SELECT id, referral_code FROM users WHERE id = ?', [req.user.id]);
    if (!me.length) return res.status(404).json({ message: 'Utilisateur introuvable.' });
    let code = me[0].referral_code;
    if (!code) {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let out = 'OG';
      for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
      code = out;
      try { await pool.query('UPDATE users SET referral_code = ? WHERE id = ? AND (referral_code IS NULL OR referral_code = "")', [code, req.user.id]); } catch {}
      const [chk] = await pool.query('SELECT referral_code FROM users WHERE id = ?', [req.user.id]);
      code = chk[0]?.referral_code || code;
    }
    let rows = [];
    try {
      const [r] = await pool.query(
        'SELECT id, full_name, email, role, phone_verified, created_at FROM users WHERE referred_by = ? ORDER BY created_at DESC',
        [req.user.id]
      );
      rows = r;
    } catch (e) {
      if (e.errno === 1054 || e.code === 'ER_BAD_FIELD_ERROR') rows = [];
      else throw e;
    }
    const clientUrl = process.env.CLIENT_URL || 'https://www.occasionetgarantie.store';
    const referrals = rows.map(u => ({
      id: u.id,
      name: maskName(u.full_name),
      email: maskEmail(u.email),
      role: u.role,
      phone_verified: !!u.phone_verified,
      created_at: u.created_at,
    }));
    const total = referrals.length;
    res.json({
      code,
      link: `${clientUrl}/parrainage/${encodeURIComponent(code)}`,
      rewardPerSignup: 100,
      total,
      totalCreditsEarned: total * 100,
      referrals,
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;
