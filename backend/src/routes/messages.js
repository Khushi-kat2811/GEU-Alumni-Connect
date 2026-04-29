const router  = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const db      = require('../db');
const protect = require('../middleware/auth');

// GET /api/messages/contacts — profiles of accepted connections
router.get('/contacts', protect, async (req, res) => {
  try {
    const { rows: conns } = await db.query(
      `SELECT requester_id, addressee_id FROM connections
       WHERE status='accepted' AND (requester_id=$1 OR addressee_id=$1)`,
      [req.user.id]
    );

    const userIds = conns.map(c =>
      c.requester_id === req.user.id ? c.addressee_id : c.requester_id
    );

    if (!userIds.length) return res.json([]);

    const { rows } = await db.query(
      'SELECT * FROM profiles WHERE user_id = ANY($1)',
      [userIds]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/messages/:userId — conversation between current user and :userId
router.get('/:userId', protect, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM messages
       WHERE (sender_id=$1 AND receiver_id=$2) OR (sender_id=$2 AND receiver_id=$1)
       ORDER BY created_at ASC`,
      [req.user.id, req.params.userId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/messages — send a message
router.post('/', protect, async (req, res) => {
  const { receiver_id, content } = req.body;
  if (!receiver_id || !content?.trim()) {
    return res.status(400).json({ error: 'receiver_id and content are required' });
  }
  try {
    const { rows } = await db.query(
      'INSERT INTO messages (id, sender_id, receiver_id, content) VALUES ($1,$2,$3,$4) RETURNING *',
      [uuidv4(), req.user.id, receiver_id, content.trim()]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
