-- Migration to add state and location fields to registrations table
-- This adds geographical information for each participant

-- Add state and location columns to registrations table
ALTER TABLE registrations 
ADD COLUMN state VARCHAR(100),
ADD COLUMN location VARCHAR(200);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_registrations_state ON registrations(state);
CREATE INDEX IF NOT EXISTS idx_registrations_location ON registrations(location);

-- Update the updated_at trigger to include new columns
-- (The existing trigger should already handle this, but making sure)
