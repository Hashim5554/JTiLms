-- Fix user creation to use direct auth.users insertion with proper password hashing
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
  user_username TEXT := username;
  effective_role TEXT := role;
  new_user_id UUID := gen_random_uuid();
  user_instance_id UUID;
  password_hash TEXT;
BEGIN
  -- Generate username if not provided
  IF user_username IS NULL THEN
    user_username := split_part(email, '@', 1);
  END IF;

  -- Get the instance_id from an existing user to ensure consistency
  SELECT u.instance_id INTO user_instance_id FROM auth.users u LIMIT 1;
  
  -- If no instance_id found, use a default
  IF user_instance_id IS NULL THEN
    user_instance_id := '00000000-0000-0000-0000-000000000000'::UUID;
  END IF;

  -- Generate the password hash using bcrypt
  password_hash := crypt(password, gen_salt('bf', 10));

  -- Insert user into auth.users
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
    aud
  ) VALUES (
    new_user_id,
    user_instance_id,
    email,
    password_hash,
    now(),
    jsonb_build_object('provider', 'email', 'providers', array['email']),
    jsonb_build_object('role', effective_role),
    now(),
    now(),
    'authenticated',
    'authenticated'
  );

  -- Create profile with the same UUID
  INSERT INTO public.profiles (
    id,
    email,
    username,
    role,
    created_at,
    updated_at
  ) VALUES (
    new_user_id,
    email,
    user_username,
    effective_role,
    now(),
    now()
  );

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