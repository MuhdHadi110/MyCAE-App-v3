# MycaeTracker - cPanel Deployment Package

## 📦 What's in This Package

This folder contains **everything you need** to deploy MycaeTracker to your cPanel hosting at mycaetech.com.

### Package Contents:

```
deployment-package/
├── mycae_tracker_backup.sql    ← DATABASE (103KB)
├── backend/                    ← BACKEND FILES
│   ├── dist/                   (compiled code)
│   ├── package.json
│   └── package-lock.json
├── frontend/                   ← FRONTEND FILES
│   ├── index.html
│   ├── .htaccess
│   ├── assets/
│   └── (all other files)
├── START_HERE.txt              ← MAIN INSTRUCTIONS
├── QUICK_CHECKLIST.txt         ← PRINTABLE CHECKLIST
└── README.md                   ← This file
```

---

## 🚀 Quick Start (30-40 minutes)

### **Option 1: Follow Step-by-Step** (Recommended)
1. Open `START_HERE.txt`
2. Follow each step carefully
3. Check off items in `QUICK_CHECKLIST.txt`

### **Option 2: Quick Overview**
1. **Database** - Create MySQL database in cPanel, import `mycae_tracker_backup.sql`
2. **Backend** - Upload `backend/` files, setup Node.js app
3. **Frontend** - Upload `frontend/` files to `/public_html/`
4. **SSL** - Enable Let's Encrypt certificate
5. **Test** - Visit https://mycaetech.com and login

---

## ✅ Pre-Deployment Checklist

Make sure you have:
- [ ] cPanel login credentials
- [ ] Access to https://mycaetech.com:2083
- [ ] This deployment-package folder ready
- [ ] 30-40 minutes of uninterrupted time

---

## 📋 Deployment Steps Summary

### Step 1: Create Database (5 min)
- cPanel → MySQL® Databases
- Create: `mycae_tracker`
- Create user with strong password
- Grant ALL PRIVILEGES

### Step 2: Import Database (2 min)
- cPanel → phpMyAdmin
- Select your database
- Import → `mycae_tracker_backup.sql`

### Step 3: Upload Backend (5 min)
- cPanel → File Manager
- Create folder: `/home/username/mycaetracker-backend/`
- Upload files from `backend/` folder

### Step 4: Configure Backend (2 min)
- Create `.env` file
- Add database credentials

### Step 5: Setup Node.js (5 min)
- cPanel → Setup Node.js App
- Create application
- Run NPM install
- Start app

### Step 6: Upload Frontend (5 min)
- Upload all files from `frontend/` to `/public_html/`

### Step 7: Enable SSL (3 min)
- cPanel → SSL/TLS Status
- Run AutoSSL

### Step 8: Test (5 min)
- Visit https://mycaetech.com
- Login and verify functionality

---

## 🆘 Need Help?

### Common Issues:

**Backend won't start:**
- Check Node.js App logs in cPanel
- Verify .env database credentials
- Run "NPM Install" again

**CORS errors:**
- Restart Node.js app
- Check .env CORS_ORIGINS setting

**404 errors:**
- Verify .htaccess in /public_html/
- Check all frontend files uploaded

**Database connection failed:**
- Double-check .env credentials
- Verify database user has ALL PRIVILEGES
- Ensure DB host is "localhost"

---

## 📞 Support Resources

1. **Detailed Instructions:** See `START_HERE.txt`
2. **Quick Reference:** See `QUICK_CHECKLIST.txt`
3. **Backend Logs:** cPanel → Setup Node.js App → View Logs
4. **Browser Console:** Press F12 on the website

---

## 🎯 Success Criteria

Your deployment is successful when:
- ✅ https://mycaetech.com loads without errors
- ✅ You can login with your credentials
- ✅ All pages navigate correctly
- ✅ Data displays properly
- ✅ SSL certificate shows (padlock icon)
- ✅ No console errors (F12)

---

## 📝 Important Notes

### Security:
- Database credentials are set during deployment
- JWT_SECRET is included in instructions
- Never share your .env file

### Performance:
- Node.js app may take 5-10 seconds on first request after restart
- cPanel may restart inactive apps after 30 minutes

### Backups:
- Keep this deployment-package folder safe
- Export database weekly from phpMyAdmin
- Store backups off-server

---

## 🔄 Future Updates

To update the application:
1. Build new version locally
2. Upload new files
3. Restart Node.js app

---

## ✨ Ready to Deploy?

1. Read `START_HERE.txt` once through
2. Open `QUICK_CHECKLIST.txt` to track progress
3. Login to cPanel
4. Begin Step 1!

**Estimated Time:** 30-40 minutes
**Difficulty:** Easy (just follow the steps!)

Good luck! 🚀
