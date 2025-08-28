-- Create new schema for event registrations
-- Run after dropping old tables: registration_participants, registrations, orders, users

-- Make sure pgcrypto is available for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create registrations table
CREATE TABLE IF NOT EXISTS registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE RESTRICT,
  team_name text NOT NULL,
  leader_id uuid NOT NULL,                           -- Supabase Auth user id (UUID stored as text/UUID)
  leader_name text NOT NULL,
  leader_email text NOT NULL,
  leader_phone text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  order_id text NULL,
  email_sent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uniq_event_team UNIQUE (event_id, team_name)
);

-- Create registrants table (team members)
CREATE TABLE IF NOT EXISTS registrants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  college text NOT NULL,
  department text NOT NULL,
  year text NOT NULL,
  is_leader boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uniq_registration_member_email UNIQUE (registration_id, email)
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_leader_id ON registrations(leader_id);
CREATE INDEX IF NOT EXISTS idx_registrants_registration_id ON registrants(registration_id);
CREATE INDEX IF NOT EXISTS idx_registrants_email ON registrants(email);

-- Enable Row Level Security (RLS) and create owner-only policies
-- Registrations: only the leader (auth.uid()) can insert/select/update/delete their registrations
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY registrations_insert_owner
  ON registrations
  FOR INSERT
  WITH CHECK (auth.uid() = leader_id);

CREATE POLICY registrations_select_owner
  ON registrations
  FOR SELECT
  USING (auth.uid() = leader_id);

CREATE POLICY registrations_update_owner
  ON registrations
  FOR UPDATE
  USING (auth.uid() = leader_id)
  WITH CHECK (auth.uid() = leader_id);

CREATE POLICY registrations_delete_owner
  ON registrations
  FOR DELETE
  USING (auth.uid() = leader_id);

-- Registrants: operations allowed only when the parent registration belongs to the authenticated leader
ALTER TABLE registrants ENABLE ROW LEVEL SECURITY;

CREATE POLICY registrants_insert_if_registration_owner
  ON registrants
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM registrations r
      WHERE r.id = registration_id
        AND auth.uid() = r.leader_id
    )
  );

CREATE POLICY registrants_select_if_registration_owner
  ON registrants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM registrations r
      WHERE r.id = registration_id
        AND auth.uid() = r.leader_id
    )
  );

CREATE POLICY registrants_update_if_registration_owner
  ON registrants
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM registrations r
      WHERE r.id = registration_id
        AND auth.uid() = r.leader_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM registrations r
      WHERE r.id = registration_id
        AND auth.uid() = r.leader_id
    )
  );

CREATE POLICY registrants_delete_if_registration_owner
  ON registrants
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM registrations r
      WHERE r.id = registration_id
        AND auth.uid() = r.leader_id
    )
  );
