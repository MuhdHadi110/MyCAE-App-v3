-- Fix: Clear reset_token for users who are stuck in password change loop
-- This will stop them being prompted to change password on every login

-- Clear reset_token for all users (they won't be prompted anymore)
UPDATE users
SET reset_token = NULL, reset_token_expires = NULL;

-- Verify the fix
SELECT email, name,
       CASE WHEN reset_token IS NULL THEN 'Will NOT be prompted'
            ELSE 'Will be prompted'
       END as status
FROM users
ORDER BY email;
