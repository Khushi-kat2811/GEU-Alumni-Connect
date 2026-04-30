# GEU Alumni Connect — Patches

Three issues, all fixed:

1. **Timestamps showing "~6 hours ago" on freshly created posts/jobs/community-posts.**
2. **Messages page rewritten WhatsApp-style** (live presence, read-receipt ticks, smart timestamps, unread badges).
3. **Super-admin can now moderate everywhere** — delete any post / comment / job / community / community-post inline from the regular pages, not just the admin panel.

---

## What each issue actually was

### 1 · The timestamp bug

The schema declares every `created_at` as **`TIMESTAMP`** (without time zone).
PostgreSQL's `NOW()` writes a UTC value into that column but **strips the
timezone marker**. When `node-postgres` reads a `TIMESTAMP WITHOUT TIME ZONE`
back, it parses the naive string in **the Node server's local timezone**.

Your Node process runs on an IST machine, so every `Date` object came back
**5h30m off**. New posts looked ~5–6 hours old. Existing rows in Neon are
stored correctly (UTC) — only the parsing was wrong.

**Fix:** one-line `pg.types.setTypeParser(1114, …)` in `db.js` tells the
driver "treat naive timestamps as UTC." That's it. No data migration. All
existing rows display correctly immediately.

### 2 · Super-admin moderation

The admin route file already had `/api/admin/posts/:id` etc., but no UI used
them, and the **regular** `DELETE /api/posts/:id` etc. always rejected
non-owners. Two changes:

- Backend: relaxed ownership checks in `posts.js` / `jobs.js` / `communities.js`
  to also accept `req.user.is_admin === true`.
- Auth middleware: hydrates `is_admin` from the DB on every request, so
  every route handler has access to it without an extra query.
- Frontend: existing delete buttons now render for admins (with a shield
  icon to make it visually clear it's a moderation action). On
  Communities, site-admins also see a delete button on each card in the
  list view.

### 3 · WhatsApp-style messages

Required schema change: one new column on `users`, `last_seen TIMESTAMP`.
This drives the "online" / "last seen" labels.

The page now:

- Shows last message preview, last-message time, and an unread count badge
  next to each contact.
- Sorts contacts by most-recent-message-first.
- Header shows live presence (green dot + "online" if seen ≤ 60 s ago,
  otherwise contextual "last seen today at 14:32" / "last seen yesterday
  at 09:11" / "last seen 12/04/25 18:20").
- Single tick (✓) = sent · double tick (✓✓) = read (sky-blue).
- Smart timestamps inside bubbles (`HH:MM` only).
- **Date separators** between days ("Today", "Yesterday", "Friday",
  "Mon, 12 Apr 2025").
- Bubble-shape and chat-pattern background reminiscent of a familiar chat
  app, without any branded assets.
- Polls every 4 s for new messages, every 10 s for the contacts list,
  every 20 s for peer presence; sends a heartbeat every 30 s so others see
  *you* as online.
- Unread badge clears automatically when you open the conversation —
  the `GET /api/messages/:userId` endpoint now marks inbound messages as
  read.

---

## How to apply

### Step 1 · Run the SQL migration

```bash
psql "$DATABASE_URL" -f migrations-v3.sql
```

(That's just one new column + an index. Idempotent.)

### Step 2 · Drop in the patched files

Copy each file from this bundle into your project at the path on the right:

| Bundle file               | Replace this path in your project                                                  |
|---------------------------|------------------------------------------------------------------------------------|
| `db.js`                   | `backend/src/db.js`                                                                |
| `auth.js`                 | `backend/src/middleware/auth.js`                                                   |
| `posts.js`                | `backend/src/routes/posts.js`                                                      |
| `jobs.js`                 | `backend/src/routes/jobs.js`                                                       |
| `communities.js`          | `backend/src/routes/communities.js`                                                |
| `messages.js`             | `backend/src/routes/messages.js`                                                   |
| `migrations-v3.sql`       | (new)  `migrations-v3.sql`  — at the project root, alongside `migrations.sql`      |
| `api.ts`                  | `Frontend/src/lib/api.ts`                                                          |
| `PostCard.tsx`            | `Frontend/src/components/dashboard/PostCard.tsx`                                   |
| `Messages.tsx`            | `Frontend/src/pages/Messages.tsx`                                                  |
| `Jobs.tsx`                | `Frontend/src/pages/Jobs.tsx`                                                      |
| `Communities.tsx`         | `Frontend/src/pages/Communities.tsx`                                               |

No new npm packages. No changes to `index.js`, `package.json`, or any
config file.

### Step 3 · Restart

```bash
# Backend — make sure to pick up the new node-postgres type parser
cmd.exe /c "node backend/src/index.js"
# Frontend — Vite picks up changes automatically; nothing to do
```

---

## Verifying

After restart:

1. **Timestamps** — create a new post/job/community-post. It should show
   "less than a minute ago" / "1 minute ago", not "5–6 hours ago".
   *Existing* rows will also retroactively display correctly because Neon
   stores them in UTC.

2. **Super-admin** — log in as a user with `is_admin = TRUE` (or
   `is_super_admin = TRUE`). On the Feed, every post — not just your own —
   shows a small shield icon for delete. Same on the Job Board (toggle +
   shield-delete) and Communities list (shield-delete on cards).

3. **Messages** — open the page. Online contacts show a green dot in their
   avatar; otherwise their last-seen line under their name shows things
   like "last seen today at 14:23". Send a message — you should see a
   single ✓ immediately. When the recipient opens the chat, your tick
   becomes a sky-blue ✓✓.

---

## Optional · TIMESTAMPTZ migration

The driver-level fix is fully sufficient. If you'd nevertheless prefer to
migrate the schema to `TIMESTAMPTZ` for permanent clarity, the bottom of
`migrations-v3.sql` contains a commented-out `ALTER TABLE ... TYPE TIMESTAMPTZ`
block you can uncomment and run. Doing so is **not** required.
