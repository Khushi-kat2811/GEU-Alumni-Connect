const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// ─── Middlewares ────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', email_mode: (process.env.SMTP_USER ? 'smtp' : 'console') })
);

// ─── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/admin',       require('./routes/admin'));
app.use('/api/profiles',    require('./routes/profiles'));
app.use('/api/posts',       require('./routes/posts'));
app.use('/api/connections', require('./routes/connections'));
app.use('/api/messages',    require('./routes/messages'));
app.use('/api/resumes',     require('./routes/resumes'));
app.use('/api/communities', require('./routes/communities'));
app.use('/api/jobs',        require('./routes/jobs'));

// 404 fallback
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Generic error handler (catches multer errors etc. that escape route handlers)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Server error' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ GEU Alumni backend running at http://localhost:${PORT}`);
  if (!process.env.SMTP_USER) {
    console.log('   ✉  SMTP not configured — emails will be logged to console.');
  }
});
