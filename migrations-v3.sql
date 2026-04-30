-- =============================================================================
-- GEU Alumni Connect — Migration v3
-- Run on top of schema.sql + migrations.sql:
--   psql "$DATABASE_URL" -f migrations-v3.sql
-- Idempotent.
-- =============================================================================

-- ── Presence: track when each user was last active ─────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP DEFAULT NOW();
CREATE INDEX IF NOT EXISTS users_last_seen_idx ON users (last_seen DESC);

-- ── Optional clean-up: align display timezone semantics ────────────────────
-- The codebase now uses a node-postgres type parser that interprets every
-- naive TIMESTAMP value as UTC, so no schema change is required to fix the
-- "X hours ago" display bug. The block below is OPTIONAL and only useful if
-- you'd rather migrate the columns to TIMESTAMPTZ for permanent clarity.
-- Uncomment if you want to do it (you only need to do this once):
--
-- ALTER TABLE users               ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
-- ALTER TABLE users               ALTER COLUMN last_seen  TYPE TIMESTAMPTZ USING last_seen  AT TIME ZONE 'UTC';
-- ALTER TABLE profiles            ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
-- ALTER TABLE profiles            ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';
-- ALTER TABLE posts               ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
-- ALTER TABLE posts               ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';
-- ALTER TABLE comments            ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
-- ALTER TABLE post_likes          ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
-- ALTER TABLE messages            ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
-- ALTER TABLE connections         ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
-- ALTER TABLE communities         ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
-- ALTER TABLE community_members   ALTER COLUMN joined_at  TYPE TIMESTAMPTZ USING joined_at  AT TIME ZONE 'UTC';
-- ALTER TABLE community_messages  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
-- ALTER TABLE community_posts     ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
-- ALTER TABLE community_post_likes    ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
-- ALTER TABLE community_post_comments ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
-- ALTER TABLE jobs                ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
-- ALTER TABLE pending_registrations ALTER COLUMN created_at  TYPE TIMESTAMPTZ USING created_at  AT TIME ZONE 'UTC';
-- ALTER TABLE pending_registrations ALTER COLUMN reviewed_at TYPE TIMESTAMPTZ USING reviewed_at AT TIME ZONE 'UTC';
-- ALTER TABLE otps                ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
-- ALTER TABLE otps                ALTER COLUMN expires_at TYPE TIMESTAMPTZ USING expires_at AT TIME ZONE 'UTC';
