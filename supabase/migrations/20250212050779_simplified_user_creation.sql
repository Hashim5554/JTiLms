-- Simplified user creation function with minimal required columns
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

  -- Insert user into auth.users with minimal columns
  -- Adapted from auth.create_user
  WITH 
  new_auth_user AS (
    INSERT INTO auth.users (
      id, 
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      role,
      aud
    )
    VALUES (
      new_user_id,
      email,
      -- Use the crypt function with bcrypt algorithm for password hashing
      -- which is what Supabase Auth expects
      crypt(password, gen_salt('bf')),
      now(), 
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('role', effective_role),
      'authenticated',
      'authenticated'
    )
    RETURNING id
  )
  -- Create profile
  INSERT INTO public.profiles (
    id,
    email,
    username, 
    role
  )
  SELECT 
    new_user_id,
    email,
    user_username,
    effective_role
  FROM new_auth_user;

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