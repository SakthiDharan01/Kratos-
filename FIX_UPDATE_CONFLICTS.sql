-- TARGETED FIX: Handle UPDATE conflicts on users table
-- This addresses the PATCH 409 error specifically

-- Check for constraint conflicts
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'users'::regclass AND contype = 'u';

-- Check current data for conflicts
SELECT id, email, phone, count(*) 
FROM users 
GROUP BY id, email, phone 
HAVING count(*) > 1;

-- Fix: Make email and phone constraints more flexible
-- Remove strict unique constraints
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_phone_key;

-- Add partial unique indexes (allows NULL and handles same-user updates)
DROP INDEX IF EXISTS users_email_unique;
DROP INDEX IF EXISTS users_phone_unique;

CREATE UNIQUE INDEX users_email_unique 
    ON users (email) 
    WHERE email IS NOT NULL AND email != '';

CREATE UNIQUE INDEX users_phone_unique 
    ON users (phone) 
    WHERE phone IS NOT NULL AND phone != '';

-- Verify the changes
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'users' AND indexname LIKE '%unique%';
