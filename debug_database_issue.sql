-- DEBUG DATABASE ISSUE SCRIPT
-- This script will help us understand why the profile query returns null

-- Check if the user exists in auth.users
SELECT 'Auth users check:' as info;
SELECT id, email, created_at 
FROM auth.users 
WHERE id = 'fe50503c-2b48-43fd-b3a4-244346c398fd';

-- Check if the profile exists in profiles table
SELECT 'Profiles table check:' as info;
SELECT id, username, email, role, created_at, updated_at 
FROM public.profiles 
WHERE id = 'fe50503c-2b48-43fd-b3a4-244346c398fd';

-- Check if there are any profiles at all
SELECT 'All profiles count:' as info;
SELECT COUNT(*) as total_profiles FROM public.profiles;

-- Check if there are any profiles with this email
SELECT 'Profiles with this email:' as info;
SELECT id, username, email, role 
FROM public.profiles 
WHERE email = 'hashim.55545554@gmail.com';

-- Try to create the profile again with explicit error handling
DO $$
BEGIN
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
  
  RAISE NOTICE 'Profile created/updated successfully';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating profile: %', SQLERRM;
END $$;

-- Final check after creation attempt
SELECT 'Final profiles check:' as info;
SELECT id, username, email, role, created_at, updated_at 
FROM public.profiles 
WHERE id = 'fe50503c-2b48-43fd-b3a4-244346c398fd'; 