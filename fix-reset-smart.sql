-- Smart Fix for Password Reset Loop
-- This checks each user's password and fixes reset_token accordingly

-- Step 1: View current status
SELECT
    email,
    name,
    CASE
        WHEN reset_token IS NOT NULL THEN 'Will be prompted'
        ELSE 'Will NOT be prompted'
    END as current_status
FROM users
ORDER BY email;

-- Step 2: Since SQL can't verify bcrypt hashes, we'll use a different approach
-- Option A: Clear ALL reset tokens (stop the loop for everyone)
-- Uncomment to use:
-- UPDATE users SET reset_token = NULL, reset_token_expires = NULL;

-- Option B: Manual selective fix
-- For users who CHANGED password (they told you), run:
-- UPDATE users SET reset_token = NULL WHERE email IN (
--     'john@mycae.com',
--     'sarah@mycae.com',
--     'other-user-who-changed@mycae.com'
-- );

-- For users who NEED to change (still using TempPassword123!), run:
-- UPDATE users SET reset_token = 'TEMP_PASSWORD_ASSIGNED' WHERE email IN (
--     'newuser@mycae.com',
--     'another-new-user@mycae.com'
-- );

-- Step 3: Verify the fix
SELECT
    email,
    name,
    CASE
        WHEN reset_token IS NOT NULL THEN '✅ Will be prompted to change password'
        ELSE '✓ Will login normally (no prompt)'
    END as status
FROM users
ORDER BY email;
