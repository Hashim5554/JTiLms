-- Script to make hashim.55545554@gmail.com an admin with the name hashim
-- This script will:
-- 1. Check if the user exists
-- 2. Update their role to 'admin' and username to 'hashim' if they exist
-- 3. Provide instructions if they don't exist

-- First, let's check if the user exists
SELECT 
  p.id,
  p.username,
  p.email,
  p.role,
  p.created_at
FROM public.profiles p
WHERE p.email = 'hashim.55545554@gmail.com';

-- If the user exists, update their role and username
UPDATE public.profiles 
SET 
  username = 'hashim',
  role = 'admin',
  updated_at = now()
WHERE email = 'hashim.55545554@gmail.com';

-- Verify the update
SELECT 
  p.id,
  p.username,
  p.email,
  p.role,
  p.updated_at
FROM public.profiles p
WHERE p.email = 'hashim.55545554@gmail.com';

-- If no rows were updated, the user doesn't exist
-- In that case, the user needs to sign up via Google OAuth first
-- Then run this script again to update their role

-- ALTERNATIVE: If you need to create an admin directly (emergency access)
-- Uncomment the following lines if the user doesn't exist and you need admin access:

/*
-- Create admin user directly (emergency access only)
INSERT INTO public.profiles (
  id,
  username,
  email,
  role,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(), -- Generate a new UUID
  'hashim',
  'hashim.55545554@gmail.com',
  'admin',
  now(),
  now()
) ON CONFLICT (email) DO UPDATE SET
  username = 'hashim',
  role = 'admin',
  updated_at = now();
*/ 