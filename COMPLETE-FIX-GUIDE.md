# Complete Fix Guide: Password Reset Token

## The Problem
Users are prompted to change password on every login, even after successfully changing it.

## The Solution (Smart Fix)

Run this command to intelligently fix the issue:

```bash
cd backend
npm run fix:reset-smart
```

### What This Does:

**For users who CHANGED their password:**
- ✅ Clears `reset_token`
- ✅ They login normally (no prompt)

**For users still using `TempPassword123!`:**
- ✅ Sets/keeps `reset_token = 'TEMP_PASSWORD_ASSIGNED'`
- ✅ They will be prompted to change password on next login (as intended)

---

## Available Fix Scripts

### 1. `npm run fix:reset-smart` ⭐ **RECOMMENDED**

**Use when:** You want intelligent fixing
- Clears token for users who changed password
- Keeps token for users who haven't changed
- Preserves first-time login behavior

**Output Example:**
```
🔧 Smart Reset Token Fix
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Connected to database

📊 Found 12 users in database

🔍 Analyzing users...

🔓 CLEAR reset_token for: john@mycae.com (John) - Already changed password
🔓 CLEAR reset_token for: sarah@mycae.com (Sarah) - Already changed password
✅ SET reset_token for: newuser@mycae.com (New User) - Still using temp password
⏭️  KEEP reset_token for: another@mycae.com (Another) - Still using temp password

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Smart Fix Complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 Total users: 12
🔓 Cleared (changed password): 8 users
✅ Set (needs to change): 2 users
⏭️  Kept (needs to change): 2 users

📋 Results:
   - 8 users will login normally (no prompt)
   - 4 users will be prompted to change password on next login
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### 2. `npm run fix:reset-loop`

**Use when:** You want to clear ALL reset tokens
- Everyone can login without prompt
- Even users who haven't changed password won't be prompted
- Use for emergency fixes

---

### 3. `npm run reset:passwords`

**Use when:** You need to reset passwords
- Resets all passwords to `TempPassword123!`
- Sets `reset_token` for all users
- Excludes: hadi@mycae.com.my
- Everyone will be prompted on next login

---

## Expected Behavior After Smart Fix

### User A (Already Changed Password):
1. Login with their new password
2. Complete reCAPTCHA
3. **Goes directly to dashboard** ✅
4. No password change prompt

### User B (Still Has TempPassword123!):
1. Login with `TempPassword123!`
2. Complete reCAPTCHA
3. **Password change modal appears** ✅
4. Must set new password
5. After change, goes to dashboard
6. Next login: No prompt (goes directly to dashboard)

---

## How It Works Technically

### Login Check (auth.routes.ts line 231):
```typescript
const isFirstTimeLogin = user.reset_token !== null && user.reset_token !== undefined;
```

### Password Change (auth.routes.ts line 310):
```typescript
user.reset_token = undefined; // Clear after password change
```

### Smart Fix Logic:
```typescript
// For each user:
const hasTempPassword = await bcrypt.compare('TempPassword123!', user.password_hash);

if (hasTempPassword) {
  // Still has temp password → Set/keep reset_token
  user.reset_token = 'TEMP_PASSWORD_ASSIGNED';
} else {
  // Changed password → Clear reset_token
  user.reset_token = undefined;
}
```

---

## Quick Command Reference

| Command | What It Does | When to Use |
|---------|-------------|-------------|
| `npm run fix:reset-smart` | Intelligent fix | ⭐ Use this first |
| `npm run fix:reset-loop` | Clear all tokens | Emergency only |
| `npm run reset:passwords` | Reset all to temp | Onboarding/security |

---

## Step-by-Step: Run the Smart Fix

### On Local (Connecting to Production DB):

1. **Make sure backend .env points to production:**
   ```env
   DB_HOST=localhost
   DB_NAME=your_database_name
   DB_USER=your_database_user
   DB_PASSWORD=YOUR_DB_PASSWORD_HERE
   ```

2. **Run the smart fix:**
   ```bash
   cd backend
   npm run fix:reset-smart
   ```

3. **Test login:**
   - Users who changed password → Login normally
   - Users with temp password → Prompted to change

---

### On Production Server (via cPanel):

1. **Upload the new script:**
   - File: `backend/src/scripts/fix-reset-token-smart.ts`
   - Destination: `/home/mycaet40/mycaetracker-backend/src/scripts/`

2. **Upload updated package.json:**
   - File: `backend/package.json`
   - Destination: `/home/mycaet40/mycaetracker-backend/`

3. **SSH or Terminal:**
   ```bash
   cd ~/mycaetracker-backend
   npm run fix:reset-smart
   ```

---

## Alternative: SQL Quick Fix (Not Recommended)

If you can't run the script, use SQL to clear all tokens:

```sql
-- Clear tokens for all users (everyone can login, no one prompted)
UPDATE users SET reset_token = NULL, reset_token_expires = NULL;
```

**Downside:** Users still using `TempPassword123!` won't be prompted to change it.

---

## Files Updated

1. ✅ `backend/src/scripts/fix-reset-token-smart.ts` - Smart fix (new)
2. ✅ `backend/src/scripts/fix-reset-token-loop.ts` - Clear all (new)
3. ✅ `backend/src/scripts/reset-all-passwords.ts` - Fixed to set token
4. ✅ `backend/package.json` - Added npm scripts

---

## Done! ✅

Run `npm run fix:reset-smart` and you're all set!

**Result:**
- Users who changed password → Login normally
- Users with temp password → Prompted once to change
- No more endless loops!
