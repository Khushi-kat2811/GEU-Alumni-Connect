const router  = require('express').Router();
const db      = require('../db');
const protect = require('../middleware/auth');

// GET /api/resumes — all profiles that have a resume uploaded
router.get('/', protect, async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT * FROM profiles WHERE resume_url IS NOT NULL AND resume_url != '' ORDER BY updated_at DESC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
