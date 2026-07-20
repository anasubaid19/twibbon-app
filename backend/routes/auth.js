const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const router = express.Router();
const db = require('../db/database');

const generateRecoveryCode = () => {
  const code = crypto.randomBytes(16).toString('hex').toUpperCase();
  // Format: XXXX-XXXX-XXXX-XXXX
  return code.match(/.{1,8}/g).join('-');
}

// Register
router.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Username dan password wajib diisi' });
  if (username.length < 3)
    return res.status(400).json({ error: 'Username minimal 3 karakter' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Password minimal 6 karakter' });

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) return res.status(409).json({ error: 'Username sudah digunakan' });

  const hash = bcrypt.hashSync(password, 10);
  const recoveryCode = generateRecoveryCode();
  const recoveryHash = bcrypt.hashSync(recoveryCode, 10);

  const result = db.prepare(
    'INSERT INTO users (username, password_hash, recovery_code_hash) VALUES (?, ?, ?)'
  ).run(username, hash, recoveryHash);

  const token = jwt.sign({ id: result.lastInsertRowid, username }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, username, recoveryCode });
});

// Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Username dan password wajib diisi' });

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) return res.status(401).json({ error: 'Username atau password salah' });

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Username atau password salah' });

  const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, username: user.username });
});

// Forgot password — pakai recovery code
router.post('/forgot-password', (req, res) => {
  const { username, recovery_code, new_password } = req.body;
  if (!username || !recovery_code || !new_password)
    return res.status(400).json({ error: 'Semua field wajib diisi' });
  if (new_password.length < 6)
    return res.status(400).json({ error: 'Password baru minimal 6 karakter' });

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !user.recovery_code_hash)
    return res.status(404).json({ error: 'Username tidak ditemukan' });

  const valid = bcrypt.compareSync(recovery_code.replace(/\s/g, ''), user.recovery_code_hash);
  if (!valid) return res.status(401).json({ error: 'Recovery code salah' });

  const newHash = bcrypt.hashSync(new_password, 10);
  // Generate recovery code baru setelah dipakai
  const newCode = generateRecoveryCode();
  const newCodeHash = bcrypt.hashSync(newCode, 10);

  db.prepare('UPDATE users SET password_hash = ?, recovery_code_hash = ? WHERE id = ?')
    .run(newHash, newCodeHash, user.id);

  res.json({ message: 'Password berhasil direset', newRecoveryCode: newCode });
});

module.exports = router;
