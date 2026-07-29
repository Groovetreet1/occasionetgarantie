const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');
const emails = require('../emails');

(async () => {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS conversations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      buyer_id INT NOT NULL,
      seller_id INT NOT NULL,
      product_id INT,
      product_name VARCHAR(200),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      conversation_id INT NOT NULL,
      sender_id INT NOT NULL,
      text TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
    )`);
    console.log('conversations + messages tables ready');
  } catch (e) {
    console.log('chat tables check skipped:', e.message);
  }
})();

router.post('/conversations', authenticate, async (req, res) => {
  try {
    const { sellerId, productId, productName } = req.body;
    if (!sellerId) return res.status(400).json({ message: 'sellerId requis.' });
    if (req.user.id === sellerId) return res.status(400).json({ message: 'Vous ne pouvez pas vous ecrire a vous-meme.' });

    const [existing] = await pool.query(
      'SELECT * FROM conversations WHERE buyer_id = ? AND seller_id = ? AND (product_id = ? OR (product_id IS NULL AND ? IS NULL)) ORDER BY updated_at DESC LIMIT 1',
      [req.user.id, sellerId, productId || null, productId || null]
    );
    if (existing.length > 0) return res.json(existing[0]);

    const [result] = await pool.query(
      'INSERT INTO conversations (buyer_id, seller_id, product_id, product_name) VALUES (?, ?, ?, ?)',
      [req.user.id, sellerId, productId || null, productName || null]
    );
    const conv = { id: result.insertId, buyer_id: req.user.id, seller_id: sellerId, product_id: productId, product_name: productName };

    try {
      const [sellerRows] = await pool.query('SELECT admin_managed_id FROM users WHERE id = ?', [sellerId]);
      if (sellerRows.length > 0 && sellerRows[0].admin_managed_id) {
        const [adminRows] = await pool.query('SELECT email FROM users WHERE id = ?', [sellerRows[0].admin_managed_id]);
        if (adminRows.length > 0) {
          const buyer = req.user;
          const msg = "Nouveau message recu sur un compte vendeur gere.<br><br>" +
            "<strong>Vendeur :</strong> " + (conv.product_name || '#' + sellerId) + "<br>" +
            "<strong>Client :</strong> " + (buyer.fullName || buyer.full_name || 'Inconnu') + " (" + (buyer.email || '') + ")<br>" +
            "<strong>Message :</strong> (aucun message pour l'instant, conversation ouverte)<br><br>" +
            "Connectez-vous au compte vendeur pour repondre.";
          await emails.send({
            to: adminRows[0].email,
            subject: 'Nouvelle conversation - Compte vendeur',
            html: '<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:20px"><h2>Nouvelle conversation</h2>' + msg + '</div>'
          });
        }
      }
    } catch (e) { console.error('Managed vendor notification error:', e.message); }

    res.status(201).json(conv);
  } catch (err) {
    console.error('POST /conversations:', err.message);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.get('/conversations', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.*,
              u1.full_name as buyer_name, u1.phone as buyer_phone,
              u2.full_name as seller_name, u2.phone as seller_phone,
              (SELECT text FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
              (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_at
       FROM conversations c
       LEFT JOIN users u1 ON c.buyer_id = u1.id
       LEFT JOIN users u2 ON c.seller_id = u2.id
       WHERE c.buyer_id = ? OR c.seller_id = ?
       ORDER BY COALESCE(last_message_at, c.updated_at) DESC`,
      [req.user.id, req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /conversations:', err.message);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.get('/conversations/:id/messages', authenticate, async (req, res) => {
  try {
    const [convs] = await pool.query(
      'SELECT * FROM conversations WHERE id = ? AND (buyer_id = ? OR seller_id = ?)',
      [req.params.id, req.user.id, req.user.id]
    );
    if (convs.length === 0) return res.status(403).json({ message: 'Acces refuse.' });

    const [rows] = await pool.query(
      'SELECT m.*, u.full_name as sender_name FROM messages m LEFT JOIN users u ON m.sender_id = u.id WHERE m.conversation_id = ? ORDER BY m.created_at ASC',
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /conversations/:id/messages:', err.message);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

const typing = {};

router.post('/conversations/:id/typing', authenticate, async (req, res) => {
  try {
    const convId = req.params.id;
    const [convs] = await pool.query(
      'SELECT * FROM conversations WHERE id = ? AND (buyer_id = ? OR seller_id = ?)',
      [convId, req.user.id, req.user.id]
    );
    if (convs.length === 0) return res.status(403).json({ message: 'Acces refuse.' });
    typing[convId] = { userId: req.user.id, name: req.user.fullName || req.user.full_name, at: Date.now() };
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.get('/conversations/:id/typing', authenticate, async (req, res) => {
  try {
    const convId = req.params.id;
    const entry = typing[convId];
    if (entry && Date.now() - entry.at < 3000) {
      return res.json({ typing: true, name: entry.name, userId: entry.userId });
    }
    delete typing[convId];
    res.json({ typing: false });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

setInterval(() => {
  const now = Date.now();
  for (const id in typing) {
    if (now - typing[id].at > 3000) delete typing[id];
  }
}, 2000);

router.post('/conversations/:id/messages', authenticate, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ message: 'Message requis.' });

    const [convs] = await pool.query(
      'SELECT * FROM conversations WHERE id = ? AND (buyer_id = ? OR seller_id = ?)',
      [req.params.id, req.user.id, req.user.id]
    );
    if (convs.length === 0) return res.status(403).json({ message: 'Acces refuse.' });

    delete typing[req.params.id];

    const [result] = await pool.query(
      'INSERT INTO messages (conversation_id, sender_id, text) VALUES (?, ?, ?)',
      [req.params.id, req.user.id, text.trim()]
    );
    const msg = { id: result.insertId, conversation_id: Number(req.params.id), sender_id: req.user.id, text: text.trim(), created_at: new Date().toISOString(), sender_name: req.user.fullName || req.user.full_name };

    try {
      const conv = convs[0];
      const recipientId = conv.buyer_id === req.user.id ? conv.seller_id : conv.buyer_id;
      const [userRows] = await pool.query('SELECT admin_managed_id, full_name, store_name, email FROM users WHERE id = ?', [recipientId]);
      if (userRows.length > 0 && userRows[0].admin_managed_id) {
        const [adminRows] = await pool.query('SELECT email FROM users WHERE id = ?', [userRows[0].admin_managed_id]);
        if (adminRows.length > 0) {
          const sellerName = userRows[0].store_name || userRows[0].full_name || 'Vendeur #' + recipientId;
          await emails.send({
            to: adminRows[0].email,
            subject: 'Nouveau message pour ' + sellerName,
            html: '<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:20px">' +
              '<h2 style="color:#3b82f6;">Nouveau message recu</h2>' +
              '<div style="background:#f8fafc;padding:16px;border-radius:8px;margin:12px 0">' +
              '<p><strong>Vendeur :</strong> ' + sellerName + ' (' + userRows[0].email + ')</p>' +
              '<p><strong>Produit :</strong> ' + (conv.product_name || 'N/A') + '</p>' +
              '<p><strong>Message :</strong><br><em>' + text.trim().substring(0, 200) + '</em></p>' +
              '</div>' +
              '<p><a href="https://www.occasionetgarantie.store/messenger/' + conv.id + '" style="display:inline-block;background:#3b82f6;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none">Voir la conversation</a></p>' +
              '<p style="font-size:12px;color:#888;margin-top:16px">Connectez-vous au compte vendeur pour repondre.</p>' +
              '</div>'
          });
        }
      }
    } catch (e) { console.error('Managed vendor message notification error:', e.message); }

    res.status(201).json(msg);
  } catch (err) {
    console.error('POST /conversations/:id/messages:', err.message);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;
