# MycaeTracker Deployment Checklist

## ✅ Pre-Deployment (Completed)

- [x] Database exported: `mycae_tracker_backup.sql` (103KB)
- [x] Frontend production build created in `dist/`
- [x] Backend production build created in `backend/dist/`
- [x] Production API URL configured: `https://mycaetech.com/api`
- [x] Deployment guide created: `DEPLOYMENT_GUIDE.md`

---

## 📋 cPanel Deployment Steps (To Do)

### Phase 1: Database Setup
- [ ] **1.1** Log into cPanel (https://mycaetech.com:2083)
- [ ] **1.2** Create MySQL database via **MySQL® Databases**
- [ ] **1.3** Create database user with strong password
- [ ] **1.4** Grant ALL PRIVILEGES to user on database
- [ ] **1.5** Note credentials:
  ```
  DB_HOST: localhost
  DB_NAME: <prefix>_mycae_tracker
  DB_USER: <prefix>_username
  DB_PASSWORD: <your_password>
  ```
- [ ] **1.6** Open phpMyAdmin
- [ ] **1.7** Import `mycae_tracker_backup.sql`
- [ ] **1.8** Verify all tables imported successfully

### Phase 2: Backend Upload & Configuration
- [ ] **2.1** Create folder `/home/<username>/mycaetracker-backend/`
- [ ] **2.2** Upload backend files:
  - [ ] `dist/` folder (compiled code)
  - [ ] `package.json`
  - [ ] `package-lock.json`
- [ ] **2.3** Create `.env` file with production credentials
- [ ] **2.4** Generate secure JWT_SECRET (64+ characters)
- [ ] **2.5** Update database credentials in `.env`

### Phase 3: Node.js Application Setup
- [ ] **3.1** Open **Setup Node.js App** in cPanel
- [ ] **3.2** Click **Create Application**
- [ ] **3.3** Configure:
  - [ ] Node.js version: 18.x or 20.x LTS
  - [ ] Application mode: Production
  - [ ] Application root: `mycaetracker-backend`
  - [ ] Startup file: `dist/server.js`
- [ ] **3.4** Click **Run NPM Install**
- [ ] **3.5** Wait for dependencies to install
- [ ] **3.6** Click **Start App**
- [ ] **3.7** Verify status shows "Running"
- [ ] **3.8** Check logs for any errors

### Phase 4: Frontend Upload
- [ ] **4.1** Navigate to `/public_html/` in File Manager
- [ ] **4.2** Upload all files from `dist/` folder:
  - [ ] `index.html`
  - [ ] `assets/` folder
  - [ ] `favicon.svg`
  - [ ] `logo.svg`
  - [ ] `mycae-logo.png`
  - [ ] Other files
- [ ] **4.3** Set permissions:
  - [ ] Folders: 755
  - [ ] Files: 644

### Phase 5: Configure Web Server
- [ ] **5.1** Create `.htaccess` in `/public_html/` for:
  - [ ] HTTPS redirect
  - [ ] React Router support
  - [ ] Security headers
  - [ ] Gzip compression
  - [ ] Browser caching
- [ ] **5.2** Create API proxy at `/public_html/api/.htaccess`
- [ ] **5.3** Test .htaccess rules work

### Phase 6: SSL Certificate
- [ ] **6.1** Open **SSL/TLS Status** in cPanel
- [ ] **6.2** Select domain `mycaetech.com`
- [ ] **6.3** Click **Run AutoSSL**
- [ ] **6.4** Wait for Let's Encrypt certificate installation
- [ ] **6.5** Verify SSL certificate is active

### Phase 7: Testing
- [ ] **7.1** Test backend health endpoint:
  ```bash
  curl https://mycaetech.com/api/health
  ```
- [ ] **7.2** Visit https://mycaetech.com
- [ ] **7.3** Check browser console for errors (F12)
- [ ] **7.4** Test login functionality
- [ ] **7.5** Test navigation between pages
- [ ] **7.6** Test data loading (projects, inventory, etc.)
- [ ] **7.7** Test CRUD operations (create, read, update, delete)
- [ ] **7.8** Test file uploads (if applicable)

### Phase 8: Post-Deployment Configuration
- [ ] **8.1** Configure PHP file upload limits (10MB)
- [ ] **8.2** Enable Node.js auto-restart on failure
- [ ] **8.3** Setup automated backups in cPanel
- [ ] **8.4** Document admin credentials securely
- [ ] **8.5** Test scheduled tasks (if any)

---

## 🔧 Files & Locations Reference

### Local Files (Ready for Upload)
```
c:\Users\User\Documents\MycaeTracker\
├── mycae_tracker_backup.sql         # Database backup (103KB)
├── dist/                             # Frontend production build
│   ├── index.html
│   ├── assets/
│   └── ...
├── backend/
│   ├── dist/                         # Backend production build
│   ├── package.json
│   └── package-lock.json
└── DEPLOYMENT_GUIDE.md               # Full deployment instructions
```

### Server Locations
```
/home/<username>/
├── public_html/                      # Frontend files
│   ├── index.html
│   ├── assets/
│   ├── .htaccess
│   └── api/
│       └── .htaccess
└── mycaetracker-backend/             # Backend application
    ├── dist/
    ├── node_modules/
    ├── package.json
    └── .env
```

---

## 🚨 Important Reminders

### Before Deployment
- ✅ Backup current production data (if any)
- ✅ Test locally one more time
- ✅ Verify all sensitive data removed from code
- ✅ Check .env.example doesn't contain real credentials

### During Deployment
- ⚠️ Use strong, unique passwords for database
- ⚠️ Generate random JWT_SECRET (don't use example)
- ⚠️ Double-check database credentials before importing
- ⚠️ Verify file permissions after upload

### After Deployment
- 📝 Document all credentials in secure password manager
- 📝 Test ALL functionality before announcing
- 📝 Monitor logs for first 24 hours
- 📝 Setup monitoring/alerting if available

---

## 📞 Quick Reference

### cPanel URLs
- **cPanel:** https://mycaetech.com:2083
- **phpMyAdmin:** Via cPanel
- **File Manager:** Via cPanel

### Application URLs
- **Production Site:** https://mycaetech.com
- **Backend API:** https://mycaetech.com/api
- **Health Check:** https://mycaetech.com/api/health

### Support Resources
- Full Guide: `DEPLOYMENT_GUIDE.md`
- Backend .env Example: `backend/.env.production.example`
- cPanel Documentation: Via cPanel help section

---

## ✨ Post-Deployment Success Criteria

- [ ] Website loads without errors
- [ ] Login works correctly
- [ ] All pages accessible
- [ ] Data displays correctly
- [ ] CRUD operations function
- [ ] SSL certificate active (padlock shows)
- [ ] No console errors
- [ ] Backend logs show no errors
- [ ] Fast page load times (<3 seconds)

---

## 📊 Deployment Timing Estimate

- Database setup: 10-15 minutes
- Backend upload & config: 15-20 minutes
- Node.js app setup: 10-15 minutes
- Frontend upload: 10 minutes
- Web server config: 5-10 minutes
- SSL setup: 5-10 minutes
- Testing: 15-20 minutes

**Total estimated time:** 1-2 hours

---

## 🎯 Next Steps After Successful Deployment

1. Monitor application for 24-48 hours
2. Gather user feedback
3. Setup automated backups (daily/weekly)
4. Configure monitoring/alerting
5. Document any deployment-specific issues
6. Plan next deployment (git workflow, CI/CD)
