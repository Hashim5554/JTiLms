-- Create a minimal user creation function with only required columns
CREATE OR REPLACE FUNCTION public.test_auth_system(
  test_email TEXT DEFAULT 'test_admin@example.com',
  test_password TEXT DEFAULT 'password123'
)
RETURNS JSONB
SECURITY DEFINER
AS $$
DECLARE
  test_user_id UUID := gen_random_uuid();
  user_instance_id UUID;
BEGIN
  -- Get instance_id using table alias
  SELECT u.instance_id INTO user_instance_id FROM auth.users u LIMIT 1;
  
  -- If no instance_id found, use a default
  IF user_instance_id IS NULL THEN
    user_instance_id := '00000000-0000-0000-0000-000000000000'::UUID;
  END IF;

  -- Insert only the minimal required columns
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
    test_user_id,
    user_instance_id,
    test_email,
    crypt(test_password, gen_salt('bf', 10)),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"admin"}'::jsonb,
    now(),
    now(),
    'authenticated',
    'authenticated'
  );

  -- Create profile
  INSERT INTO public.profiles (
    id,
    email,
    username,
    role
  ) VALUES (
    test_user_id,
    test_email,
    split_part(test_email, '@', 1),
    'admin'
  );

  RETURN jsonb_build_object(
    'id', test_user_id,
    'email', test_email,
    'password', test_password,
    'message', 'Test admin created. Use these credentials to log in.'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', SQLERRM,
      'details', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql;

-- Grant execution permission
GRANT EXECUTE ON FUNCTION public.test_auth_system() TO authenticated; 