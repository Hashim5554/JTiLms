-- CHECK RLS AND FIX SCRIPT
-- This script will check RLS policies and fix any issues

-- Check current RLS policies on profiles table
SELECT 'Current RLS policies on profiles:' as info;
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- Check if RLS is enabled on profiles table
SELECT 'RLS status on profiles table:' as info;
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'profiles';

-- Temporarily disable RLS to test if that's the issue
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Try to query the profile without RLS
SELECT 'Query without RLS:' as info;
SELECT id, username, email, role 
FROM public.profiles 
WHERE id = 'fe50503c-2b48-43fd-b3a4-244346c398fd';

-- If the profile doesn't exist, create it
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
SELECT 'Profile after creation:' as info;
SELECT id, username, email, role, created_at, updated_at 
FROM public.profiles 
WHERE id = 'fe50503c-2b48-43fd-b3a4-244346c398fd';

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Check if the profile is still accessible with RLS enabled
SELECT 'Query with RLS re-enabled:' as info;
SELECT id, username, email, role 
FROM public.profiles 
WHERE id = 'fe50503c-2b48-43fd-b3a4-244346c398fd'; 