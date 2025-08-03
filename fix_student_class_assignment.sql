-- Fix Student Class Assignment
-- This script ensures the test student has a proper class assignment

-- First, let's check if the test student exists and get their ID
SELECT id, email, username, role FROM profiles WHERE email = 'testinglgsjti@gmail.com';

-- Check if class 3A exists
SELECT id, grade, section FROM classes WHERE grade = '3' AND section = 'A';

-- Check if there's already a class assignment for the test student
SELECT 
  ca.id,
  ca.user_id,
  ca.class_id,
  p.username,
  p.email,
  c.grade,
  c.section
FROM class_assignments ca
JOIN profiles p ON ca.user_id = p.id
JOIN classes c ON ca.class_id = c.id
WHERE p.email = 'testinglgsjti@gmail.com';

-- Create class assignment for the test student (if not exists)
-- Replace the user_id and class_id with actual values from the queries above
INSERT INTO class_assignments (user_id, class_id)
SELECT 
  p.id as user_id,
  c.id as class_id
FROM profiles p
CROSS JOIN classes c
WHERE p.email = 'testinglgsjti@gmail.com'
  AND c.grade = '3' 
  AND c.section = 'A'
ON CONFLICT (user_id, class_id) DO NOTHING;

-- Verify the assignment was created
SELECT 
  ca.id,
  ca.user_id,
  ca.class_id,
  p.username,
  p.email,
  c.grade,
  c.section,
  ca.created_at
FROM class_assignments ca
JOIN profiles p ON ca.user_id = p.id
JOIN classes c ON ca.class_id = c.id
WHERE p.email = 'testinglgsjti@gmail.com'; 