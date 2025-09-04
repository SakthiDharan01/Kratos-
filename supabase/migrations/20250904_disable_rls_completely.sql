-- Migration: Disable RLS and remove all policies to eliminate recursion
-- Since you mentioned RLS is disabled, this ensures all tables are properly unrestricted
BEGIN;

-- Drop all existing policies first
DROP POLICY IF EXISTS events_select_public ON events;
DROP POLICY IF EXISTS events_modify_admin ON events;
DROP POLICY IF EXISTS users_self_select ON users;
DROP POLICY IF EXISTS users_self_update ON users; 
DROP POLICY IF EXISTS users_admin_all ON users;
DROP POLICY IF EXISTS registrants_owner_select ON registrants;
DROP POLICY IF EXISTS registrants_owner_insert ON registrants;
DROP POLICY IF EXISTS registrants_owner_update ON registrants;
DROP POLICY IF EXISTS registrations_participant_select ON registrations;
DROP POLICY IF EXISTS registrations_insert ON registrations;
DROP POLICY IF EXISTS registrations_update_owner_admin ON registrations;
DROP POLICY IF EXISTS payments_select_owner_admin ON payments;
DROP POLICY IF EXISTS payments_insert_owner ON payments;

-- Disable RLS on all tables
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE registrants DISABLE ROW LEVEL SECURITY;
ALTER TABLE registrations DISABLE ROW LEVEL SECURITY;  
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;

-- Remove role column from users since admin functionality is removed
ALTER TABLE users DROP COLUMN IF EXISTS role;

COMMIT;
