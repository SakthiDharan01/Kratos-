-- Migration: Update events table structure
-- Date: 2025-09-09
-- Description: Enhance events table with stricter constraints and new fields

-- Make rules column NOT NULL
ALTER TABLE events ALTER COLUMN rules SET NOT NULL;

-- Make event_date NOT NULL
ALTER TABLE events ALTER COLUMN event_date SET NOT NULL;

-- Update time_slot values FIRST before updating constraint
UPDATE events SET time_slot = 'morning' WHERE time_slot = 'slot1';
UPDATE events SET time_slot = 'afternoon' WHERE time_slot = 'slot2';

-- Add default value to time_slot and make it NOT NULL
ALTER TABLE events ALTER COLUMN time_slot SET NOT NULL;
ALTER TABLE events ALTER COLUMN time_slot SET DEFAULT 'morning';

-- Update time_slot constraint to use morning/afternoon
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_time_slot_check;
ALTER TABLE events ADD CONSTRAINT events_time_slot_check CHECK (time_slot IN ('morning','afternoon','both'));

-- Update category values FIRST before creating ENUM constraint
UPDATE events SET category = 'no_code' WHERE category = 'No-Code';
UPDATE events SET category = 'technical' WHERE category = 'Technical';
UPDATE events SET category = 'playground' WHERE category = 'PlayGround';
UPDATE events SET category = 'online' WHERE category = 'Online Events';

-- Convert all category values to lowercase to match ENUM
UPDATE events SET category = LOWER(category);

-- Now create ENUM type for category and update column
CREATE TYPE category_type AS ENUM ('technical', 'no_code', 'playground', 'online');
ALTER TABLE events ALTER COLUMN category TYPE category_type USING category::category_type;
ALTER TABLE events ALTER COLUMN category SET NOT NULL;

-- Make incharge fields NOT NULL and increase length
ALTER TABLE events ALTER COLUMN incharge_name1 TYPE VARCHAR(255);
ALTER TABLE events ALTER COLUMN incharge_name1 SET NOT NULL;

ALTER TABLE events ALTER COLUMN incharge_phone1 TYPE VARCHAR(15);
ALTER TABLE events ALTER COLUMN incharge_phone1 SET NOT NULL;

ALTER TABLE events ALTER COLUMN incharge_name2 TYPE VARCHAR(255);
ALTER TABLE events ALTER COLUMN incharge_name2 SET NOT NULL;

ALTER TABLE events ALTER COLUMN incharge_phone2 TYPE VARCHAR(15);
ALTER TABLE events ALTER COLUMN incharge_phone2 SET NOT NULL;

-- Change participant_limit default and make it NOT NULL
ALTER TABLE events ALTER COLUMN participant_limit SET NOT NULL;
ALTER TABLE events ALTER COLUMN participant_limit SET DEFAULT 0;
-- Note: CHECK constraint already exists for participant_limit >= 0 (we'll update it)
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_participant_limit_check;
ALTER TABLE events ADD CONSTRAINT events_participant_limit_check CHECK (participant_limit >= 0);

-- Change timestamp columns to TIMESTAMP (remove timezone)
ALTER TABLE events ALTER COLUMN created_at TYPE TIMESTAMP;
ALTER TABLE events ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE events ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE events ALTER COLUMN updated_at TYPE TIMESTAMP;
ALTER TABLE events ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE events ALTER COLUMN updated_at SET NOT NULL;

-- Add the new rounds column
ALTER TABLE events ADD COLUMN rounds TEXT;

-- Add venue column
ALTER TABLE events ADD COLUMN venue VARCHAR(255) NOT NULL DEFAULT 'TBA';

-- Drop columns that are not in the target schema
ALTER TABLE events DROP COLUMN IF EXISTS slot_duration;
ALTER TABLE events DROP COLUMN IF EXISTS registration_start;
ALTER TABLE events DROP COLUMN IF EXISTS registration_end;
ALTER TABLE events DROP COLUMN IF EXISTS start_time;
ALTER TABLE events DROP COLUMN IF EXISTS end_time;

-- Create trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update existing records to comply with new constraints
-- Set default values for any NULL fields that are now NOT NULL

UPDATE events SET 
    rules = 'Rules will be announced soon.' 
WHERE rules IS NULL;

UPDATE events SET 
    event_date = CURRENT_DATE + INTERVAL '30 days'
WHERE event_date IS NULL;

UPDATE events SET 
    time_slot = 'morning'
WHERE time_slot IS NULL;

UPDATE events SET 
    incharge_name1 = 'TBA'
WHERE incharge_name1 IS NULL;

UPDATE events SET 
    incharge_phone1 = 'TBA'
WHERE incharge_phone1 IS NULL;

UPDATE events SET 
    incharge_name2 = 'TBA'
WHERE incharge_name2 IS NULL;

UPDATE events SET 
    incharge_phone2 = 'TBA'
WHERE incharge_phone2 IS NULL;

UPDATE events SET 
    participant_limit = 0
WHERE participant_limit IS NULL;
