/*
  # Fix Authentication Schema

  1. Changes
    - Recreate profiles table with proper structure
    - Set up RLS policies
    - Create default admin user with minimal required columns
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop and recreate profiles table to ensure correct structure
DROP TABLE IF EXISTS profiles CASCADE;

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Recreate policies for profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id OR is_ultra_admin(auth.uid()));

CREATE POLICY "Allow insert for authenticated users"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create default admin user
DO $$
DECLARE
  admin_user_id uuid := '00000000-0000-0000-0000-000000000000'::uuid;
BEGIN
  -- Create admin user in auth.users with only core columns
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    last_sign_in_at,
    role,
    aud
  ) VALUES (
    admin_user_id,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'admin@lgs.edu.pk',
    crypt('admin123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now(),
    now(),
    'authenticated',
    'authenticated'
  ) ON CONFLICT (id) DO NOTHING;

  -- Create admin profile
  INSERT INTO profiles (id, username, role)
  VALUES (
    admin_user_id,
    'admin',
    'ultra_admin'
  ) ON CONFLICT (id) DO UPDATE 
  SET role = 'ultra_admin',
      username = 'admin',
      updated_at = now();
END $$;