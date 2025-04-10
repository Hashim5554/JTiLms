/*
  # Fix authentication schema

  1. Updates
    - Add email field to profiles table
    - Update existing profiles
    - Add proper indexes and constraints
*/

-- Add email field if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email TEXT UNIQUE;
  END IF;
END $$;

-- Update admin profile with email
UPDATE profiles 
SET email = 'admin@lgs.edu.pk'
WHERE username = 'admin' AND email IS NULL;

-- Ensure proper indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Add NOT NULL constraint to email if not exists
DO $$ 
BEGIN
  ALTER TABLE profiles ALTER COLUMN email SET NOT NULL;
EXCEPTION
  WHEN others THEN NULL;
END $$;