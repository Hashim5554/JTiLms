-- Debug script to check club memberships
-- Check if the test user exists in profiles
SELECT id, email, username, role FROM profiles WHERE email = 'testinglgsjti@gmail.com';

-- Check if the test user is in any clubs
SELECT 
  cm.id,
  cm.club_id,
  cm.user_id,
  c.name as club_name,
  p.username,
  p.email
FROM club_members cm
JOIN clubs c ON cm.club_id = c.id
JOIN profiles p ON cm.user_id = p.id
WHERE p.email = 'testinglgsjti@gmail.com';

-- Check all club members to see what's in the table
SELECT 
  cm.id,
  cm.club_id,
  cm.user_id,
  c.name as club_name,
  p.username,
  p.email
FROM club_members cm
JOIN clubs c ON cm.club_id = c.id
JOIN profiles p ON cm.user_id = p.id
ORDER BY c.name, p.username;

-- Check if there are any club members at all
SELECT COUNT(*) as total_club_members FROM club_members; 