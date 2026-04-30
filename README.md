# GEU Alumni Connect

Alumni networking platform for Graphic Era University. Express +
PostgreSQL backend, React (Vite + TypeScript + Tailwind + shadcn/ui)
frontend.

> **Setup, configuration and operations:** see [`SETUP_GUIDE.md`](./SETUP_GUIDE.md).

---

## What's in this iteration

- **Admin-approved signup** — applications go to a holding table; an
  admin reviews the verification document, then approves or rejects.
  Approved users are emailed an auto-generated username and temporary
  password.
- **Admin dashboard** at `/dashboard/admin` — pending applications, user
  search & management, super-admin promotion / demotion, password
  resets, and stats.
- **OTP-based password change** — current-password gate, then a 6-digit
  email-delivered OTP. Required after first login or admin reset.
- **Job board** at `/dashboard/jobs` — any user can post listings; the
  poster (or an admin) can edit, close or delete.
- **Community announcement posts** — admins and moderators of a
  community can publish announcements with optional title and image.
  Members can like, comment, and admins can pin.
- **Community role management** — admin / moderator / member, mute, kick,
  with last-admin-self-demote protection.
- **Connection-gated resumes** — `/api/resumes` only returns resumes
  shared by users you're connected with.
- **Visible comments** on feed posts — previously the count was tracked
  but the comments themselves were never rendered.
- **Console-fallback email** — works without SMTP for local development;
  emails are logged to the backend console instead.

## Repository layout

```
backend/         Node + Express + pg API server
Frontend/        React + Vite + TS app
schema.sql       Fresh-database DDL
migrations.sql   Idempotent upgrade for existing DBs
SETUP_GUIDE.md   Full setup and operations guide
```

## Quick start

```bash
# Database
psql -U postgres -c "CREATE DATABASE geu_alumni;"
psql -U postgres -d geu_alumni -f schema.sql

# Backend
cd backend && npm install && cp .env.example .env
# edit .env (DATABASE_URL, JWT_SECRET) — SMTP is optional
npm run dev

# Frontend (new shell)
cd Frontend && npm install
echo "VITE_API_URL=http://localhost:3001" > .env
npm run dev   # opens on :8080
```

Promote your first super-admin via SQL — see "Promote the first
super-admin" in [`SETUP_GUIDE.md`](./SETUP_GUIDE.md). Everything else can
then be done from the admin UI.

## Credits

Built on top of the original GEU Alumni Connect codebase. Additions in
this iteration are described above.
