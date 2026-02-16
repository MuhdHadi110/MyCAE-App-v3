# Fix: Password Change Loop on Every Login

## Problem
Users are prompted to change password on every login, even after successfully changing it.

## Root Cause
The `reset-all-passwords.ts` script didn't set the `reset_token` field, which is used to detect first-time logins. This caused inconsistent behavior where the token never cleared properly.

## Complete Solution

### Step 1: Fix Current Users (Stop the Loop)

Run the fix script to clear all reset tokens:

```bash
cd backend
npm run fix:reset-loop
```

**What this does:**
- Connects to your database
- Clears `reset_token` and `reset_token_expires` for all users
- Users will no longer be prompted on every login

**Output you'll see:**
```
🔧 Fix Reset Token Loop
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Connected to database

📊 Found 12 users in database

✅ Cleared reset_token for: user1@mycae.com
✅ Cleared reset_token for: user2@mycae.com
...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Fix Complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### Step 2: Deploy Fixed Backend to Production

The `reset-all-passwords.ts` script has been fixed. Deploy it to production:

**Option A: Upload via cPanel File Manager**
1. Go to `/home/mycaet40/mycaetracker-backend/src/scripts/`
2. Upload the updated `reset-all-passwords.ts` file
3. Replace the existing file

**Option B: Run the fix script on production**
1. SSH or use cPanel Terminal
2. Navigate to backend directory:
   ```bash
   cd ~/mycaetracker-backend
   ```
3. Run the fix:
   ```bash
   npm run fix:reset-loop
   ```

---

### Step 3: Test the Fix

1. Login to https://mycaetech.com
2. Use email + current password
3. Complete reCAPTCHA
4. Click "Sign In"
5. **You should go directly to the dashboard** (no password change prompt)

---

## Updated Scripts

### `npm run fix:reset-loop`
**Use when:** Users are stuck in password change loop
**What it does:** Clears all reset tokens to stop prompts

### `npm run reset:passwords`
**Use when:** You need to reset all user passwords to `TempPassword123!`
**What it does:**
- Resets all passwords to the default
- Sets `reset_token` so users are prompted ONCE on next login
- Excludes: hadi@mycae.com.my

---

## How First-Time Login Works Now

### New User or Password Reset:
1. Admin runs `npm run reset:passwords`
2. User's password → `TempPassword123!`
3. User's `reset_token` → `'TEMP_PASSWORD_ASSIGNED'`

### User's First Login:
1. User logs in with `TempPassword123!`
2. Backend checks: `reset_token` is set → First-time login = TRUE
3. Password change modal appears (cannot be dismissed)
4. User must set new password

### Password Change:
1. User submits new password
2. Backend:
   - Hashes new password
   - **Clears `reset_token` → NULL**
   - Saves to database

### Subsequent Logins:
1. User logs in with new password
2. Backend checks: `reset_token` is NULL → First-time login = FALSE
3. User goes directly to dashboard ✅

---

## Files Modified

### ✅ Fixed Files:
1. `backend/src/scripts/reset-all-passwords.ts` - Now sets `reset_token` properly
2. `backend/src/scripts/fix-reset-token-loop.ts` - New script to fix current users
3. `backend/package.json` - Added npm scripts

### 📝 No Changes Needed:
- `backend/src/routes/auth.routes.ts` - Login detection logic is correct
- `backend/src/entities/User.ts` - Schema is correct

---

## For Future Password Resets

When you need to reset passwords for all users (or specific users):

1. Run: `npm run reset:passwords`
2. Users will be prompted to change password on their next login
3. After they change it, they won't be prompted again

**To exclude specific users from password reset:**
Edit `backend/src/scripts/reset-all-passwords.ts` line 11:
```typescript
const EXCLUDED_EMAIL = 'hadi@mycae.com.my'; // Add more as needed
```

---

## Quick Reference

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `npm run fix:reset-loop` | Stop password loop | Users stuck in loop |
| `npm run reset:passwords` | Reset all passwords | Onboarding/security |
| SQL: `UPDATE users SET reset_token = NULL` | Quick database fix | Emergency fix |

---

## Done! ✅

After running `npm run fix:reset-loop`, users will:
- ✅ Login normally with their current password
- ✅ Go directly to dashboard
- ✅ No more password change prompts every time
