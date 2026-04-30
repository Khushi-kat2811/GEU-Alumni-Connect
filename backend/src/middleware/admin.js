// backend/src/middleware/admin.js
//
// Run *after* the regular `auth` middleware.
// Re-checks the DB on every admin request so that an admin who has been
// demoted in another session loses access immediately (rather than waiting
// for their JWT to expire).

const db = require('../db');

module.exports = async function requireAdmin(req, res, next) {
  if (!req.user?.id) return res.status(401).json({ error: 'Unauthenticated' });
  try {
    const { rows } = await db.query(
      'SELECT is_admin, is_super_admin FROM users WHERE id = $1',
      [req.user.id]
    );
    const u = rows[0];
    if (!u || (!u.is_admin && !u.is_super_admin)) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    req.user.is_admin = !!u.is_admin || !!u.is_super_admin;
    req.user.is_super_admin = !!u.is_super_admin;
    next();
  } catch (err) {
    console.error('admin middleware:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};
