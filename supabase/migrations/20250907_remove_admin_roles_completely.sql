-- Migration to completely remove admin role functionality
-- This removes the role column from users table and any remaining admin policies

BEGIN;

-- Drop any remaining admin-related policies
DROP POLICY IF EXISTS events_modify_admin ON events;
DROP POLICY IF EXISTS users_admin_all ON users;
DROP POLICY IF EXISTS registrants_owner_update ON registrants;
DROP POLICY IF EXISTS registrations_update_owner_admin ON registrations;
DROP POLICY IF EXISTS payments_select_owner_admin ON payments;

-- Remove role column from users table since admin functionality is removed
ALTER TABLE users DROP COLUMN IF EXISTS role;

-- Update policies to remove admin checks
-- Events: keep public read only (events will be managed via service role or direct SQL)
DROP POLICY IF EXISTS events_select_public ON events;
CREATE POLICY events_select_public ON events FOR SELECT USING (true);

-- Users: self access only
DROP POLICY IF EXISTS users_self_select ON users;
DROP POLICY IF EXISTS users_self_update ON users;
CREATE POLICY users_self_select ON users FOR SELECT USING (id = auth.uid());
CREATE POLICY users_self_update ON users FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Registrants: owner only
DROP POLICY IF EXISTS registrants_owner_select ON registrants;
DROP POLICY IF EXISTS registrants_owner_insert ON registrants;
CREATE POLICY registrants_owner_select ON registrants FOR SELECT USING (user_id = auth.uid());
CREATE POLICY registrants_owner_insert ON registrants FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY registrants_owner_update ON registrants FOR UPDATE USING (user_id = auth.uid());

-- Registrations: participant access by email or team owner
DROP POLICY IF EXISTS registrations_participant_select ON registrations;
CREATE POLICY registrations_participant_select ON registrations FOR SELECT USING (
  email = auth.email() OR
  EXISTS (
    SELECT 1 FROM registrants r WHERE r.id = registrations.leader_id AND r.user_id = auth.uid()
  )
);

-- Payments: owner only
DROP POLICY IF EXISTS payments_select_owner ON payments;
CREATE POLICY payments_select_owner ON payments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM registrants r WHERE r.id = payments.registrant_id AND r.user_id = auth.uid()
  )
);

COMMIT;
