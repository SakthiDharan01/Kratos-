-- Re-enable RLS with proper non-recursive policies
-- Since admin system is removed, focus on user ownership and public access
BEGIN;

-- Enable RLS on all tables
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrants ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- ========== EVENTS POLICIES ==========
-- Events are public readable, only service role can modify
CREATE POLICY events_public_read ON events
  FOR SELECT USING (true);

-- Only service role can modify events (no user-level event management)
-- This means events can only be managed via direct database access or migrations

-- ========== USERS POLICIES ==========  
-- Users can only see and update their own records
CREATE POLICY users_own_record ON users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY users_update_own ON users 
  FOR UPDATE USING (id = auth.uid()) 
  WITH CHECK (id = auth.uid());

CREATE POLICY users_insert_own ON users
  FOR INSERT WITH CHECK (id = auth.uid());

-- ========== REGISTRANTS POLICIES ==========
-- Users can see their own team registrations
CREATE POLICY registrants_own_teams ON registrants
  FOR SELECT USING (user_id = auth.uid());

-- Users can create registrations for themselves  
CREATE POLICY registrants_create_own ON registrants
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own pending registrations
CREATE POLICY registrants_update_own ON registrants
  FOR UPDATE USING (user_id = auth.uid() AND payment_status = 'pending')
  WITH CHECK (user_id = auth.uid());

-- ========== REGISTRATIONS POLICIES ==========
-- Users can see registrations for their own teams
CREATE POLICY registrations_own_teams ON registrations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM registrants r 
      WHERE r.id = registrations.leader_id 
      AND r.user_id = auth.uid()
    )
  );

-- Allow insertion of registrations (participants) for any team during registration
CREATE POLICY registrations_insert_any ON registrations
  FOR INSERT WITH CHECK (true);

-- Users can update registrations for their own teams
CREATE POLICY registrations_update_own ON registrations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM registrants r 
      WHERE r.id = registrations.leader_id 
      AND r.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM registrants r 
      WHERE r.id = registrations.leader_id 
      AND r.user_id = auth.uid()
    )
  );

-- ========== PAYMENTS POLICIES ==========
-- Users can see payments for their own registrations
CREATE POLICY payments_own_teams ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM registrants r 
      WHERE r.id = payments.registrant_id 
      AND r.user_id = auth.uid()
    )
  );

-- Users can create payments for their own registrations
CREATE POLICY payments_create_own ON payments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM registrants r 
      WHERE r.id = payments.registrant_id 
      AND r.user_id = auth.uid()
    )
  );

-- Users can update payments for their own registrations (for payment status updates)
CREATE POLICY payments_update_own ON payments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM registrants r 
      WHERE r.id = payments.registrant_id 
      AND r.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM registrants r 
      WHERE r.id = payments.registrant_id 
      AND r.user_id = auth.uid()
    )
  );

COMMIT;
