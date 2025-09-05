-- This migration documents the unique constraint on registrants table
-- The constraint "registrants_event_id_team_name_key" prevents duplicate team names per event
-- This is handled in the application code by checking for existing teams before insertion

-- Note: This constraint should already exist in the database
-- This file serves as documentation for the constraint handling implemented in checkout/review

COMMENT ON CONSTRAINT registrants_event_id_team_name_key ON registrants IS 
'Prevents duplicate team names for the same event. Application handles this by checking existing teams first.';
