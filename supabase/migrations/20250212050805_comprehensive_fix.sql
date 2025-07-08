-- COMPREHENSIVE FIX: Address both profile and email duplicate issues
-- This migration should resolve all duplicate key constraint violations

-- Step 1: Clean up duplicate emails in auth.users
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

-- Step 2: Clean up orphaned profiles (profiles without corresponding auth.users)
DELETE FROM public.profiles 
WHERE id NOT IN (
  SELECT id FROM auth.users
);

-- Step 3: Clean up duplicate profiles
DELETE FROM public.profiles 
WHERE id IN (
  SELECT id 
  FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY id ORDER BY created_at) as rn
    FROM public.profiles
  ) t 
  WHERE t.rn > 1
);

-- Step 4: Recreate the trigger function with better error handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_username TEXT;
  user_role TEXT;
  existing_profile_id UUID;
BEGIN
  -- Check if profile already exists
  SELECT id INTO existing_profile_id 
  FROM public.profiles 
  WHERE id = NEW.id;
  
  -- If profile already exists, don't create a new one
  IF existing_profile_id IS NOT NULL THEN
    RAISE NOTICE 'Profile already exists for user %: %, skipping creation', NEW.id, NEW.email;
    RETURN NEW;
  END IF;

  -- Extract username from user metadata or email
  user_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  );
  
  -- ALWAYS set new users to 'pending' status regardless of metadata
  user_role := 'pending';
  
  -- Insert profile with 'pending' status
  INSERT INTO public.profiles (
    id,
    email,
    username,
    role,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    user_username,
    user_role,
    now(),
    now()
  );
  
  RAISE NOTICE 'Created profile for user %: % with role %', NEW.id, NEW.email, user_role;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;

-- Step 5: Create profiles for any users that don't have them
INSERT INTO public.profiles (id, email, username, role, created_at, updated_at)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'username', split_part(u.email, '@', 1)),
  'pending',
  u.created_at,
  now()
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
  AND u.email IS NOT NULL;

-- Step 6: Show final status
SELECT 
  'Final status:' as info,
  COUNT(*) as total_users,
  COUNT(DISTINCT email) as unique_emails,
  (SELECT COUNT(*) FROM public.profiles) as total_profiles
FROM auth.users 
WHERE email IS NOT NULL;

-- Show recent activity
SELECT 
  'Recent users and profiles:' as info,
  u.email,
  u.created_at,
  p.role,
  CASE WHEN p.id IS NOT NULL THEN 'Has Profile' ELSE 'No Profile' END as profile_status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.created_at > now() - interval '1 day'
ORDER BY u.created_at DESC; 