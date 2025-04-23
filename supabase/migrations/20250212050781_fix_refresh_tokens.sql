-- Function to create a test user and generate a refresh token
CREATE OR REPLACE FUNCTION public.test_auth_system(
  test_email TEXT DEFAULT 'test_user@example.com',
  test_password TEXT DEFAULT 'password123',
  test_role TEXT DEFAULT 'admin'
)
RETURNS JSONB
SECURITY DEFINER
AS $$
DECLARE
  test_user_id UUID;
  token_result JSONB;
BEGIN
  -- Create a test user
  WITH user_creation AS (
    INSERT INTO auth.users (
      email,
      encrypted_password,
      email_confirmed_at,
      confirmation_token,
      recovery_token,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      role,
      aud
    ) VALUES (
      test_email,
      crypt(test_password, gen_salt('bf', 10)),
      now(),
      '',
      '',
      jsonb_build_object('provider', 'email', 'providers', array['email']),
      jsonb_build_object('role', test_role),
      now(),
      now(),
      'authenticated',
      'authenticated'
    )
    RETURNING id
  )
  SELECT id INTO test_user_id FROM user_creation;

  -- Create a profile for the test user
  INSERT INTO public.profiles (
    id,
    email,
    username,
    role
  ) VALUES (
    test_user_id,
    test_email,
    split_part(test_email, '@', 1),
    test_role
  );

  -- Return status
  RETURN jsonb_build_object(
    'id', test_user_id,
    'email', test_email,
    'role', test_role,
    'status', 'Authentication system test complete'
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