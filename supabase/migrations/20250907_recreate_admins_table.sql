-- Recreate admins table for admin access control
-- This migration recreates the admins table that was previously removed

CREATE TABLE IF NOT EXISTS admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at_admins()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_admins ON admins;
CREATE TRIGGER set_updated_at_admins 
  BEFORE UPDATE ON admins 
  FOR EACH ROW 
  EXECUTE FUNCTION set_updated_at_admins();

-- Enable RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow authenticated users to read admin records (for checking access)
DROP POLICY IF EXISTS "Allow authenticated users to read admin records" ON admins;
CREATE POLICY "Allow authenticated users to read admin records" ON admins
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow admins to manage admin records
DROP POLICY IF EXISTS "Allow admins to manage admin records" ON admins;
CREATE POLICY "Allow admins to manage admin records" ON admins
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admins_user_id ON admins(user_id);
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_active ON admins(is_active);

-- Note: To add the first admin, you'll need to:
-- 1. Login to your app to create a user record
-- 2. Find your user ID from the users table
-- 3. Insert yourself into the admins table manually or use the grant_admin_access.sql script
