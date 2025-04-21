-- Drop existing tables if they exist
DROP TABLE IF EXISTS due_works CASCADE;
DROP TABLE IF EXISTS class_teachers CASCADE;
DROP TABLE IF EXISTS class_assignments CASCADE;
DROP TABLE IF EXISTS discussions CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Create profiles table
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL CHECK (role IN ('admin', 'ultra_admin', 'teacher', 'student')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create profiles policies
CREATE POLICY "Users can view all profiles"
    ON profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles"
    ON profiles FOR ALL
    TO authenticated
    USING (
        auth.uid() IN (
            SELECT id FROM auth.users WHERE role = 'admin' OR role = 'ultra_admin'
        )
    );

-- Create classes table
CREATE TABLE classes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    grade INTEGER NOT NULL,
    section TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    semester TEXT NOT NULL,
    max_students INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(grade, section, academic_year, semester)
);

-- Enable RLS for classes
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- Create classes policies
CREATE POLICY "Users can view all classes"
    ON classes FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage classes"
    ON classes FOR ALL
    TO authenticated
    USING (
        auth.uid() IN (
            SELECT id FROM auth.users WHERE role = 'admin' OR role = 'ultra_admin'
        )
    );

-- Create subjects table
CREATE TABLE subjects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for subjects
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

-- Create subjects policies
CREATE POLICY "Users can view all subjects"
    ON subjects FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage subjects"
    ON subjects FOR ALL
    TO authenticated
    USING (
        auth.uid() IN (
            SELECT id FROM auth.users WHERE role = 'admin' OR role = 'ultra_admin'
        )
    );

-- Create class_teachers table
CREATE TABLE class_teachers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(class_id, user_id)
);

-- Enable RLS for class_teachers
ALTER TABLE class_teachers ENABLE ROW LEVEL SECURITY;

-- Create class_teachers policies
CREATE POLICY "Users can view class teachers"
    ON class_teachers FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage class teachers"
    ON class_teachers FOR ALL
    TO authenticated
    USING (
        auth.uid() IN (
            SELECT id FROM auth.users WHERE role = 'admin' OR role = 'ultra_admin'
        )
    );

-- Create class_assignments table
CREATE TABLE class_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(class_id, user_id)
);

-- Enable RLS for class_assignments
ALTER TABLE class_assignments ENABLE ROW LEVEL SECURITY;

-- Create class_assignments policies
CREATE POLICY "Users can view their class assignments"
    ON class_assignments FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage class assignments"
    ON class_assignments FOR ALL
    TO authenticated
    USING (
        auth.uid() IN (
            SELECT id FROM auth.users WHERE role = 'admin' OR role = 'ultra_admin'
        )
    );

-- Create announcements table
CREATE TABLE announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for announcements
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Create announcements policies
CREATE POLICY "Users can view announcements for their classes"
    ON announcements FOR SELECT
    TO authenticated
    USING (
        class_id IN (
            SELECT class_id FROM class_assignments WHERE user_id = auth.uid()
        ) OR
        class_id IN (
            SELECT class_id FROM class_teachers WHERE user_id = auth.uid()
        ) OR
        auth.uid() IN (
            SELECT id FROM auth.users WHERE role = 'admin' OR role = 'ultra_admin'
        )
    );

CREATE POLICY "Teachers can create announcements"
    ON announcements FOR INSERT
    TO authenticated
    WITH CHECK (
        class_id IN (
            SELECT class_id FROM class_teachers WHERE user_id = auth.uid()
        ) OR
        auth.uid() IN (
            SELECT id FROM auth.users WHERE role = 'admin' OR role = 'ultra_admin'
        )
    );

CREATE POLICY "Teachers can update their announcements"
    ON announcements FOR UPDATE
    TO authenticated
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "Teachers can delete their announcements"
    ON announcements FOR DELETE
    TO authenticated
    USING (created_by = auth.uid());

