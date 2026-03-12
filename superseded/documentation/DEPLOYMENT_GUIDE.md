# MycaeTracker cPanel Deployment Guide

## Pre-Deployment Checklist

✅ **Completed:**
- [x] Database exported: `mycae_tracker_backup.sql` (103KB)
- [x] Frontend built: `dist/` folder with production assets
- [x] Backend built: `backend/dist/` folder with compiled TypeScript
- [x] Frontend API URL configured: `https://mycaetech.com/api`

## Files Ready for Upload

### Database
- **File:** `mycae_tracker_backup.sql` (103KB)
- **Location:** Project root directory

### Frontend (Built)
- **Folder:** `dist/`
- **Size:** ~2.5MB total
- **Upload to:** `/public_html/` or `/public_html/subdomain/`

### Backend
- **Required files/folders:**
  - `backend/dist/` - Compiled JavaScript
  - `backend/package.json` - Dependencies list
  - `backend/package-lock.json` - Locked dependencies
  - `backend/.env` - Production environment variables (create on server)
  - `backend/node_modules/` - Will be installed on server

---

## Step-by-Step Deployment Instructions

### 1. Create MySQL Database in cPanel

1. Log into cPanel at: https://mycaetech.com:2083
2. Navigate to **MySQL® Databases**
3. Create New Database:
   - Database Name: `mycae_tracker` (or similar)
   - Click "Create Database"
4. Create Database User:
   - Username: Choose a secure username
   - Password: Generate a strong password
   - Click "Create User"
5. Add User to Database:
   - User: Select the user you created
   - Database: Select `mycae_tracker`
   - Privileges: Check **ALL PRIVILEGES**
   - Click "Make Changes"
6. **Note down these credentials:**
   - Database Host: `localhost`
   - Database Name: `<prefix>_mycae_tracker`
   - Database User: `<prefix>_username`
   - Database Password: `<your_password>`

### 2. Import Database

1. In cPanel, navigate to **phpMyAdmin**
2. Select your database (`<prefix>_mycae_tracker`)
3. Click **Import** tab
4. Choose File: Select `mycae_tracker_backup.sql`
5. Format: SQL
6. Click **Go**
7. Wait for import to complete (should show "Import has been successfully finished")

### 3. Upload Backend Files

**Option A: File Manager (Recommended for initial deployment)**

1. In cPanel, open **File Manager**
2. Navigate to `/home/<username>/`
3. Create folder: `mycaetracker-backend`
4. Upload these files/folders to `mycaetracker-backend/`:
   - `dist/` folder (entire folder)
   - `package.json`
   - `package-lock.json`
5. Create `.env` file (see Step 4 below for contents)

**Option B: FTP/SFTP**

Use FileZilla or similar FTP client:
- Host: mycaetech.com
- Username: Your cPanel username
- Password: Your cPanel password
- Port: 21 (FTP) or 22 (SFTP)

Upload to `/home/<username>/mycaetracker-backend/`

### 4. Create Production .env File

In `mycaetracker-backend/` folder, create a file named `.env` with this content:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=<your_cpanel_db_user>
DB_PASSWORD=<your_cpanel_db_password>
DB_NAME=<your_cpanel_db_name>

# Server Configuration
NODE_ENV=production
PORT=3000

# CORS Configuration
CORS_ORIGINS=https://mycaetech.com,https://www.mycaetech.com

# JWT Secret (generate a random string)
JWT_SECRET=your-very-long-random-secret-key-here-change-this

# Email Configuration (optional - configure later if needed)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=
```

**To generate a secure JWT_SECRET:**
- Go to https://www.random.org/strings/
- Or use: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

### 5. Setup Node.js Application in cPanel

1. In cPanel, navigate to **Setup Node.js App**
2. Click **Create Application**
3. Configure:
   - **Node.js version:** Select latest LTS (18.x or 20.x)
   - **Application mode:** Production
   - **Application root:** `mycaetracker-backend`
   - **Application URL:** Leave empty or set subdomain if needed
   - **Application startup file:** `dist/server.js`
4. Click **Create**
5. The system will:
   - Create the app
   - Show you environment variables section
   - Provide a command to enter virtual environment

### 6. Install Backend Dependencies

1. In Node.js App interface, click **Run NPM Install**
2. Or use Terminal:
   ```bash
   cd mycaetracker-backend
   npm install --production
   ```
3. Wait for installation to complete (~2-3 minutes)

### 7. Start Backend Application

1. In Node.js App interface, click **Start App** or **Restart**
2. Check the **Status** - should show "Running"
3. View logs to verify successful start
4. The backend will be accessible at `http://localhost:3000` internally

