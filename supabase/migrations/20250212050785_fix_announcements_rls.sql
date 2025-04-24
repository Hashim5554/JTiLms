-- First, drop all existing policies on announcements table
DROP POLICY IF EXISTS "Allow public read access to announcements" ON announcements;
DROP POLICY IF EXISTS "Allow authenticated users to create announcements" ON announcements;
DROP POLICY IF EXISTS "Allow users to update their own announcements" ON announcements;
DROP POLICY IF EXISTS "Allow users to delete their own announcements" ON announcements;
DROP POLICY IF EXISTS "Announcements are viewable by everyone" ON announcements;
DROP POLICY IF EXISTS "Only admins can create announcements" ON announcements;
DROP POLICY IF EXISTS "Admins can manage announcements" ON announcements;
DROP POLICY IF EXISTS "Users can view announcements for their classes" ON announcements;
DROP POLICY IF EXISTS "Teachers can create announcements" ON announcements;
DROP POLICY IF EXISTS "Teachers can update their announcements" ON announcements;
DROP POLICY IF EXISTS "Teachers can delete their announcements" ON announcements;
DROP POLICY IF EXISTS "Users can create announcements" ON announcements;
DROP POLICY IF EXISTS "Users can update their own announcements" ON announcements;
DROP POLICY IF EXISTS "Users can delete their own announcements" ON announcements;
DROP POLICY IF EXISTS "Only admins can update announcements" ON announcements;
DROP POLICY IF EXISTS "Only admins can delete announcements" ON announcements;
DROP POLICY IF EXISTS "Enable read access for all users" ON announcements;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON announcements;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON announcements;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON announcements;
DROP POLICY IF EXISTS "Enable insert for ultra_admin and admin" ON announcements;
DROP POLICY IF EXISTS "Enable update for ultra_admin and admin" ON announcements;
DROP POLICY IF EXISTS "Enable delete for ultra_admin and admin" ON announcements;

-- Create a function to check if the user is an admin or teacher
CREATE OR REPLACE FUNCTION can_manage_announcements()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin', 'ultra_admin', 'teacher')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make sure RLS is enabled
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Create clear, consistent policies

-- Anyone can view announcements
CREATE POLICY "Anyone can view announcements"
ON announcements
FOR SELECT
USING (true);

-- Admins and teachers can create announcements
CREATE POLICY "Admins and teachers can create announcements"
ON announcements
FOR INSERT
WITH CHECK (can_manage_announcements());

-- Admins can update any announcement
CREATE POLICY "Admins can update any announcement"
ON announcements
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE id = auth.uid() AND role IN ('admin', 'ultra_admin')
));

-- Teachers can only update their own announcements
CREATE POLICY "Teachers can update their own announcements"
ON announcements
FOR UPDATE
USING (
  auth.uid() = created_by AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'teacher'
  )
);

-- Admins can delete any announcement
CREATE POLICY "Admins can delete any announcement"
ON announcements
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE id = auth.uid() AND role IN ('admin', 'ultra_admin')
));

-- Teachers can only delete their own announcements
CREATE POLICY "Teachers can delete their own announcements"
ON announcements
FOR DELETE
USING (
  auth.uid() = created_by AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'teacher'
  )
); 