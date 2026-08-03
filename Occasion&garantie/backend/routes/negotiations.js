const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

(async () => {
  try {
    await pool.query('ALTER TABLE negotiations ADD COLUMN counter_price DECIMAL(10,2) NULL');
  } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') console.log('counter_price col:', e.message); }
  try {
    await pool.query('ALTER TABLE negotiations ADD COLUMN counter_by INT NULL');
  } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') console.log('counter_by col:', e.message); }
  try {
    await pool.query('ALTER TABLE conversations ADD COLUMN negotiation_id INT NULL');
  } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') console.log('negotiation_id col:', e.message); }
})();

async function ensureNotifications() {
  await pool.query(`CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type VARCHAR(50) DEFAULT 'general',
    title VARCHAR(200) NOT NULL,
    message TEXT DEFAULT NULL,
    link VARCHAR(500) DEFAULT NULL,
    read_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) DEFAULT CHARSET=utf8mb4`);
}

async function ensureConversations() {
  await pool.query(`CREATE TABLE IF NOT EXISTS conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    buyer_id INT NOT NULL,
    seller_id INT NOT NULL,
    product_id INT,
    product_name VARCHAR(200),
    negotiation_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) DEFAULT CHARSET=utf8mb4`);
  await pool.query(`CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    sender_id INT NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) DEFAULT CHARSET=utf8mb4`);
}

