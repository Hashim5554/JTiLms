-- Corrected fix for all relationship and RLS policy issues
-- This migration properly references profiles(id) instead of auth.users(id)

-- 1. Fix announcements table relationship with profiles
-- Drop existing announcements table if it exists
DROP TABLE IF EXISTS announcements CASCADE;

-- Create announcements table with proper structure
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view announcements" ON announcements;
DROP POLICY IF EXISTS "Admins and teachers can create announcements" ON announcements;
DROP POLICY IF EXISTS "Admins can update any announcement" ON announcements;
DROP POLICY IF EXISTS "Teachers can update their own announcements" ON announcements;
DROP POLICY IF EXISTS "Admins can delete any announcement" ON announcements;
DROP POLICY IF EXISTS "Teachers can delete their own announcements" ON announcements;

-- Create policies for announcements
CREATE POLICY "Anyone can view announcements"
    ON announcements FOR SELECT
    USING (true);

CREATE POLICY "Admins and teachers can create announcements"
    ON announcements FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'ultra_admin', 'teacher')
        )
    );

CREATE POLICY "Admins can update any announcement"
    ON announcements FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'ultra_admin')
        )
    );

CREATE POLICY "Teachers can update their own announcements"
    ON announcements FOR UPDATE
    USING (
        auth.uid() = created_by AND
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'teacher'
        )
    );

CREATE POLICY "Admins can delete any announcement"
    ON announcements FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'ultra_admin')
        )
    );

CREATE POLICY "Teachers can delete their own announcements"
    ON announcements FOR DELETE
    USING (
        auth.uid() = created_by AND
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'teacher'
        )
    );

-- 2. Fix achievers table relationship with profiles
-- Drop existing achievers table if it exists
DROP TABLE IF EXISTS achievers CASCADE;

-- Create achievers table with proper structure
CREATE TABLE achievers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    achievement TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    certificate_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE achievers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view achievers" ON achievers;
DROP POLICY IF EXISTS "Admins and teachers can create achievers" ON achievers;
DROP POLICY IF EXISTS "Admins and teachers can update achievers" ON achievers;
DROP POLICY IF EXISTS "Admins and teachers can delete achievers" ON achievers;

-- Create policies for achievers
CREATE POLICY "Anyone can view achievers"
    ON achievers FOR SELECT
    USING (true);

CREATE POLICY "Admins and teachers can create achievers"
    ON achievers FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'ultra_admin', 'teacher')
        )
    );

CREATE POLICY "Admins and teachers can update achievers"
    ON achievers FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'ultra_admin', 'teacher')
        )
    );

CREATE POLICY "Admins and teachers can delete achievers"
    ON achievers FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'ultra_admin', 'teacher')
        )
    );

-- 3. Fix class_assignments table relationship with profiles
-- Drop existing class_assignments table if it exists
DROP TABLE IF EXISTS class_assignments CASCADE;

-- Create class_assignments table with proper structure
CREATE TABLE class_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(class_id, user_id)
);

-- Enable RLS
ALTER TABLE class_assignments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view class assignments" ON class_assignments;
DROP POLICY IF EXISTS "Admins can manage class assignments" ON class_assignments;

-- Create policies for class_assignments
CREATE POLICY "Anyone can view class assignments"
    ON class_assignments FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage class assignments"
    ON class_assignments FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'ultra_admin')
        )
    );

-- 4. Fix clubs table - add missing capacity column
-- Add capacity column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clubs' AND column_name = 'capacity'
    ) THEN
        ALTER TABLE clubs ADD COLUMN capacity INTEGER DEFAULT 30;
    END IF;
END $$;

