-- Fix the user creation function to use the correct admin API
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
  result JSONB;
  new_user_id UUID;
BEGIN
  -- Generate username if not provided
  IF user_username IS NULL THEN
    user_username := split_part(email, '@', 1);
  END IF;

  -- Attempt to find and use the correct admin API function
  BEGIN
    -- First try the most common function path
    SELECT auth.uid() INTO new_user_id FROM auth.uid();
  EXCEPTION
    WHEN OTHERS THEN
      -- Failed, so fall back to direct insertion
      INSERT INTO auth.users (
        id,
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
        gen_random_uuid(),
        email,
        crypt(password, gen_salt('bf')),
        now(),
        jsonb_build_object('provider', 'email', 'providers', array['email']),
        jsonb_build_object('role', effective_role),
        now(),
        now(),
        'authenticated',
        'authenticated'
      )
      RETURNING id INTO new_user_id;
  END;

  -- Create profile with the same UUID
  INSERT INTO public.profiles (
    id,
    email,
    username,
    role
  ) VALUES (
    new_user_id,
    email,
    user_username,
    effective_role
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