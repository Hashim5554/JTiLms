-- Create a simple user creation function that bypasses permissions
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
  new_user_id UUID;
  user_username TEXT := username;
BEGIN
  -- Generate username if not provided
  IF user_username IS NULL THEN
    user_username := split_part(email, '@', 1);
  END IF;

  -- Create auth user
  INSERT INTO auth.users (
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    role,
    aud
  ) VALUES (
    email,
    crypt(password, gen_salt('bf')),
    now(),
    jsonb_build_object('provider', 'email', 'providers', array['email']),
    jsonb_build_object('role', role),
    'authenticated',
    'authenticated'
  )
  RETURNING id INTO new_user_id;

  -- Create profile
  INSERT INTO public.profiles (
    id,
    email,
    username,
    role
  ) VALUES (
    new_user_id,
    email,
    user_username,
    role
  );

  RETURN jsonb_build_object(
    'id', new_user_id,
    'email', email,
    'username', user_username,
    'role', role
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