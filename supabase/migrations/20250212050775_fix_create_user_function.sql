-- Fix the user creation function to use admin.create_user instead of auth.create_user
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
  new_user_id UUID;
  result JSONB;
BEGIN
  -- Generate username if not provided
  IF user_username IS NULL THEN
    user_username := split_part(email, '@', 1);
  END IF;

  -- Using the proper admin API to create users
  -- This will properly encrypt passwords and handle auth setup
  result := supabase_admin.create_user(
    jsonb_build_object(
      'email', email,
      'password', password,
      'email_confirm', TRUE,
      'user_metadata', jsonb_build_object('role', effective_role)
    )
  );

  -- Extract the user ID from the result
  new_user_id := (result ->> 'id')::UUID;
  
  IF new_user_id IS NULL THEN
    RAISE EXCEPTION 'Failed to create user: %', result;
  END IF;

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