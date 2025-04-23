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

-- First, drop the policy if it exists
DROP POLICY IF EXISTS "Admin users can access full API" ON auth.users;

-- Then create the policy
CREATE POLICY "Admin users can access full API" 
  ON auth.users
  FOR ALL
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user()); 