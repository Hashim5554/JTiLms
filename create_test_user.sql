-- Create test user: testinglgsjti@gmail.com as student in class 3A
-- First, find the class 3A ID
-- Then create/update the profile
-- Then assign to the class

-- Step 1: Find class 3A
SELECT id, grade, section FROM classes WHERE grade = '3' AND section = 'A';

-- Step 2: Create/update profile for testinglgsjti@gmail.com
INSERT INTO profiles (id, email, username, role, created_at, updated_at)
VALUES (
    gen_random_uuid(), -- Generate a new UUID for the user
    'testinglgsjti@gmail.com',
    'test',
    'student',
    NOW(),
    NOW()
)
ON CONFLICT (email) 
DO UPDATE SET 
    username = 'test',
    role = 'student',
    updated_at = NOW();

-- Step 3: Get the user ID and class ID for assignment
WITH user_info AS (
    SELECT id FROM profiles WHERE email = 'testinglgsjti@gmail.com'
),
class_info AS (
    SELECT id FROM classes WHERE grade = '3' AND section = 'A'
)
-- Step 4: Assign user to class 3A
INSERT INTO class_assignments (user_id, class_id, created_at, updated_at)
SELECT 
    u.id,
    c.id,
    NOW(),
    NOW()
FROM user_info u, class_info c
ON CONFLICT (user_id, class_id) DO NOTHING;

-- Verify the user was created and assigned
SELECT 
    p.id,
    p.email,
    p.username,
    p.role,
    c.grade,
    c.section
FROM profiles p
JOIN class_assignments ca ON p.id = ca.user_id
JOIN classes c ON ca.class_id = c.id
WHERE p.email = 'testinglgsjti@gmail.com'; 