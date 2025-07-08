-- Fix Google OAuth profile creation
-- This migration ensures that Google OAuth users get proper profiles created

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create improved handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_username TEXT;
  user_role TEXT;
BEGIN
  -- Extract username from user metadata or email
  user_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  );
  
  -- Extract role from user metadata or default to 'pending' for new users
  user_role := COALESCE(
    NEW.raw_user_meta_data->>'role',
    'pending'  -- New users get 'pending' status instead of 'student'
  );
  
  -- Insert profile with all required fields
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

-- Create a function to manually create profiles for existing users
CREATE OR REPLACE FUNCTION public.create_missing_profiles()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
  created_count INTEGER := 0;
  error_count INTEGER := 0;
BEGIN
  -- Loop through all auth users that don't have profiles
  FOR user_record IN 
    SELECT 
      u.id,
      u.email,
      COALESCE(u.raw_user_meta_data->>'username', split_part(u.email, '@', 1)) as username,
      COALESCE(u.raw_user_meta_data->>'role', 'pending') as role  -- Default to 'pending' for existing users too
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.id
    WHERE p.id IS NULL
  LOOP
    BEGIN
      INSERT INTO public.profiles (
        id,
        email,
        username,
        role,
        created_at,
        updated_at
      ) VALUES (
        user_record.id,
        user_record.email,
        user_record.username,
        user_record.role,
        now(),
        now()
      );
      created_count := created_count + 1;
    EXCEPTION
      WHEN OTHERS THEN
        error_count := error_count + 1;
        RAISE WARNING 'Failed to create profile for user %: %', user_record.id, SQLERRM;
    END;
  END LOOP;
  
  RETURN jsonb_build_object(
    'created', created_count,
    'errors', error_count
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_missing_profiles() TO authenticated;

-- Run the function to create missing profiles
SELECT public.create_missing_profiles(); 