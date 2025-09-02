-- Create admin table for managing admin access
CREATE TABLE IF NOT EXISTS admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Create RLS policies for admin table
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can read admin records (for checking access)
CREATE POLICY "Allow authenticated users to read admin records" ON admins
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only existing admins can insert new admins
CREATE POLICY "Allow admins to insert new admins" ON admins
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

-- Only existing admins can update admin records
CREATE POLICY "Allow admins to update admin records" ON admins
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

-- Insert initial admin (replace with your actual user ID and email)
-- You can get your user ID from Supabase Auth dashboard
INSERT INTO admins (user_id, email, role, is_active) 
VALUES 
  -- Replace these with actual values from your Supabase Auth users
  ('00000000-0000-0000-0000-000000000000', 'your-email@domain.com', 'super_admin', true)
ON CONFLICT (email) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admins_user_id ON admins(user_id);
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_active ON admins(is_active) WHERE is_active = true;
