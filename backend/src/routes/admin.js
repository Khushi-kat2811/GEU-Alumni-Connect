// backend/src/routes/admin.js
//
// All routes require auth + admin. Mounted at /api/admin.
// Endpoints:
//
//   Signup approvals
//     GET    /pending                        — list pending signup applications
//     GET    /pending/:id                    — full detail (includes verification doc URL)
//     POST   /pending/:id/approve            — create user, email credentials
//     POST   /pending/:id/reject             — mark rejected, email user
//
//   Users
//     GET    /users                          — list all users (with profile basics)
//     PATCH  /users/:id/admin                — promote/demote (super-admin only)
//     POST   /users/:id/reset-password       — generate a new temp password + email it
//     DELETE /users/:id                      — remove a user (super-admin only)
//
//   Stats
//     GET    /stats                          — counts for the dashboard

const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const db        = require('../db');
const protect   = require('../middleware/auth');
const requireAdmin = require('../middleware/admin');

const email   = require('../services/email');
const { generatePassword, generateUsername } = require('../services/credentials');

router.use(protect, requireAdmin);

// ─── Stats ──────────────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [users, pending, posts, jobs, communities] = await Promise.all([
      db.query('SELECT COUNT(*)::int AS c FROM users'),
      db.query("SELECT COUNT(*)::int AS c FROM pending_registrations WHERE status = 'pending'"),
      db.query('SELECT COUNT(*)::int AS c FROM posts'),
      db.query('SELECT COUNT(*)::int AS c FROM jobs WHERE is_open = TRUE'),
      db.query('SELECT COUNT(*)::int AS c FROM communities'),
    ]);
    res.json({
      total_users:        users.rows[0].c,
      pending_signups:    pending.rows[0].c,
      total_posts:        posts.rows[0].c,
      open_jobs:          jobs.rows[0].c,
      total_communities:  communities.rows[0].c,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Pending registrations ──────────────────────────────────────────────────
router.get('/pending', async (req, res) => {
  try {
    const status = req.query.status || 'pending';
    const { rows } = await db.query(
      `SELECT id, email, full_name, graduation_year, course, student_id,
              reason, verification_doc_url, status, rejection_reason, created_at
         FROM pending_registrations
        WHERE status = $1
        ORDER BY created_at DESC`,
      [status]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/pending/:id', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM pending_registrations WHERE id = $1', [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/pending/:id/approve', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM pending_registrations WHERE id = $1 AND status = 'pending'`,
      [req.params.id]
    );
    const app = rows[0];
    if (!app) return res.status(404).json({ error: 'Pending application not found' });

    // Make sure email isn't somehow already a user
    const existing = await db.query('SELECT 1 FROM users WHERE email = $1', [app.email]);
    if (existing.rows.length) {
      return res.status(409).json({ error: 'A user with this email already exists' });
    }

    const username = await generateUsername(app.full_name, app.email, async (cand) => {
      const r = await db.query('SELECT 1 FROM users WHERE LOWER(username) = $1', [cand.toLowerCase()]);
      return r.rows.length > 0;
    });
    const tempPassword = generatePassword();
    const hash = await bcrypt.hash(tempPassword, 10);
    const userId = uuidv4();

    await db.query(
      `INSERT INTO users (id, email, username, password_hash, must_change_password)
       VALUES ($1, $2, $3, $4, TRUE)`,
      [userId, app.email, username, hash]
    );
    await db.query(
      `INSERT INTO profiles (id, user_id, full_name, graduation_year, course, student_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [uuidv4(), userId, app.full_name, app.graduation_year, app.course, app.student_id]
    );
    await db.query(
      `UPDATE pending_registrations
          SET status = 'approved', reviewed_by = $1, reviewed_at = NOW()
        WHERE id = $2`,
      [req.user.id, app.id]
    );

    // Email credentials
    const loginUrl = (process.env.FRONTEND_URL || 'http://localhost:5173') + '/login';
    const tpl = email.approvalEmail({
      fullName: app.full_name,
      username,
      password: tempPassword,
      loginUrl,
    });
    const result = await email.sendMail({ to: app.email, subject: tpl.subject, text: tpl.text });

    res.json({
      message: 'User approved and credentials emailed.',
      username,
      email_delivered: result.ok,
      email_mode: result.mode || null,
    });
  } catch (err) {
    console.error('approve:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/pending/:id/reject', async (req, res) => {
  try {
    const reason = (req.body?.reason || '').toString().slice(0, 500);
    const { rows } = await db.query(
      `UPDATE pending_registrations
          SET status = 'rejected', reviewed_by = $1, reviewed_at = NOW(),
              rejection_reason = $2
        WHERE id = $3 AND status = 'pending'
        RETURNING *`,
      [req.user.id, reason || null, req.params.id]
    );
    const app = rows[0];
    if (!app) return res.status(404).json({ error: 'Pending application not found' });

    const tpl = email.rejectionEmail({ fullName: app.full_name, reason });
    await email.sendMail({ to: app.email, subject: tpl.subject, text: tpl.text });
    res.json({ message: 'Application rejected and user notified.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── User management ────────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const search = (req.query.search || '').toString().trim().toLowerCase();
    const args = [];
    let where = '';
    if (search) {
      args.push(`%${search}%`);
      where = `WHERE LOWER(u.email) LIKE $1
                  OR LOWER(u.username) LIKE $1
                  OR LOWER(p.full_name) LIKE $1`;
    }
    const { rows } = await db.query(
      `SELECT u.id, u.email, u.username, u.is_admin, u.is_super_admin,
              u.must_change_password, u.created_at,
              p.full_name, p.graduation_year, p.avatar_url, p.headline
         FROM users u
         LEFT JOIN profiles p ON p.user_id = u.id
         ${where}
         ORDER BY u.created_at DESC
         LIMIT 500`,
      args
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Promote/demote — super-admin only
router.patch('/users/:id/admin', async (req, res) => {
  if (!req.user.is_super_admin) return res.status(403).json({ error: 'Super-admin only' });
  const { is_admin } = req.body;
  if (typeof is_admin !== 'boolean') return res.status(400).json({ error: 'is_admin (bool) required' });
  try {
    const { rows } = await db.query(
      `UPDATE users
          SET is_admin = $1
        WHERE id = $2 AND is_super_admin = FALSE
        RETURNING id, is_admin`,
      [is_admin, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'User not found, or is super-admin (cannot change)' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Reset a user's password (admin convenience action)
router.post('/users/:id/reset-password', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT id, email FROM users WHERE id = $1', [req.params.id]);
    const user = rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });

    const tempPassword = generatePassword();
    const hash = await bcrypt.hash(tempPassword, 10);
    await db.query(
      'UPDATE users SET password_hash = $1, must_change_password = TRUE WHERE id = $2',
      [hash, user.id]
    );

    const { rows: prows } = await db.query('SELECT full_name FROM profiles WHERE user_id = $1', [user.id]);
    const loginUrl = (process.env.FRONTEND_URL || 'http://localhost:5173') + '/login';
    const tpl = email.approvalEmail({
      fullName: prows[0]?.full_name || 'there',
      username: '(use your existing username)',
      password: tempPassword,
      loginUrl,
    });
    await email.sendMail({
      to: user.email,
      subject: 'GEU Alumni Connect — Password reset by admin',
      text: tpl.text + '\n\n(Note: an administrator triggered this reset.)',
    });
    res.json({ message: 'Password reset and emailed to user.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/users/:id', async (req, res) => {
  if (!req.user.is_super_admin) return res.status(403).json({ error: 'Super-admin only' });
  if (req.user.id === req.params.id) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }
  try {
    const { rowCount } = await db.query(
      'DELETE FROM users WHERE id = $1 AND is_super_admin = FALSE',
      [req.params.id]
    );
    if (!rowCount) return res.status(404).json({ error: 'User not found, or is super-admin' });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Content moderation ────────────────────────────────────────────────────
// Admins can delete any post or job listing, even if they didn't author it.
router.delete('/posts/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM post_likes WHERE post_id=$1', [req.params.id]);
    await db.query('DELETE FROM comments WHERE post_id=$1', [req.params.id]);
    const { rowCount } = await db.query('DELETE FROM posts WHERE id=$1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Post not found' });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/jobs/:id', async (req, res) => {
  try {
    const { rowCount } = await db.query('DELETE FROM jobs WHERE id=$1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Job not found' });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/communities/:id', async (req, res) => {
  try {
    const { rowCount } = await db.query('DELETE FROM communities WHERE id=$1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Community not found' });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
