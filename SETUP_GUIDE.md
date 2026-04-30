# GEU Alumni Connect — Setup Guide

This iteration adds an admin-approved signup flow, email-driven password
changes, a job board, community announcement-style posts and role
management, and several other improvements over the original codebase.

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js    | 18+ |
| PostgreSQL | 14+ |
| npm        | comes with Node |

(SMTP is optional — see Step 4. Without it, emails are logged to the server
console and the app remains fully usable for development.)

---

## Step 1 — Database

Open a terminal and create the database:

```bash
psql -U postgres -c "CREATE DATABASE geu_alumni;"
```

### A) Brand-new database

```bash
psql -U postgres -d geu_alumni -f schema.sql
```

You'll see a series of `CREATE TABLE` messages — your DB is ready.

### B) Upgrading an existing database (older codebase)

```bash
psql -U postgres -d geu_alumni -f migrations.sql
```

The migration is idempotent — safe to run more than once. It backfills
`username` for existing users from their email local-part, adds the new
admin/OTP/jobs/community-posts tables, and is otherwise non-destructive.

### Promote the first super-admin

The very first super-admin must be promoted by hand because the admin panel
is the only place to mint other admins. Run **either** of these once:

**If you're using a fresh DB and have no users yet** — register through the
UI first (your application will sit in `pending_registrations`), then
hand-approve yourself with SQL:

```sql
-- Approve the first signup and seed an admin
WITH ins AS (
  INSERT INTO users (id, email, username, password_hash, is_admin, is_super_admin, must_change_password)
  SELECT uuid_generate_v4(), email, split_part(email, '@', 1),
         crypt('TempAdmin!23', gen_salt('bf')),  -- requires pgcrypto extension
         TRUE, TRUE, TRUE
    FROM pending_registrations
   WHERE status = 'pending'
   ORDER BY created_at LIMIT 1
   RETURNING id, email
)
INSERT INTO profiles (id, user_id, full_name)
SELECT uuid_generate_v4(), ins.id, p.full_name
  FROM ins JOIN pending_registrations p ON p.email = ins.email;

UPDATE pending_registrations SET status = 'approved'
 WHERE id = (SELECT id FROM pending_registrations
              WHERE status = 'pending' ORDER BY created_at LIMIT 1);
```

(If you don't want to bother with `pgcrypto`, the simpler approach is to
register a normal user, **then** flip the admin bits on that row.)

**If you already had users from the previous codebase**, just promote one
of them to super-admin:

```sql
UPDATE users
   SET is_admin = TRUE, is_super_admin = TRUE
 WHERE email = 'your-admin@geu.ac.in';
```

That super-admin can then promote others via the Admin Dashboard UI (no
more SQL required).

---

## Step 2 — Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env`:

```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/geu_alumni
JWT_SECRET=pick_any_long_random_string_here
PORT=3001
BASE_URL=http://localhost:3001
FRONTEND_URL=http://localhost:8080
```

Generate a JWT secret in one line:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Start the backend:

```bash
npm run dev      # auto-restart
# or:
npm start
```

You'll see:

```
✅ GEU Alumni backend running at http://localhost:3001
   ✉  SMTP not configured — emails will be logged to console.
```

The "✉ SMTP not configured" line goes away once you fill in SMTP creds.

---

## Step 3 — Frontend

```bash
cd Frontend
npm install
echo "VITE_API_URL=http://localhost:3001" > .env
npm run dev
```

App is at **http://localhost:8080**.

---

## Step 4 — Email (optional but recommended)

Approval credentials and OTPs are sent over email. **Without SMTP they are
logged to the backend console** — fine for local development, but not for
real users.

For Gmail, generate an [App Password](https://myaccount.google.com/apppasswords)
(requires 2FA on the account) and fill in `backend/.env`:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_address@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM="GEU Alumni Connect <your_address@gmail.com>"
```

Restart the backend after editing `.env`.

---

## How the new flows work

**Signup (`/signup`)** is now an *application*, not a direct registration.
Users provide name, email, course, graduation year, student id, optional
reason, and a verification document (PDF / PNG / JPG / WEBP, ≤ 10 MB). The
form posts to `pending_registrations`. The user cannot log in yet.

**Admin approval (`/dashboard/admin`)** — visible to admins only. The admin
opens "Sign-up Approvals", reviews the verification doc (one-click open),
and either:
- **Approves** — backend auto-generates a username (from the full name)
  and a 12-character random password, creates the user, sets
  `must_change_password = TRUE`, and emails the credentials.
- **Rejects** — admin can include a reason; user gets an email and the row
  is marked rejected. The user can re-submit with a new document.

**First login** — new users sign in with the emailed username (or their
email) + temp password. They are routed straight to `/dashboard/change-password`
because of the `must_change_password` flag.

**Change-password / OTP** — two-step:
1. User confirms their current password → backend emails a 6-digit OTP
   (10 minute TTL, max 5 attempts).
2. User enters OTP + new password (≥ 8 chars) → password is updated.

**User management (admin)** — search by name/username/email, promote or
demote users (super-admin only), trigger password reset (re-emails a new
temp password and forces another change), or delete a user (super-admin
only). The super-admin row itself is protected from accidental
deletion / demotion.

**Resumes** — `GET /api/resumes` now returns *only* resumes from the
current user's accepted connections.

**Comments on feed posts** — `GET /api/posts/:id/comments` returns the
list (with author profile data); the PostCard fetches them when you open
the comment section, displays them, lets the author or any admin delete
them.

**Job board (`/dashboard/jobs`)** — any logged-in user can post; only the
poster (or an admin) can edit/delete. Search by keyword, filter by type,
toggle "My Postings".

**Communities** — three tabs once you're a member:
- *Posts* — admin/moderator-authored announcements with optional title
  and image; everyone can like/comment, admins can pin or delete any post.
- *Chat* — unchanged behaviour; admin can disable globally or mute
  individual members.
- *Members* — admin can change roles (admin / moderator / member),
  mute/unmute, or remove members. Last-admin self-demote is blocked at
  both API and UI level.

---

## Troubleshooting

**"Connection refused" on API calls** — Make sure backend is running on
port 3001 and `Frontend/.env` has `VITE_API_URL=http://localhost:3001`.

**"password authentication failed for user postgres"** — Wrong password
in `backend/.env`'s `DATABASE_URL`.

**Approval emails aren't arriving** — Check the backend console; if it
shows the email there, SMTP is not configured. Fill in SMTP_USER/PASS.

**OTP "expired" right away** — Server clock skew. The OTP expires 10
minutes after issue based on `NOW()` server time.

**`extension "uuid-ossp" does not exist`** — Run `CREATE EXTENSION
"uuid-ossp";` in your DB as a superuser.

**`pgcrypto` errors when seeding super-admin via SQL** — install it with
`CREATE EXTENSION pgcrypto;` first, or use the simpler "register, then
flip the bits" approach instead.
