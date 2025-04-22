-- Drop existing function first
DROP FUNCTION IF EXISTS get_classes();

-- Create function to get classes with proper permissions
CREATE OR REPLACE FUNCTION get_classes()
RETURNS TABLE (
  id UUID,
  grade INTEGER,
  section TEXT,
  max_students INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Check if classes table exists and has data
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'classes') THEN
    RAISE EXCEPTION 'Classes table does not exist';
  END IF;

  -- Return the query results
  RETURN QUERY
  SELECT 
    c.id,
    c.grade,
    c.section,
    c.max_students,
    c.created_at,
    c.updated_at
  FROM classes c
  WHERE c.id IS NOT NULL
  ORDER BY c.grade, c.section;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_classes() TO authenticated; 