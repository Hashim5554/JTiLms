-- Update permissions for admin role to match ultra_admin

-- Create a helper function to check if user has admin permissions
CREATE OR REPLACE FUNCTION has_admin_access() 
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

-- Grant execute permission on this function
GRANT EXECUTE ON FUNCTION has_admin_access() TO authenticated;

-- Enable admin and ultra_admin to update any profile
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
CREATE POLICY "Admins can update any profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (has_admin_access())
  WITH CHECK (has_admin_access());

-- Enable admin and ultra_admin to delete any profile
DROP POLICY IF EXISTS "Admins can delete any profile" ON profiles;
CREATE POLICY "Admins can delete any profile"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (has_admin_access());

-- Add or update policies for classes table
DROP POLICY IF EXISTS "Admins can manage classes" ON classes;
CREATE POLICY "Admins can manage classes"
  ON classes
  FOR ALL
  TO authenticated
  USING (has_admin_access());

-- Add or update policies for class_assignments table
DROP POLICY IF EXISTS "Admins can manage class assignments" ON class_assignments;
CREATE POLICY "Admins can manage class assignments"
  ON class_assignments
  FOR ALL
  TO authenticated
  USING (has_admin_access());

-- Add or update policies for subjects table
DROP POLICY IF EXISTS "Admins can manage subjects" ON subjects;
CREATE POLICY "Admins can manage subjects"
  ON subjects
  FOR ALL
  TO authenticated
  USING (has_admin_access());

-- Add or update policies for announcements table
DROP POLICY IF EXISTS "Admins can manage announcements" ON announcements;
CREATE POLICY "Admins can manage announcements"
  ON announcements
  FOR ALL
  TO authenticated
  USING (has_admin_access());

-- Add or update policies for discussions table
DROP POLICY IF EXISTS "Admins can manage discussions" ON discussions;
CREATE POLICY "Admins can manage discussions"
  ON discussions
  FOR ALL
  TO authenticated
  USING (has_admin_access());

-- Add or update policies for due_works table
DROP POLICY IF EXISTS "Admins can manage due works" ON due_works;
CREATE POLICY "Admins can manage due works"
  ON due_works
  FOR ALL
  TO authenticated
  USING (has_admin_access());

-- Reset the is_admin_user function to use our new more robust has_admin_access function
DROP FUNCTION IF EXISTS is_admin_user CASCADE;
CREATE OR REPLACE FUNCTION is_admin_user() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN has_admin_access();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on this function
GRANT EXECUTE ON FUNCTION is_admin_user() TO authenticated;

-- Recreate the policy that was dropped by CASCADE for auth.users
CREATE POLICY "Admin users can use admin API" 
  ON auth.users
  FOR ALL
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user()); 