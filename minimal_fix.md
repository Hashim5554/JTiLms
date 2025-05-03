# Direct Database Fix for Schema Error

Since previous solutions didn't work, this is our most aggressive approach - completely rebuilding the profiles table.

## Execute this SQL script

1. Login to your [Supabase Dashboard](https://app.supabase.com)
2. Go to the "SQL Editor" section 
3. Copy and paste the ENTIRE contents below:

```sql
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

-- Analyze tables to refresh schema cache
ANALYZE public.profiles;
ANALYZE auth.users;
```

4. Click "Run" to execute the script
5. **IMPORTANT:** After running this script, restart your application completely:
   - Stop your development server
   - Clear your browser cache and cookies
   - Restart the development server
   - Try logging in again

## What This Fix Does

This is our most aggressive fix - it completely rebuilds the profiles table from scratch:

1. Creates a backup of your existing profiles data
2. Drops the existing profiles table entirely
3. Recreates it with the correct structure
4. Restores your profile data
5. Ensures all the required permissions are set

This "nuclear option" approach should resolve the schema issues by eliminating any inconsistencies in the database structure. 