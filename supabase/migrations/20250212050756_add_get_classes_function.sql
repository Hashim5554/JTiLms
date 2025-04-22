-- Create function to get classes with proper permissions
CREATE OR REPLACE FUNCTION get_classes()
RETURNS TABLE (
  id UUID,
  grade INTEGER,
  section TEXT,
  subject_id UUID,
  subject_name TEXT,
  academic_year TEXT,
  semester TEXT,
  max_students INTEGER,
  status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.grade,
    c.section,
    c.subject_id,
    s.name as subject_name,
    c.academic_year,
    c.semester,
    c.max_students,
    c.status,
    c.created_at,
    c.updated_at
  FROM classes c
  LEFT JOIN subjects s ON c.subject_id = s.id
  ORDER BY c.grade, c.section;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_classes() TO authenticated; 