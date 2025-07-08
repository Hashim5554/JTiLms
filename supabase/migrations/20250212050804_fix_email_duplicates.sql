-- FIX: Email duplicate key constraint violation
-- This migration fixes duplicate email addresses in auth.users table

-- First, let's see what duplicate emails we have
SELECT 
  'Duplicate emails found:' as info,
  email,
  COUNT(*) as count,
  array_agg(id) as user_ids
FROM auth.users 
WHERE email IS NOT NULL
GROUP BY email 
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- Clean up duplicate users in auth.users table
-- Keep the most recent user for each email
DELETE FROM auth.users 
WHERE id IN (
  SELECT id FROM (
    SELECT id, 
           ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as rn
    FROM auth.users 
    WHERE email IN (
      SELECT email 
      FROM auth.users 
      WHERE email IS NOT NULL
      GROUP BY email 
      HAVING COUNT(*) > 1
    )
  ) t 
  WHERE t.rn > 1
);

-- Also clean up any orphaned profiles
DELETE FROM public.profiles 
WHERE id NOT IN (
  SELECT id FROM auth.users
);

-- Show the results after cleanup
SELECT 
  'Users after cleanup:' as info,
  COUNT(*) as total_users,
  COUNT(DISTINCT email) as unique_emails
FROM auth.users 
WHERE email IS NOT NULL;

-- Show recent users and their status
SELECT 
  'Recent users:' as info,
  u.email,
  u.created_at,
  p.role,
  CASE WHEN p.id IS NOT NULL THEN 'Has Profile' ELSE 'No Profile' END as profile_status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.created_at > now() - interval '1 day'
ORDER BY u.created_at DESC; 