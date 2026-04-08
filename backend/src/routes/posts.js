const router  = require('express').Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const { v4: uuidv4 } = require('uuid');
const db      = require('../db');
const protect = require('../middleware/auth');

// Post-image upload storage
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads/post-images');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${uuidv4()}${ext}`);
  },
});
const uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

// GET /api/posts — all posts with profiles, likes, comments, user's liked status
router.get('/', protect, async (req, res) => {
  try {
    const { rows: postsData } = await db.query(
      'SELECT * FROM posts ORDER BY created_at DESC'
    );
    if (!postsData.length) return res.json([]);

    const postIds = postsData.map(p => p.id);
    const userIds = [...new Set(postsData.map(p => p.user_id))];

    const [profilesRes, likesRes, commentsRes, userLikesRes] = await Promise.all([
      db.query(
        'SELECT user_id, full_name, headline, avatar_url FROM profiles WHERE user_id = ANY($1)',
        [userIds]
      ),
      db.query('SELECT post_id FROM post_likes WHERE post_id = ANY($1)', [postIds]),
      db.query('SELECT post_id FROM comments WHERE post_id = ANY($1)', [postIds]),
      db.query(
        'SELECT post_id FROM post_likes WHERE user_id = $1 AND post_id = ANY($2)',
        [req.user.id, postIds]
      ),
    ]);

    const profilesMap = {};
    profilesRes.rows.forEach(p => { profilesMap[p.user_id] = p; });

    const likesMap = {};
    likesRes.rows.forEach(l => { likesMap[l.post_id] = (likesMap[l.post_id] || 0) + 1; });

    const commentsMap = {};
    commentsRes.rows.forEach(c => { commentsMap[c.post_id] = (commentsMap[c.post_id] || 0) + 1; });

    const userLikedSet = new Set(userLikesRes.rows.map(l => l.post_id));

    const result = postsData.map(p => ({
      ...p,
      profiles:      profilesMap[p.user_id] || null,
      likes_count:   likesMap[p.id] || 0,
      comments_count: commentsMap[p.id] || 0,
      liked_by_user: userLikedSet.has(p.id),
    }));

    res.json(result);
  } catch (err) {
    console.error('GET /posts:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/posts — create a post (with optional image)
router.post('/', protect, (req, res) => {
  uploadImage.single('image')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });

    const { content } = req.body;
    let image_url = null;

    if (req.file) {
      image_url = `${process.env.BASE_URL || 'http://localhost:3001'}/uploads/post-images/${req.file.filename}`;
    }

    if (!content?.trim() && !image_url) {
      return res.status(400).json({ error: 'Post must have content or an image' });
    }

    try {
      const { rows } = await db.query(
        'INSERT INTO posts (id, user_id, content, image_url) VALUES ($1,$2,$3,$4) RETURNING *',
        [uuidv4(), req.user.id, content?.trim() || '', image_url]
      );
      res.status(201).json(rows[0]);
    } catch (dbErr) {
      console.error(dbErr.message);
      res.status(500).json({ error: 'Server error' });
    }
  });
});

// DELETE /api/posts/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT user_id FROM posts WHERE id=$1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Post not found' });
    if (rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    await db.query('DELETE FROM post_likes WHERE post_id=$1', [req.params.id]);
    await db.query('DELETE FROM comments WHERE post_id=$1', [req.params.id]);
    await db.query('DELETE FROM posts WHERE id=$1', [req.params.id]);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/posts/:id/like — toggle like
router.post('/:id/like', protect, async (req, res) => {
  try {
    const existing = await db.query(
      'SELECT id FROM post_likes WHERE post_id=$1 AND user_id=$2',
      [req.params.id, req.user.id]
    );
    if (existing.rows.length) {
      await db.query('DELETE FROM post_likes WHERE post_id=$1 AND user_id=$2', [req.params.id, req.user.id]);
      res.json({ liked: false });
    } else {
      await db.query(
        'INSERT INTO post_likes (id, post_id, user_id) VALUES ($1,$2,$3)',
        [uuidv4(), req.params.id, req.user.id]
      );
      res.json({ liked: true });
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/posts/:id/comments — add a comment
router.post('/:id/comments', protect, async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'Content is required' });
  try {
    await db.query(
      'INSERT INTO comments (id, post_id, user_id, content) VALUES ($1,$2,$3,$4)',
      [uuidv4(), req.params.id, req.user.id, content.trim()]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
