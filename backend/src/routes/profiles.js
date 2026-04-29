const router  = require('express').Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const db      = require('../db');
const protect = require('../middleware/auth');

const { uploadImage, uploadDocument } = require('../config/cloudinary');

// GET /api/profiles — all profiles except current user
router.get('/', protect, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM profiles WHERE user_id != $1 ORDER BY created_at ASC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/profiles/:userId
router.get('/:userId', protect, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM profiles WHERE user_id = $1',
      [req.params.userId]
    );
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/profiles/:userId — update profile fields
router.put('/:userId', protect, async (req, res) => {
  if (req.user.id !== req.params.userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { full_name, headline, bio, graduation_year } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE profiles
       SET full_name=$1, headline=$2, bio=$3, graduation_year=$4, updated_at=NOW()
       WHERE user_id=$5
       RETURNING *`,
      [full_name || '', headline || null, bio || null, graduation_year ? parseInt(graduation_year) : null, req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/profiles/:userId/resume — upload resume PDF
router.post('/:userId/resume', protect, (req, res) => {
  if (req.user.id !== req.params.userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  uploadDocument.single('resume')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const resumeUrl = req.file.path;
    try {
      await db.query('UPDATE profiles SET resume_url=$1, updated_at=NOW() WHERE user_id=$2', [resumeUrl, req.user.id]);
      res.json({ resume_url: resumeUrl });
    } catch (dbErr) {
      res.status(500).json({ error: 'Server error' });
    }
  });
});

// POST /api/profiles/:userId/avatar — upload avatar image
router.post('/:userId/avatar', protect, (req, res) => {
  if (req.user.id !== req.params.userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  uploadImage.single('avatar')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const avatarUrl = req.file.path;
    try {
      await db.query('UPDATE profiles SET avatar_url=$1, updated_at=NOW() WHERE user_id=$2', [avatarUrl, req.user.id]);
      res.json({ avatar_url: avatarUrl });
    } catch (dbErr) {
      res.status(500).json({ error: 'Server error' });
    }
  });
});

module.exports = router;
