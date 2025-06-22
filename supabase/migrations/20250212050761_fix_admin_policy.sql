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

-- Create execute_sql function with security measures
CREATE OR REPLACE FUNCTION public.execute_sql(sql_query TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  allowed_operations TEXT[] := ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE'];
  operation TEXT;
  is_allowed BOOLEAN := false;
BEGIN
  -- Only allow ultra_admin to execute SQL
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'ultra_admin'
  ) THEN
    RAISE EXCEPTION 'Only ultra_admin can execute SQL queries';
  END IF;

  -- Extract the operation type from the query
  operation := upper(split_part(trim(sql_query), ' ', 1));
  
  -- Check if the operation is allowed
  FOREACH operation IN ARRAY allowed_operations LOOP
    IF upper(sql_query) LIKE operation || '%' THEN
      is_allowed := true;
      EXIT;
    END IF;
  END LOOP;

  IF NOT is_allowed THEN
    RAISE EXCEPTION 'Only SELECT, INSERT, UPDATE, and DELETE operations are allowed';
  END IF;

  -- Execute the query and return results
  BEGIN
    EXECUTE sql_query;
    result := jsonb_build_object(
      'status', 'success',
      'message', 'Query executed successfully'
    );
  EXCEPTION WHEN OTHERS THEN
    result := jsonb_build_object(
      'status', 'error',
      'message', SQLERRM,
      'details', SQLSTATE
    );
  END;

  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.execute_sql(TEXT) TO authenticated; 