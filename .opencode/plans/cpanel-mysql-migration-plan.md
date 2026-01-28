# MycaeTracker - cPanel & MySQL Migration Plan

## 📋 Executive Summary

This plan outlines the complete step-by-step migration of MycaeTracker from local Laragon to cPanel hosting with MySQL database.

**Current State:** App running locally on Laragon (MySQL on port 5001, Node.js backend)
**Target State:** Live on cPanel hosting at mycaetech.com with MySQL database

**Estimated Time:** 30-40 minutes for first deployment
**Difficulty:** Easy-Medium (follows existing comprehensive guides)

---

## ✅ Pre-Deployment Checklist

Before starting the migration, verify these items:

### Files Already Ready
- [x] Database backup: `deployment-package/mycae_tracker_backup.sql` (103KB)
- [x] Frontend production build: `deployment-package/frontend/` folder
- [x] Backend compiled code: `deployment-package/backend/dist/` folder
- [x] Frontend .htaccess: `deployment-package/frontend/.htaccess` (React Router, SSL, security)
- [x] Deployment guides: START_HERE.txt, QUICK_CHECKLIST.txt, README.md

### Files That Need Creation
- [ ] **API Proxy .htaccess**: Create `deployment-package/frontend/api/.htaccess` to proxy /api/* requests to Node.js backend
- [ ] **Updated .env Template**: Create production-ready .env file with proper JWT_SECRET

### Pre-Build Verification
- [ ] Frontend API URL configured: `VITE_API_URL=https://mycaetech.com/api`
- [ ] Backend CORS origins include: `https://mycaetech.com,https://www.mycaetech.com`
- [ ] Database schema matches backup file
- [ ] All dependencies are up-to-date

---

## 🚀 Phase 1: Pre-Deployment Preparation (Local)

### Step 1: Create API Proxy .htaccess

**File to create:** `deployment-package/frontend/api/.htaccess`

**Purpose:** Route all `/api/*` requests to the Node.js backend running on port 3000

**Content:**
```apache
# API Proxy Configuration
# This file routes /api/* requests to the Node.js backend on port 3000

RewriteEngine On

# Proxy all API requests to Node.js backend (localhost:3000)
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:3000/api/$1 [P,L]

# P = Proxy (pass request to backend)
# L = Last (stop processing rules)
```

**Why needed:** cPanel Node.js apps run on localhost:3000, but the frontend needs to access them at `/api/*`. This .htaccess proxies those requests correctly.

---

### Step 2: Generate Secure JWT_SECRET

**Command to run (in local terminal):**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Expected output:** A 128-character hexadecimal string (e.g., `a1b2c3d4e5f6...`)

**Where to use:** In `backend/.env` production file

**Why important:** JWT_SECRET is used to sign authentication tokens. Never use the example value in production.

---

### Step 3: Build Fresh Production Versions

**Frontend Build:**
```bash
# From project root
npm run build
# Output: dist/ folder (already exists, verify it's up-to-date)
```

**Backend Build:**
```bash
cd backend
npm run build
# Output: backend/dist/ folder (already exists, verify it's up-to-date)
```

**Verify builds:**
- [ ] `dist/index.html` exists and is recent
- [ ] `dist/assets/` folder contains all JS/CSS bundles
- [ ] `backend/dist/server.js` exists and is recent
- [ ] `backend/dist/config/database.js` exists

---

### Step 4: Update Deployment Package

**Files to copy:**
1. Copy `dist/*` to `deployment-package/frontend/` (overwrite existing)
2. Copy `backend/dist/*` to `deployment-package/backend/dist/` (overwrite existing)
3. Create `deployment-package/frontend/api/.htaccess` (from Step 1)

**Files already in place:**
- `deployment-package/backend/package.json`
- `deployment-package/backend/package-lock.json`
- `deployment-package/mycae_tracker_backup.sql`
- `deployment-package/frontend/.htaccess` (frontend routing)

**Verify deployment package structure:**
```
deployment-package/
├── mycae_tracker_backup.sql      ← Database
├── backend/
│   ├── dist/                      ← Compiled backend
│   │   ├── server.js
│   │   ├── config/
│   │   ├── entities/
│   │   └── ...
│   ├── package.json
│   └── package-lock.json
└── frontend/
    ├── index.html
    ├── .htaccess                  ← Frontend routing
    ├── api/
    │   └── .htaccess              ← API proxy (NEW!)
    ├── assets/
    └── (other static files)
```

---

## 🚀 Phase 2: cPanel Database Setup (10 min)

### Step 1: Login to cPanel
- URL: `https://mycaetech.com:2083`
- Use your cPanel credentials

### Step 2: Create MySQL Database
1. Navigate to **MySQL® Databases**
2. Under "Create New Database":
   - Database Name: `mycae_tracker`
   - Click "Create Database"
   - Note: Full name will be like `username_mycae_tracker`

### Step 3: Create Database User
1. Scroll down to "Add New User":
   - Username: `mycae_user` (or similar)
   - Password: Click "Generate Password" (SAVE THIS!)
   - Click "Create User"

### Step 4: Grant Privileges
1. Scroll down to "Add User To Database":
   - User: Select your new user
   - Database: Select your new database
   - Click "Add"
   - Check **ALL PRIVILEGES**
   - Click "Make Changes"

### Step 5: Note Credentials
Write these down (you'll need them for backend .env):
```
Database Host: localhost
Database Name: <prefix>_mycae_tracker
Database User: <prefix>_mycae_user
Database Password: <your_generated_password>
```

### Step 6: Import Database
1. In cPanel, navigate to **phpMyAdmin**
2. On the left sidebar, click your new database
3. Click the **Import** tab
4. Click "Choose File" and select `mycae_tracker_backup.sql`
5. Format: SQL
6. Click "Go"
7. Wait for "Import has been successfully finished" message

**Verification:**
- [ ] All tables imported (should see 20+ tables)
- [ ] No errors during import
- [ ] Can browse tables in phpMyAdmin

---

## 🚀 Phase 3: Backend Deployment (15 min)

### Step 1: Upload Backend Files

**Option A: File Manager (Recommended)**
1. In cPanel, open **File Manager**
2. Navigate to `/home/<username>/`
3. Click "New Folder" → Name it: `mycaetracker-backend`
4. Upload these files to `mycaetracker-backend/`:
   - `package.json`
   - `package-lock.json`
   - `dist/` folder (entire folder with all subdirectories)

**Option B: FTP/SFTP**
- Use FileZilla or similar
- Host: `mycaetech.com`
- Upload to `/home/<username>/mycaetracker-backend/`

### Step 2: Create Production .env File

1. In File Manager, inside `mycaetracker-backend/` folder:
   - Click "+ File"
   - Name it: `.env`
   - Click "Create New File"

2. Right-click `.env` → "Edit"

3. Paste this content (replace placeholders with your credentials):

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=<YOUR_DATABASE_USER_FROM_STEP_2>
DB_PASSWORD=<YOUR_DATABASE_PASSWORD_FROM_STEP_2>
DB_NAME=<YOUR_DATABASE_NAME_FROM_STEP_2>

# Server Configuration
NODE_ENV=production
PORT=3000

# CORS Configuration
CORS_ORIGINS=https://mycaetech.com,https://www.mycaetech.com

# JWT Secret (use the 128-char string from Phase 1, Step 2)
JWT_SECRET=<YOUR_128_CHAR_HEX_SECRET>

# Email Configuration (optional - configure later)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=
```

4. Click "Save Changes"

### Step 3: Setup Node.js Application

1. In cPanel, navigate to **Setup Node.js App**
2. Click **Create Application**
3. Configure:
   - Node.js version: **18** or **20** (latest available LTS)
   - Application mode: **Production**
   - Application root: `mycaetracker-backend`
   - Application URL: Leave empty
   - Application startup file: `dist/server.js`
4. Click **Create**
5. Wait for app to be created (~30 seconds)

### Step 4: Install Dependencies

1. In the Node.js App screen:
   - Scroll down to "Environment Variables" section (skip for now)
   - Click **Run NPM Install**
   - Wait 2-3 minutes for installation to complete
   - Should see "Success" message when done

### Step 5: Start Backend

1. Click **Restart** button at the top
2. Check Status: Should show "Running" (green)
3. Click **View Logs** to check for errors
   - Look for: "MyCAE Equipment Tracker API Server"
   - Look for: "Database connection established successfully"
   - Look for: "Server running on: http://localhost:3000"

**Verification:**
- [ ] Status shows "Running" (green)
- [ ] Logs show no errors
- [ ] Database connection successful
- [ ] Health endpoint accessible

### Step 6: Test Backend Health Check

Open a new browser tab and visit:
```
https://mycaetech.com/api/health
```

Expected response (JSON):
```json
{
  "status": "healthy",
  "timestamp": "2026-01-16T...",
  "uptime": ...,
  "environment": "production",
  "checks": {
    "database": { "status": "ok", "latency": ... }
  }
}
```

**Verification:**
- [ ] Health check returns 200 OK
- [ ] Status is "healthy"
- [ ] Database check shows "ok"

---

## 🚀 Phase 4: Frontend Deployment (10 min)

### Step 1: Upload Frontend Files

1. In cPanel File Manager, navigate to `/public_html/`
2. **IMPORTANT:** Delete any existing files EXCEPT:
   - `cgi-bin/` folder (keep this!)
   - Any existing `.htaccess` (you can keep or replace)

3. Click "Upload" button

4. Upload ALL files from `deployment-package/frontend/`:
   - `index.html`
   - `.htaccess`
   - `api/` folder (entire folder)
   - `assets/` folder (entire folder - may need to zip first)
   - `favicon.svg`
   - `logo.svg`
   - `mycae-logo.svg`
   - `mycae-logo.png`
   - `templates/` folder
   - `vite.svg`

**Tip:** If you can't upload folders directly:
- Zip the entire `frontend/` folder on your computer
- Upload the zip to `/public_html/`
- Right-click zip → "Extract"
- Move all files from extracted folder to `/public_html/`
- Delete the zip file

### Step 2: Verify Frontend Files

In File Manager, `/public_html/` should contain:
- [ ] `index.html`
- [ ] `.htaccess`
- [ ] `api/.htaccess` ← NEW - API proxy
- [ ] `assets/` folder (with JS/CSS bundles)
- [ ] `favicon.svg`
- [ ] logo files

### Step 3: Set File Permissions (if needed)

Files should have:
- Permissions: `644` (rw-r--r--)
- Folders: `755` (rwxr-xr-x)

If files are not accessible:
1. Select all files/folders
2. Right-click → "Change Permissions"
3. Set to: `755` for folders, `644` for files
4. Click "Change Permissions"

---

## 🚀 Phase 5: SSL & Security (5 min)

### Step 1: Enable SSL Certificate

1. In cPanel, navigate to **SSL/TLS Status**
2. Select domain `mycaetech.com`
3. Click **Run AutoSSL**
4. Wait for Let's Encrypt certificate to install (1-2 minutes)
5. Verify green checkmark appears

### Step 2: Verify .htaccess Rules

The `.htaccess` file should contain:

**Frontend .htaccess (`/public_html/.htaccess`):**
- HTTPS redirect
- React Router fallback
- Security headers
- Gzip compression
- Browser caching

**API Proxy .htaccess (`/public_html/api/.htaccess`):**
- Proxy requests to `http://localhost:3000/api/$1`

These files are already created in the deployment package.

---

## 🚀 Phase 6: Testing & Verification (10 min)

### Step 1: Test Frontend

1. Open browser and visit: `https://mycaetech.com`
2. Expected: Login page loads
3. Open browser console (F12) → Check for errors
4. Check Network tab → API requests should go to `https://mycaetech.com/api/*`

**Verification:**
- [ ] Login page loads without errors
- [ ] No console errors
- [ ] HTTPS enabled (padlock icon)
- [ ] API requests go to correct URL

### Step 2: Test Login

1. Enter your admin credentials
2. Click "Login"
3. Expected: Redirect to dashboard

**Verification:**
- [ ] Login successful
- [ ] Redirect to dashboard
- [ ] User data loads
- [ ] No CORS errors

### Step 3: Test Core Features

1. **Navigation:**
   - Navigate between pages (Projects, Inventory, etc.)
   - [ ] All pages load correctly
   - [ ] No 404 errors

2. **Data Loading:**
   - Load projects list
   - Load inventory
   - [ ] Data displays correctly
   - [ ] Tables populate with data

3. **CRUD Operations:**
   - Create a new test project
   - Edit the project
   - [ ] Create operation works
   - [ ] Edit operation works

4. **File Upload (if applicable):**
   - Try uploading a document
   - [ ] Upload completes successfully

### Step 4: Check Backend Logs

1. In cPanel → Setup Node.js App
2. Click on your application
3. View **Log** section
4. Look for:
   - [ ] No critical errors
   - [ ] Request logs show API calls
   - [ ] Database queries successful

### Step 5: Test Health Check

Visit: `https://mycaetech.com/api/health`

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "...",
  "uptime": ...,
  "environment": "production",
  "checks": {
    "database": { "status": "ok", "latency": ... }
  }
}
```

---

## 🚨 Troubleshooting Guide

### Problem: Backend won't start

**Symptoms:**
- Status shows "Application Error" or red
- Logs show connection errors
- Health check fails

**Solutions:**
1. Check Node.js App logs for specific error
2. Verify `.env` file has correct database credentials
3. Click "Run NPM Install" again
4. Click "Restart" button
5. Verify database user has ALL PRIVILEGES
6. Ensure DB_HOST is `localhost` (not `127.0.0.1`)

**Common errors:**
- `Access denied for user`: Wrong DB_USER or DB_PASSWORD
- `Unknown database`: Wrong DB_NAME
- `Connection refused`: Database not running or wrong port

---

### Problem: CORS Errors

**Symptoms:**
- Browser console shows CORS errors
- API requests blocked
- "Not allowed by CORS" message

**Solutions:**
1. Check `.env` file: `CORS_ORIGINS=https://mycaetech.com,https://www.mycaetech.com`
2. Restart Node.js app (cPanel → Setup Node.js App → Restart)
3. Clear browser cache (Ctrl+Shift+Delete)
4. Verify frontend is using HTTPS

---

### Problem: 404 Not Found Errors

**Symptoms:**
- React routes return 404
- Clicking links shows 404 page
- Refreshing pages shows 404

**Solutions:**
1. Verify `.htaccess` exists in `/public_html/`
2. Check `.htaccess` has React Router fallback rules
3. Ensure `index.html` is in `/public_html/`
4. Check Apache mod_rewrite is enabled (usually enabled on cPanel)

---

### Problem: White Screen or Blank Page

**Symptoms:**
- Website loads but shows blank/white screen
- No content visible
- Browser console shows errors

**Solutions:**
1. Open browser console (F12) → Check Console tab for errors
2. Check Network tab → Verify assets are loading
3. Verify `dist/assets/` folder exists and has all JS/CSS files
4. Check if `index.html` references correct asset paths
5. Clear browser cache and reload

---

### Problem: "Cannot Connect to API"

**Symptoms:**
- Frontend loads but can't fetch data
- Network errors for API calls
- Backend shows no requests

**Solutions:**
1. Verify backend is running: Visit `/api/health`
2. Check `.env` file: `PORT=3000`
3. Restart Node.js app
4. Check firewall settings (cPanel may block port 3000)
5. Verify API proxy `.htaccess` exists in `/public_html/api/`

---

### Problem: Database Connection Failed

**Symptoms:**
- Backend logs show database errors
- Health check shows `database: { "status": "error" }`

**Solutions:**
1. Double-check `.env` database credentials
2. Verify database exists in cPanel → MySQL Databases
3. Verify user has ALL PRIVILEGES on database
4. Test connection in phpMyAdmin (can you browse tables?)
5. Ensure DB_HOST is `localhost`

---

### Problem: File Upload Errors

**Symptoms:**
- File uploads fail
- "File too large" error
- Uploads timeout

**Solutions:**
1. Increase PHP upload limits in cPanel:
   - cPanel → Select PHP Version → Options
   - Set `upload_max_filesize`: `10MB`
   - Set `post_max_size`: `10MB`
2. Check Node.js body parser limit in `server.ts`: `express.json({ limit: '10kb' })`
3. Verify uploads folder exists and has write permissions

---

## 📝 Post-Deployment Configuration

### Optional: Enable Email Notifications

1. Configure SMTP in backend `.env`:
```env
SMTP_HOST=mail.mycaetech.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@mycaetech.com
SMTP_PASSWORD=<your_smtp_password>
SMTP_FROM="MyCAE Tracker <noreply@mycaetech.com>"
```

2. Restart Node.js app

3. Test email by triggering a notification (e.g., checkout)

---

### Optional: Configure Automated Backups

1. cPanel → Backup → Configure Backup
2. Set daily/weekly schedule
3. Select: Database backup, Home directory backup
4. Store backups securely off-server

---

### Optional: Enable Node.js Auto-Restart

1. cPanel → Setup Node.js App
2. Edit your application
3. Check "Restart on failure"
4. Click "Save Changes"

---

## ✅ Final Verification Checklist

### Database
- [ ] Database created and imported successfully
- [ ] All tables present (20+ tables)
- [ ] Database user has ALL PRIVILEGES
- [ ] Can browse data in phpMyAdmin

### Backend
- [ ] Node.js app status: "Running" (green)
- [ ] Health check returns 200 OK
- [ ] Database check shows "ok"
- [ ] No errors in logs
- [ ] Port 3000 accessible

### Frontend
- [ ] HTTPS enabled (padlock icon)
- [ ] Login page loads correctly
- [ ] No console errors (F12)
- [ ] API requests go to `/api/*`
- [ ] React Router works (no 404s on refresh)
- [ ] All pages accessible

### Functionality
- [ ] Login works
- [ ] Data loads correctly
- [ ] CRUD operations work
- [ ] File uploads work (if applicable)
- [ ] Navigation between pages works

### Performance
- [ ] Page load time < 3 seconds
- [ ] API responses < 1 second
- [ ] No memory leaks (check logs over 24h)

---

## 📞 Support Resources

### Documentation
- **Deployment Guide:** `DEPLOYMENT_GUIDE.md` (project root)
- **Quick Checklist:** `deployment-package/QUICK_CHECKLIST.txt`
- **Start Here:** `deployment-package/START_HERE.txt`

### cPanel Resources
- **cPanel Login:** https://mycaetech.com:2083
- **Node.js App Manager:** cPanel → Setup Node.js App
- **Database Manager:** cPanel → MySQL Databases, phpMyAdmin
- **File Manager:** cPanel → File Manager

### Testing URLs
- **Frontend:** https://mycaetech.com
- **Backend Health:** https://mycaetech.com/api/health
- **Backend Ready:** https://mycaetech.com/api/health/ready
- **Backend Live:** https://mycaetech.com/api/health/live

### Log Locations
- **Node.js App Logs:** cPanel → Setup Node.js App → View Logs
- **Apache Logs:** cPanel → Metrics → Errors / Raw Access
- **Browser Console:** F12 → Console tab

---

## 🎯 Success Criteria

Your migration is **successful** when:

✅ Frontend loads at https://mycaetech.com without errors
✅ You can login with your credentials
✅ All pages navigate correctly (no 404s)
✅ Data displays properly in tables
✅ CRUD operations (create, read, update, delete) work
✅ SSL certificate active (padlock icon shows)
✅ No console errors in browser (F12)
✅ Backend logs show no critical errors
✅ Health check returns "healthy" status
✅ Fast page load times (< 3 seconds)

---

## 📅 Timeline Summary

| Phase | Duration | Description |
|-------|----------|-------------|
| Phase 1: Preparation | 15 min | Create files, generate secrets, build |
| Phase 2: Database | 10 min | Create DB, import backup |
| Phase 3: Backend | 15 min | Upload, configure, start Node.js |
| Phase 4: Frontend | 10 min | Upload files to public_html |
| Phase 5: SSL | 5 min | Enable Let's Encrypt |
| Phase 6: Testing | 10 min | Verify all features work |

**Total Estimated Time:** 60-65 minutes for first deployment
**Subsequent Updates:** 10-15 minutes (just upload and restart)

---

## 🔄 Future Deployment Workflow

After initial deployment, here's how to update the app:

1. **Local Development:**
   ```bash
   # Make changes
   npm run build          # Build frontend
   cd backend && npm run build  # Build backend
   ```

2. **Upload New Files:**
   - Upload new `dist/*` to `/public_html/`
   - Upload new `backend/dist/*` to `/home/username/mycaetracker-backend/`

3. **Restart Backend:**
   - cPanel → Setup Node.js App → Restart

4. **Clear Cache:**
   - Browser cache (Ctrl+Shift+Delete)
   - Optional: Clear Cloudflare if using

---

## 🚀 You're Ready to Deploy!

Follow this plan step-by-step, and you'll have MycaeTracker running on cPanel in about an hour.

**Key Reminders:**
- Take your time with the database setup
- Double-check all credentials before saving
- Test thoroughly before going live
- Monitor logs for first 24 hours

Good luck! 🎉
