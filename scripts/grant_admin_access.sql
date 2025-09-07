-- Script to grant admin access to a user
-- Replace 'your-email@example.com' with your actual email address

-- First, find your user ID (run this to get your ID)
SELECT id, email, name FROM users WHERE email = 'your-email@example.com';

-- Then, add yourself to the admins table (replace 'your-user-id-here' with the actual ID from above)
INSERT INTO admins (user_id, email, role, is_active, created_at)
VALUES (
  'your-user-id-here',
  'your-email@example.com', 
  'admin',
  true,
  now()
)
ON CONFLICT (user_id) DO UPDATE SET
  is_active = true,
  role = 'admin',
  updated_at = now();

-- Verify the admin was added
SELECT * FROM admins WHERE email = 'your-email@example.com';
