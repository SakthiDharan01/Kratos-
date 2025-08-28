-- Enable RLS and add policies for registrations and registration_participants

-- Registrations table
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
-- Allow a user to insert their own registration. For local/dev testing we also
-- allow inserts when user_id = 'test-user' (the mock user used in GoogleLoginButton).
CREATE POLICY "Allow user to insert own registration"
  ON registrations
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR user_id = 'test-user'
  );

-- Registration participants table
ALTER TABLE registration_participants ENABLE ROW LEVEL SECURITY;
-- Allow inserting participants only when the parent registration belongs to the
-- authenticated user (or the dev test user). This checks the registrations table
-- to ensure the registration_id points to a registration owned by the same user.
CREATE POLICY "Allow user to insert participants for own registration"
  ON registration_participants
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM registrations r
      WHERE r.id = registration_id
        AND (
          auth.uid() = r.user_id
          OR r.user_id = 'test-user'
        )
    )
  );

-- Ensure user_id exists on registrations
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS user_id UUID;

-- Add team_name, is_leader, and required fields to registration_participants
ALTER TABLE registration_participants ADD COLUMN IF NOT EXISTS team_name TEXT NOT NULL;
ALTER TABLE registration_participants ADD COLUMN IF NOT EXISTS is_leader BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE registration_participants ADD COLUMN IF NOT EXISTS full_name TEXT NOT NULL;
ALTER TABLE registration_participants ADD COLUMN IF NOT EXISTS email TEXT NOT NULL;
ALTER TABLE registration_participants ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL;
ALTER TABLE registration_participants ADD COLUMN IF NOT EXISTS college TEXT NOT NULL;
ALTER TABLE registration_participants ADD COLUMN IF NOT EXISTS department TEXT NOT NULL;
ALTER TABLE registration_participants ADD COLUMN IF NOT EXISTS year TEXT NOT NULL;

-- Indexes for efficient policy checks (AFTER leader_id exists)
CREATE INDEX IF NOT EXISTS idx_registration_participants_leader_id ON registration_participants(leader_id);
CREATE INDEX IF NOT EXISTS idx_registration_participants_email ON registration_participants(email);
CREATE INDEX IF NOT EXISTS idx_registration_participants_phone ON registration_participants(phone);

-- You may need to backfill or update existing data for new columns.
