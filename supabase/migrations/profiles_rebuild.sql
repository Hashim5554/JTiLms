-- COMPLETE REBUILD OF PROFILES TABLE
-- This script will back up your profiles data, drop the table, and rebuild it correctly

-- First, create a backup of existing profiles
CREATE TABLE IF NOT EXISTS profiles_backup AS
SELECT * FROM profiles;

-- Drop existing triggers
DROP TRIGGER IF EXISTS profiles_moddatetime ON profiles;

-- Drop existing table
DROP TABLE IF EXISTS profiles CASCADE;

-- Create the profiles table from scratch with all required fields
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'student',
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create moddatetime function if it doesn't exist
CREATE OR REPLACE FUNCTION moddatetime()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for updated_at
CREATE TRIGGER profiles_moddatetime
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION moddatetime();

-- Restore data from backup
INSERT INTO profiles (id, username, email, role, photo_url, created_at, updated_at)
SELECT 
  id, 
  username, 
  email, 
  role, 
  photo_url, 
  COALESCE(created_at, now()) as created_at,
  COALESCE(updated_at, now()) as updated_at
FROM profiles_backup
ON CONFLICT (id) DO NOTHING;

-- Update NULL emails from auth.users
UPDATE profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow insert for authenticated users"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Drop the view and recreate it
DROP VIEW IF EXISTS user_profiles_complete;

CREATE VIEW user_profiles_complete AS
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

-- Grant permissions
GRANT SELECT ON user_profiles_complete TO authenticated;

-- Recreate the get_user_profile function
DROP FUNCTION IF EXISTS get_user_profile;

CREATE FUNCTION get_user_profile(user_id UUID)
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

-- Analyze tables to refresh schema cache
ANALYZE public.profiles;
ANALYZE auth.users; 