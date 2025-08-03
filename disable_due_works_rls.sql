-- Disable RLS on due_works table
-- This fixes the posting issues for due works

-- Drop existing policies for due_works if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON due_works;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON due_works;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON due_works;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON due_works;

-- Disable RLS on the due_works table
ALTER TABLE due_works DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'due_works'; 