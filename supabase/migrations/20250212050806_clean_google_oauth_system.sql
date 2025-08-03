-- Clean Google OAuth System Migration
-- This migration removes manual user creation and ensures proper Google OAuth flow

-- Drop all manual user creation functions
DROP FUNCTION IF EXISTS public.create_new_user(TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.create_user(TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.admin_create_user(TEXT, TEXT, TEXT, TEXT);

-- Create a clean trigger for Google OAuth users
CREATE OR REPLACE FUNCTION public.handle_google_oauth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only create profile if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
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
      COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
      'pending', -- All new users start as pending
      now(),
      now()
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the new trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_google_oauth_user();

-- Create function to approve pending users
CREATE OR REPLACE FUNCTION public.approve_user(
  user_id UUID,
  new_role TEXT DEFAULT 'student',
  class_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Update user role
  UPDATE public.profiles 
  SET role = new_role, updated_at = now()
  WHERE id = user_id;
  
  -- If student and class_id provided, assign to class
  IF new_role = 'student' AND class_id IS NOT NULL THEN
    -- Remove existing assignments
    DELETE FROM public.class_assignments WHERE user_id = user_id;
    
    -- Add new assignment
    INSERT INTO public.class_assignments (user_id, class_id, created_at)
    VALUES (user_id, class_id, now());
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'user_id', user_id,
    'new_role', new_role,
    'class_id', class_id
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.approve_user(UUID, TEXT, UUID) TO authenticated;

-- Create function to delete user completely
CREATE OR REPLACE FUNCTION public.delete_user_complete(user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Delete class assignments
  DELETE FROM public.class_assignments WHERE user_id = user_id;
  
  -- Delete profile
  DELETE FROM public.profiles WHERE id = user_id;
  
  -- Delete from auth.users (this will cascade to other auth tables)
  DELETE FROM auth.users WHERE id = user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'user_id', user_id
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.delete_user_complete(UUID) TO authenticated;

-- Update RLS policies to ensure proper access
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;

-- Create new policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'ultra_admin')
    )
  );

CREATE POLICY "Admins can update profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'ultra_admin')
    )
  );

-- Ensure profiles table has all required columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_class_assignments_user_id ON public.class_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_class_assignments_class_id ON public.class_assignments(class_id); 