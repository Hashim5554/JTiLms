-- CRITICAL FIX: Prevent duplicate key constraint violation
-- This migration MUST be run immediately to fix the duplicate key error

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the fixed handle_new_user function that checks for existing profiles
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

-- Clean up any duplicate profiles that might exist
DELETE FROM public.profiles 
WHERE id IN (
  SELECT id 
  FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY id ORDER BY created_at) as rn
    FROM public.profiles
  ) t 
  WHERE t.rn > 1
);

-- Show current state
SELECT 
  'Current profiles after cleanup:' as info,
  COUNT(*) as total_profiles,
  COUNT(DISTINCT id) as unique_profiles
FROM public.profiles;

-- Show recent users and their profiles
SELECT 
  'Recent users and profiles:' as info,
  u.email,
  p.role,
  p.created_at,
  CASE WHEN p.id IS NOT NULL THEN 'Has Profile' ELSE 'No Profile' END as profile_status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.created_at > now() - interval '1 day'
ORDER BY u.created_at DESC; 