-- IMMEDIATE FIX: Remove duplicate policies causing 409 error
-- The issue is duplicate INSERT policies for users table

BEGIN;

-- Remove ALL existing policies for users table
DROP POLICY IF EXISTS users_own_record ON users;
DROP POLICY IF EXISTS users_update_own ON users;
DROP POLICY IF EXISTS users_insert_own ON users;
DROP POLICY IF EXISTS users_self_select ON users;
DROP POLICY IF EXISTS users_self_update ON users;
DROP POLICY IF EXISTS users_self_insert ON users;

-- Create clean, non-conflicting policies
CREATE POLICY users_select_own ON users 
  FOR SELECT 
  USING (id = auth.uid());

CREATE POLICY users_insert_own ON users 
  FOR INSERT 
  WITH CHECK (id = auth.uid());

CREATE POLICY users_update_own ON users 
  FOR UPDATE 
  USING (id = auth.uid()) 
  WITH CHECK (id = auth.uid());

COMMIT;

-- Verify clean policies
SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check 
FROM pg_policies 
WHERE tablename = 'users';
