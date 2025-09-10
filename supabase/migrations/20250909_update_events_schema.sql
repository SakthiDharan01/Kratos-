-- Update events table schema
-- Date: 2025-09-09
-- Purpose: Add venue and rounds, modify time_slot, remove unnecessary columns

-- First, let's add the new columns
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue VARCHAR(255);
ALTER TABLE events ADD COLUMN IF NOT EXISTS rounds TEXT;

-- Update time_slot constraint to use 'morning'/'afternoon' instead of 'slot1'/'slot2'
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_time_slot_check;
ALTER TABLE events ADD CONSTRAINT events_time_slot_check CHECK (time_slot IN ('morning','afternoon','both'));

-- Update existing time_slot values
UPDATE events SET time_slot = 'morning' WHERE time_slot = 'slot1';
UPDATE events SET time_slot = 'afternoon' WHERE time_slot = 'slot2';

-- Make rules NOT NULL (set empty string for existing NULL values)
UPDATE events SET rules = '' WHERE rules IS NULL;
ALTER TABLE events ALTER COLUMN rules SET NOT NULL;

-- Make event_date NOT NULL (you may need to set a default date for existing NULL values)
-- UPDATE events SET event_date = '2025-02-15' WHERE event_date IS NULL;
-- ALTER TABLE events ALTER COLUMN event_date SET NOT NULL;

-- Make venue NOT NULL with default value for existing records
UPDATE events SET venue = 'TBD' WHERE venue IS NULL;
ALTER TABLE events ALTER COLUMN venue SET NOT NULL;

-- Update category to use specific values (PostgreSQL enum-like constraint)
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_category_check;
ALTER TABLE events ADD CONSTRAINT events_category_check CHECK (category IN ('technical', 'no_code', 'playground', 'online'));

-- Update existing category values to match new constraint
UPDATE events SET category = 'technical' WHERE category = 'Technical';
UPDATE events SET category = 'no_code' WHERE category = 'No-Code';
UPDATE events SET category = 'playground' WHERE category = 'PlayGround';
UPDATE events SET category = 'online' WHERE category = 'Online Events';

-- Make incharge fields NOT NULL and increase length (set defaults for existing NULL values)
UPDATE events SET incharge_name1 = 'TBD' WHERE incharge_name1 IS NULL;
UPDATE events SET incharge_phone1 = 'TBD' WHERE incharge_phone1 IS NULL;
UPDATE events SET incharge_name2 = 'TBD' WHERE incharge_name2 IS NULL;
UPDATE events SET incharge_phone2 = 'TBD' WHERE incharge_phone2 IS NULL;

ALTER TABLE events ALTER COLUMN incharge_name1 TYPE VARCHAR(255);
ALTER TABLE events ALTER COLUMN incharge_name1 SET NOT NULL;
ALTER TABLE events ALTER COLUMN incharge_phone1 TYPE VARCHAR(15);
ALTER TABLE events ALTER COLUMN incharge_phone1 SET NOT NULL;
ALTER TABLE events ALTER COLUMN incharge_name2 TYPE VARCHAR(255);
ALTER TABLE events ALTER COLUMN incharge_name2 SET NOT NULL;
ALTER TABLE events ALTER COLUMN incharge_phone2 TYPE VARCHAR(15);
ALTER TABLE events ALTER COLUMN incharge_phone2 SET NOT NULL;

-- Change participant_limit to have default 0 and make NOT NULL
UPDATE events SET participant_limit = 0 WHERE participant_limit IS NULL;
ALTER TABLE events ALTER COLUMN participant_limit SET NOT NULL;
ALTER TABLE events ALTER COLUMN participant_limit SET DEFAULT 0;

-- Remove columns that are not needed
ALTER TABLE events DROP COLUMN IF EXISTS start_time;
ALTER TABLE events DROP COLUMN IF EXISTS end_time;
ALTER TABLE events DROP COLUMN IF EXISTS slot_duration;
ALTER TABLE events DROP COLUMN IF EXISTS registration_start;
ALTER TABLE events DROP COLUMN IF EXISTS registration_end;

-- Change timestamp columns to remove timezone (keep as TIMESTAMPTZ for better handling)
-- PostgreSQL recommendation is to keep TIMESTAMPTZ for better timezone handling
-- But if you specifically want without timezone:
-- ALTER TABLE events ALTER COLUMN created_at TYPE TIMESTAMP;
-- ALTER TABLE events ALTER COLUMN updated_at TYPE TIMESTAMP;

-- Add updated_at trigger to automatically update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add some sample data for venue and rounds for existing events
UPDATE events SET 
    venue = CASE 
        WHEN category = 'technical' THEN 'Computer Lab A'
        WHEN category = 'no_code' THEN 'Design Studio'
        WHEN category = 'playground' THEN 'Main Auditorium'
        WHEN category = 'online' THEN 'Virtual Platform'
        ELSE 'TBD'
    END,
    rounds = CASE 
        WHEN category = 'technical' THEN 'Round 1: Coding Challenge, Round 2: Technical Interview, Round 3: Final Presentation'
        WHEN category = 'no_code' THEN 'Round 1: Design Brief, Round 2: Prototype Creation, Round 3: Final Presentation'
        WHEN category = 'playground' THEN 'Round 1: Preliminary, Round 2: Semi-Final, Round 3: Final'
        WHEN category = 'online' THEN 'Round 1: Online Assessment, Round 2: Virtual Presentation'
        ELSE 'Single Round'
    END
WHERE venue = 'TBD' OR rounds IS NULL;
