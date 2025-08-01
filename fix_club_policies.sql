-- Comprehensive fix for club policies
-- First, let's see what policies exist (this will help debug)
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('clubs', 'club_members', 'club_attendance')
ORDER BY tablename, policyname;

-- Drop ALL existing policies for club_members (using a more comprehensive approach)
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Drop all policies for club_members
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'club_members'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON club_members';
    END LOOP;
    
    -- Drop all policies for clubs
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'clubs'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON clubs';
    END LOOP;
    
    -- Drop all policies for club_attendance
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'club_attendance'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON club_attendance';
    END LOOP;
END $$;

-- Enable RLS
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_attendance ENABLE ROW LEVEL SECURITY;

-- Create policies for clubs table
CREATE POLICY "Enable read access for all users" ON clubs
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON clubs
  FOR INSERT WITH CHECK (auth.role() IN ('admin', 'teacher'));

CREATE POLICY "Enable update for authenticated users only" ON clubs
  FOR UPDATE USING (auth.role() IN ('admin', 'teacher'));

CREATE POLICY "Enable delete for authenticated users only" ON clubs
  FOR DELETE USING (auth.role() IN ('admin', 'teacher'));

-- Create policies for club_members table
CREATE POLICY "Enable read access for all users" ON club_members
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON club_members
  FOR INSERT WITH CHECK (auth.role() IN ('admin', 'teacher'));

CREATE POLICY "Enable update for authenticated users only" ON club_members
  FOR UPDATE USING (auth.role() IN ('admin', 'teacher'));

CREATE POLICY "Enable delete for authenticated users only" ON club_members
  FOR DELETE USING (auth.role() IN ('admin', 'teacher'));

-- Create policies for club_attendance table
CREATE POLICY "Enable read access for all users" ON club_attendance
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON club_attendance
  FOR INSERT WITH CHECK (auth.role() IN ('admin', 'teacher'));

CREATE POLICY "Enable update for authenticated users only" ON club_attendance
  FOR UPDATE USING (auth.role() IN ('admin', 'teacher'));

CREATE POLICY "Enable delete for authenticated users only" ON club_attendance
  FOR DELETE USING (auth.role() IN ('admin', 'teacher'));

-- Verify the policies were created correctly
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('clubs', 'club_members', 'club_attendance')
ORDER BY tablename, policyname; 