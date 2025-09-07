-- Fix users table RLS policies to allow INSERT for profile creation
-- This resolves the 409 error when users try to access their profile

BEGIN;

-- Add missing INSERT policy for users table
DROP POLICY IF EXISTS users_self_insert ON users;
CREATE POLICY users_self_insert ON users 
  FOR INSERT 
  WITH CHECK (id = auth.uid());

-- Ensure all necessary policies exist
DROP POLICY IF EXISTS users_self_select ON users;
DROP POLICY IF EXISTS users_self_update ON users;

-- Recreate all user policies to be safe
CREATE POLICY users_self_select ON users 
  FOR SELECT 
  USING (id = auth.uid());

CREATE POLICY users_self_update ON users 
  FOR UPDATE 
  USING (id = auth.uid()) 
  WITH CHECK (id = auth.uid());

CREATE POLICY users_self_insert ON users 
  FOR INSERT 
  WITH CHECK (id = auth.uid());

COMMIT;
