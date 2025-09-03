-- Initial fresh schema for Kratos
-- Generated 2025-09-03

-- ========== EXTENSIONS ==========
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ========== TABLE: events ==========
DROP TABLE IF EXISTS events CASCADE;
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  name VARCHAR(180) NOT NULL UNIQUE,
  description TEXT,
  event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('team','solo')),
  rules TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  event_date DATE,
  time_slot VARCHAR(10) CHECK (time_slot IN ('slot1','slot2','both')),
  slot_duration VARCHAR(10) CHECK (slot_duration IN ('single','double')),
  start_time TIME,
  end_time TIME,
  category VARCHAR(40) NOT NULL,
  incharge_name1 VARCHAR(120),
  incharge_phone1 VARCHAR(20),
  incharge_name2 VARCHAR(120),
  incharge_phone2 VARCHAR(20),
  participant_limit INT CHECK (participant_limit > 0),
  current_registrations INT NOT NULL DEFAULT 0 CHECK (current_registrations >= 0),
  registration_start TIMESTAMP WITH TIME ZONE,
  registration_end TIMESTAMP WITH TIME ZONE,
  status VARCHAR(15) NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed','completed')),
  min_team_size INT NOT NULL DEFAULT 1 CHECK (min_team_size > 0),
  max_team_size INT NOT NULL DEFAULT 1 CHECK (max_team_size >= min_team_size),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========== TABLE: users (app profile wrapper around auth.users) ==========
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  phone VARCHAR(25) UNIQUE,
  role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  department VARCHAR(120),
  year VARCHAR(20),
  college VARCHAR(160),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========== TABLE: registrants (TEAM / REGISTRATION RECORD) ==========
-- NOTE: naming per user spec: "Registrants" holds team registration + payment context
DROP TABLE IF EXISTS registrants CASCADE;
CREATE TABLE registrants (
  id SERIAL PRIMARY KEY,
  event_id INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  team_name VARCHAR(160),
  registration_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('paid','failed','refunded','pending')),
  transaction_id VARCHAR(120),
  razorpay_order_id VARCHAR(120),
  razorpay_payment_id VARCHAR(120),
  razorpay_signature VARCHAR(256),
  paid_amount DECIMAL(10,2) DEFAULT 0 CHECK (paid_amount >= 0),
  payment_method VARCHAR(40),
  payment_time TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, team_name)
);

-- ========== TABLE: registrations (PARTICIPANTS) ==========
DROP TABLE IF EXISTS registrations CASCADE;
CREATE TABLE registrations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(190) NOT NULL,
  phone VARCHAR(25),
  college VARCHAR(160),
  department VARCHAR(120),
  year VARCHAR(20),
  leader_id INT REFERENCES registrants(id) ON DELETE CASCADE,
  team_name VARCHAR(160),
  event_id INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  is_leader BOOLEAN NOT NULL DEFAULT false,
  registration_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_registrations_event ON registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_leader ON registrations(leader_id);
CREATE INDEX IF NOT EXISTS idx_registrations_email ON registrations(email);

-- ========== TABLE: payments (optional logging) ==========
DROP TABLE IF EXISTS payments CASCADE;
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  registrant_id INT NOT NULL REFERENCES registrants(id) ON DELETE CASCADE,
  razorpay_order_id VARCHAR(120),
  razorpay_payment_id VARCHAR(120),
  razorpay_signature VARCHAR(256),
  paid_amount DECIMAL(10,2) NOT NULL CHECK (paid_amount >= 0),
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','failed','refunded')),
  payment_method VARCHAR(40),
  payment_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========== TRIGGERS: updated_at auto update ==========
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DO $$ BEGIN
  PERFORM 1 FROM pg_trigger WHERE tgname = 'set_updated_at_events';
  IF NOT FOUND THEN
    CREATE TRIGGER set_updated_at_events BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;
