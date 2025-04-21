-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.get_announcements_with_profiles CASCADE;
DROP FUNCTION IF EXISTS public.get_discussions_with_profiles CASCADE;
DROP FUNCTION IF EXISTS public.get_due_works_with_profiles CASCADE;

-- Create function to get announcements with profiles
CREATE OR REPLACE FUNCTION public.get_announcements_with_profiles()
RETURNS TABLE (
    id UUID,
    title TEXT,
    content TEXT,
    class_id UUID,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    username TEXT,
    full_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.title,
        a.content,
        a.class_id,
        a.created_by,
        a.created_at,
        a.updated_at,
        p.username,
        p.full_name
    FROM public.announcements a
    LEFT JOIN public.profiles p ON a.created_by = p.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get discussions with profiles
CREATE OR REPLACE FUNCTION public.get_discussions_with_profiles()
RETURNS TABLE (
    id UUID,
    title TEXT,
    content TEXT,
    class_id UUID,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    username TEXT,
    full_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.title,
        d.content,
        d.class_id,
        d.created_by,
        d.created_at,
        d.updated_at,
        p.username,
        p.full_name
    FROM public.discussions d
    LEFT JOIN public.profiles p ON d.created_by = p.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get due works with profiles
CREATE OR REPLACE FUNCTION public.get_due_works_with_profiles()
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
    username TEXT,
    full_name TEXT
) AS $$
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
        s.name AS subject_name,
        p.username,
        p.full_name
    FROM public.due_works dw
    LEFT JOIN public.subjects s ON dw.subject_id = s.id
    LEFT JOIN public.profiles p ON dw.created_by = p.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on the functions
GRANT EXECUTE ON FUNCTION public.get_announcements_with_profiles TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_discussions_with_profiles TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_due_works_with_profiles TO authenticated; 