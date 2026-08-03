const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const authenticate = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Accès refusé. Token manquant.' });
  }
  let decoded;
  try {
    decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: 'Token invalide.' });
  }
  req.user = decoded;

  try {
    await pool.query("ALTER TABLE users ADD COLUMN suspended TINYINT(1) DEFAULT 0"); } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') {}
  }
  try {
    await pool.query("ALTER TABLE users ADD COLUMN suspension_reason VARCHAR(255) DEFAULT NULL"); } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') {}
  }

  try {
    const [rows] = await pool.query('SELECT id, suspended, suspension_reason FROM users WHERE id = ?', [decoded.id]);
    if (rows.length > 0 && rows[0].suspended) {
      return res.status(403).json({
        message: 'Votre compte a ete suspendu. Raison : ' + (rows[0].suspension_reason || 'Non specifiee') + '. Contactez l\'administration.',
        suspended: true,
        suspension_reason: rows[0].suspension_reason,
      });
    }
  } catch (e) {
    if (e.errno === 1054 || e.code === 'ER_BAD_FIELD_ERROR') {
      // colonnes pas encore presentes, on laisse passer
    } else {
      console.error('authenticate suspension check error:', e.message);
    }
  }

  next();
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Accès réservé aux administrateurs.' });
  }
  next();
};

const sellerOrAdmin = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'seller') {
    return res.status(403).json({ message: 'Accès réservé aux vendeurs et administrateurs.' });
  }
  next();
};

module.exports = { authenticate, adminOnly, sellerOrAdmin };
