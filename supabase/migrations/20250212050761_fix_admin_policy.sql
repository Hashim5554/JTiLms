-- Grant admin access to auth.admin API for specific roles
CREATE OR REPLACE FUNCTION is_admin_user() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND (role = 'admin' OR role = 'ultra_admin')
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a security policy for all endpoints in auth.admin
DROP POLICY IF EXISTS "Admin users can use admin API" ON auth.users;

CREATE POLICY "Admin users can use admin API" 
  ON auth.users
  FOR ALL
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- Grant execute permission on auth.admin.* functions to authenticated users
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO authenticated;

-- Create service role function to create users with admin API
CREATE OR REPLACE FUNCTION public.create_user_with_admin_api(
  user_email TEXT,
  user_password TEXT,
  user_data JSONB DEFAULT '{}'::jsonb
) RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  -- Check if user is admin or ultra_admin
  IF NOT is_admin_user() THEN
    RAISE EXCEPTION 'Only admin users can create new users';
  END IF;

  -- Call the internal admin API
  result := auth.admin_create_user(
    email := user_email,
    password := user_password,
    data := user_data
  );
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', SQLERRM,
      'details', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 