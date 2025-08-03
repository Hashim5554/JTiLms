-- Add class-specific support to subjects system
-- This migration makes subjects class-specific so each class has its own folders and materials

-- First, add class_id to subjects table
ALTER TABLE subjects 
ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_subjects_class_id ON subjects(class_id);

-- Add unique constraint for name and class_id combination
-- First drop the existing unique constraint on name if it exists
ALTER TABLE subjects DROP CONSTRAINT IF EXISTS subjects_name_key;

-- Add new unique constraint for name and class_id combination
ALTER TABLE subjects ADD CONSTRAINT subjects_name_class_id_key UNIQUE (name, class_id);

-- Update subjects policies to be class-aware
DROP POLICY IF EXISTS "Users can view all subjects" ON subjects;
CREATE POLICY "Users can view subjects for their classes"
    ON subjects FOR SELECT
    TO authenticated
    USING (
        -- Admins and teachers can see all subjects
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'ultra_admin', 'teacher')
        )
        OR
        -- Students can only see subjects for their assigned classes
        EXISTS (
            SELECT 1 FROM class_assignments ca
            WHERE ca.user_id = auth.uid() AND ca.class_id = subjects.class_id
        )
    );

-- Update folders to be class-specific
ALTER TABLE folders 
ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id) ON DELETE CASCADE;

-- Create index for folders class_id
CREATE INDEX IF NOT EXISTS idx_folders_class_id ON folders(class_id);

-- Update folders policies to be class-aware
DROP POLICY IF EXISTS "Folders are viewable by authenticated users" ON folders;
CREATE POLICY "Users can view folders for their classes"
    ON folders FOR SELECT
    TO authenticated
    USING (
        -- Admins and teachers can see all folders
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'ultra_admin', 'teacher')
        )
        OR
        -- Students can only see folders for their assigned classes
        EXISTS (
            SELECT 1 FROM class_assignments ca
            WHERE ca.user_id = auth.uid() AND ca.class_id = folders.class_id
        )
    );

-- Update subject_materials to be class-specific
ALTER TABLE subject_materials 
ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id) ON DELETE CASCADE;

-- Create index for subject_materials class_id
CREATE INDEX IF NOT EXISTS idx_subject_materials_class_id ON subject_materials(class_id);

-- Update subject_materials policies to be class-aware
DROP POLICY IF EXISTS "Subject materials are viewable by authenticated users" ON subject_materials;
CREATE POLICY "Users can view materials for their classes"
    ON subject_materials FOR SELECT
    TO authenticated
    USING (
        -- Admins and teachers can see all materials
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'ultra_admin', 'teacher')
        )
        OR
        -- Students can only see materials for their assigned classes
        EXISTS (
            SELECT 1 FROM class_assignments ca
            WHERE ca.user_id = auth.uid() AND ca.class_id = subject_materials.class_id
        )
    );

-- Create function to get subjects for a specific class
CREATE OR REPLACE FUNCTION get_subjects_for_class(class_uuid UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    class_id UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT s.id, s.name, s.description, s.class_id, s.created_at, s.updated_at
    FROM subjects s
    WHERE s.class_id = class_uuid
    ORDER BY s.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get folders for a specific class and subject
CREATE OR REPLACE FUNCTION get_folders_for_class_subject(class_uuid UUID, subject_uuid UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    subject_id UUID,
    class_id UUID,
    parent_folder_id UUID,
    created_by UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT f.id, f.name, f.description, f.subject_id, f.class_id, f.parent_folder_id, f.created_by, f.created_at, f.updated_at
    FROM folders f
    WHERE f.class_id = class_uuid AND f.subject_id = subject_uuid
    ORDER BY f.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get materials for a specific class and subject
CREATE OR REPLACE FUNCTION get_materials_for_class_subject(class_uuid UUID, subject_uuid UUID)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    file_url TEXT,
    due_date TIMESTAMPTZ,
    subject_id UUID,
    class_id UUID,
    folder_id UUID,
    created_by UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT sm.id, sm.title, sm.description, sm.file_url, sm.due_date, sm.subject_id, sm.class_id, sm.folder_id, sm.created_by, sm.created_at, sm.updated_at
    FROM subject_materials sm
    WHERE sm.class_id = class_uuid AND sm.subject_id = subject_uuid
    ORDER BY sm.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create default subjects for each class if they don't exist
DO $$
DECLARE
    class_record RECORD;
    subject_names TEXT[] := ARRAY['Mathematics', 'Science', 'English', 'History', 'Geography', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Literature'];
    subject_name TEXT;
BEGIN
    FOR class_record IN SELECT id, grade, section FROM classes LOOP
        FOREACH subject_name IN ARRAY subject_names LOOP
            INSERT INTO subjects (name, description, class_id)
            VALUES (subject_name, subject_name || ' for Grade ' || class_record.grade || '-' || class_record.section, class_record.id)
            ON CONFLICT (name, class_id) DO NOTHING;
        END LOOP;
    END LOOP;
END $$; 