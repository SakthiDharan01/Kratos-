-- Get your user ID from Supabase Auth
-- Run this query in your Supabase SQL Editor to get your user ID

SELECT 
  id as user_id,
  email,
  created_at,
  last_sign_in_at
FROM auth.users 
WHERE email = 'YOUR_EMAIL@DOMAIN.COM';  -- Replace with your actual email

-- After you get your user_id, run this to add yourself as an admin:
-- INSERT INTO admins (user_id, email, role, is_active) 
-- VALUES ('your-user-id-here', 'your-email@domain.com', 'super_admin', true);
