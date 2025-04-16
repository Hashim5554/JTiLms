-- Drop existing foreign key constraint if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'announcements_created_by_fkey'
    ) THEN
        ALTER TABLE announcements DROP CONSTRAINT announcements_created_by_fkey;
    END IF;
END $$;

-- Add new foreign key constraint to profiles table
ALTER TABLE announcements 
    ADD CONSTRAINT announcements_created_by_fkey 
    FOREIGN KEY (created_by) 
    REFERENCES profiles(id) 
    ON DELETE CASCADE;

-- Update RLS policies
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Allow public read access to announcements" ON announcements;
    DROP POLICY IF EXISTS "Allow authenticated users to create announcements" ON announcements;
    DROP POLICY IF EXISTS "Allow users to update their own announcements" ON announcements;
    DROP POLICY IF EXISTS "Allow users to delete their own announcements" ON announcements;
    DROP POLICY IF EXISTS "Announcements are viewable by everyone" ON announcements;
    DROP POLICY IF EXISTS "Only admins can create announcements" ON announcements;
    DROP POLICY IF EXISTS "Enable read access for all users" ON announcements;
    DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON announcements;
    DROP POLICY IF EXISTS "Enable update for authenticated users only" ON announcements;
    DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON announcements;

    -- Create new policies
    CREATE POLICY "Enable read access for all users" ON announcements
        FOR SELECT USING (true);

    CREATE POLICY "Enable insert for ultra_admin and admin" ON announcements
        FOR INSERT WITH CHECK (auth.role() IN ('ultra_admin', 'admin'));

    CREATE POLICY "Enable update for ultra_admin and admin" ON announcements
        FOR UPDATE USING (auth.role() IN ('ultra_admin', 'admin'));

    CREATE POLICY "Enable delete for ultra_admin and admin" ON announcements
        FOR DELETE USING (auth.role() IN ('ultra_admin', 'admin'));
END $$; 