-- Fix database error querying schema when logging in with newly created accounts
-- This migration adds missing extensions, ensures the profiles table has all required fields,
-- and rebuilds necessary functions to prevent schema query errors

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "moddatetime";

-- Ensure auth schema exists
CREATE SCHEMA IF NOT EXISTS auth;

-- Ensure profiles table has all required fields
DO $$
BEGIN
  -- Add email field if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email TEXT;
    -- Add unique constraint with extra checks to avoid errors
    BEGIN
      ALTER TABLE profiles ADD CONSTRAINT profiles_email_key UNIQUE (email);
    EXCEPTION
      WHEN duplicate_table THEN NULL;
    END;
  END IF;

  -- Add missing created_at field if needed
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
  END IF;

  -- Add missing updated_at field if needed
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
  END IF;

  -- Create or replace moddatetime function and trigger for updated_at
  CREATE OR REPLACE FUNCTION moddatetime()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  -- Add updated_at trigger if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'profiles_moddatetime'
  ) THEN
    CREATE TRIGGER profiles_moddatetime
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime();
  END IF;
END
$$;

-- Update function to create new users to ensure all required fields are set
CREATE OR REPLACE FUNCTION public.create_new_user(
  email TEXT,
  password TEXT,
  role TEXT DEFAULT 'student',
  username TEXT DEFAULT NULL
)
RETURNS JSONB
SECURITY DEFINER
AS $$
DECLARE
  new_user_id UUID := gen_random_uuid();
  user_username TEXT := username;
  effective_role TEXT := role;
BEGIN
  -- Generate username if not provided
  IF user_username IS NULL THEN
    user_username := split_part(email, '@', 1);
  END IF;

  -- Create auth user with explicit id specification
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    role,
    aud
  ) VALUES (
    new_user_id,
    email,
    crypt(password, gen_salt('bf')),
    now(),
    jsonb_build_object('provider', 'email', 'providers', array['email']),
    jsonb_build_object('role', effective_role),
    'authenticated',
    'authenticated'
  );

  -- Create profile with all required fields
  INSERT INTO public.profiles (
    id,
    email,
    username,
    role,
    created_at,
    updated_at
  ) VALUES (
    new_user_id,
    email,
    user_username,
    effective_role,
    now(),
    now()
  );

  RETURN jsonb_build_object(
    'id', new_user_id,
    'email', email,
    'username', user_username,
    'role', effective_role
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', SQLERRM,
      'details', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to this function
GRANT EXECUTE ON FUNCTION public.create_new_user(TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- Create a schema cache refreshing function that can be called when needed
CREATE OR REPLACE FUNCTION public.refresh_schema_cache()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Execute ANALYZE on key tables to update statistics
  ANALYZE public.profiles;
  ANALYZE auth.users;
  
  -- Return success
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to refresh schema cache: %', SQLERRM;
    RETURN false;
END;
$$;

-- Grant execution permission to refresh schema cache function
GRANT EXECUTE ON FUNCTION public.refresh_schema_cache() TO authenticated; 