-- Drop existing due works functions to avoid conflicts
DROP FUNCTION IF EXISTS public.get_due_works_with_profiles() CASCADE;
DROP FUNCTION IF EXISTS public.get_due_works_with_info() CASCADE;

-- Create a simplified, reliable function for due works
CREATE OR REPLACE FUNCTION public.get_all_due_works()
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
LANGUAGE SQL
SECURITY DEFINER
AS $$
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
    s.name AS subject_name,
    p.username AS creator_username
  FROM public.due_works dw
  LEFT JOIN public.subjects s ON dw.subject_id = s.id
  LEFT JOIN public.profiles p ON dw.created_by = p.id
  ORDER BY dw.due_date ASC;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_all_due_works() TO authenticated; 