-- Reset script to run before the main migration if needed
-- This will clean up any partial migration attempts

-- Drop the enum type if it exists (this will fail if the column is still using it)
DROP TYPE IF EXISTS category_type CASCADE;

-- Reset any constraints that might have been partially applied
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_time_slot_check;
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_category_check;

-- Note: Run this first if you get enum-related errors, then run the main migration
