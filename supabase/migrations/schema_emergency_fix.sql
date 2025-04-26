-- EMERGENCY FIX FOR DATABASE SCHEMA QUERY ERROR
-- This is a minimal script focused on just fixing the schema cache error

-- Create required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- First fix profiles table directly
DO $$
BEGIN
  -- Create the columns we need, ignoring errors if they already exist
  BEGIN
    ALTER TABLE profiles ADD COLUMN email TEXT;
  EXCEPTION WHEN duplicate_column THEN
    -- Column already exists, no problem
  END;
  
  BEGIN
    ALTER TABLE profiles ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
  EXCEPTION WHEN duplicate_column THEN
    -- Column already exists, no problem
  END;
  
  BEGIN
    ALTER TABLE profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
  EXCEPTION WHEN duplicate_column THEN
    -- Column already exists, no problem
  END;
  
  -- Update email from auth.users if it's NULL
  UPDATE profiles p
  SET email = u.email
  FROM auth.users u
  WHERE p.id = u.id AND p.email IS NULL;
END $$;

-- Analyze the tables to refresh the schema cache
ANALYZE public.profiles;
ANALYZE auth.users;

-- Update role in auth.users to match profiles
UPDATE auth.users u
SET raw_user_meta_data = jsonb_build_object('role', p.role)
FROM profiles p
WHERE u.id = p.id;

-- Fix any NULL values
UPDATE profiles
SET created_at = now()
WHERE created_at IS NULL;

UPDATE profiles
SET updated_at = now()
WHERE updated_at IS NULL;

-- Option 1: Make App.tsx work better with a view
CREATE OR REPLACE VIEW user_profiles_complete AS
SELECT 
  p.id,
  p.username,
  p.role,
  p.photo_url,
  COALESCE(p.email, u.email) as email,
  p.created_at,
  p.updated_at
FROM 
  profiles p
JOIN
  auth.users u ON p.id = u.id;
  
GRANT SELECT ON user_profiles_complete TO authenticated;

-- Create a function to get a complete profile
CREATE OR REPLACE FUNCTION get_user_profile(user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT 
    jsonb_build_object(
      'id', p.id,
      'username', p.username,
      'role', p.role,
      'photo_url', p.photo_url,
      'email', COALESCE(p.email, u.email),
      'created_at', p.created_at,
      'updated_at', p.updated_at
    ) INTO result
  FROM 
    profiles p
  JOIN
    auth.users u ON p.id = u.id
  WHERE 
    p.id = user_id;
    
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_profile(UUID) TO authenticated; 