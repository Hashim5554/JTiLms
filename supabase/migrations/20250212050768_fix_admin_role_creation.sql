-- Fix the user creation function to properly handle admin roles
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

  -- Fix issue: Make sure admin role has proper permissions
  -- No need to modify the role in the database, just ensure
  -- the role is properly set in both auth.users and profiles
  
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

-- Update the is_admin_user function to properly identify admin roles
CREATE OR REPLACE FUNCTION is_admin_user() 
RETURNS BOOLEAN AS $$
DECLARE
  current_role TEXT;
BEGIN
  -- Get the current user's role from the profiles table
  SELECT role INTO current_role 
  FROM profiles 
  WHERE id = auth.uid();
  
  -- Consider both 'admin' and 'ultra_admin' as admin roles with full permissions
  RETURN current_role IN ('admin', 'ultra_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on this function
GRANT EXECUTE ON FUNCTION is_admin_user() TO authenticated;

-- Create policy to ensure both 'admin' and 'ultra_admin' have proper permissions
DROP POLICY IF EXISTS "Admin users can access full API" ON auth.users;
CREATE POLICY "Admin users can access full API" 
  ON auth.users
  FOR ALL
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user()); 