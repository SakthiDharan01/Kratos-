-- Fix: eliminate infinite recursion in users RLS policy
-- Problem: Original policy `users_admin_all` on users referenced the users table itself:
--   EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
-- This causes Supabase to attempt to evaluate a users row, which triggers the same policy repeatedly,
-- resulting in: "infinite recursion detected in policy for relation 'users'" (HTTP 500 from REST).
-- Solution: Use the separate admins table (already RLS-enabled) to determine admin privileges
-- instead of self-referencing the users table inside the users policies.

BEGIN;

-- Drop the problematic recursive policy if it exists
DROP POLICY IF EXISTS users_admin_all ON users;

-- Optional: drop any earlier attempt at a modify policy to avoid duplicates
DROP POLICY IF EXISTS users_admin_modify ON users;

-- Recreate admin policy without self-reference.
-- Grant full access (SELECT, INSERT, UPDATE, DELETE) to active admins.
CREATE POLICY users_admin_all ON users FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admins a WHERE a.user_id = auth.uid() AND a.is_active = true
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM admins a WHERE a.user_id = auth.uid() AND a.is_active = true
  )
);

-- (Keep existing self-select / self-update policies; they are non-recursive.)
-- After applying this migration, other table policies that subquery users will no longer recurse
-- because the users admin policy itself no longer queries users.

COMMIT;

-- Post-Deployment Verification (run manually in SQL editor):
-- 1. SELECT * FROM users LIMIT 1;  (as normal user should only see own row)
-- 2. (As admin) SELECT count(*) FROM users;  (should succeed)
-- 3. REST call to /rest/v1/users?id=eq.<your_user_id> should return 200, not 500.
