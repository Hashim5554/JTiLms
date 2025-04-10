-- Custom Pages Policies
CREATE OR REPLACE FUNCTION public.create_custom_pages_policies(admin_role text, teacher_role text)
RETURNS void AS $$
BEGIN
  -- Enable RLS
  ALTER TABLE custom_pages ENABLE ROW LEVEL SECURITY;

  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Enable read access for all users" ON custom_pages;
  DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON custom_pages;
  DROP POLICY IF EXISTS "Enable update for authenticated users only" ON custom_pages;
  DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON custom_pages;

  -- Create policies
  CREATE POLICY "Enable read access for all users" ON custom_pages
    FOR SELECT USING (true);

  CREATE POLICY "Enable insert for authenticated users only" ON custom_pages
    FOR INSERT WITH CHECK (auth.role() IN (admin_role, teacher_role));

  CREATE POLICY "Enable update for authenticated users only" ON custom_pages
    FOR UPDATE USING (auth.role() IN (admin_role, teacher_role));

  CREATE POLICY "Enable delete for authenticated users only" ON custom_pages
    FOR DELETE USING (auth.role() IN (admin_role, teacher_role));
END;
$$ LANGUAGE plpgsql;

-- Announcements Policies
CREATE OR REPLACE FUNCTION public.create_announcements_policies(admin_role text, teacher_role text)
RETURNS void AS $$
BEGIN
  -- Enable RLS
  ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Enable read access for all users" ON announcements;
  DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON announcements;
  DROP POLICY IF EXISTS "Enable update for authenticated users only" ON announcements;
  DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON announcements;

  -- Create policies
  CREATE POLICY "Enable read access for all users" ON announcements
    FOR SELECT USING (true);

  CREATE POLICY "Enable insert for authenticated users only" ON announcements
    FOR INSERT WITH CHECK (auth.role() IN (admin_role, teacher_role));

  CREATE POLICY "Enable update for authenticated users only" ON announcements
    FOR UPDATE USING (auth.role() IN (admin_role, teacher_role));

  CREATE POLICY "Enable delete for authenticated users only" ON announcements
    FOR DELETE USING (auth.role() IN (admin_role, teacher_role));
END;
$$ LANGUAGE plpgsql;

-- Afternoon Clubs Policies
CREATE OR REPLACE FUNCTION public.create_clubs_policies(admin_role text, teacher_role text)
RETURNS void AS $$
BEGIN
  -- Enable RLS
  ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
  ALTER TABLE club_members ENABLE ROW LEVEL SECURITY;
  ALTER TABLE club_attendance ENABLE ROW LEVEL SECURITY;

  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Enable read access for all users" ON clubs;
  DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON clubs;
  DROP POLICY IF EXISTS "Enable update for authenticated users only" ON clubs;
  DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON clubs;

  -- Create policies for clubs table
  CREATE POLICY "Enable read access for all users" ON clubs
    FOR SELECT USING (true);

  CREATE POLICY "Enable insert for authenticated users only" ON clubs
    FOR INSERT WITH CHECK (auth.role() IN (admin_role, teacher_role));

  CREATE POLICY "Enable update for authenticated users only" ON clubs
    FOR UPDATE USING (auth.role() IN (admin_role, teacher_role));

  CREATE POLICY "Enable delete for authenticated users only" ON clubs
    FOR DELETE USING (auth.role() IN (admin_role, teacher_role));

  -- Create policies for club_members table
  CREATE POLICY "Enable read access for all users" ON club_members
    FOR SELECT USING (true);

  CREATE POLICY "Enable insert for authenticated users only" ON club_members
    FOR INSERT WITH CHECK (auth.role() IN (admin_role, teacher_role));

  CREATE POLICY "Enable update for authenticated users only" ON club_members
    FOR UPDATE USING (auth.role() IN (admin_role, teacher_role));

  CREATE POLICY "Enable delete for authenticated users only" ON club_members
    FOR DELETE USING (auth.role() IN (admin_role, teacher_role));

  -- Create policies for club_attendance table
  CREATE POLICY "Enable read access for all users" ON club_attendance
    FOR SELECT USING (true);

  CREATE POLICY "Enable insert for authenticated users only" ON club_attendance
    FOR INSERT WITH CHECK (auth.role() IN (admin_role, teacher_role));

  CREATE POLICY "Enable update for authenticated users only" ON club_attendance
    FOR UPDATE USING (auth.role() IN (admin_role, teacher_role));

  CREATE POLICY "Enable delete for authenticated users only" ON club_attendance
    FOR DELETE USING (auth.role() IN (admin_role, teacher_role));
END;
$$ LANGUAGE plpgsql; 