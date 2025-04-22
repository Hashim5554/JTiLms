-- Drop existing classes-related functions and tables if they exist
DROP FUNCTION IF EXISTS get_classes();
DROP FUNCTION IF EXISTS get_class_students(class_id UUID);

-- First recreate the classes table with proper structure
DROP TABLE IF EXISTS class_assignments CASCADE;
DROP TABLE IF EXISTS classes CASCADE;

-- Create classes table with proper structure
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grade INTEGER NOT NULL,
  section TEXT NOT NULL,
  max_students INTEGER NOT NULL DEFAULT 40,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_grade_section UNIQUE (grade, section)
);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS classes_updated_at ON classes;
CREATE TRIGGER classes_updated_at
BEFORE UPDATE ON classes
FOR EACH ROW
EXECUTE FUNCTION moddatetime(updated_at);

-- Create class_assignments table
CREATE TABLE IF NOT EXISTS class_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_class UNIQUE (user_id, class_id)
);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS class_assignments_updated_at ON class_assignments;
CREATE TRIGGER class_assignments_updated_at
BEFORE UPDATE ON class_assignments
FOR EACH ROW
EXECUTE FUNCTION moddatetime(updated_at);

-- Create function to get classes
CREATE OR REPLACE FUNCTION get_classes()
RETURNS TABLE (
  id UUID,
  grade INTEGER,
  section TEXT,
  max_students INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) 
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.grade,
    c.section,
    c.max_students,
    c.created_at,
    c.updated_at
  FROM classes c
  ORDER BY c.grade, c.section;
END;
$$;

-- Create function to get students in a specific class
CREATE OR REPLACE FUNCTION get_class_students(class_id UUID)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  photo_url TEXT
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as user_id,
    p.username,
    p.photo_url
  FROM profiles p
  JOIN class_assignments ca ON p.id = ca.user_id
  WHERE ca.class_id = get_class_students.class_id
  AND p.role = 'student'
  ORDER BY p.username;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_classes() TO authenticated;
GRANT EXECUTE ON FUNCTION get_class_students(UUID) TO authenticated;

-- Set up RLS policies for classes
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Classes visible to all authenticated users"
  ON classes FOR SELECT
  TO authenticated
  USING (true);
  
CREATE POLICY "Only admins can insert classes"
  ON classes FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');
  
CREATE POLICY "Only admins can update classes"
  ON classes FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');
  
CREATE POLICY "Only admins can delete classes"
  ON classes FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Set up RLS policies for class_assignments  
ALTER TABLE class_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Class assignments visible to all authenticated users"
  ON class_assignments FOR SELECT
  TO authenticated
  USING (true);
  
CREATE POLICY "Only admins can insert class_assignments"
  ON class_assignments FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');
  
CREATE POLICY "Only admins can update class_assignments"
  ON class_assignments FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');
  
CREATE POLICY "Only admins can delete class_assignments"
  ON class_assignments FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin'); 