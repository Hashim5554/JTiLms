-- Create a simplified user creation function
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

  -- Create auth user with explicit id specification
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    role,
    aud
  ) VALUES (
    new_user_id,
    email,
    crypt(password, gen_salt('bf')),
    now(),
    jsonb_build_object('provider', 'email', 'providers', array['email']),
    jsonb_build_object('role', effective_role),
    'authenticated',
    'authenticated'
  );

  -- Create profile with all required fields
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