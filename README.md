# GEU Alumni Connect — Setup Guide

This guide sets up the project **without Supabase or Lovable** using a local
Node.js + Express backend and a PostgreSQL database.

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 18+ | https://nodejs.org |
| PostgreSQL | 14+ | https://www.postgresql.org/download |
| npm / bun | any | comes with Node |

---

## Step 1 — Create the PostgreSQL Database

Open a terminal and run:

```bash
# Log into PostgreSQL (use your postgres password when prompted)
psql -U postgres

# Inside the psql shell:
CREATE DATABASE geu_alumni;
\q
```

Now load the schema:

```bash
psql -U postgres -d geu_alumni -f schema.sql
```

You should see a series of `CREATE TABLE` messages. Your database is ready.

---

## Step 2 — Set Up the Backend

```bash
cd backend
npm install
```

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Edit `backend/.env`:

```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/geu_alumni
JWT_SECRET=pick_any_long_random_string_here
BASE_URL=http://localhost:3001
PORT=3001
FRONTEND_URL=http://localhost:5173
```

> **JWT_SECRET** can be anything — e.g. run `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` to generate one.

Start the backend:

```bash
# Development (auto-restarts on changes)
npm run dev

# OR production
npm start
```

You should see:
```
✅ GEU Alumni backend running at http://localhost:3001
```

Test it:
```bash
curl http://localhost:3001/api/health
# → {"status":"ok"}
```

---

## Step 3 — Set Up the Frontend

Go to your existing frontend project folder (GEUAlumniConnect):

```bash
cd GEUAlumniConnect
```

### 3a. Copy the new source files

Replace/add these files from the `frontend/` folder provided:

```
frontend/src/lib/api.ts                         → src/lib/api.ts          (NEW)
frontend/src/contexts/AuthContext.tsx           → src/contexts/AuthContext.tsx
frontend/src/App.tsx                            → src/App.tsx
frontend/src/pages/Login.tsx                    → src/pages/Login.tsx
frontend/src/pages/Signup.tsx                   → src/pages/Signup.tsx
frontend/src/pages/Dashboard.tsx                → src/pages/Dashboard.tsx
frontend/src/pages/Profile.tsx                  → src/pages/Profile.tsx
frontend/src/pages/Network.tsx                  → src/pages/Network.tsx
frontend/src/pages/Messages.tsx                 → src/pages/Messages.tsx
frontend/src/pages/Resumes.tsx                  → src/pages/Resumes.tsx
frontend/src/components/dashboard/CreatePost.tsx
frontend/src/components/dashboard/PostCard.tsx
```

### 3b. Create the frontend .env

In the root of GEUAlumniConnect, create a `.env` file:

```
VITE_API_URL=http://localhost:3001
```

### 3c. Remove Supabase & Lovable packages (optional but clean)

```bash
npm uninstall @supabase/supabase-js @lovable-dev/cloud-auth-js
```

Also delete these folders (they are no longer imported anywhere):
```
src/integrations/supabase/
src/integrations/lovable/
```

### 3d. Install deps & run

```bash
npm install
npm run dev
```

The app runs at **http://localhost:5173**

---

## Project Structure

```
project/
├── schema.sql                  ← Run once to create all DB tables
├── backend/
│   ├── .env                    ← Your DB credentials & JWT secret
│   ├── package.json
│   ├── uploads/
│   │   ├── resumes/            ← Uploaded resume PDFs stored here
│   │   ├── post-images/        ← Post image uploads stored here
│   │   └── avatars/            ← Avatar image uploads stored here
│   └── src/
│       ├── index.js            ← Express app entry point
│       ├── db.js               ← PostgreSQL connection pool
│       ├── middleware/
│       │   └── auth.js         ← JWT verification middleware
│       └── routes/
│           ├── auth.js         ← POST /register, POST /login, GET /me
│           ├── profiles.js     ← GET/PUT profile, upload resume/avatar
│           ├── posts.js        ← CRUD posts, likes, comments
│           ├── connections.js  ← Send/accept connection requests
│           ├── messages.js     ← Send & fetch messages
│           └── resumes.js      ← List all alumni resumes
└── frontend/
    └── src/
        ├── lib/api.ts          ← All API calls (replaces Supabase)
        ├── contexts/
        │   └── AuthContext.tsx ← JWT-based auth (no Supabase)
        └── pages/ & components/
```

---

## API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Register new user |
| POST | `/api/auth/login` | — | Login, get JWT token |
| GET | `/api/auth/me` | ✅ | Validate token, get user |
| GET | `/api/profiles` | ✅ | All profiles (except self) |
| GET | `/api/profiles/:userId` | ✅ | Single profile |
| PUT | `/api/profiles/:userId` | ✅ | Update profile fields |
| POST | `/api/profiles/:userId/resume` | ✅ | Upload PDF resume |
| POST | `/api/profiles/:userId/avatar` | ✅ | Upload avatar image |
| GET | `/api/posts` | ✅ | All posts with likes/comments |
| POST | `/api/posts` | ✅ | Create a post (+ optional image) |
| DELETE | `/api/posts/:id` | ✅ | Delete own post |
| POST | `/api/posts/:id/like` | ✅ | Toggle like |
| POST | `/api/posts/:id/comments` | ✅ | Add a comment |
| GET | `/api/connections` | ✅ | Your connections |
| POST | `/api/connections` | ✅ | Send connection request |
| PUT | `/api/connections/:requesterId/accept` | ✅ | Accept request |
| GET | `/api/messages/contacts` | ✅ | Connected users (chat list) |
| GET | `/api/messages/:userId` | ✅ | Conversation with user |
| POST | `/api/messages` | ✅ | Send a message |
| GET | `/api/resumes` | ✅ | All profiles with resumes |

---

## Troubleshooting

**"Connection refused" on API calls**
→ Make sure the backend is running on port 3001 and `VITE_API_URL` is set in the frontend `.env`.

**"password authentication failed for user postgres"**
→ Check your `DATABASE_URL` password in `backend/.env`.

**Files not uploading**
→ Make sure the `backend/uploads/` subfolders exist (they are created automatically on first upload).

**Token errors after restart**
→ If you change `JWT_SECRET`, existing tokens become invalid and users need to log in again.