-- Ensure clubs table has all required columns
DO $$
BEGIN
    -- Add missing columns if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clubs' AND column_name = 'day'
    ) THEN
        ALTER TABLE clubs ADD COLUMN day TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clubs' AND column_name = 'time'
    ) THEN
        ALTER TABLE clubs ADD COLUMN time TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clubs' AND column_name = 'location'
    ) THEN
        ALTER TABLE clubs ADD COLUMN location TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clubs' AND column_name = 'teacher'
    ) THEN
        ALTER TABLE clubs ADD COLUMN teacher TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clubs' AND column_name = 'created_by'
    ) THEN
        ALTER TABLE clubs ADD COLUMN created_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Enable RLS on clubs if not already enabled
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Clubs are viewable by everyone" ON clubs;
DROP POLICY IF EXISTS "Only admins can modify clubs" ON clubs;
DROP POLICY IF EXISTS "Users can manage their own clubs" ON clubs;
DROP POLICY IF EXISTS "Enable read access for all users" ON clubs;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON clubs;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON clubs;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON clubs;
DROP POLICY IF EXISTS "Anyone can view clubs" ON clubs;
DROP POLICY IF EXISTS "Admins and teachers can create clubs" ON clubs;
DROP POLICY IF EXISTS "Admins and teachers can update clubs" ON clubs;
DROP POLICY IF EXISTS "Admins and teachers can delete clubs" ON clubs;

-- Create new policies for clubs
CREATE POLICY "Anyone can view clubs"
    ON clubs FOR SELECT
    USING (true);

CREATE POLICY "Admins and teachers can create clubs"
    ON clubs FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'ultra_admin', 'teacher')
        )
    );

CREATE POLICY "Admins and teachers can update clubs"
    ON clubs FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'ultra_admin', 'teacher')
        )
    );

CREATE POLICY "Admins and teachers can delete clubs"
    ON clubs FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'ultra_admin', 'teacher')
        )
    );

-- 5. Fix attendance table relationship with profiles
-- Drop existing attendance table if it exists
DROP TABLE IF EXISTS attendance CASCADE;

-- Create attendance table with proper structure
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late')),
    type TEXT NOT NULL DEFAULT 'school' CHECK (type IN ('school', 'club')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(student_id, class_id, date, type)
);

-- Enable RLS
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view attendance" ON attendance;
DROP POLICY IF EXISTS "Admins and teachers can manage attendance" ON attendance;

-- Create policies for attendance
CREATE POLICY "Anyone can view attendance"
    ON attendance FOR SELECT
    USING (true);

CREATE POLICY "Admins and teachers can manage attendance"
    ON attendance FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'ultra_admin', 'teacher')
        )
    );

-- 6. Fix subject_materials table RLS policies
-- Enable RLS if not already enabled
ALTER TABLE subject_materials ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Subject materials are viewable by authenticated users" ON subject_materials;
DROP POLICY IF EXISTS "Subject materials are insertable by teachers and admins" ON subject_materials;
DROP POLICY IF EXISTS "Subject materials are updatable by teachers and admins" ON subject_materials;
DROP POLICY IF EXISTS "Subject materials are deletable by teachers and admins" ON subject_materials;
DROP POLICY IF EXISTS "Anyone can view subject materials" ON subject_materials;
DROP POLICY IF EXISTS "Admins and teachers can create subject materials" ON subject_materials;
DROP POLICY IF EXISTS "Admins and teachers can update subject materials" ON subject_materials;
DROP POLICY IF EXISTS "Admins and teachers can delete subject materials" ON subject_materials;

-- Create new policies for subject_materials
CREATE POLICY "Anyone can view subject materials"
    ON subject_materials FOR SELECT
    USING (true);

CREATE POLICY "Admins and teachers can create subject materials"
    ON subject_materials FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'ultra_admin', 'teacher')
        )
    );

CREATE POLICY "Admins and teachers can update subject materials"
    ON subject_materials FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'ultra_admin', 'teacher')
        )
    );

CREATE POLICY "Admins and teachers can delete subject materials"
    ON subject_materials FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'ultra_admin', 'teacher')
        )
    );

-- 7. Fix folders table RLS policies
-- Enable RLS if not already enabled
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Folders are viewable by authenticated users" ON folders;
DROP POLICY IF EXISTS "Folders are insertable by teachers and admins" ON folders;
DROP POLICY IF EXISTS "Folders are updatable by teachers and admins" ON folders;
DROP POLICY IF EXISTS "Folders are deletable by teachers and admins" ON folders;
DROP POLICY IF EXISTS "Anyone can view folders" ON folders;
DROP POLICY IF EXISTS "Admins and teachers can create folders" ON folders;
DROP POLICY IF EXISTS "Admins and teachers can update folders" ON folders;
DROP POLICY IF EXISTS "Admins and teachers can delete folders" ON folders;

-- Create new policies for folders
CREATE POLICY "Anyone can view folders"
    ON folders FOR SELECT
    USING (true);

