-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.get_classes;

-- Create a new version of the function that doesn't try to access the 'name' column
CREATE OR REPLACE FUNCTION public.get_classes()
RETURNS TABLE (
  id UUID,
  grade INTEGER,
  section TEXT,
  max_students INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT 
    c.id,
    c.grade,
    c.section,
    c.max_students,
    c.created_at,
    c.updated_at
  FROM 
    public.classes c
  ORDER BY 
    c.grade ASC,
    c.section ASC;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_classes() TO authenticated; 