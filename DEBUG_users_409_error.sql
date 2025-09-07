-- Debug the 409 error - Check users table structure and constraints
-- Run this in Supabase SQL Editor to diagnose the issue

-- 1. Check table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- 2. Check table constraints
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'users'::regclass;

-- 3. Check if there are any unique constraint violations
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    most_common_vals
FROM pg_stats 
WHERE tablename = 'users' AND attname IN ('email', 'phone');

-- 4. Check current RLS policies
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    cmd, 
    roles, 
    qual, 
    with_check 
FROM pg_policies 
WHERE tablename = 'users';
