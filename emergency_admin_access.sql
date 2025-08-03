-- EMERGENCY ADMIN ACCESS SCRIPT
-- This script will ensure hashim.55545554@gmail.com has admin access
-- Run this in your Supabase SQL editor

-- Method 1: Update existing user (if they signed up via Google OAuth)
UPDATE public.profiles 
SET 
  username = 'hashim',
  role = 'admin',
  updated_at = now()
WHERE email = 'hashim.55545554@gmail.com';

-- Method 2: Create admin user if they don't exist (emergency access)
INSERT INTO public.profiles (
  id,
  username,
  email,
  role,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'hashim',
  'hashim.55545554@gmail.com',
  'admin',
  now(),
  now()
) ON CONFLICT (email) DO UPDATE SET
  username = 'hashim',
  role = 'admin',
  updated_at = now();

-- Verify the result
SELECT 
  id,
  username,
  email,
  role,
  created_at,
  updated_at
FROM public.profiles 
WHERE email = 'hashim.55545554@gmail.com'; 