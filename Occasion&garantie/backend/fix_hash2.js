const fs = require('fs');
const d = JSON.parse(fs.readFileSync('data.json', 'utf8'));
d.users[0].password = '$2a$10$sP91PF8LJR4fXzMvSdopPOPRi4nHENdAyMfC1KW394zjCkMy26U3K';
fs.writeFileSync('data.json', JSON.stringify(d, null, 2) + '\n');
const bcrypt = require('bcryptjs');
console.log('hash length:', d.users[0].password.length);
console.log('bcrypt match:', bcrypt.compareSync('admin123', d.users[0].password));
