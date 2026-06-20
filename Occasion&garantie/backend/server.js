require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const https = require('https');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const uploadRoutes = require('./routes/upload');
const depositRoutes = require('./routes/deposit');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/deposits', depositRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Occasion&Garantie API running' });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Auto-ping pour éviter le sommeil Render
const PUBLIC_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
const PING_INTERVAL = Number(process.env.PING_INTERVAL) || 5 * 60 * 1000;

const ping = () => {
  const mod = PUBLIC_URL.startsWith('https') ? https : http;
  const req = mod.get(`${PUBLIC_URL}/api/health`, (res) => {
    console.log(`[keepalive] ping ${PUBLIC_URL}/api/health → ${res.statusCode}`);
  });
  req.on('error', () => {});
  req.end();
};

// Premier ping après 1 min (pas 5 min)
setTimeout(ping, 60 * 1000);
setInterval(ping, PING_INTERVAL);