-- Create discussions table
CREATE TABLE discussions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for discussions
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;

-- Create discussions policies
CREATE POLICY "Users can view discussions for their classes"
    ON discussions FOR SELECT
    TO authenticated
    USING (
        class_id IN (
            SELECT class_id FROM class_assignments WHERE user_id = auth.uid()
        ) OR
        class_id IN (
            SELECT class_id FROM class_teachers WHERE user_id = auth.uid()
        ) OR
        auth.uid() IN (
            SELECT id FROM auth.users WHERE role = 'admin' OR role = 'ultra_admin'
        )
    );

CREATE POLICY "Users can create discussions"
    ON discussions FOR INSERT
    TO authenticated
    WITH CHECK (
        class_id IN (
            SELECT class_id FROM class_assignments WHERE user_id = auth.uid()
        ) OR
        class_id IN (
            SELECT class_id FROM class_teachers WHERE user_id = auth.uid()
        ) OR
        auth.uid() IN (
            SELECT id FROM auth.users WHERE role = 'admin' OR role = 'ultra_admin'
        )
    );

CREATE POLICY "Users can update their discussions"
    ON discussions FOR UPDATE
    TO authenticated
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete their discussions"
    ON discussions FOR DELETE
    TO authenticated
    USING (created_by = auth.uid());

-- Create due_works table
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

-- Enable RLS for due_works
ALTER TABLE due_works ENABLE ROW LEVEL SECURITY;

-- Create due_works policies
CREATE POLICY "Users can view due works for their classes"
    ON due_works FOR SELECT
    TO authenticated
    USING (
        class_id IN (
            SELECT class_id FROM class_assignments WHERE user_id = auth.uid()
        ) OR
        class_id IN (
            SELECT class_id FROM class_teachers WHERE user_id = auth.uid()
        ) OR
        auth.uid() IN (
            SELECT id FROM auth.users WHERE role = 'admin' OR role = 'ultra_admin'
        )
    );

CREATE POLICY "Teachers can create due works"
    ON due_works FOR INSERT
    TO authenticated
    WITH CHECK (
        class_id IN (
            SELECT class_id FROM class_teachers WHERE user_id = auth.uid()
        ) OR
        auth.uid() IN (
            SELECT id FROM auth.users WHERE role = 'admin' OR role = 'ultra_admin'
        )
    );

CREATE POLICY "Teachers can update their due works"
    ON due_works FOR UPDATE
    TO authenticated
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "Teachers can delete their due works"
    ON due_works FOR DELETE
    TO authenticated
    USING (created_by = auth.uid());

-- Create functions for getting data with profiles
CREATE OR REPLACE FUNCTION get_announcements_with_profiles()
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
    FROM announcements a
    LEFT JOIN profiles p ON a.created_by = p.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_discussions_with_profiles()
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
    FROM discussions d
    LEFT JOIN profiles p ON d.created_by = p.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
    FROM due_works dw
    LEFT JOIN subjects s ON dw.subject_id = s.id
    LEFT JOIN profiles p ON dw.created_by = p.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON classes TO authenticated;
GRANT ALL ON subjects TO authenticated;
GRANT ALL ON class_teachers TO authenticated;
GRANT ALL ON class_assignments TO authenticated;
GRANT ALL ON announcements TO authenticated;
GRANT ALL ON discussions TO authenticated;
GRANT ALL ON due_works TO authenticated;

GRANT EXECUTE ON FUNCTION get_announcements_with_profiles TO authenticated;
GRANT EXECUTE ON FUNCTION get_discussions_with_profiles TO authenticated;
GRANT EXECUTE ON FUNCTION get_due_works_with_profiles TO authenticated;

-- Create updated_at triggers
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime();

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON classes
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime();

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON subjects
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime();

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON class_teachers
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime();

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON class_assignments
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime();

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON announcements
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime();

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON discussions
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime();

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON due_works
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(); 