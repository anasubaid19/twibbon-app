const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const db = require('../db/database');
const authMiddleware = require('../middleware/auth');

const VALID_RATIOS = ['1:1', '4:5', '5:4', '3:4', '4:3', '16:9', '9:16'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads/frames')),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}.png`)
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/png') cb(null, true);
    else cb(new Error('Hanya file PNG yang diizinkan'));
  }
});

const slugify = (text) =>
  text.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);

const validateSlug = (slug) => /^[a-z0-9-]{3,60}$/.test(slug);

// Buat kampanye baru
router.post('/', authMiddleware, upload.single('frame'), (req, res) => {
  const { name, description, ratio, is_public, slug } = req.body;
  if (!name || !ratio || !req.file)
    return res.status(400).json({ error: 'Nama, rasio, dan frame wajib diisi' });
  if (!VALID_RATIOS.includes(ratio))
    return res.status(400).json({ error: 'Rasio tidak valid' });

  const finalSlug = slug ? slug.toLowerCase().trim() : null;
  if (finalSlug && !validateSlug(finalSlug))
    return res.status(400).json({ error: 'Slug hanya boleh huruf kecil, angka, dan tanda hubung (-), 3-60 karakter' });

  if (finalSlug) {
    const existing = db.prepare('SELECT id FROM campaigns WHERE slug = ?').get(finalSlug);
    if (existing) return res.status(409).json({ error: 'Slug sudah digunakan, coba yang lain' });
  }

  const result = db.prepare(
    'INSERT INTO campaigns (user_id, name, description, ratio, frame_path, is_public, slug) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(req.user.id, name, description || '', ratio, req.file.filename, is_public === 'true' ? 1 : 0, finalSlug);

  res.json({ id: result.lastInsertRowid, slug: finalSlug, message: 'Kampanye berhasil dibuat' });
});

// Kampanye milik user
router.get('/my', authMiddleware, (req, res) => {
  const campaigns = db.prepare(
    'SELECT * FROM campaigns WHERE user_id = ? ORDER BY created_at DESC'
  ).all(req.user.id);
  res.json(campaigns);
});

// Kampanye publik
router.get('/public', (req, res) => {
  const campaigns = db.prepare(
    'SELECT c.*, u.username FROM campaigns c JOIN users u ON c.user_id = u.id WHERE c.is_public = 1 ORDER BY c.created_at DESC'
  ).all();
  res.json(campaigns);
});

// Ambil kampanye by ID atau slug
router.get('/:identifier', (req, res) => {
  const { identifier } = req.params;
  const isNumeric = /^\d+$/.test(identifier);

  const campaign = isNumeric
    ? db.prepare('SELECT c.*, u.username FROM campaigns c JOIN users u ON c.user_id = u.id WHERE c.id = ?').get(identifier)
    : db.prepare('SELECT c.*, u.username FROM campaigns c JOIN users u ON c.user_id = u.id WHERE c.slug = ?').get(identifier);

  if (!campaign) return res.status(404).json({ error: 'Kampanye tidak ditemukan' });
  if (!campaign.is_public) return res.status(403).json({ error: 'Kampanye ini bersifat private' });
  res.json(campaign);
});

// Edit kampanye
router.put('/:id', authMiddleware, upload.single('frame'), (req, res) => {
  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!campaign) return res.status(404).json({ error: 'Kampanye tidak ditemukan' });

  const { name, description, ratio, is_public, slug } = req.body;
  if (!name || !ratio) return res.status(400).json({ error: 'Nama dan rasio wajib diisi' });
  if (!VALID_RATIOS.includes(ratio)) return res.status(400).json({ error: 'Rasio tidak valid' });

  const finalSlug = slug ? slug.toLowerCase().trim() : null;
  if (finalSlug && !validateSlug(finalSlug))
    return res.status(400).json({ error: 'Slug hanya boleh huruf kecil, angka, dan tanda hubung (-), 3-60 karakter' });

  if (finalSlug && finalSlug !== campaign.slug) {
    const existing = db.prepare('SELECT id FROM campaigns WHERE slug = ? AND id != ?').get(finalSlug, req.params.id);
    if (existing) return res.status(409).json({ error: 'Slug sudah digunakan, coba yang lain' });
  }

  let frame_path = campaign.frame_path;
  if (req.file) {
    const oldPath = path.join(__dirname, '../uploads/frames', campaign.frame_path);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    frame_path = req.file.filename;
  }

  db.prepare(
    'UPDATE campaigns SET name=?, description=?, ratio=?, is_public=?, frame_path=?, slug=? WHERE id=?'
  ).run(name, description || '', ratio, is_public === 'true' ? 1 : 0, frame_path, finalSlug, req.params.id);

  res.json({ message: 'Kampanye berhasil diupdate', slug: finalSlug });
});

// Hapus kampanye
router.delete('/:id', authMiddleware, (req, res) => {
  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!campaign) return res.status(404).json({ error: 'Kampanye tidak ditemukan' });

  const framePath = path.join(__dirname, '../uploads/frames', campaign.frame_path);
  if (fs.existsSync(framePath)) fs.unlinkSync(framePath);

  db.prepare('DELETE FROM campaigns WHERE id = ?').run(req.params.id);
  res.json({ message: 'Kampanye berhasil dihapus' });
});

module.exports = router;
