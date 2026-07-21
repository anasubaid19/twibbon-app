const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('./db/database');

const [,, username, newPassword] = process.argv;

if (!username || !newPassword) {
  console.log('Usage: node reset-password.js <username> <password_baru>');
  process.exit(1);
}

const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
if (!user) {
  console.log(`User "${username}" tidak ditemukan`);
  process.exit(1);
}

const newHash = bcrypt.hashSync(newPassword, 10);
const newCode = crypto.randomBytes(16).toString('hex').toUpperCase().match(/.{1,8}/g).join('-');
const newCodeHash = bcrypt.hashSync(newCode, 10);

db.prepare('UPDATE users SET password_hash = ?, recovery_code_hash = ? WHERE id = ?')
  .run(newHash, newCodeHash, user.id);

console.log(`✅ Password user "${username}" berhasil direset`);
console.log(`🔑 Recovery code baru: ${newCode}`);
console.log(`⚠️  Berikan recovery code ini ke user dan minta mereka simpan baik-baik`);
