// backend/src/routes/resumes.js
//
// Returns resumes ONLY for the current user's accepted connections.
// (The current user's own resume is NOT included — they can see/manage that
// from the profile page directly.)

const router  = require('express').Router();
const db      = require('../db');
const protect = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT p.*
         FROM profiles p
         JOIN connections c
           ON c.status = 'accepted'
          AND ((c.requester_id = $1 AND c.addressee_id = p.user_id)
            OR (c.addressee_id = $1 AND c.requester_id = p.user_id))
        WHERE p.resume_url IS NOT NULL AND p.resume_url <> ''
        ORDER BY p.updated_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /resumes:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
