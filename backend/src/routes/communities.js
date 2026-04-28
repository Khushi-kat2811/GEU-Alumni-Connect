const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/auth");

// Create community
router.post("/", auth, async (req, res) => {
  try {
    const { name, description } = req.body;
    const result = await pool.query(
      `INSERT INTO communities (name, description, created_by, chat_enabled)
       VALUES ($1, $2, $3, true) RETURNING *`,
      [name, description, req.user.id]
    );
    await pool.query(
      `INSERT INTO community_members (community_id, user_id, role, can_chat)
       VALUES ($1, $2, 'admin', true)`,
      [result.rows[0].id, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List all communities
router.get("/", auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*,
        (SELECT COUNT(*) FROM community_members WHERE community_id = c.id) as member_count,
        EXISTS(SELECT 1 FROM community_members WHERE community_id = c.id AND user_id = $1) as is_member,
        (SELECT role FROM community_members WHERE community_id = c.id AND user_id = $1) as my_role,
        p.full_name as creator_name
       FROM communities c
       LEFT JOIN profiles p ON p.user_id = c.created_by
       ORDER BY c.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single community
router.get("/:id", auth, async (req, res) => {
  try {
    const community = await pool.query(
      `SELECT c.*,
        (SELECT COUNT(*) FROM community_members WHERE community_id = c.id) as member_count,
        EXISTS(SELECT 1 FROM community_members WHERE community_id = c.id AND user_id = $1) as is_member,
        (SELECT role FROM community_members WHERE community_id = c.id AND user_id = $1) as my_role
       FROM communities c WHERE c.id = $2`,
      [req.user.id, req.params.id]
    );
    if (!community.rows[0]) return res.status(404).json({ error: "Not found" });
    res.json(community.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Join community
router.post("/:id/join", auth, async (req, res) => {
  try {
    await pool.query(
      `INSERT INTO community_members (community_id, user_id, role, can_chat)
       VALUES ($1, $2, 'member', true) ON CONFLICT DO NOTHING`,
      [req.params.id, req.user.id]
    );
    res.json({ message: "Joined" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Leave community
router.post("/:id/leave", auth, async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM community_members WHERE community_id = $1 AND user_id = $2 AND role != 'admin'`,
      [req.params.id, req.user.id]
    );
    res.json({ message: "Left" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle global chat (admin only)
router.patch("/:id/toggle-chat", auth, async (req, res) => {
  try {
    const member = await pool.query(
      `SELECT role FROM community_members WHERE community_id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!member.rows[0] || member.rows[0].role !== "admin") {
      return res.status(403).json({ error: "Only admin can toggle chat" });
    }
    const result = await pool.query(
      `UPDATE communities SET chat_enabled = NOT chat_enabled WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle chat for a specific member (admin only)
router.patch("/:id/members/:userId/toggle-chat", auth, async (req, res) => {
  try {
    // Check caller is admin
    const caller = await pool.query(
      `SELECT role FROM community_members WHERE community_id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!caller.rows[0] || caller.rows[0].role !== "admin") {
      return res.status(403).json({ error: "Only admin can manage member chat" });
    }
    // Don't allow toggling admin's own chat
    const target = await pool.query(
      `SELECT role, can_chat FROM community_members WHERE community_id = $1 AND user_id = $2`,
      [req.params.id, req.params.userId]
    );
    if (!target.rows[0]) return res.status(404).json({ error: "Member not found" });
    if (target.rows[0].role === "admin") {
      return res.status(400).json({ error: "Cannot toggle admin chat" });
    }
    const result = await pool.query(
      `UPDATE community_members SET can_chat = NOT can_chat
       WHERE community_id = $1 AND user_id = $2 RETURNING *`,
      [req.params.id, req.params.userId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete community (admin only)
router.delete("/:id", auth, async (req, res) => {
  try {
    const member = await pool.query(
      `SELECT role FROM community_members WHERE community_id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!member.rows[0] || member.rows[0].role !== "admin") {
      return res.status(403).json({ error: "Only admin can delete" });
    }
    await pool.query(`DELETE FROM communities WHERE id = $1`, [req.params.id]);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get members (include can_chat field)
router.get("/:id/members", auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT cm.*, cm.can_chat, p.full_name, p.avatar_url, p.headline
       FROM community_members cm
       LEFT JOIN profiles p ON p.user_id = cm.user_id
       WHERE cm.community_id = $1
       ORDER BY cm.role DESC, cm.joined_at`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get community messages
router.get("/:id/messages", auth, async (req, res) => {
  try {
    // Check membership
    const member = await pool.query(
      `SELECT role, can_chat FROM community_members WHERE community_id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!member.rows[0]) return res.status(403).json({ error: "Join first" });

    // Admin can always view messages
    // Members can view only if global chat is on OR their individual can_chat is true
    const community = await pool.query(
      `SELECT chat_enabled FROM communities WHERE id = $1`,
      [req.params.id]
    );

    const isAdmin = member.rows[0].role === "admin";
    if (!isAdmin && !community.rows[0]?.chat_enabled && !member.rows[0].can_chat) {
      return res.status(403).json({ error: "Chat is disabled for you" });
    }

    const result = await pool.query(
      `SELECT m.*, p.full_name, p.avatar_url
       FROM community_messages m
       LEFT JOIN profiles p ON p.user_id = m.sender_id
       WHERE m.community_id = $1
       ORDER BY m.created_at ASC
       LIMIT 100`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send community message
router.post("/:id/messages", auth, async (req, res) => {
  try {
    const member = await pool.query(
      `SELECT role, can_chat FROM community_members WHERE community_id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!member.rows[0]) return res.status(403).json({ error: "Join first" });

    const community = await pool.query(
      `SELECT chat_enabled FROM communities WHERE id = $1`,
      [req.params.id]
    );

    const isAdmin = member.rows[0].role === "admin";

    // Admin can ALWAYS send
    // Members: if global chat OFF → check individual can_chat
    //          if global chat ON  → allowed
    if (!isAdmin) {
      if (!community.rows[0]?.chat_enabled && !member.rows[0].can_chat) {
        return res.status(403).json({ error: "Chat is disabled for you" });
      }
    }

    const result = await pool.query(
      `INSERT INTO community_messages (community_id, sender_id, content)
       VALUES ($1, $2, $3) RETURNING *`,
      [req.params.id, req.user.id, req.body.content]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;