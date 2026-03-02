# Secure Environment Variables Setup Guide

## 🚨 Current Issues to Fix

### 1. Backend (.env) - CRITICAL

**Current Problems:**
```env
JWT_SECRET=YOUR_GENERATED_JWT_SECRET_HERE  # EXPOSED
SMTP_PASSWORD=YOUR_SMTP_PASSWORD_HERE  # EXPOSED
RECAPTCHA_SECRET_KEY=YOUR_RECAPTCHA_SECRET_KEY_HERE  # TEST KEY
DB_PASSWORD=  # EMPTY
```

**What to Change:**
```env
# Database Configuration
DB_HOST=localhost  # Change to: 127.0.0.1 or production DB host
DB_PORT=3306
DB_NAME=mycae_tracker
DB_USER=root  # Change to: production database user
DB_PASSWORD=your_secure_db_password_here  # REQUIRED - set strong password

# JWT Configuration - CHANGE THIS FOR PRODUCTION
JWT_SECRET=generate_new_32_char_random_secret_here  # See below
JWT_EXPIRES_IN=7d

# Google reCAPTCHA v2 Secret Key (REQUIRED)
# Get from: https://www.google.com/recaptcha/admin
RECAPTCHA_SECRET_KEY=your_production_secret_key_here  # NOT the test key

# Server Configuration
PORT=5000
NODE_ENV=production  # Change from 'development' to 'production'
FRONTEND_URL=https://yourdomain.com  # Change to production URL

# Email Configuration - CHANGE TO PRODUCTION SMTP
SMTP_HOST=mail.yourdomain.com  # Change to your production SMTP
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=notifications@yourdomain.com  # Change to your production email
SMTP_PASSWORD=your_production_smtp_password  # REQUIRED - production SMTP password
EMAIL_FROM=MyCAE App <noreply@yourdomain.com>

# n8n Configuration (Optional)
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook
N8N_API_KEY=your_n8n_api_key
N8N_WORKFLOW_NEW_CHECKOUT=https://your-n8n-instance.com/webhook/checkout-created
N8N_WORKFLOW_RETURN_DUE=https://your-n8n-instance.com/webhook/return-due
N8N_WORKFLOW_LOW_STOCK=https://your-n8n-instance.com/webhook/low-stock-alert
N8N_WORKFLOW_MAINTENANCE_TICKET=https://your-n8n-instance.com/webhook/maintenance-ticket
N8N_WORKFLOW_PROJECT_ASSIGNED=https://your-n8n-instance.com/webhook/project-assigned
```

### 2. Frontend (.env.example doesn't exist - needs creation)

**Frontend needs:** `VITE_RECAPTCHA_SITE_KEY`

Create file: `frontend/.env.example` (or `.env.example` in root):
```env
# API Configuration
VITE_API_URL=http://localhost:5000/api  # Change to production API URL

# Google reCAPTCHA Configuration
# Get your SITE KEY from: https://www.google.com/recaptcha/admin
VITE_RECAPTCHA_SITE_KEY=your_google_recaptcha_site_key_here

# Frontend URL (for email links)
VITE_FRONTEND_URL=https://yourdomain.com

# Application Settings
VITE_APP_NAME=MyCAE Equipment Tracker
```

---

## 🔐 How to Generate Secure JWT_SECRET

### Method 1: Using Node.js (Recommended)
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Method 2: Using OpenSSL
```bash
openssl rand -hex 32
```

### Method 3: Using Python
```python
import secrets
print(secrets.token_hex(32))
```

### Method 4: Online Generator
Visit: https://generate-secret.vercel.app/32

**Example of a good JWT_SECRET:**
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

---

## ✅ What Environment Variables Are Used For

### Backend (.env)

| Variable | Used For | Example | Security Level |
|-----------|-----------|----------|----------------|
| `DB_HOST` | Database server address | `127.0.0.1` | Low |
| `DB_PORT` | Database port | `3306` | Low |
| `DB_NAME` | Database name | `mycae_tracker` | Low |
| `DB_USER` | Database username | `root` | Medium |
| `DB_PASSWORD` | Database password | `SecurePass123!` | **CRITICAL** |
| `JWT_SECRET` | Sign JWT tokens | `random-string` | **CRITICAL** |
| `JWT_EXPIRES_IN` | Token expiration | `7d` | Low |
| `RECAPTCHA_SECRET_KEY` | Verify CAPTCHA | `6Le...` | **HIGH** |
| `SMTP_HOST` | Email server | `smtp.gmail.com` | Medium |
| `SMTP_PORT` | Email port | `587` | Low |
| `SMTP_SECURE` | Use SSL/TLS | `true` | Low |
| `SMTP_USER` | Email username | `user@domain.com` | **HIGH** |
| `SMTP_PASSWORD` | Email password | `password` | **CRITICAL** |
| `EMAIL_FROM` | From email address | `noreply@domain.com` | Low |
| `FRONTEND_URL` | Base URL for links | `https://domain.com` | Low |
| `NODE_ENV` | Environment mode | `production` | Medium |
| `N8N_*` | Automation webhooks | Various | Medium |

### Frontend (.env)

| Variable | Used For | Example | Security Level |
|-----------|-----------|----------|----------------|
| `VITE_API_URL` | API base URL | `https://api.domain.com/api` | Low |
| `VITE_RECAPTCHA_SITE_KEY` | CAPTCHA widget | `6Le...` | **PUBLIC** (safe to expose) |
| `VITE_FRONTEND_URL` | App base URL | `https://domain.com` | Low |
| `VITE_APP_NAME` | App title | `MyCAE` | Low |

---

