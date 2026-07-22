const fs = require('fs');
const d = JSON.parse(fs.readFileSync('data.json', 'utf8'));
d.users[0].password = '$2a$10$YAP5X8atYvbXQYFSugi2y./KHz9aoU3QgLkT8p1UKRb7h8of.JM0a';
fs.writeFileSync('data.json', JSON.stringify(d, null, 2) + '\n');
const bcrypt = require('bcryptjs');
console.log('hash length:', d.users[0].password.length);
console.log('bcrypt match:', bcrypt.compareSync('admin123', d.users[0].password));
