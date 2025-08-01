-- Fix the foreign key relationship between results and profiles tables
-- This ensures that student_id in results table properly references id in profiles table

-- First, let's check if the foreign key constraint exists
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name='results' 
    AND kcu.column_name='student_id';

-- If the foreign key doesn't exist, create it
ALTER TABLE results 
ADD CONSTRAINT fk_results_student_id 
FOREIGN KEY (student_id) REFERENCES profiles(id) 
ON DELETE CASCADE;

-- Also ensure the same for attendance and discipline tables
ALTER TABLE attendance 
ADD CONSTRAINT fk_attendance_student_id 
FOREIGN KEY (student_id) REFERENCES profiles(id) 
ON DELETE CASCADE;

ALTER TABLE discipline 
ADD CONSTRAINT fk_discipline_student_id 
FOREIGN KEY (student_id) REFERENCES profiles(id) 
ON DELETE CASCADE;

-- Update RLS policies to ensure proper access
CREATE POLICY "Enable read access for authenticated users" ON results
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for teachers and admins" ON results
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('ultra_admin', 'admin', 'teacher')
  )
);

CREATE POLICY "Enable update access for teachers and admins" ON results
FOR UPDATE USING (
  auth.role() = 'authenticated' AND (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('ultra_admin', 'admin', 'teacher')
  )
);

CREATE POLICY "Enable delete access for teachers and admins" ON results
FOR DELETE USING (
  auth.role() = 'authenticated' AND (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('ultra_admin', 'admin', 'teacher')
  )
); 