-- Create required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create moddatetime function for timestamps
CREATE OR REPLACE FUNCTION moddatetime()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create auth schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS auth;

-- Check if profiles table exists, if not create it
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  role TEXT NOT NULL DEFAULT 'student',
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS profiles_moddatetime ON profiles;
CREATE TRIGGER profiles_moddatetime
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION moddatetime();

-- Create schema cache refreshing function
CREATE OR REPLACE FUNCTION public.refresh_schema_cache()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  ANALYZE public.profiles;
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to refresh schema cache: %', SQLERRM;
    RETURN false;
END;
$$;

-- Grant execution permission
GRANT EXECUTE ON FUNCTION public.refresh_schema_cache() TO authenticated; 