-- Fix admin permissions to ensure both admin and ultra_admin roles have access to key features
-- We'll make two changes:
-- 1. Ensure both admin roles have admin privileges 
-- 2. Update policies for library, clubs and other resources

-- 1. Fix admin role recognition in the is_admin_user function
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

-- 2. Update policy for library resources to allow both admin types to modify
DROP POLICY IF EXISTS "Users can view library resources" ON public.library_resources;
DROP POLICY IF EXISTS "Admins can create library resources" ON public.library_resources;
DROP POLICY IF EXISTS "Admins can update their library resources" ON public.library_resources;
DROP POLICY IF EXISTS "Admins can delete library resources" ON public.library_resources;

CREATE POLICY "Users can view library resources"
ON public.library_resources
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can create library resources"
ON public.library_resources
FOR INSERT
TO authenticated
WITH CHECK (
  role = 'ultra_admin' OR role = 'admin' OR role = 'teacher'
);

CREATE POLICY "Admins can update library resources"
ON public.library_resources
FOR UPDATE
TO authenticated
USING (
  role = 'ultra_admin' OR role = 'admin' OR role = 'teacher'
)
WITH CHECK (
  role = 'ultra_admin' OR role = 'admin' OR role = 'teacher'
);

CREATE POLICY "Admins can delete library resources"
ON public.library_resources
FOR DELETE
TO authenticated
USING (
  role = 'ultra_admin' OR role = 'admin' OR role = 'teacher'
);

-- 3. Update policy for clubs to allow both admin types to manage
DROP POLICY IF EXISTS "Users can view clubs" ON public.clubs;
DROP POLICY IF EXISTS "Admins can create clubs" ON public.clubs;
DROP POLICY IF EXISTS "Admins can update clubs" ON public.clubs;
DROP POLICY IF EXISTS "Admins can delete clubs" ON public.clubs;

CREATE POLICY "Users can view clubs"
ON public.clubs
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can create clubs"
ON public.clubs
FOR INSERT
TO authenticated
WITH CHECK (
  role = 'ultra_admin' OR role = 'admin' OR role = 'teacher'
);

CREATE POLICY "Admins can update clubs"
ON public.clubs
FOR UPDATE
TO authenticated
USING (
  role = 'ultra_admin' OR role = 'admin' OR role = 'teacher'
)
WITH CHECK (
  role = 'ultra_admin' OR role = 'admin' OR role = 'teacher'
);

CREATE POLICY "Admins can delete clubs"
ON public.clubs
FOR DELETE
TO authenticated
USING (
  role = 'ultra_admin' OR role = 'admin' OR role = 'teacher'
);

-- 4. Fix default admin account to ensure it has the correct role
DO $$
BEGIN
  -- Update the admin account to have the correct role
  UPDATE auth.users 
  SET raw_user_meta_data = jsonb_build_object('role', 'ultra_admin')
  WHERE email = 'admin@lgs.edu.pk';
  
  -- Ensure the admin profile in profiles table has correct role
  UPDATE public.profiles 
  SET role = 'ultra_admin'
  WHERE email = 'admin@lgs.edu.pk';
END
$$; 