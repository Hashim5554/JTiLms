-- Drop existing classes table if it exists
DROP TABLE IF EXISTS classes CASCADE;

-- Create classes table with improved structure
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grade TEXT NOT NULL,
  section TEXT NOT NULL,
  subject_id UUID REFERENCES subjects(id),
  teacher_id UUID REFERENCES profiles(id),
  academic_year TEXT NOT NULL,
  semester TEXT NOT NULL,
  max_students INTEGER DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(grade, section, academic_year, semester)
);

-- Enable RLS
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Classes are viewable by everyone"
  ON classes FOR SELECT
  USING (true);

CREATE POLICY "Only admins can modify classes"
  ON classes FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Insert all possible class combinations
DO $$
DECLARE
  grade TEXT;
  section TEXT;
  academic_year TEXT;
  semester TEXT;
BEGIN
  -- Set academic year and semester
  academic_year := '2024-2025';
  semester := 'Spring';

  -- Insert classes for grades 3-8 and sections A-H
  FOR grade IN 3..8 LOOP
    FOR section IN 0..7 LOOP
      INSERT INTO classes (
        grade,
        section,
        academic_year,
        semester
      ) VALUES (
        grade::TEXT,
        CHR(65 + section)::TEXT,
        academic_year,
        semester
      );
    END LOOP;
  END LOOP;
END $$; 