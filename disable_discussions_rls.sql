-- Disable RLS on discussions and private_discussions tables
-- This fixes the posting issues for both open and private discussions

-- Drop existing policies for discussions if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON discussions;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON discussions;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON discussions;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON discussions;

-- Drop existing policies for private_discussions if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON private_discussions;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON private_discussions;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON private_discussions;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON private_discussions;

-- Disable RLS on the discussions table
ALTER TABLE discussions DISABLE ROW LEVEL SECURITY;

-- Disable RLS on the private_discussions table
ALTER TABLE private_discussions DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled for both tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('discussions', 'private_discussions')
ORDER BY tablename; 