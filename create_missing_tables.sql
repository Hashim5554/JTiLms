-- First, let's check what tables exist in the database
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Create the results table if it doesn't exist
CREATE TABLE IF NOT EXISTS results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL,
    subject_id UUID NOT NULL,
    class_id UUID NOT NULL,
    grade VARCHAR(10),
    marks INTEGER DEFAULT 0,
    total_marks INTEGER DEFAULT 100,
    test_date DATE NOT NULL,
    test_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the attendance table if it doesn't exist
CREATE TABLE IF NOT EXISTS attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL,
    class_id UUID NOT NULL,
    date DATE NOT NULL,
    status VARCHAR(20) CHECK (status IN ('present', 'absent', 'leave')),
    type VARCHAR(20) CHECK (type IN ('school', 'online')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the discipline table if it doesn't exist
CREATE TABLE IF NOT EXISTS discipline (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL,
    class_id UUID NOT NULL,
    warning_count INTEGER DEFAULT 1,
    reason TEXT NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the subjects table if it doesn't exist
CREATE TABLE IF NOT EXISTS subjects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraints (with proper error handling)
DO $$ 
BEGIN
    -- Results table foreign keys
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_results_student_id') THEN
        ALTER TABLE results ADD CONSTRAINT fk_results_student_id FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_results_subject_id') THEN
        ALTER TABLE results ADD CONSTRAINT fk_results_subject_id FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_results_class_id') THEN
        ALTER TABLE results ADD CONSTRAINT fk_results_class_id FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE;
    END IF;
    
    -- Attendance table foreign keys
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_attendance_student_id') THEN
        ALTER TABLE attendance ADD CONSTRAINT fk_attendance_student_id FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_attendance_class_id') THEN
        ALTER TABLE attendance ADD CONSTRAINT fk_attendance_class_id FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE;
    END IF;
    
    -- Discipline table foreign keys
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_discipline_student_id') THEN
        ALTER TABLE discipline ADD CONSTRAINT fk_discipline_student_id FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_discipline_class_id') THEN
        ALTER TABLE discipline ADD CONSTRAINT fk_discipline_class_id FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Enable RLS on all tables
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE discipline ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for results table
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON results;
CREATE POLICY "Enable read access for authenticated users" ON results
FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable insert access for teachers and admins" ON results;
CREATE POLICY "Enable insert access for teachers and admins" ON results
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('ultra_admin', 'admin', 'teacher')
  )
);

DROP POLICY IF EXISTS "Enable update access for teachers and admins" ON results;
CREATE POLICY "Enable update access for teachers and admins" ON results
FOR UPDATE USING (
  auth.role() = 'authenticated' AND (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('ultra_admin', 'admin', 'teacher')
  )
);

DROP POLICY IF EXISTS "Enable delete access for teachers and admins" ON results;
CREATE POLICY "Enable delete access for teachers and admins" ON results
FOR DELETE USING (
  auth.role() = 'authenticated' AND (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('ultra_admin', 'admin', 'teacher')
  )
);

-- Create RLS policies for attendance table
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON attendance;
CREATE POLICY "Enable read access for authenticated users" ON attendance
FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable insert access for teachers and admins" ON attendance;
CREATE POLICY "Enable insert access for teachers and admins" ON attendance
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('ultra_admin', 'admin', 'teacher')
  )
);

DROP POLICY IF EXISTS "Enable update access for teachers and admins" ON attendance;
CREATE POLICY "Enable update access for teachers and admins" ON attendance
FOR UPDATE USING (
  auth.role() = 'authenticated' AND (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('ultra_admin', 'admin', 'teacher')
  )
);

DROP POLICY IF EXISTS "Enable delete access for teachers and admins" ON attendance;
CREATE POLICY "Enable delete access for teachers and admins" ON attendance
FOR DELETE USING (
  auth.role() = 'authenticated' AND (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('ultra_admin', 'admin', 'teacher')
  )
);

-- Create RLS policies for discipline table
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON discipline;
CREATE POLICY "Enable read access for authenticated users" ON discipline
FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable insert access for teachers and admins" ON discipline;
CREATE POLICY "Enable insert access for teachers and admins" ON discipline
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('ultra_admin', 'admin', 'teacher')
  )
);

DROP POLICY IF EXISTS "Enable update access for teachers and admins" ON discipline;
CREATE POLICY "Enable update access for teachers and admins" ON discipline
FOR UPDATE USING (
  auth.role() = 'authenticated' AND (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('ultra_admin', 'admin', 'teacher')
  )
);

DROP POLICY IF EXISTS "Enable delete access for teachers and admins" ON discipline;
CREATE POLICY "Enable delete access for teachers and admins" ON discipline
FOR DELETE USING (
  auth.role() = 'authenticated' AND (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('ultra_admin', 'admin', 'teacher')
  )
);

-- Create RLS policies for subjects table
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON subjects;
CREATE POLICY "Enable read access for authenticated users" ON subjects
FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable insert access for teachers and admins" ON subjects;
CREATE POLICY "Enable insert access for teachers and admins" ON subjects
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('ultra_admin', 'admin', 'teacher')
  )
);

-- Ensure unique constraint exists on subjects name
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'subjects_name_key') THEN
        ALTER TABLE subjects ADD CONSTRAINT subjects_name_key UNIQUE (name);
    END IF;
END $$;

-- Insert some default subjects if the table is empty
INSERT INTO subjects (name) VALUES 
('Mathematics'),
('Science'),
('English'),
('History'),
('Geography'),
('Physics'),
('Chemistry'),
('Biology'),
('Computer Science'),
('Literature')
ON CONFLICT (name) DO NOTHING; 