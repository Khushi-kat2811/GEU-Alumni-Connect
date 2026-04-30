const { Pool } = require('pg');
require('dotenv').config();

// Use explicit SSL and connection timeouts for cloud databases like Neon
// to prevent "Connection terminated unexpectedly" and SSL warnings.
const isLocal = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('localhost');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false },
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('connect', () => {
  // Uncomment to debug:
  // console.log('Connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err.message);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
