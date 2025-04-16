-- Drop existing policies for custom_pages
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'custom_pages') THEN
        DROP POLICY IF EXISTS "Allow read access to all users" ON custom_pages;
        DROP POLICY IF EXISTS "Allow insert for authenticated users" ON custom_pages;
        DROP POLICY IF EXISTS "Allow update for creators" ON custom_pages;
        DROP POLICY IF EXISTS "Allow delete for creators" ON custom_pages;
        DROP POLICY IF EXISTS "Custom pages are viewable by assigned users and ultra admins" ON custom_pages;
        DROP POLICY IF EXISTS "Only ultra admins can modify custom pages" ON custom_pages;
        DROP POLICY IF EXISTS "Enable read access for all users" ON custom_pages;
        DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON custom_pages;
        DROP POLICY IF EXISTS "Enable update for authenticated users only" ON custom_pages;
        DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON custom_pages;
        DROP POLICY IF EXISTS "Allow all operations for ultra_admin" ON custom_pages;
        DROP POLICY IF EXISTS "Allow all operations for admin" ON custom_pages;
        DROP POLICY IF EXISTS "Allow users to manage their own pages" ON custom_pages;
    END IF;
END $$;

-- Create new policies for custom_pages
CREATE POLICY "Enable read access for all users" ON custom_pages
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for ultra_admin only" ON custom_pages
    FOR INSERT WITH CHECK (auth.role() = 'ultra_admin');

CREATE POLICY "Enable update for ultra_admin only" ON custom_pages
    FOR UPDATE USING (auth.role() = 'ultra_admin');

CREATE POLICY "Enable delete for ultra_admin only" ON custom_pages
    FOR DELETE USING (auth.role() = 'ultra_admin'); 