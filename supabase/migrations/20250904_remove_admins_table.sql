-- Migration: remove admins table and related policies
BEGIN;

-- Drop dependent policies referencing admins table if any exist
DROP POLICY IF EXISTS users_admin_all ON users; -- will recreate as plain self policies for user only
DROP POLICY IF EXISTS events_modify_admin ON events;

-- Drop admins table
DROP TABLE IF EXISTS admins CASCADE;

-- Recreate minimal non-admin policies
-- Events: keep public read only, remove admin modify (so events become read-only unless modified later)
DROP POLICY IF EXISTS events_select_public ON events;
CREATE POLICY events_select_public ON events FOR SELECT USING (true);
-- (No write policy now; only service role can modify.)

-- Users: only self access; remove admin-wide access
CREATE POLICY users_self_select ON users FOR SELECT USING (id = auth.uid());
CREATE POLICY users_self_update ON users FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

COMMIT;
