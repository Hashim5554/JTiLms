-- FIX DATABASE 500 ERROR SCRIPT
-- This script will fix the database issues causing the 500 error

-- First, let's disable RLS temporarily to see what's in the table
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Check what's in the profiles table
SELECT 'Current profiles:' as info;
SELECT id, username, email, role, created_at, updated_at 
FROM public.profiles 
ORDER BY created_at DESC;

-- Create the profile if it doesn't exist
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

-- Re-enable RLS with proper policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.profiles;

-- Create simple policies that allow access
CREATE POLICY "Allow all authenticated users to view profiles" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow users to update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow users to insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Test the query
SELECT 'Testing profile access:' as info;
SELECT id, username, email, role 
FROM public.profiles 
WHERE id = 'fe50503c-2b48-43fd-b3a4-244346c398fd'; 