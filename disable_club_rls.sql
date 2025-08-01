-- Disable RLS on club tables to allow all operations
-- This will bypass all policy restrictions

-- Disable RLS on club_members table
ALTER TABLE club_members DISABLE ROW LEVEL SECURITY;

-- Disable RLS on clubs table  
ALTER TABLE clubs DISABLE ROW LEVEL SECURITY;

-- Disable RLS on club_attendance table
ALTER TABLE club_attendance DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('clubs', 'club_members', 'club_attendance')
ORDER BY tablename; 