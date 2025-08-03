-- VERIFY AND FORCE REFRESH SCRIPT
-- This script will verify the profile exists and force a session refresh

-- Check if the profile was actually created
SELECT 'Profile verification:' as info;
SELECT 
  p.id,
  p.username,
  p.email,
  p.role,
  p.created_at,
  p.updated_at
FROM public.profiles p
WHERE p.id = 'fe50503c-2b48-43fd-b3a4-244346c398fd';

-- If profile doesn't exist, create it again
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

-- Force update the timestamp to trigger any cache invalidation
UPDATE public.profiles 
SET updated_at = now() + interval '1 second'
WHERE id = 'fe50503c-2b48-43fd-b3a4-244346c398fd';

-- Final verification
SELECT 'Final verification:' as info;
SELECT 
  p.id,
  p.username,
  p.email,
  p.role,
  p.created_at,
  p.updated_at
FROM public.profiles p
WHERE p.id = 'fe50503c-2b48-43fd-b3a4-244346c398fd';

-- Check if there are any other profiles with this email
SELECT 'All profiles with this email:' as info;
SELECT 
  p.id,
  p.username,
  p.email,
  p.role,
  p.created_at,
  p.updated_at
FROM public.profiles p
WHERE p.email = 'hashim.55545554@gmail.com'; 