// Buyer: create a price offer on a product
router.post('/', authenticate, async (req, res) => {
  try {
    const { product_id, offered_price, message } = req.body;
    if (!product_id) return res.status(400).json({ message: 'Produit requis.' });
    const price = parseFloat(offered_price);
    if (!price || price <= 0) return res.status(400).json({ message: 'Prix proposé invalide.' });
    if (message && message.length > 500) return res.status(400).json({ message: 'Message limité à 500 caractères.' });

    const [prods] = await pool.query('SELECT seller_id, name, price FROM products WHERE id = ?', [product_id]);
    if (prods.length === 0) return res.status(404).json({ message: 'Produit introuvable.' });
    const prod = prods[0];
    if (prod.seller_id === req.user.id) return res.status(400).json({ message: 'Vous ne pouvez pas négocier votre propre produit.' });

    const [result] = await pool.query(
      'INSERT INTO negotiations (product_id, buyer_id, seller_id, offered_price, message, status) VALUES (?, ?, ?, ?, ?, ?)',
      [product_id, req.user.id, prod.seller_id, price, message || null, 'en_attente']
    );

    try {
      await ensureNotifications();
      const [buyers] = await pool.query('SELECT full_name FROM users WHERE id = ?', [req.user.id]);
      const bName = buyers[0]?.full_name || 'Un client';
      await pool.query(
        'INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)',
        [prod.seller_id, 'negociation_new', 'Nouvelle offre de prix',
         `${bName} propose ${price} DH pour "${prod.name}".`,
         '/seller']
      );
    } catch (nErr) { console.error('Notification failed:', nErr.message); }

    res.status(201).json({ id: result.insertId, message: 'Offre envoyée au vendeur.' });
  } catch (err) {
    console.error('POST /negotiations:', err.message);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Buyer: list my offers
router.get('/mine', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT n.*, p.name as product_name, p.image as product_image, p.slug as product_slug,
              (SELECT c.id FROM conversations c WHERE c.negotiation_id = n.id LIMIT 1) as conversation_id
       FROM negotiations n
       LEFT JOIN products p ON n.product_id = p.id
       WHERE n.buyer_id = ?
       ORDER BY n.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /negotiations/mine:', err.message);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Seller: list offers on my products
router.get('/vendor', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT n.*, p.name as product_name, p.image as product_image, p.slug as product_slug,
              u.full_name as buyer_name
       FROM negotiations n
       LEFT JOIN products p ON n.product_id = p.id
       LEFT JOIN users u ON n.buyer_id = u.id
       WHERE n.seller_id = ?
       ORDER BY CASE WHEN n.status = 'en_attente' OR n.status = 'contre_offre' THEN 0 ELSE 1 END, n.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /negotiations/vendor:', err.message);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Ensure a dedicated conversation exists for an accepted negotiation.
// The confirmation of the agreed price is the FIRST message.
async function ensureAcceptedConversation(neg, price) {
  await ensureConversations();
  const [prods] = await pool.query('SELECT name FROM products WHERE id = ?', [neg.product_id]);
  const pName = prods[0]?.name || 'Produit';

  let [convs] = await pool.query('SELECT * FROM conversations WHERE negotiation_id = ? LIMIT 1', [neg.id]);
  if (convs.length === 0) {
    const [result] = await pool.query(
      'INSERT INTO conversations (buyer_id, seller_id, product_id, product_name, negotiation_id) VALUES (?, ?, ?, ?, ?)',
      [neg.buyer_id, neg.seller_id, neg.product_id, pName, neg.id]
    );
    convs = [{ id: result.insertId }];
  }
  const conv = convs[0];

  const [msgs] = await pool.query('SELECT COUNT(*) as cnt FROM messages WHERE conversation_id = ?', [conv.id]);
  if (msgs[0].cnt === 0) {
    await pool.query(
      'INSERT INTO messages (conversation_id, sender_id, text) VALUES (?, ?, ?)',
      [conv.id, neg.seller_id, `Prix accepté : ${price} DH pour "${pName}".`]
    );
  }
  return conv.id;
}

// Respond to an offer: seller can accept / refuse / counter-offer.
// After a counter-offer, the buyer can also accept / refuse / counter again.
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { status, price } = req.body;
    if (!['acceptee', 'refusee', 'contre_offre', 'annulee'].includes(status)) {
      return res.status(400).json({ message: 'Statut invalide.' });
    }

    const [rows] = await pool.query('SELECT * FROM negotiations WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Offre introuvable.' });
    const neg = rows[0];
    if (req.user.role !== 'admin' && neg.seller_id !== req.user.id && neg.buyer_id !== req.user.id) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }
    if (['acceptee', 'refusee', 'annulee'].includes(neg.status)) {
      return res.status(400).json({ message: 'Cette offre a déjà été traitée.' });
    }

    const isSeller = neg.seller_id === req.user.id;
    const isBuyer = neg.buyer_id === req.user.id;

    // Buyer can cancel their own pending offer at any time
    if (status === 'annulee') {
      if (!isBuyer && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Seul le client peut annuler cette offre.' });
      }
      await pool.query('UPDATE negotiations SET status = ? WHERE id = ?', ['annulee', req.params.id]);
      try {
        await ensureNotifications();
        const [prods] = await pool.query('SELECT name FROM products WHERE id = ?', [neg.product_id]);
        const pName = prods[0]?.name || 'Produit';
        const cancelledPrice = neg.counter_price != null ? Number(neg.counter_price) : Number(neg.offered_price);
        await pool.query(
          'INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)',
          [neg.seller_id, 'negociation_annulee', 'Offre annulée',
           `Le client a annulé sa négociation de ${cancelledPrice} DH pour "${pName}".`,
           '/seller']
        );
      } catch (nErr) { console.error('Notification failed:', nErr.message); }
      return res.json({ message: 'Offre annulée.' });
    }

    if (neg.status === 'en_attente') {
      if (!isSeller && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Le vendeur doit répondre à cette offre.' });
      }
    } else if (neg.status === 'contre_offre') {
      if (neg.counter_by === req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'En attente de la réponse de l\'autre partie.' });
      }
    }

    const [prods] = await pool.query('SELECT name FROM products WHERE id = ?', [neg.product_id]);
    const pName = prods[0]?.name || 'Produit';

    // Counter-offer
    if (status === 'contre_offre') {
      const p = parseFloat(price);
      if (!p || p <= 0) return res.status(400).json({ message: 'Prix proposé invalide.' });
      await pool.query(
        'UPDATE negotiations SET status = ?, counter_price = ?, counter_by = ? WHERE id = ?',
        ['contre_offre', p, req.user.id, req.params.id]
      );
      try {
        await ensureNotifications();
        const otherId = isSeller ? neg.buyer_id : neg.seller_id;
        const [names] = await pool.query('SELECT full_name FROM users WHERE id = ?', [req.user.id]);
        const actorName = names[0]?.full_name || (isSeller ? 'Le vendeur' : 'Le client');
        await pool.query(
          'INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)',
          [otherId, 'negociation_contreoffre', 'Nouvelle contre-offre',
           `${actorName} propose ${p} DH pour "${pName}".`,
           isSeller ? '/offres' : '/seller']
        );
      } catch (nErr) { console.error('Notification failed:', nErr.message); }
      return res.json({ message: 'Contre-offre envoyée.' });
    }

    // Accept (final price = last counter price, else buyer's original offer)
    if (status === 'acceptee') {
      const agreedPrice = neg.counter_price != null ? Number(neg.counter_price) : Number(neg.offered_price);
      await pool.query('UPDATE negotiations SET status = ? WHERE id = ?', ['acceptee', req.params.id]);

      const convId = await ensureAcceptedConversation(neg, agreedPrice);

      try {
        await ensureNotifications();
        const [sellers] = await pool.query('SELECT full_name FROM users WHERE id = ?', [neg.seller_id]);
        const sName = sellers[0]?.full_name || 'Le vendeur';
        const [buyers] = await pool.query('SELECT full_name FROM users WHERE id = ?', [neg.buyer_id]);
        const bName = buyers[0]?.full_name || 'Le client';
        const msgLink = `/messenger/${convId}`;
        await pool.query(
          'INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)',
          [neg.buyer_id, 'negociation_acceptee', 'Offre acceptée !',
           `${sName} a accepté le prix de ${agreedPrice} DH pour "${pName}".`, msgLink]
        );
        await pool.query(
          'INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)',
          [neg.seller_id, 'negociation_acceptee', 'Offre acceptée !',
           `Vous avez accepté le prix de ${agreedPrice} DH pour "${pName}" avec ${bName}.`, msgLink]
        );
      } catch (nErr) { console.error('Notification failed:', nErr.message); }

      return res.json({ message: 'Offre acceptée.', conversation_id: convId });
    }

    // Refuse
    await pool.query('UPDATE negotiations SET status = ? WHERE id = ?', ['refusee', req.params.id]);
    try {
      await ensureNotifications();
      const otherId = isSeller ? neg.buyer_id : neg.seller_id;
      const refusedPrice = neg.counter_price != null ? Number(neg.counter_price) : Number(neg.offered_price);
      const [names] = await pool.query('SELECT full_name FROM users WHERE id = ?', [req.user.id]);
      const actorName = names[0]?.full_name || (isSeller ? 'Le vendeur' : 'Le client');
      await pool.query(
        'INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)',
        [otherId, 'negociation_refusee', 'Offre refusée',
         `${actorName} a refusé le prix de ${refusedPrice} DH pour "${pName}".`,
         isSeller ? '/products' : '/seller']
      );
    } catch (nErr) { console.error('Notification failed:', nErr.message); }

    res.json({ message: 'Offre refusée.' });
  } catch (err) {
    console.error('PUT /negotiations/:id:', err.message);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;
