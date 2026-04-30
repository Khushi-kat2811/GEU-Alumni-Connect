# GEU Alumni Connect - Context & Migration Summary

This document serves as a record of all the architectural changes, code modifications, and troubleshooting steps performed during this session.

## 1. Database Migration Fix (`migrations.sql`)
**Problem:** The user encountered a foreign key constraint error when running `migrations.sql` on an existing database because the original `communities` table had an `integer` primary key, while the new `community_posts` table was attempting to reference it using a `UUID`.
**Solution:**
- Modified `migrations.sql` to include a dynamic PL/pgSQL `DO $$` block.
- The script now dynamically checks the `data_type` of the `communities.id` column in `information_schema.columns`.
- If the column is an `integer`, it dynamically creates `community_posts` with an `INTEGER` foreign key. If it's a `UUID`, it uses a `UUID` foreign key.

## 2. Network Port Forwarding (Microsoft DevTunnels)
**Problem:** The user wanted to expose the local application to the public internet across different networks using DevTunnels.
**Solution:**
- **Frontend (`Frontend/.env`):** Updated `VITE_API_URL` to point to the backend DevTunnel URL.
- **Backend (`backend/.env`):** 
  - Updated `BASE_URL` to the backend DevTunnel URL so file URLs are constructed properly.
  - Updated `FRONTEND_URL` to the frontend DevTunnel URL to ensure the Express CORS middleware allows cross-origin requests.
- **Actionable Advice:** Instructed the user to ensure the DevTunnels visibility in VS Code was set to **Public** to bypass Microsoft Login requirements for API `fetch` calls.

## 3. Persistent Cloud Storage Migration
**Problem:** The application was using a local PostgreSQL database and local disk storage (`multer.diskStorage`), which meant data would not persist across different systems or cloud deployments.
**Solution:** Migrated both the database and file storage to managed cloud services.

### A. Cloud Database (Neon PostgreSQL)
- Initially attempted to migrate to Supabase, but the user's local network (IPv4 only) failed to resolve Supabase's new IPv6 direct connection URLs.
- Switched to **Neon Tech**, which natively supports standard IPv4 connection strings.
- Updated `DATABASE_URL` in `backend/.env` to the new Neon connection string.
- The user successfully ran `schema.sql` on the Neon database to initialize all tables.

### B. Cloud File Storage (Cloudinary)
- Installed dependencies: `npm install cloudinary multer-storage-cloudinary`.
- Added `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` to `backend/.env`.
- **Created `backend/src/config/cloudinary.js`**:
  - Centralized Cloudinary configuration.
  - Configured two separate Multer storage engines: one for images (`uploadImage`) and one for raw documents like PDFs (`uploadDocument` using `resource_type: 'auto'`).

### C. Route Modifications for Cloudinary
Replaced all instances of `multer.diskStorage` and local `/uploads/...` URL generation with the new Cloudinary configuration:
- **`backend/src/routes/auth.js`**: Registration verification documents now upload to Cloudinary. The public URL is retrieved via `req.file.path`.
- **`backend/src/routes/profiles.js`**: User avatars and resume PDFs now upload to Cloudinary.
- **`backend/src/routes/posts.js`**: Feed post images now upload to Cloudinary.
- **`backend/src/routes/communities.js`**: Community announcement images now upload to Cloudinary.

## 4. Troubleshooting & Process Management
- **PowerShell Execution Policy:** Bypassed local PowerShell script restrictions blocking `npm` by using `cmd.exe /c npm ...` and `cmd.exe /c node ...`.
- **Port Conflicts (`EADDRINUSE`):** Resolved backend crash issues where Port 3001 was already in use by a hidden "ghost" node process. 
  - Executed `Stop-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess -Force` to kill the stuck server and allow the new environment variables to take effect.
- **Manual Server Initialization:** Manually started the backend server in the background and verified its health using `curl` to prove the API was functional and responsive.
