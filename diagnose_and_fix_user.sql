-- COMPREHENSIVE USER DIAGNOSIS AND FIX SCRIPT
-- This script will diagnose the issue and fix it

-- Step 1: Check if the user exists in auth.users
SELECT 
  id,
  email,
  created_at
FROM auth.users 
WHERE email = 'hashim.55545554@gmail.com';

-- Step 2: Check if the user exists in profiles
SELECT 
  id,
  username,
  email,
  role,
  created_at,
  updated_at
FROM public.profiles 
WHERE email = 'hashim.55545554@gmail.com';

-- Step 3: Check if there are any profiles with similar email
SELECT 
  id,
  username,
  email,
  role,
  created_at,
  updated_at
FROM public.profiles 
WHERE email LIKE '%hashim%' OR email LIKE '%55545554%';

-- Step 4: Create or update the user profile
-- First, get the auth.users ID
WITH auth_user AS (
  SELECT id, email FROM auth.users WHERE email = 'hashim.55545554@gmail.com'
)
INSERT INTO public.profiles (
  id,
  username,
  email,
  role,
  created_at,
  updated_at
) 
SELECT 
  auth_user.id,
  'hashim',
  auth_user.email,
  'admin',
  now(),
  now()
FROM auth_user
ON CONFLICT (id) DO UPDATE SET
  username = 'hashim',
  email = EXCLUDED.email,
  role = 'admin',
  updated_at = now();

-- Step 5: Verify the final result
SELECT 
  p.id,
  p.username,
  p.email,
  p.role,
  p.created_at,
  p.updated_at,
  u.email as auth_email
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE p.email = 'hashim.55545554@gmail.com'; 