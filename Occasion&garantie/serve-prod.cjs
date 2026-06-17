const express = require('express');
const path = require('path');
const app = express();
app.use(express.static(path.join(__dirname, 'frontend', 'dist')));
app.listen(3002, () => console.log('OG on :3002'));
