-- Drop existing classes and related data
DROP TABLE IF EXISTS class_assignments CASCADE;
DROP TABLE IF EXISTS classes CASCADE;

-- Create classes table
CREATE TABLE classes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    grade INTEGER NOT NULL CHECK (grade BETWEEN 3 AND 8),
    section CHAR(1) NOT NULL CHECK (section BETWEEN 'A' AND 'H'),
    name VARCHAR(100) NOT NULL,
    max_students INTEGER NOT NULL DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(grade, section)
);

-- Create class_assignments table
CREATE TABLE class_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, class_id)
);

-- Create updated_at trigger
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON classes
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime('updated_at');

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON class_assignments
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime('updated_at');

-- Insert classes for grades 3-8 with sections A-H
DO $$
DECLARE
    grade INTEGER;
    sections CHAR[] := ARRAY['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    section CHAR;
BEGIN
    FOR grade IN 3..8 LOOP
        FOREACH section IN ARRAY sections LOOP
            INSERT INTO classes (grade, section, name, max_students)
            VALUES (grade, section, 'Grade ' || grade || ' - Section ' || section, 30);
        END LOOP;
    END LOOP;
END $$;

-- Grant permissions
GRANT ALL ON classes TO authenticated;
GRANT ALL ON class_assignments TO authenticated; 