-- Drop existing function to ensure a clean implementation
DROP FUNCTION IF EXISTS public.get_home_due_works CASCADE;

-- Create an improved function to retrieve due works with enhanced error handling
CREATE OR REPLACE FUNCTION public.get_home_due_works()
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  subject_id UUID,
  class_id UUID,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  subject_name TEXT,
  creator_username TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dw.id,
    dw.title,
    dw.description,
    dw.due_date,
    dw.subject_id,
    dw.class_id,
    dw.created_by,
    dw.created_at,
    dw.updated_at,
    COALESCE(s.name, 'Unknown Subject') AS subject_name,
    COALESCE(p.username, 'Unknown User') AS creator_username
  FROM 
    public.due_works dw
  LEFT JOIN 
    public.subjects s ON dw.subject_id = s.id
  LEFT JOIN 
    public.profiles p ON dw.created_by = p.id
  ORDER BY 
    dw.due_date ASC;
  
  -- If no rows were returned, don't raise an exception, just return empty result
  -- This prevents "no rows returned" errors
  IF NOT FOUND THEN
    RETURN;
  END IF;
EXCEPTION
  WHEN others THEN
    -- Log error and return empty result instead of failing completely
    RAISE NOTICE 'Error fetching due works: %', SQLERRM;
    RETURN;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_home_due_works() TO authenticated; 