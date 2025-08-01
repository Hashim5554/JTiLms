-- Simple fix for club_members_insert_policy error
-- Drop the specific problematic policy
DROP POLICY IF EXISTS "club_members_insert_policy" ON club_members;

-- Also drop any other policies that might conflict
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON club_members;
DROP POLICY IF EXISTS "club_members_insert" ON club_members;
DROP POLICY IF EXISTS "club_members_insert_policy" ON club_members;

-- Create the correct policy
CREATE POLICY "Enable insert for authenticated users only" ON club_members
  FOR INSERT WITH CHECK (auth.role() IN ('admin', 'teacher', 'ultra_admin'));

-- Verify the policy was created
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'club_members' 
AND cmd = 'INSERT'; 