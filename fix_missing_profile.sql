-- FIX MISSING PROFILE SCRIPT
-- This script will create the missing profile for the specific user ID

-- The user ID from debug info: fe50503c-2b48-43fd-b3a4-244346c398fd

-- First, let's verify the user exists in auth.users
SELECT 'Auth user check:' as info;
SELECT id, email, created_at 
FROM auth.users 
WHERE id = 'fe50503c-2b48-43fd-b3a4-244346c398fd';

-- Check if profile exists
SELECT 'Profile check:' as info;
SELECT id, username, email, role, created_at, updated_at 
FROM public.profiles 
WHERE id = 'fe50503c-2b48-43fd-b3a4-244346c398fd';

-- Create the missing profile
INSERT INTO public.profiles (
  id,
  username,
  email,
  role,
  created_at,
  updated_at
) VALUES (
  'fe50503c-2b48-43fd-b3a4-244346c398fd',
  'hashim',
  'hashim.55545554@gmail.com',
  'admin',
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  username = 'hashim',
  email = 'hashim.55545554@gmail.com',
  role = 'admin',
  updated_at = now();

-- Verify the profile was created
SELECT 'Final profile check:' as info;
SELECT 
  p.id,
  p.username,
  p.email,
  p.role,
  p.created_at,
  p.updated_at
FROM public.profiles p
WHERE p.id = 'fe50503c-2b48-43fd-b3a4-244346c398fd'; 