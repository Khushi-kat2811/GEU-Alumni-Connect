# GEU Alumni Connect — Setup Guide

## Prerequisites

- [Node.js](https://nodejs.org) (v18+)
- [PostgreSQL](https://www.postgresql.org/download) (v14+)
- npm (comes with Node.js)

---

## Step 1 — Create the Database

```bash
psql -U postgres
```

```sql
CREATE DATABASE geu_alumni;
\q
```

Now connect to the database and create all the tables:

```bash
psql -U postgres -d geu_alumni
```

Paste and run the following SQL:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users (auth)
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  full_name       VARCHAR(255) NOT NULL DEFAULT '',
  headline        VARCHAR(500),
  bio             TEXT,
  graduation_year INTEGER,
  avatar_url      VARCHAR(1000),
  resume_url      VARCHAR(1000),
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- Posts
CREATE TABLE IF NOT EXISTS posts (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL DEFAULT '',
  image_url  VARCHAR(1000),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Post Likes
CREATE TABLE IF NOT EXISTS post_likes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id    UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Comments
CREATE TABLE IF NOT EXISTS comments (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id    UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Connections
CREATE TABLE IF NOT EXISTS connections (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID REFERENCES users(id) ON DELETE CASCADE,
  addressee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status       VARCHAR(20) DEFAULT 'pending',
  created_at   TIMESTAMP DEFAULT NOW(),
  UNIQUE(requester_id, addressee_id)
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id   UUID REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  read        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Communities
CREATE TABLE IF NOT EXISTS communities (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(255) NOT NULL,
  description  TEXT,
  created_by   UUID REFERENCES users(id) ON DELETE CASCADE,
  chat_enabled BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMP DEFAULT NOW()
);

-- Community Members
CREATE TABLE IF NOT EXISTS community_members (
  id           SERIAL PRIMARY KEY,
  community_id INTEGER REFERENCES communities(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  role         VARCHAR(20) DEFAULT 'member',
  can_chat     BOOLEAN DEFAULT TRUE,
  joined_at    TIMESTAMP DEFAULT NOW(),
  UNIQUE(community_id, user_id)
);

-- Community Messages
CREATE TABLE IF NOT EXISTS community_messages (
  id           SERIAL PRIMARY KEY,
  community_id INTEGER REFERENCES communities(id) ON DELETE CASCADE,
  sender_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  content      TEXT NOT NULL,
  created_at   TIMESTAMP DEFAULT NOW()
);
```

Then exit:

```sql
\q
```

---

## Step 2 — Set Up the Backend

```bash
cd backend
npm install
```

Open `backend/.env` and **update the values according to your system**:

```env
# Replace YOUR_PASSWORD with your actual PostgreSQL password
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/geu_alumni

# Replace with any long random string (used to sign auth tokens)
JWT_SECRET=replace_with_a_random_secret_key

BASE_URL=http://localhost:3001
PORT=3001
FRONTEND_URL=http://localhost:8080
```

> To generate a secure JWT secret, run:
> `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

Start the backend:

```bash
npm run dev
```

You should see: `✅ GEU Alumni backend running at http://localhost:3001`

---

## Step 3 — Set Up the Frontend

Open a **new terminal** (keep the backend running):

```bash
cd Frontend
npm install
```

Create a `.env` file inside the `Frontend/` folder:

```env
VITE_API_URL=http://localhost:3001
```

Start the frontend:

```bash
npm run dev
```

Open **http://localhost:8080** in your browser.

---

## Step 4 — You're Done!

1. Go to **http://localhost:8080**
2. Sign up for a new account
3. Log in and start using the app

---

## Troubleshooting

- **"Connection refused"** → Make sure the backend is running and `VITE_API_URL` is correct in `Frontend/.env`. Restart the frontend after editing `.env`.
- **"password authentication failed"** → Fix your PostgreSQL password in `backend/.env`.
- **CORS errors** → Make sure `FRONTEND_URL` in `backend/.env` is `http://localhost:8080`.
- **Token errors after restart** → If you changed `JWT_SECRET`, clear browser localStorage and log in again.
