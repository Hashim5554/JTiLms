-- Create class_teachers table
CREATE TABLE class_teachers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(class_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE class_teachers ENABLE ROW LEVEL SECURITY;

-- Create policies for class_teachers
CREATE POLICY "Users can view class teachers"
    ON class_teachers FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id FROM class_assignments WHERE class_id = class_teachers.class_id
        ) OR
        auth.uid() IN (
            SELECT id FROM auth.users WHERE role = 'admin' OR role = 'ultra_admin'
        )
    );

CREATE POLICY "Admins can manage class teachers"
    ON class_teachers FOR ALL
    USING (
        auth.uid() IN (
            SELECT id FROM auth.users WHERE role = 'admin' OR role = 'ultra_admin'
        )
    );

-- Create updated_at trigger
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON class_teachers
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime();

-- Grant necessary permissions
GRANT ALL ON class_teachers TO authenticated;
GRANT ALL ON class_teachers TO service_role;

-- Update due_works policies to use class_teachers table
DROP POLICY IF EXISTS "Teachers can create due works" ON due_works;
DROP POLICY IF EXISTS "Teachers can update due works" ON due_works;
DROP POLICY IF EXISTS "Teachers can delete due works" ON due_works;

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