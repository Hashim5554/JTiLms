-- SIMPLE FIX SCRIPT
-- This script will directly create the profile and check if it works

-- First, let's see what we have
SELECT 'Current state:' as info;
SELECT 'Auth users:' as table_name;
SELECT id, email FROM auth.users WHERE id = 'fe50503c-2b48-43fd-b3a4-244346c398fd';

SELECT 'Profiles:' as table_name;
SELECT id, username, email, role FROM public.profiles WHERE id = 'fe50503c-2b48-43fd-b3a4-244346c398fd';

-- Create the profile directly
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

-- Check the result
SELECT 'After creation:' as info;
SELECT id, username, email, role, created_at, updated_at 
FROM public.profiles 
WHERE id = 'fe50503c-2b48-43fd-b3a4-244346c398fd'; 