-- FORCE SESSION REFRESH SCRIPT
-- This script will update the user's timestamp to force a session refresh
-- Run this after making the user an admin

-- First, ensure the user is an admin
UPDATE public.profiles 
SET 
  username = 'hashim',
  role = 'admin',
  updated_at = now()
WHERE email = 'hashim.55545554@gmail.com';

-- Force a session refresh by updating the timestamp again
UPDATE public.profiles 
SET updated_at = now()
WHERE email = 'hashim.55545554@gmail.com';

-- Verify the user is now an admin
SELECT 
  id,
  username,
  email,
  role,
  created_at,
  updated_at
FROM public.profiles 
WHERE email = 'hashim.55545554@gmail.com';

-- INSTRUCTIONS:
-- 1. Run this script in Supabase SQL Editor
-- 2. Go back to your website
-- 3. HARD REFRESH the page (Ctrl+F5 or Cmd+Shift+R)
-- 4. If that doesn't work, sign out and sign back in 