CREATE POLICY "Admins and teachers can create folders"
    ON folders FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'ultra_admin', 'teacher')
        )
    );

CREATE POLICY "Admins and teachers can update folders"
    ON folders FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'ultra_admin', 'teacher')
        )
    );

CREATE POLICY "Admins and teachers can delete folders"
    ON folders FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'ultra_admin', 'teacher')
        )
    );

-- 8. Fix custom_pages table RLS policies
-- Enable RLS if not already enabled
ALTER TABLE custom_pages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow read access to all users" ON custom_pages;
DROP POLICY IF EXISTS "Allow all operations for ultra_admin" ON custom_pages;
DROP POLICY IF EXISTS "Allow all operations for admin" ON custom_pages;
DROP POLICY IF EXISTS "Allow users to manage their own pages" ON custom_pages;
DROP POLICY IF EXISTS "Enable read access for all users" ON custom_pages;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON custom_pages;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON custom_pages;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON custom_pages;
DROP POLICY IF EXISTS "Anyone can view custom pages" ON custom_pages;
DROP POLICY IF EXISTS "Admins can create custom pages" ON custom_pages;
DROP POLICY IF EXISTS "Admins can update custom pages" ON custom_pages;
DROP POLICY IF EXISTS "Admins can delete custom pages" ON custom_pages;

-- Create new policies for custom_pages
CREATE POLICY "Anyone can view custom pages"
    ON custom_pages FOR SELECT
    USING (true);

CREATE POLICY "Admins can create custom pages"
    ON custom_pages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'ultra_admin')
        )
    );

CREATE POLICY "Admins can update custom pages"
    ON custom_pages FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'ultra_admin')
        )
    );

CREATE POLICY "Admins can delete custom pages"
    ON custom_pages FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'ultra_admin')
        )
    );

-- 9. Create helper functions for role checking
CREATE OR REPLACE FUNCTION is_admin_or_ultra(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = user_id AND role IN ('admin', 'ultra_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_teacher_or_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = user_id AND role IN ('admin', 'ultra_admin', 'teacher')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_announcements_created_by ON announcements(created_by);
CREATE INDEX IF NOT EXISTS idx_announcements_class_id ON announcements(class_id);
CREATE INDEX IF NOT EXISTS idx_achievers_student_id ON achievers(student_id);
CREATE INDEX IF NOT EXISTS idx_class_assignments_user_id ON class_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_class_assignments_class_id ON class_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_class_id ON attendance(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_subject_materials_subject_id ON subject_materials(subject_id);
CREATE INDEX IF NOT EXISTS idx_subject_materials_created_by ON subject_materials(created_by);
CREATE INDEX IF NOT EXISTS idx_folders_subject_id ON folders(subject_id);
CREATE INDEX IF NOT EXISTS idx_folders_created_by ON folders(created_by);

-- 11. Grant necessary permissions
GRANT ALL ON announcements TO authenticated;
GRANT ALL ON achievers TO authenticated;
GRANT ALL ON class_assignments TO authenticated;
GRANT ALL ON attendance TO authenticated;
GRANT ALL ON subject_materials TO authenticated;
GRANT ALL ON folders TO authenticated;
GRANT ALL ON custom_pages TO authenticated;
GRANT ALL ON clubs TO authenticated;

-- 12. Create updated_at triggers
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables
DROP TRIGGER IF EXISTS set_announcements_updated_at ON announcements;
CREATE TRIGGER set_announcements_updated_at
    BEFORE UPDATE ON announcements
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS set_achievers_updated_at ON achievers;
CREATE TRIGGER set_achievers_updated_at
    BEFORE UPDATE ON achievers
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS set_class_assignments_updated_at ON class_assignments;
CREATE TRIGGER set_class_assignments_updated_at
    BEFORE UPDATE ON class_assignments
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS set_attendance_updated_at ON attendance;
CREATE TRIGGER set_attendance_updated_at
    BEFORE UPDATE ON attendance
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS set_subject_materials_updated_at ON subject_materials;
CREATE TRIGGER set_subject_materials_updated_at
    BEFORE UPDATE ON subject_materials
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS set_folders_updated_at ON folders;
CREATE TRIGGER set_folders_updated_at
    BEFORE UPDATE ON folders
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- 13. Refresh schema cache
SELECT pg_notify('schema_refresh', 'refresh'); 