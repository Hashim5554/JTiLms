/*
  # Fix Authentication Setup

  1. Changes
    - Add missing auth schema extensions
    - Ensure all required auth fields are present
    - Fix user creation with proper defaults
    - Add proper error handling
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Ensure auth schema exists
CREATE SCHEMA IF NOT EXISTS auth;

-- Create the admin user if it doesn't exist
DO $$
DECLARE
  admin_user_id uuid;
  instance_id uuid := '00000000-0000-0000-0000-000000000000'::uuid;
BEGIN
  -- Check if the admin user already exists
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'admin@lgs.edu.pk';

  -- If admin user doesn't exist, create it
  IF admin_user_id IS NULL THEN
    -- Generate a new UUID for the user
    admin_user_id := uuid_generate_v4();
    
    -- Insert the user with all required fields
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
      aud,
      confirmation_token,
      recovery_token,
      email_change_token_current,
      email_change_token_new,
      confirmation_sent_at,
      recovery_sent_at,
      email_change_token_current_sent_at,
      email_change_token_new_sent_at,
      banned_until,
      reauthentication_token,
      reauthentication_sent_at,
      is_super_admin,
      phone,
      phone_confirmed_at,
      phone_change_token,
      phone_change_sent_at,
      email_change,
      phone_change,
      code_challenge_method,
      code_challenge,
      code_challenge_sent_at
    ) VALUES (
      admin_user_id,
      instance_id,
      'admin@lgs.edu.pk',
      crypt('admin123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      now(),
      now(),
      now(),
      'authenticated',
      'authenticated',
      '',
      '',
      '',
      '',
      now(),
      null,
      null,
      null,
      null,
      '',
      null,
      false,
      null,
      null,
      '',
      null,
      '',
      '',
      '',
      '',
      null
    );

    -- Create or update the admin profile
    INSERT INTO public.profiles (id, username, role)
    VALUES (admin_user_id, 'admin', 'ultra_admin')
    ON CONFLICT (id) DO UPDATE 
    SET role = 'ultra_admin',
        username = 'admin',
        updated_at = now();
  END IF;
EXCEPTION WHEN others THEN
  -- Log the error (in a real production system, you'd want proper error logging)
  RAISE NOTICE 'Error creating admin user: %', SQLERRM;
  -- Re-raise the error
  RAISE;
END $$;