DO $$ BEGIN
  PERFORM 1 FROM pg_trigger WHERE tgname = 'set_updated_at_users';
  IF NOT FOUND THEN
    CREATE TRIGGER set_updated_at_users BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;
DO $$ BEGIN
  PERFORM 1 FROM pg_trigger WHERE tgname = 'set_updated_at_registrants';
  IF NOT FOUND THEN
    CREATE TRIGGER set_updated_at_registrants BEFORE UPDATE ON registrants FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;
DO $$ BEGIN
  PERFORM 1 FROM pg_trigger WHERE tgname = 'set_updated_at_registrations';
  IF NOT FOUND THEN
    CREATE TRIGGER set_updated_at_registrations BEFORE UPDATE ON registrations FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;
DO $$ BEGIN
  PERFORM 1 FROM pg_trigger WHERE tgname = 'set_updated_at_payments';
  IF NOT FOUND THEN
    CREATE TRIGGER set_updated_at_payments BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

-- ========== INDEXES ==========
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_registrants_event ON registrants(event_id);
CREATE INDEX IF NOT EXISTS idx_registrants_status ON registrants(payment_status);
CREATE INDEX IF NOT EXISTS idx_registrants_user ON registrants(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_registrant ON payments(registrant_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);

-- ========== RLS ENABLE ==========
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrants ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- ========== RLS POLICIES ==========
-- Events: public read for open/closed/completed; write only for admins
CREATE POLICY events_select_public ON events FOR SELECT USING (true);
CREATE POLICY events_modify_admin ON events FOR ALL USING (
  EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
);

-- Users: each user can see/update self; admins can see all
CREATE POLICY users_self_select ON users FOR SELECT USING (id = auth.uid());
CREATE POLICY users_self_update ON users FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY users_admin_all ON users FOR ALL USING (
  EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
);

-- Registrants (team registrations) - owner or admin
CREATE POLICY registrants_owner_select ON registrants FOR SELECT USING (
  user_id = auth.uid() OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role='admin')
);
CREATE POLICY registrants_owner_insert ON registrants FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY registrants_owner_update ON registrants FOR UPDATE USING (
  user_id = auth.uid() OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role='admin')
);

-- Registrations (participants) - participants by email OR team owner OR admin
CREATE POLICY registrations_participant_select ON registrations FOR SELECT USING (
  email = auth.email() OR
  EXISTS (
    SELECT 1 FROM registrants r WHERE r.id = registrations.leader_id AND r.user_id = auth.uid()
  ) OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role='admin')
);
CREATE POLICY registrations_insert ON registrations FOR INSERT WITH CHECK (true);
CREATE POLICY registrations_update_owner_admin ON registrations FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role='admin') OR
  EXISTS (SELECT 1 FROM registrants r WHERE r.id = registrations.leader_id AND r.user_id = auth.uid())
);

-- Payments: only team owner or admin
CREATE POLICY payments_select_owner_admin ON payments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM registrants r WHERE r.id = payments.registrant_id AND r.user_id = auth.uid()
  ) OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role='admin')
);
CREATE POLICY payments_insert_owner ON payments FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM registrants r WHERE r.id = payments.registrant_id AND r.user_id = auth.uid()
  )
);

-- ========== SAMPLE ADMIN USER SEED (optional - replace) ==========
-- INSERT INTO users (id,name,email,role) VALUES ('00000000-0000-0000-0000-000000000000','Admin','admin@example.com','admin') ON CONFLICT DO NOTHING;

-- ========== DERIVED VIEW (optional) ==========
CREATE OR REPLACE VIEW event_registration_summary AS
SELECT e.id as event_id,
       e.name,
       e.category,
       COUNT(DISTINCT r.id) as participant_count,
       COUNT(DISTINCT rg.id) as team_count,
       COALESCE(SUM(rg.paid_amount),0) as total_revenue
FROM events e
LEFT JOIN registrants rg ON rg.event_id = e.id AND rg.payment_status = 'paid'
LEFT JOIN registrations r ON r.event_id = e.id
GROUP BY e.id;

