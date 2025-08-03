-- DIRECT ADMIN FIX SCRIPT
-- This script will directly fix the admin status

-- First, let's see what we have
SELECT 'Current auth.users:' as info;
SELECT id, email, created_at FROM auth.users WHERE email = 'hashim.55545554@gmail.com';

SELECT 'Current profiles:' as info;
SELECT id, username, email, role, created_at, updated_at FROM public.profiles WHERE email = 'hashim.55545554@gmail.com';

-- Now let's force update the role to admin
UPDATE public.profiles 
SET 
  role = 'admin',
  username = 'hashim',
  updated_at = now()
WHERE email = 'hashim.55545554@gmail.com';

-- If no rows were updated, let's create the profile
INSERT INTO public.profiles (
  id,
  username,
  email,
  role,
  created_at,
  updated_at
)
SELECT 
  u.id,
  'hashim',
  u.email,
  'admin',
  now(),
  now()
FROM auth.users u
WHERE u.email = 'hashim.55545554@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
);

-- Verify the result
SELECT 'Final result:' as info;
SELECT 
  p.id,
  p.username,
  p.email,
  p.role,
  p.created_at,
  p.updated_at
FROM public.profiles p
WHERE p.email = 'hashim.55545554@gmail.com'; 