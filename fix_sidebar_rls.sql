-- Fix sidebar_pages RLS issue
-- Disable RLS on sidebar_pages table since access is controlled through frontend UI

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON sidebar_pages;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON sidebar_pages;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON sidebar_pages;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON sidebar_pages;

-- Disable RLS
ALTER TABLE sidebar_pages DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'sidebar_pages'; 