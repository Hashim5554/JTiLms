-- Drop existing due_works table if it exists
DROP TABLE IF EXISTS due_works CASCADE;

-- Create due_works table with proper foreign key relationships
CREATE TABLE due_works (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE due_works ENABLE ROW LEVEL SECURITY;

-- Create policies for due_works
CREATE POLICY "Users can view due works for their classes"
    ON due_works FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id FROM class_assignments WHERE class_id = due_works.class_id
        ) OR
        auth.uid() IN (
            SELECT user_id FROM class_teachers WHERE class_id = due_works.class_id
        ) OR
        auth.uid() IN (
            SELECT id FROM auth.users WHERE role = 'admin' OR role = 'ultra_admin'
        )
    );

CREATE POLICY "Teachers can create due works"
    ON due_works FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM class_teachers WHERE class_id = due_works.class_id
        ) OR
        auth.uid() IN (
            SELECT id FROM auth.users WHERE role = 'admin' OR role = 'ultra_admin'
        )
    );

CREATE POLICY "Teachers can update due works"
    ON due_works FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT user_id FROM class_teachers WHERE class_id = due_works.class_id
        ) OR
        auth.uid() IN (
            SELECT id FROM auth.users WHERE role = 'admin' OR role = 'ultra_admin'
        )
    );

CREATE POLICY "Teachers can delete due works"
    ON due_works FOR DELETE
    USING (
        auth.uid() IN (
            SELECT user_id FROM class_teachers WHERE class_id = due_works.class_id
        ) OR
        auth.uid() IN (
            SELECT id FROM auth.users WHERE role = 'admin' OR role = 'ultra_admin'
        )
    );

-- Create updated_at trigger
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON due_works
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime();

-- Create function to get due works with profiles
CREATE OR REPLACE FUNCTION get_due_works_with_profiles()
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
    username TEXT
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
        p.username
    FROM due_works dw
    LEFT JOIN subjects s ON dw.subject_id = s.id
    LEFT JOIN profiles p ON dw.created_by = p.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT ALL ON due_works TO authenticated;
GRANT ALL ON due_works TO service_role;
GRANT EXECUTE ON FUNCTION get_due_works_with_profiles TO authenticated; 