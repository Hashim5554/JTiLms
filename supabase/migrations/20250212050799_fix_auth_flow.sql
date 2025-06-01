-- Fix user creation to use proper auth flow
CREATE OR REPLACE FUNCTION public.create_new_user(
  email TEXT,
  password TEXT,
  role TEXT DEFAULT 'student',
  username TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
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
    jsonb_build_object('username', user_username, 'role', effective_role),
    now(),
    now(),
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

  -- Refresh schema cache after user creation
  PERFORM public.refresh_schema_cache();

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
$$;

-- Grant execute permission to this function
GRANT EXECUTE ON FUNCTION public.create_new_user(TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- Create a trigger to automatically create profile after user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    username,
    role,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    now(),
    now()
  );
  RETURN NEW;
END;
$$;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user(); 