-- Add team_size column to registrants table if it doesn't exist
-- This migration ensures the team_size field is available for proper registration handling

DO $$ 
BEGIN 
    -- Check if team_size column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'registrants' AND column_name = 'team_size'
    ) THEN
        ALTER TABLE registrants ADD COLUMN team_size INT NOT NULL DEFAULT 1 CHECK (team_size > 0);
        
        -- Add index for performance
        CREATE INDEX IF NOT EXISTS idx_registrants_team_size ON registrants(team_size);
        
        -- Update existing records to have proper team_size based on registrations count
        UPDATE registrants SET team_size = (
            SELECT COUNT(*) FROM registrations WHERE registrations.leader_id = registrants.id
        ) WHERE team_size = 1;
        
        RAISE NOTICE 'Added team_size column to registrants table';
    ELSE
        RAISE NOTICE 'team_size column already exists in registrants table';
    END IF;
END $$;

-- Add comment to document the purpose of this field
COMMENT ON COLUMN registrants.team_size IS 'Number of team members for this registration. Used for validation and display purposes.';