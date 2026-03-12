# Environment Variables - Quick Reference

## 🚨 Critical Actions Needed Before Beta Deployment

### 1. Generate JWT_SECRET (Backend)
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Update in `backend/.env`:
```env
JWT_SECRET=<paste_generated_secret_here>
```

### 2. Get Production reCAPTCHA Keys
Go to: https://www.google.com/recaptcha/admin

Update in **backend/.env**:
```env
RECAPTCHA_SECRET_KEY=<paste_secret_key_here>
```

Update in **frontend/.env** (create this file):
```env
VITE_RECAPTCHA_SITE_KEY=<paste_site_key_here>
```

### 3. Set Database Password
Update in `backend/.env`:
```env
DB_PASSWORD=<your_secure_db_password>
```

### 4. Update SMTP Credentials
Update in `backend/.env`:
```env
SMTP_HOST=mail.yourdomain.com
SMTP_USER=noreply@yourdomain.com
SMTP_PASSWORD=<your_smtp_password>
```

### 5. Update Production URLs
Update in both **backend/.env** and **frontend/.env**:
```env
# Backend
FRONTEND_URL=https://yourdomain.com
NODE_ENV=production

# Frontend
VITE_FRONTEND_URL=https://yourdomain.com
VITE_API_URL=https://api.yourdomain.com/api
```

---

## ✅ Complete .env Templates

### Backend (.env) - Production Template
```env
# Database
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=mycae_tracker
DB_USER=production_db_user
DB_PASSWORD=CHANGE_THIS_SECURE_PASSWORD

# JWT
JWT_SECRET=CHANGE_THIS_TO_RANDOM_32_CHAR_STRING
JWT_EXPIRES_IN=7d

# reCAPTCHA (Backend)
RECAPTCHA_SECRET_KEY=CHANGE_THIS_TO_PRODUCTION_SECRET_KEY

# Server
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com

# Email
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=noreply@yourdomain.com
SMTP_PASSWORD=CHANGE_THIS_TO_SMTP_PASSWORD
EMAIL_FROM=MyCAE App <noreply@yourdomain.com>

# n8n (Optional)
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook
N8N_API_KEY=CHANGE_THIS_TO_N8N_KEY
N8N_WORKFLOW_NEW_CHECKOUT=https://your-n8n-instance.com/webhook/checkout-created
N8N_WORKFLOW_RETURN_DUE=https://your-n8n-instance.com/webhook/return-due
N8N_WORKFLOW_LOW_STOCK=https://your-n8n-instance.com/webhook/low-stock-alert
N8N_WORKFLOW_MAINTENANCE_TICKET=https://your-n8n-instance.com/webhook/maintenance-ticket
N8N_WORKFLOW_PROJECT_ASSIGNED=https://your-n8n-instance.com/webhook/project-assigned
```

### Frontend (.env) - Production Template
```env
# API
VITE_API_URL=https://api.yourdomain.com/api

# reCAPTCHA (Frontend)
VITE_RECAPTCHA_SITE_KEY=CHANGE_THIS_TO_PRODUCTION_SITE_KEY

# App
VITE_FRONTEND_URL=https://yourdomain.com
VITE_APP_NAME=MyCAE Equipment Tracker
```

---

## 📝 Commands Reference

### Generate JWT Secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Generate Random Password (for DB/SMTP):
```bash
openssl rand -base64 24
# Or
node -e "console.log(require('crypto').randomBytes(24).toString('base64'))"
```

### Test Backend Environment Variables:
```bash
cd backend
node -e "require('dotenv').config(); console.log('JWT_SECRET:', process.env.JWT_SECRET?.substring(0, 10) + '...');"
```

### Test Frontend Environment Variables:
```bash
cd frontend
npm run dev
# Check console for VITE_RECAPTCHA_SITE_KEY warnings
```

---

## 📋 Deployment Checklist

### Before Upload:
- [ ] Generated new JWT_SECRET (32+ random characters)
- [ ] Retrieved production reCAPTCHA keys (site + secret)
- [ ] Set production DB password
- [ ] Configured production SMTP credentials
- [ ] Set NODE_ENV=production
- [ ] Updated FRONTEND_URL to production domain
- [ ] Created frontend/.env file
- [ ] Updated VITE_API_URL to production API endpoint

### On Production Server:
- [ ] Uploaded backend files
- [ ] Created/updated backend/.env with production values
- [ ] Uploaded frontend build (dist/)
- [ ] Created/updated frontend/.env with production values
- [ ] Run: `npm install` (backend)
- [ ] Run: `npm run build` (backend)
- [ ] Restart backend service (pm2 or systemd)

### After Deployment:
- [ ] Test login with temp password (TempPassword123!)
- [ ] Verify password change works
- [ ] Test reCAPTCHA (should not error)
- [ ] Test email sending (trigger password reset)
- [ ] Test all main features
- [ ] Check browser console for errors

---

## 🔒 Security Notes

### ⚠️ Files That MUST Be in .gitignore (Already Done):
- `.env` (root)
- `backend/.env` (backend)
- `frontend/.env` (frontend if created)
- Any file with `.env` prefix

### ✅ Files That CAN Be in Git:
- `.env.example` (contains only placeholders)
- `SECURE_ENV_GUIDE.md` (this file - documentation)

### 🔄 When to Rotate Secrets:
- **JWT_SECRET**: Every 90 days or if compromised
- **Database Password**: If compromised or policy requires
- **SMTP Password**: If email account is changed or compromised
- **reCAPTCHA Keys**: If compromised or keys revoked by Google

---

## 📞 Quick Help

### reCAPTCHA Not Working?
1. Check: Frontend uses **SITE KEY**, Backend uses **SECRET KEY**
2. Verify: Both keys are from same reCAPTCHA setup
3. Check: Domain in reCAPTCHA console matches your production domain
4. Clear: Browser cache (CAPTCHA may be cached)

### JWT Token Issues?
1. Verify: JWT_SECRET is same on all backend instances
2. Check: JWT_SECRET length (minimum 32 characters)
3. Verify: Token not expired (7 days default)

### Emails Not Sending?
1. Check: SMTP_HOST is correct (usually `mail.yourdomain.com` for cPanel)
2. Verify: SMTP_USER and PASSWORD match email account
3. Check: SMTP_PORT (465 for SSL, 587 for TLS)
4. Verify: SMTP_SECURE=true for port 465, false for 587

### Database Connection Failed?
1. Check: DB_HOST (use `127.0.0.1` for same server)
2. Verify: DB_PORT (usually 3306 for MySQL)
3. Check: DB_USER and DB_PASSWORD are correct
4. Verify: DB_NAME exists and user has permissions

---

## 🎯 Summary

### What YOU Need to Do (Before Beta Launch):

1. **15 minutes**: Get reCAPTCHA production keys
2. **1 minute**: Generate JWT_SECRET
3. **5 minutes**: Update backend/.env with all production values
4. **3 minutes**: Create frontend/.env with production values
5. **5 minutes**: Deploy and test

### Total Time: ~30 minutes
### Cost: Free (all services used are free)

---

Created by: OpenCode Assistant
Date: January 14, 2026
Purpose: Secure environment variable setup for beta deployment
