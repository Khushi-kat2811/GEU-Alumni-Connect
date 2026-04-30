-- =============================================================================
-- GEU Alumni Connect — Migration script for EXISTING databases
-- Run after upgrading the codebase:
--    psql -U postgres -d geu_alumni -f migrations.sql
-- Idempotent — safe to run more than once.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── users: add username, admin flags, must_change_password ──────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(64);
-- Backfill username for existing rows from local-part of email
UPDATE users
   SET username = SPLIT_PART(email, '@', 1)
 WHERE username IS NULL OR username = '';
-- Disambiguate any duplicates by appending a 4-char suffix from id
UPDATE users u
   SET username = u.username || '_' || SUBSTRING(u.id::text FROM 1 FOR 4)
 WHERE EXISTS (
   SELECT 1 FROM users u2
    WHERE u2.username = u.username AND u2.id <> u.id
 );
ALTER TABLE users ALTER COLUMN username SET NOT NULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_username_key'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_username_key UNIQUE (username);
  END IF;
END $$;

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin              BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_super_admin        BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password  BOOLEAN NOT NULL DEFAULT FALSE;

-- ── profiles: add course / student_id ───────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS course     VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS student_id VARCHAR(64);

-- ── pending_registrations ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pending_registrations (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email               VARCHAR(255) UNIQUE NOT NULL,
  full_name           VARCHAR(255) NOT NULL,
  graduation_year     INTEGER,
  course              VARCHAR(255),
  student_id          VARCHAR(64),
  reason              TEXT,
  verification_doc_url VARCHAR(1000) NOT NULL,
  status              VARCHAR(20) NOT NULL DEFAULT 'pending',
  reviewed_by         UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at         TIMESTAMP,
  rejection_reason    TEXT,
  created_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ── otps ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS otps (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash   VARCHAR(255) NOT NULL,
  purpose     VARCHAR(40)  NOT NULL,
  expires_at  TIMESTAMP    NOT NULL,
  used        BOOLEAN      NOT NULL DEFAULT FALSE,
  attempts    INTEGER      NOT NULL DEFAULT 0,
  created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS otps_user_purpose_idx ON otps (user_id, purpose);

-- ── communities (in case the prior install never added these) ──────────────
CREATE TABLE IF NOT EXISTS communities (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(255) NOT NULL,
  description   TEXT,
  created_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  chat_enabled  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_members (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id  UUID REFERENCES communities(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  role          VARCHAR(20) NOT NULL DEFAULT 'member',
  can_chat      BOOLEAN NOT NULL DEFAULT TRUE,
  joined_at     TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (community_id, user_id)
);

CREATE TABLE IF NOT EXISTS community_messages (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id  UUID REFERENCES communities(id) ON DELETE CASCADE,
  sender_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  content       TEXT NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ── community_posts + likes/comments ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS community_posts_temp (); -- dummy to prevent error if we just dropped it

DO $do$
DECLARE
  comm_type text;
BEGIN
  SELECT data_type INTO comm_type
    FROM information_schema.columns
   WHERE table_name = 'communities' AND column_name = 'id';

  IF comm_type = 'integer' THEN
    EXECUTE '
      CREATE TABLE IF NOT EXISTS community_posts (
        id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        community_id  INTEGER REFERENCES communities(id) ON DELETE CASCADE,
        author_id     UUID REFERENCES users(id) ON DELETE CASCADE,
        title         VARCHAR(300),
        content       TEXT NOT NULL,
        image_url     VARCHAR(1000),
        pinned        BOOLEAN NOT NULL DEFAULT FALSE,
        created_at    TIMESTAMP NOT NULL DEFAULT NOW()
      );
    ';
  ELSE
    EXECUTE '
      CREATE TABLE IF NOT EXISTS community_posts (
        id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        community_id  UUID REFERENCES communities(id) ON DELETE CASCADE,
        author_id     UUID REFERENCES users(id) ON DELETE CASCADE,
        title         VARCHAR(300),
        content       TEXT NOT NULL,
        image_url     VARCHAR(1000),
        pinned        BOOLEAN NOT NULL DEFAULT FALSE,
        created_at    TIMESTAMP NOT NULL DEFAULT NOW()
      );
    ';
  END IF;
END $do$;

DROP TABLE IF EXISTS community_posts_temp;

CREATE TABLE IF NOT EXISTS community_post_likes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id       UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS community_post_comments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id       UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  content       TEXT NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ── jobs ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS jobs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  posted_by     UUID REFERENCES users(id) ON DELETE CASCADE,
  title         VARCHAR(255) NOT NULL,
  company       VARCHAR(255) NOT NULL,
  location      VARCHAR(255),
  job_type      VARCHAR(40),
  experience    VARCHAR(40),
  salary        VARCHAR(100),
  description   TEXT NOT NULL,
  apply_url     VARCHAR(1000),
  apply_email   VARCHAR(255),
  is_open       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS jobs_open_created_idx ON jobs (is_open, created_at DESC);

-- =============================================================================
-- FINAL STEP — promote at least one existing user to super-admin so they can
-- log into the admin panel and approve future signups. Replace the email below
-- before running this migration:
--
--   UPDATE users SET is_admin = TRUE, is_super_admin = TRUE
--    WHERE email = 'YOUR_ADMIN_EMAIL@geu.ac.in';
-- =============================================================================
