# MyCAE-App - cPanel Deployment Guide

## Overview
This guide will help you deploy your MyCAE Tracker application from GitHub to cPanel using Git Version Control.

## Prerequisites
✅ Code pushed to GitHub (https://github.com/MuhdHadi110/MyCAE-App)
✅ Database migration completed (SQL script executed)
✅ cPanel access with Git Version Control feature enabled

---

## Phase 1: Configure cPanel Git Version Control

### Step 1: Access Git Version Control
1. Log into cPanel
2. Go to **Files** → **Git Version Control**
3. Click **"Create"** button

### Step 2: Clone Your Repository
1. **Toggle:** Enable "Clone a Repository"
2. **Clone URL:** `https://github.com/MuhdHadi110/MyCAE-App`
3. **Repository Path:** `/home/mycaet40/repositories/MyCAE-App`
   - This creates a separate folder for the Git repository
4. **Repository Name:** `MyCAE-App`
5. Click **"Create"**

### Step 3: Wait for Clone to Complete
- The clone may take a few minutes
- You'll see progress in the interface
- Once done, you'll see it in the repositories list

---

## Phase 2: Initial Deployment

### Step 1: Access Repository Management
1. In Git Version Control list, find your repository
2. Click **"Manage"** button

### Step 2: Pull Latest Changes
1. Click **"Update from Remote"** to pull latest code from GitHub
2. Wait for pull to complete

### Step 3: Deploy Application
1. Click **"Deploy HEAD Commit"**
2. This runs the `.cpanel.yml` file which:
   - Copies frontend files to `public_html/`
   - Copies backend files to `/home/mycaet40/`
   - Preserves existing `.env` file

---

## Phase 3: Configure Node.js Application

### Step 1: Setup Node.js App
1. Go to **Software** → **Setup Node.js App**
2. Click **"Create Application"**

### Step 2: Configure Application Settings
- **Node.js Version:** 18.x or 20.x (choose latest available)
- **Application Mode:** Production
- **Application Root:** `/home/mycaet40`
- **Application URL:** Your domain (e.g., `mycaetech.com`)
- **Application Startup File:** `dist/server.js`
- **Passenger log file:** `/home/mycaet40/logs/node.log`

### Step 3: Environment Variables
Add these environment variables:
```
NODE_ENV=production
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_NAME=mycaet40_mycae_tracker
DB_USER=mycaet40_mycaetracker_dbuser
DB_PASSWORD=YOUR_DB_PASSWORD
JWT_SECRET=YOUR_JWT_SECRET
FRONTEND_URL=https://mycaetech.com
```

**Note:** Copy values from your backed-up `.env` file

### Step 4: Install Dependencies
1. In the Node.js App interface, click **"Run NPM Install"**
2. Wait for installation to complete

### Step 5: Start Application
1. Click **"Start App"**
2. Check that status shows "Running"

---

## Phase 4: Verify Deployment

### Test Backend
1. Visit: `https://mycaetech.com:3001/api/health`
2. Should return: `{"status":"ok"}` or similar

### Test Frontend
1. Visit: `https://mycaetech.com`
2. Should see login page
3. Try logging in

### Test Key Features
- [ ] User login works
- [ ] Dashboard loads
- [ ] Projects display
- [ ] New Project Team feature works
- [ ] Team Workload shows all engineers
- [ ] No console errors

---

## Phase 5: Future Updates (Easy!)

Once set up, updating is simple:

### When you make changes locally:
1. Commit changes: `git commit -m "your message"`
2. Push to GitHub: `git push origin main`

### To deploy to cPanel:
1. Go to cPanel → **Files** → **Git Version Control**
2. Click **"Manage"** on your repository
3. Click **"Update from Remote"** (pulls latest code)
4. Click **"Deploy HEAD Commit"** (deploys to live site)
5. If backend changed: **Software** → **Setup Node.js App** → **Restart**

That's it! No more manual file uploads.

---

## Troubleshooting

### Issue: Clone fails with authentication error
**Solution:** 
- Make sure your GitHub repository is public, OR
- Set up SSH keys in cPanel for private repo access

### Issue: Deployment fails
**Solution:**
- Check `.cpanel.yml` file exists in repository root
- Check file permissions in File Manager
- Review error logs in Node.js App interface

### Issue: Node.js app won't start
**Solution:**
- Check `dist/server.js` exists after deployment
- Review logs in `/home/mycaet40/logs/`
- Verify all environment variables are set
- Try stopping and starting the app

### Issue: Frontend shows 404 errors
**Solution:**
- Check `public_html/` has `index.html` and `assets/` folder
- Verify `.cpanel.yml` deployed frontend files correctly

---

## Important Files

### .cpanel.yml (Already in your repo)
This file tells cPanel how to deploy your code:
- Frontend → `public_html/`
- Backend → `/home/mycaet40/`
- Preserves existing `.env`

### .env (Production)
Located at `/home/mycaet40/.env`
Contains sensitive data - never commit to Git!

---

## Quick Reference

| Task | Location |
|------|----------|
| Pull latest code | Git Version Control → Manage → Update from Remote |
| Deploy to live | Git Version Control → Manage → Deploy HEAD Commit |
| Restart backend | Setup Node.js App → Restart |
| View logs | Setup Node.js App → Logs |
| Edit .env | File Manager → /home/mycaet40/.env |
| Check frontend | File Manager → public_html/ |

---

## Rollback Plan

If something goes wrong:

1. **Stop Node.js App** (Setup Node.js App → Stop)
2. **Restore database** (phpMyAdmin → import your .sql backup)
3. **Restore files** (File Manager → use backup .zip files)
4. **Restart Node.js App**

---

## Need Help?

If you encounter issues:
1. Check error logs in Node.js App interface
2. Check cPanel error logs (Metrics → Errors)
3. Verify database connection in `.env`
4. Ensure all file paths in `.cpanel.yml` are correct

Good luck with your deployment! 🚀
