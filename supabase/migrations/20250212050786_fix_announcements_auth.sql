-- Drop all existing RLS policies for announcements to start fresh
DROP POLICY IF EXISTS "Anyone can view announcements" ON announcements;
DROP POLICY IF EXISTS "Admins and teachers can create announcements" ON announcements;
DROP POLICY IF EXISTS "Admins can update any announcement" ON announcements;
DROP POLICY IF EXISTS "Teachers can update their own announcements" ON announcements;
DROP POLICY IF EXISTS "Admins can delete any announcement" ON announcements;
DROP POLICY IF EXISTS "Teachers can delete their own announcements" ON announcements;
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

-- Temporarily disable RLS to diagnose issues
ALTER TABLE announcements DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS with simpler policies
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Create basic policies for essential operations
CREATE POLICY "everyone_select_announcements" 
ON announcements FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "authenticated_insert_announcements" 
ON announcements FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "authenticated_update_announcements" 
ON announcements FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "authenticated_delete_announcements" 
ON announcements FOR DELETE 
TO authenticated 
USING (true); 