### 8. Upload Frontend Files

1. In cPanel File Manager, navigate to `/public_html/`
2. Upload all files from your `dist/` folder:
   - `index.html`
   - `assets/` folder
   - All other files (favicon.svg, logo files, etc.)
3. Set permissions:
   - Files: 644
   - Folders: 755

### 9. Create .htaccess for React Router

In `/public_html/`, create a file named `.htaccess`:

```apache
# Enable HTTPS redirect
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# React Router fallback
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>

# Security headers
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-XSS-Protection "1; mode=block"
</IfModule>

# Gzip compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Browser caching
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

### 10. Setup API Proxy (If needed)

If you want the API accessible at `https://mycaetech.com/api/`:

Create `/public_html/api/.htaccess`:

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]
```

### 11. Enable SSL Certificate

1. In cPanel, navigate to **SSL/TLS Status**
2. Select `mycaetech.com`
3. Click **Run AutoSSL**
4. Wait for Let's Encrypt certificate to install
5. Certificate should auto-renew every 90 days

---

## Verification Steps

### Test Backend API
```bash
curl https://mycaetech.com/api/health
# or
curl http://localhost:3000/health
```

### Test Frontend
1. Visit: https://mycaetech.com
2. Check browser console for errors
3. Try logging in
4. Test navigation between pages

### Check Node.js App Logs
1. cPanel → Setup Node.js App
2. Click on your application
3. View **Log** section for any errors

---

## Troubleshooting

### Backend won't start
1. Check logs in cPanel → Node.js App → View Logs
2. Verify `.env` file has correct database credentials
3. Ensure all dependencies installed: `npm list`
4. Check file permissions: folders 755, files 644

### Frontend shows CORS errors
1. Update `CORS_ORIGINS` in backend `.env`
2. Add your actual domain (not api subdomain)
3. Restart Node.js application

### Database connection fails
1. Verify DB credentials in `.env`
2. Check DB user has correct permissions in cPanel
3. Ensure hostname is `localhost` not `127.0.0.1`

### 404 on React routes
1. Verify `.htaccess` file exists in `/public_html/`
2. Check mod_rewrite is enabled (usually is on cPanel)
3. Clear browser cache

---

## Post-Deployment Configuration

### File Upload Limits
1. cPanel → Select PHP Version → Options
2. Set `upload_max_filesize`: 10MB
3. Set `post_max_size`: 10MB

### Enable Node.js Auto-Restart
1. cPanel → Node.js App
2. Check "Restart on failure"

### Setup Automated Backups
1. cPanel → Backup → Setup scheduled backups
2. Or use cPanel backup tool weekly

---

## Maintenance Commands

### Restart Backend
```bash
# Via cPanel Node.js App interface - click Restart
# Or via SSH:
cd mycaetracker-backend
npm restart
```

### View Backend Logs
```bash
# Via cPanel Node.js App interface
# Or check passenger log file
```

### Update Application
1. Build locally: `npm run build` (both frontend and backend)
2. Upload new `dist/` folders
3. Restart Node.js app

---

## Environment URLs

- **Production Site:** https://mycaetech.com
- **Backend API:** https://mycaetech.com/api
- **cPanel:** https://mycaetech.com:2083
- **phpMyAdmin:** Via cPanel

---

## Important Notes

⚠️ **Security:**
- Never commit `.env` files to git
- Keep database credentials secure
- Change JWT_SECRET to a strong random string

⚠️ **Performance:**
- Node.js app will restart if inactive for ~30 minutes (cPanel default)
- First request after restart may be slow (~5-10 seconds)

⚠️ **Backups:**
- Export database weekly: phpMyAdmin → Export
- Keep backup of uploaded files
- Store backups securely off-server

---

## Support

If you encounter issues:
1. Check cPanel error logs
2. Check Node.js app logs
3. Check browser console (F12) for frontend errors
4. Contact cPanel hosting support for server-specific issues
