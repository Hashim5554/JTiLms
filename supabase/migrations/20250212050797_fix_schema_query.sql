-- Fix database error querying schema when logging in with newly created accounts
-- This migration adds missing columns and refreshes the schema cache

-- Enable required extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Ensure all required columns exist in auth.users
DO $$
BEGIN
  -- Add missing columns to auth.users if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'last_sign_in_at') THEN
    ALTER TABLE auth.users ADD COLUMN last_sign_in_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'raw_app_meta_data') THEN
    ALTER TABLE auth.users ADD COLUMN raw_app_meta_data JSONB DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'raw_user_meta_data') THEN
    ALTER TABLE auth.users ADD COLUMN raw_user_meta_data JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Ensure all required columns exist in public.profiles
DO $$
BEGIN
  -- Add missing columns to profiles if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email') THEN
    ALTER TABLE public.profiles ADD COLUMN email TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'created_at') THEN
    ALTER TABLE public.profiles ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'updated_at') THEN
    ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

-- Create or replace the schema refresh function
CREATE OR REPLACE FUNCTION public.refresh_schema_cache()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Execute ANALYZE on key tables to update statistics
  ANALYZE auth.users;
  ANALYZE public.profiles;
  
  -- Refresh materialized views if they exist
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE schemaname = 'public' AND matviewname = 'user_profiles') THEN
    REFRESH MATERIALIZED VIEW public.user_profiles;
  END IF;
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to refresh schema cache: %', SQLERRM;
    RETURN false;
END;
$$;

-- Grant execute permission to the refresh function
GRANT EXECUTE ON FUNCTION public.refresh_schema_cache() TO authenticated;

-- Execute the refresh function
SELECT public.refresh_schema_cache();

-- Update existing users to ensure they have all required fields
UPDATE auth.users
SET 
  last_sign_in_at = COALESCE(last_sign_in_at, now()),
  raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb),
  raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb)
WHERE 
  last_sign_in_at IS NULL 
  OR raw_app_meta_data IS NULL 
  OR raw_user_meta_data IS NULL;

-- Update existing profiles to ensure they have all required fields
UPDATE public.profiles p
SET 
  email = COALESCE(p.email, u.email),
  created_at = COALESCE(p.created_at, now()),
  updated_at = COALESCE(p.updated_at, now())
FROM auth.users u
WHERE p.id = u.id
  AND (
    p.email IS NULL 
    OR p.created_at IS NULL 
    OR p.updated_at IS NULL
  ); 