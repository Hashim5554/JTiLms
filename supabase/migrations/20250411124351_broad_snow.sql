-- Add class_id column to discussions table
ALTER TABLE discussions
ADD COLUMN class_id UUID REFERENCES classes(id);

-- Update RLS policies for discussions
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON discussions;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON discussions;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON discussions;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON discussions;

-- Create new policies
CREATE POLICY "Enable read access for all users"
ON discussions
FOR SELECT
USING (
  -- Allow access to global discussions (class_id is null)
  class_id IS NULL
  OR
  -- Allow access to class-specific discussions for users in that class
  EXISTS (
    SELECT 1 FROM class_assignments
    WHERE class_assignments.user_id = auth.uid()
    AND class_assignments.class_id = discussions.class_id
  )
  OR
  -- Allow access for admins and ultra admins
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'ultra_admin')
  )
);

CREATE POLICY "Enable insert for authenticated users only"
ON discussions
FOR INSERT
WITH CHECK (
  -- Allow creating global discussions for admins and ultra admins
  (class_id IS NULL AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'ultra_admin')
  ))
  OR
  -- Allow creating class-specific discussions for users in that class
  EXISTS (
    SELECT 1 FROM class_assignments
    WHERE class_assignments.user_id = auth.uid()
    AND class_assignments.class_id = discussions.class_id
  )
);

CREATE POLICY "Enable update for users based on user_id"
ON discussions
FOR UPDATE
USING (
  -- Allow updates for the original creator
  user_id = auth.uid()
  OR
  -- Allow updates for admins and ultra admins
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'ultra_admin')
  )
);

CREATE POLICY "Enable delete for users based on user_id"
ON discussions
FOR DELETE
USING (
  -- Allow deletion for the original creator
  user_id = auth.uid()
  OR
  -- Allow deletion for admins and ultra admins
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'ultra_admin')
  )
); 