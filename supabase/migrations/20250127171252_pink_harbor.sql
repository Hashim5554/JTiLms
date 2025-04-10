-- First, ensure the auth schema is properly set up
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the admin user if it doesn't exist
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Check if the admin user already exists
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'admin@lgs.edu.pk';

  -- If admin user doesn't exist, create it
  IF admin_user_id IS NULL THEN
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
      role,
      aud,
      confirmation_token,
      recovery_token,
      email_change_token_current,
      email_change_token_new,
      last_sign_in_at
    ) VALUES (
      uuid_generate_v4(),
      '00000000-0000-0000-0000-000000000000'::uuid,
      'admin@lgs.edu.pk',
      crypt('admin123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      now(),
      now(),
      'authenticated',
      'authenticated',
      '',
      '',
      '',
      '',
      now()
    ) RETURNING id INTO admin_user_id;

    -- Create the admin profile
    INSERT INTO profiles (id, username, role)
    VALUES (admin_user_id, 'admin', 'ultra_admin')
    ON CONFLICT (id) DO UPDATE 
    SET role = 'ultra_admin';
  END IF;
END $$;