## 📝 Step-by-Step Deployment Process

### Step 1: Get reCAPTCHA Production Keys

1. Visit: https://www.google.com/recaptcha/admin
2. Sign in with Google account
3. Click "Register a new site"
4. Fill in:
   - Label: `MyCAE Tracker Production`
   - Type: `reCAPTCHA v2`
   - Checkbox: `I'm not a robot`
   - Domains:
     - `yourdomain.com`
     - `www.yourdomain.com`
     - `staging.yourdomain.com` (if using staging)
5. Accept terms and submit
6. Copy both keys:
   - **Site Key** (for frontend `.env`)
   - **Secret Key** (for backend `.env`)

### Step 2: Generate JWT_SECRET

```bash
# Run this command in terminal:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output - this is your new `JWT_SECRET`

### Step 3: Update Backend .env on Production Server

```bash
# SSH into production server
cd /path/to/backend
nano .env  # or vim .env
```

Update these lines:
```env
DB_PASSWORD=your_secure_db_password_here
JWT_SECRET=paste_new_jwt_secret_here
RECAPTCHA_SECRET_KEY=paste_production_secret_key_here
SMTP_PASSWORD=your_production_smtp_password
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
```

### Step 4: Create Frontend .env

On production server (or build locally and upload):

```bash
cd /path/to/frontend
nano .env  # or create file
```

Add:
```env
VITE_API_URL=https://api.yourdomain.com/api
VITE_RECAPTCHA_SITE_KEY=paste_production_site_key_here
VITE_FRONTEND_URL=https://yourdomain.com
VITE_APP_NAME=MyCAE Equipment Tracker
```

### Step 5: Build and Deploy Frontend

```bash
cd /path/to/frontend
npm install
npm run build

# Upload dist/ folder to your web server
# Example: upload to /public_html/
```

### Step 6: Restart Backend

```bash
cd /path/to/backend
npm run build
pm2 restart all  # or whatever process manager you use
```

---

## 🔒 Security Best Practices

### ✅ DO:
- Generate random, long secrets (minimum 32 characters)
- Use different passwords for different services
- Store .env files only on production server
- Add .env to .gitignore (already done ✅)
- Use .env.example as template with placeholder values
- Rotate secrets periodically (JWT_SECRET every 90 days)
- Use environment-specific secrets (dev, staging, prod)
- Backup .env files securely (encrypted storage)

### ❌ DON'T:
- Commit .env to git
- Share secrets in chat/email
- Use weak or common passwords
- Use test keys in production
- Hardcode secrets in source code
- Log secrets to console
- Store secrets in database or code comments

---

## 🧪 Testing Your Setup

### Test reCAPTCHA:
1. Login with test credentials
2. Complete CAPTCHA
3. Should work without errors

### Test Email:
1. Trigger a password reset
2. Check email inbox
3. Email should arrive

### Test JWT:
1. Login and get token
2. Try to access protected endpoint
3. Should work for 7 days

### Test Database:
1. Create a new record
2. Verify it persists
3. Check database via phpMyAdmin or CLI

---

## 📊 Environment Variables Summary

### Before Deployment (Current State):
| File | Issues Found | Action Required |
|------|--------------|-----------------|
| `backend/.env` | JWT_SECRET exposed, SMTP_PASSWORD exposed, Test reCAPTCHA key, Empty DB_PASSWORD | ⚠️ UPDATE ALL |
| `.env.example` (root) | Has placeholder values | ✅ Good |
| `frontend/.env.example` | Doesn't exist | ⚠️ CREATE |

### After Deployment (Target State):
| File | State |
|------|--------|
| `backend/.env` | ✅ Secure production values |
| `.env.example` (root) | ✅ Placeholders only (safe in git) |
| `frontend/.env.example` | ✅ Created with placeholders |
| `.gitignore` | ✅ All .env files ignored |

---

## 🚀 Quick Reference Commands

### Generate secrets:
```bash
# JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# DB_PASSWORD (example - use your own)
openssl rand -base64 24
```

### Test environment variables:
```bash
# Backend
cd backend
node -e "console.log(process.env.DB_NAME)"

# Frontend
cd frontend
node -e "console.log(require('dotenv').config().parsed.VITE_API_URL)"
```

### Verify gitignore:
```bash
git status  # Should NOT show .env files
```

---

## 📞 Emergency Reset

If secrets are compromised, immediately:

1. **Rotate JWT_SECRET:**
   - Generate new secret
   - Update backend/.env
   - Restart backend
   - All users must re-login (acceptable emergency measure)

2. **Rotate SMTP Password:**
   - Change in email provider
   - Update backend/.env
   - Test email sending

3. **Rotate Database Password:**
   - Change in database
   - Update backend/.env
   - Restart backend

4. **Rotate reCAPTCHA Keys:**
   - Generate new keys in Google Console
   - Update both frontend and backend .env
   - Redeploy frontend (if cached)

---

## ✅ Final Checklist

Before deploying to production, verify:

- [ ] JWT_SECRET is random 32+ character string (NOT the one from this repo)
- [ ] DB_PASSWORD is set (not empty)
- [ ] RECAPTCHA_SECRET_KEY is production key (NOT 6LeIxAcT...)
- [ ] SMTP_PASSWORD is production password
- [ ] NODE_ENV=production
- [ ] FRONTEND_URL points to production domain
- [ ] Frontend .env exists with VITE_RECAPTCHA_SITE_KEY
- [ ] All .env files are in .gitignore
- [ ] .env.example files contain only placeholders
- [ ] Test login with new credentials
- [ ] Test email sending
- [ ] Test reCAPTCHA

---

Generated by OpenCode Assistant
