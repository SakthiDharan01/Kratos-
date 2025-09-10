-- Verification script for events table migration
-- Run this after applying the migration to verify everything worked correctly

-- Check the new table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'events' 
ORDER BY ordinal_position;

-- Check constraints
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'events';

-- Check constraint definitions
SELECT constraint_name, check_clause
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%events%';

-- Sample data check
SELECT 
    id, 
    name, 
    category, 
    time_slot, 
    venue, 
    rounds,
    event_date,
    rules IS NOT NULL as has_rules,
    incharge_name1,
    incharge_phone1
FROM events 
LIMIT 5;

-- Count events by category
SELECT category, COUNT(*) as event_count
FROM events 
GROUP BY category;

-- Check for any NULL values in required fields
SELECT 
    COUNT(CASE WHEN rules IS NULL THEN 1 END) as null_rules,
    COUNT(CASE WHEN venue IS NULL THEN 1 END) as null_venue,
    COUNT(CASE WHEN incharge_name1 IS NULL THEN 1 END) as null_incharge_name1,
    COUNT(CASE WHEN incharge_phone1 IS NULL THEN 1 END) as null_incharge_phone1,
    COUNT(CASE WHEN participant_limit IS NULL THEN 1 END) as null_participant_limit
FROM events;
