-- DROP ALL EXISTING TABLES FIRST (if they exist)
DROP TABLE IF EXISTS public.registrations CASCADE;
DROP TABLE IF EXISTS public.registrants CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;

-- 1. EVENTS TABLE
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    event_type VARCHAR(10) NOT NULL DEFAULT 'team' CHECK (event_type IN ('team', 'solo')),
    rules TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (price >= 0),
    event_date DATE NOT NULL CHECK (event_date >= CURRENT_DATE),
    time_slot VARCHAR(10) NOT NULL DEFAULT 'slot1' CHECK (time_slot IN ('slot1', 'slot2', 'both')),
    slot_duration VARCHAR(10) NOT NULL DEFAULT 'single' CHECK (slot_duration IN ('single', 'double')),
    start_time TIME NOT NULL DEFAULT '10:00:00',
    end_time TIME NOT NULL DEFAULT '12:00:00',
    category VARCHAR(15) NOT NULL CHECK (category IN ('technical', 'non-technical', 'grounds', 'online', 'hackathon', 'pre-events')),
    incharge_name1 VARCHAR(255) NOT NULL,
    incharge_phone1 VARCHAR(15) NOT NULL,
    incharge_name2 VARCHAR(255) NOT NULL,
    incharge_phone2 VARCHAR(15) NOT NULL,
    participant_limit INT NOT NULL DEFAULT 0 CHECK (participant_limit > 0),
    current_registrations INT NOT NULL DEFAULT 0 CHECK (current_registrations >= 0),
    registration_start TIMESTAMP NOT NULL,
    registration_end TIMESTAMP NOT NULL CHECK (registration_start < registration_end),
    status VARCHAR(15) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'completed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. USERS TABLE
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(10) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    phone VARCHAR(15) NOT NULL UNIQUE,
    department VARCHAR(100) NOT NULL,
    year VARCHAR(15) NOT NULL CHECK (year IN ('1st', '2nd', '3rd', '4th', '5th', 'Graduate')),
    college VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_users_phone_format CHECK (phone ~ '^[0-9+()-]{10,15}$')
);

-- 3. REGISTRANTS TABLE (Registration per team/event/individual + PAYMENT FIELDS)
CREATE TABLE registrants (
    id SERIAL PRIMARY KEY,
    event_id INT NOT NULL,
    user_id INT NOT NULL,
    team_name VARCHAR(255) NOT NULL,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_status VARCHAR(15) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('paid', 'failed', 'refunded', 'pending')),
    transaction_id VARCHAR(100),
    razorpay_order_id VARCHAR(100),
    razorpay_payment_id VARCHAR(100),
    razorpay_signature VARCHAR(255),
    paid_amount DECIMAL(10,2),
    payment_method VARCHAR(20),
    payment_time TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_team_per_event UNIQUE (team_name, event_id),
    CONSTRAINT chk_registrants_team_name CHECK (LENGTH(TRIM(team_name)) > 0)
);

-- 4. REGISTRATIONS TABLE (Team members, links to registrants by leader_id)
CREATE TABLE registrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    college VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    year VARCHAR(15) NOT NULL CHECK (year IN ('1st', '2nd', '3rd', '4th', '5th', 'Graduate')),
    leader_id INT NOT NULL,
    team_name VARCHAR(255) NOT NULL,
    event_id INT NOT NULL,
    is_leader BOOLEAN NOT NULL DEFAULT FALSE,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_member_email_per_event UNIQUE (email, event_id),
    CONSTRAINT unique_member_phone_per_event UNIQUE (phone, event_id)
);

-- FOREIGN KEYS
ALTER TABLE registrants 
    ADD CONSTRAINT fk_registrants_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE registrants 
    ADD CONSTRAINT fk_registrants_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE registrations 
    ADD CONSTRAINT fk_registrations_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE registrations 
    ADD CONSTRAINT fk_registrations_leader FOREIGN KEY (leader_id) REFERENCES registrants(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- TRIGGERS FOR updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_registrants_updated_at BEFORE UPDATE ON registrants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_registrations_updated_at BEFORE UPDATE ON registrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- INDEXES FOR PERFORMANCE
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_registrants_event ON registrants(event_id);
CREATE INDEX idx_registrants_user ON registrants(user_id);
CREATE INDEX idx_registrants_team ON registrants(team_name);
CREATE INDEX idx_registrants_payment_status ON registrants(payment_status);
CREATE INDEX idx_registrations_leader ON registrations(leader_id);
CREATE INDEX idx_registrations_event ON registrations(event_id);
CREATE INDEX idx_registrations_email ON registrations(email);

-- ENABLE RLS (Row Level Security)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrants ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES

-- Events: Public read access
CREATE POLICY "Events are publicly readable" ON events FOR SELECT USING (true);

-- Users: Users can read their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id::text);

-- Registrants: Users can view and manage their own registrations
CREATE POLICY "Users can view own registrations" ON registrants FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can create registrations" ON registrants FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own registrations" ON registrants FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Registrations: Users can view and manage their own team registrations
CREATE POLICY "Users can view own team registrations" ON registrations 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM registrants r 
            WHERE r.id = registrations.leader_id 
            AND r.user_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can create team registrations" ON registrations 
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM registrants r 
            WHERE r.id = registrations.leader_id 
            AND r.user_id::text = auth.uid()::text
        )
    );

-- INSERT SAMPLE EVENTS (you can modify these)
INSERT INTO events (name, description, event_type, rules, price, event_date, category, incharge_name1, incharge_phone1, incharge_name2, incharge_phone2, participant_limit, registration_start, registration_end) VALUES
('Web Development Challenge', 'Build a responsive website in 3 hours', 'team', 'Teams of 2-4 members. Use any framework.', 100.00, '2025-09-15', 'technical', 'John Doe', '9876543210', 'Jane Smith', '9876543211', 50, '2025-08-30 00:00:00', '2025-09-14 23:59:59'),
('UI/UX Design Contest', 'Design a mobile app interface', 'solo', 'Individual participation. Use Figma or similar tools.', 50.00, '2025-09-16', 'technical', 'Alex Johnson', '9876543212', 'Sarah Wilson', '9876543213', 30, '2025-08-30 00:00:00', '2025-09-15 23:59:59'),
('Photography Contest', 'Capture the best moments', 'solo', 'Submit 3 best photos with theme "Campus Life"', 25.00, '2025-09-17', 'non-technical', 'Mike Brown', '9876543214', 'Lisa Davis', '9876543215', 100, '2025-08-30 00:00:00', '2025-09-16 23:59:59'),
('Football Tournament', '5v5 Football matches', 'team', 'Teams of 5 players + 2 substitutes', 200.00, '2025-09-18', 'grounds', 'Tom Wilson', '9876543216', 'Jerry Lee', '9876543217', 16, '2025-08-30 00:00:00', '2025-09-17 23:59:59'),
('Hackathon 24hrs', 'Build innovative solutions', 'team', 'Teams of 2-5 members. 24-hour coding marathon.', 500.00, '2025-09-20', 'hackathon', 'Emily Clark', '9876543218', 'David Miller', '9876543219', 20, '2025-08-30 00:00:00', '2025-09-19 23:59:59'),
('Online Quiz', 'Test your knowledge', 'solo', 'Individual online quiz on various topics', 0.00, '2025-09-19', 'online', 'Anna Taylor', '9876543220', 'Mark Anderson', '9876543221', 200, '2025-08-30 00:00:00', '2025-09-18 23:59:59');
