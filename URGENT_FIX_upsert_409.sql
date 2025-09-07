-- URGENT FIX: Handle users table upsert conflicts properly
-- This addresses the 409 error by handling unique constraint conflicts

-- First, let's make email and phone constraints more flexible for the same user
-- Check if we need to modify constraints

-- Drop existing unique constraints that might be causing conflicts
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_phone_key;

-- Add unique constraints that allow NULL values and handle updates properly
-- Email should be unique only when not null
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique 
    ON users (email) 
    WHERE email IS NOT NULL;

-- Phone should be unique only when not null  
CREATE UNIQUE INDEX IF NOT EXISTS users_phone_unique 
    ON users (phone) 
    WHERE phone IS NOT NULL;

-- Ensure RLS policies support upsert operations
DROP POLICY IF EXISTS users_self_insert ON users;
DROP POLICY IF EXISTS users_self_update ON users;
DROP POLICY IF EXISTS users_self_select ON users;

-- Create comprehensive policies for all operations
CREATE POLICY users_self_select ON users 
    FOR SELECT 
    USING (id = auth.uid());

CREATE POLICY users_self_insert ON users 
    FOR INSERT 
    WITH CHECK (id = auth.uid());

CREATE POLICY users_self_update ON users 
    FOR UPDATE 
    USING (id = auth.uid()) 
    WITH CHECK (id = auth.uid());

-- Also add DELETE policy for completeness (though not needed for this use case)
CREATE POLICY users_self_delete ON users 
    FOR DELETE 
    USING (id = auth.uid());
