-- URGENT FIX: Run this SQL in your Supabase SQL Editor to fix the 409 error
-- This adds the missing INSERT policy for the users table

-- First, let's check current policies
SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check 
FROM pg_policies 
WHERE tablename = 'users';

-- Add the missing INSERT policy
DROP POLICY IF EXISTS users_self_insert ON users;
CREATE POLICY users_self_insert ON users 
  FOR INSERT 
  WITH CHECK (id = auth.uid());

-- Verify the policy was created
SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check 
FROM pg_policies 
WHERE tablename = 'users' AND policyname = 'users_self_insert';
