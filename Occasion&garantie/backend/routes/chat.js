const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { authenticate } = require('../middleware/auth');
const emails = require('../emails');

const CHAT_AUDIO_DIR = path.join(__dirname, '..', 'uploads', 'chat');
if (!fs.existsSync(CHAT_AUDIO_DIR)) fs.mkdirSync(CHAT_AUDIO_DIR, { recursive: true });

const AUDIO_EXT = {
  'audio/webm': '.webm',
  'audio/ogg': '.ogg',
  'audio/mp4': '.m4a',
  'audio/x-m4a': '.m4a',
  'audio/mpeg': '.mp3',
  'audio/mp3': '.mp3',
  'audio/wav': '.wav',
};

const audioUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, CHAT_AUDIO_DIR),
    filename: (req, file, cb) => {
      const ext = AUDIO_EXT[file.mimetype] || '.webm';
      cb(null, `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = file.mimetype.startsWith('audio/') || /\.(webm|ogg|m4a|mp4|mp3|wav)$/i.test(file.originalname);
    if (ok) cb(null, true);
    else cb(new Error('Format audio non supporte.'));
  },
});

(async () => {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS conversations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      buyer_id INT NOT NULL,
      seller_id INT NOT NULL,
      product_id INT,
      product_name VARCHAR(200),
      negotiation_id INT,
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
      audio VARCHAR(500) DEFAULT NULL,
      duration INT DEFAULT NULL,
      read_at DATETIME DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
    )`);
    try { await pool.query('ALTER TABLE messages ADD COLUMN audio VARCHAR(500) DEFAULT NULL'); } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') console.log('audio col:', e.message); }
    try { await pool.query('ALTER TABLE messages ADD COLUMN duration INT DEFAULT NULL'); } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') console.log('duration col:', e.message); }
    try { await pool.query('ALTER TABLE messages ADD COLUMN read_at DATETIME DEFAULT NULL'); } catch (e) { if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') console.log('read_at col:', e.message); }
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
          const sellerLabel = String(conv.product_name || '#' + sellerId).replace(/[<>]/g, '');
          const buyerName = String(buyer.fullName || buyer.full_name || 'Inconnu').replace(/[<>]/g, '');
          const buyerEmail = String(buyer.email || '').replace(/[<>]/g, '');
          const msg = "Nouveau message recu sur un compte vendeur gere.<br><br>" +
            "<strong>Vendeur :</strong> " + sellerLabel + "<br>" +
            "<strong>Client :</strong> " + buyerName + " (" + buyerEmail + ")<br>" +
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
      'SELECT m.*, u.full_name as sender_name FROM messages m LEFT JOIN users u ON m.sender_id = u.id WHERE m.conversation_id = ? ORDER BY m.created_at ASC, m.id ASC',
      [req.params.id]
    );

    await pool.query(
      'UPDATE messages SET read_at = NOW() WHERE conversation_id = ? AND sender_id != ? AND read_at IS NULL',
      [req.params.id, req.user.id]
    );
    if (rows.length > 0) {
      for (const r of rows) {
        if (r.sender_id !== req.user.id) r.read_at = r.read_at || new Date().toISOString();
      }
    }

    res.json(rows);
  } catch (err) {
    console.error('GET /conversations/:id/messages:', err.message);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.delete('/conversations/:id', authenticate, async (req, res) => {
  try {
    const [convs] = await pool.query(
      'SELECT * FROM conversations WHERE id = ? AND (buyer_id = ? OR seller_id = ?)',
      [req.params.id, req.user.id, req.user.id]
    );
    if (convs.length === 0) return res.status(403).json({ message: 'Acces refuse.' });

    await pool.query('DELETE FROM messages WHERE conversation_id = ?', [req.params.id]);
    await pool.query('DELETE FROM conversations WHERE id = ?', [req.params.id]);
    res.json({ message: 'Conversation supprimée.' });
  } catch (err) {
    console.error('DELETE /conversations/:id:', err.message);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.delete('/conversations/:id/messages/:messageId', authenticate, async (req, res) => {
  try {
    const [convs] = await pool.query(
      'SELECT * FROM conversations WHERE id = ? AND (buyer_id = ? OR seller_id = ?)',
      [req.params.id, req.user.id, req.user.id]
    );
    if (convs.length === 0) return res.status(403).json({ message: 'Acces refuse.' });

    const [rows] = await pool.query('SELECT * FROM messages WHERE id = ? AND conversation_id = ?', [req.params.messageId, req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Message introuvable.' });
    if (rows[0].sender_id !== req.user.id) return res.status(403).json({ message: 'Vous ne pouvez supprimer que vos propres messages.' });

    const file = rows[0].audio;
    await pool.query('DELETE FROM messages WHERE id = ?', [req.params.messageId]);
    if (file && !file.includes('..')) {
      try { fs.unlinkSync(path.join(__dirname, '..', 'uploads', file)); } catch {}
    }

    res.json({ message: 'Message supprimé.' });
  } catch (err) {
    console.error('DELETE /conversations/:id/messages/:messageId:', err.message);
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
    if (text.trim().length > 100) return res.status(400).json({ message: 'Le message ne doit pas dépasser 100 caractères.' });

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
          const sellerName = (userRows[0].store_name || userRows[0].full_name || 'Vendeur #' + recipientId).replace(/[<>]/g, '');
          const safeEmail = String(userRows[0].email || '').replace(/[<>]/g, '');
          const safeProduct = String(conv.product_name || 'N/A').replace(/[<>]/g, '');
          const safeText = String(text.trim().substring(0, 200)).replace(/[<>]/g, '');
          await emails.send({
            to: adminRows[0].email,
            subject: 'Nouveau message pour ' + sellerName,
            html: '<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:20px">' +
              '<h2 style="color:#3b82f6;">Nouveau message recu</h2>' +
              '<div style="background:#f8fafc;padding:16px;border-radius:8px;margin:12px 0">' +
              '<p><strong>Vendeur :</strong> ' + sellerName + ' (' + safeEmail + ')</p>' +
              '<p><strong>Produit :</strong> ' + safeProduct + '</p>' +
              '<p><strong>Message :</strong><br><em>' + safeText + '</em></p>' +
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

router.post('/conversations/:id/audio', authenticate, audioUpload.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Fichier audio requis.' });

    const [convs] = await pool.query(
      'SELECT * FROM conversations WHERE id = ? AND (buyer_id = ? OR seller_id = ?)',
      [req.params.id, req.user.id, req.user.id]
    );
    if (convs.length === 0) {
      try { fs.unlinkSync(req.file.path); } catch {}
      return res.status(403).json({ message: 'Acces refuse.' });
    }

    const duration = parseInt(req.body.duration, 10);
    const dur = Number.isFinite(duration) && duration > 0 ? Math.min(duration, 60) : null;

    delete typing[req.params.id];

    const audioPath = 'chat/' + req.file.filename;
    const [result] = await pool.query(
      'INSERT INTO messages (conversation_id, sender_id, text, audio, duration) VALUES (?, ?, ?, ?, ?)',
      [req.params.id, req.user.id, '🎤 Message vocal', audioPath, dur]
    );
    const msg = {
      id: result.insertId,
      conversation_id: Number(req.params.id),
      sender_id: req.user.id,
      text: '🎤 Message vocal',
      audio: audioPath,
      duration: dur,
      created_at: new Date().toISOString(),
      sender_name: req.user.fullName || req.user.full_name,
    };

    try {
      const conv = convs[0];
      const recipientId = conv.buyer_id === req.user.id ? conv.seller_id : conv.buyer_id;
      const [userRows] = await pool.query('SELECT admin_managed_id, full_name, store_name, email FROM users WHERE id = ?', [recipientId]);
      if (userRows.length > 0 && userRows[0].admin_managed_id) {
        const [adminRows] = await pool.query('SELECT email FROM users WHERE id = ?', [userRows[0].admin_managed_id]);
        if (adminRows.length > 0) {
          const sellerName = (userRows[0].store_name || userRows[0].full_name || 'Vendeur #' + recipientId).replace(/[<>]/g, '');
          const safeEmail = String(userRows[0].email || '').replace(/[<>]/g, '');
          const safeProduct = String(conv.product_name || 'N/A').replace(/[<>]/g, '');
          await emails.send({
            to: adminRows[0].email,
            subject: 'Nouveau message vocal pour ' + sellerName,
            html: '<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:20px">' +
              '<h2 style="color:#3b82f6;">Nouveau message vocal recu</h2>' +
              '<div style="background:#f8fafc;padding:16px;border-radius:8px;margin:12px 0">' +
              '<p><strong>Vendeur :</strong> ' + sellerName + ' (' + safeEmail + ')</p>' +
              '<p><strong>Produit :</strong> ' + safeProduct + '</p>' +
              '<p><strong>Type :</strong> Message vocal (à écouter dans la messagerie)</p>' +
              '</div>' +
              '<p><a href="https://www.occasionetgarantie.store/messenger/' + conv.id + '" style="display:inline-block;background:#3b82f6;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none">Voir la conversation</a></p>' +
              '</div>'
          });
        }
      }
    } catch (e) { console.error('Managed vendor audio notification error:', e.message); }

    res.status(201).json(msg);
  } catch (err) {
    console.error('POST /conversations/:id/audio:', err.message);
    if (req.file) { try { fs.unlinkSync(req.file.path); } catch {} }
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;
