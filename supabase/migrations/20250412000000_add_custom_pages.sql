-- Create custom_pages table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'custom_pages') THEN
        CREATE TABLE custom_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    path TEXT NOT NULL UNIQUE,
    content TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
    END IF;

    -- Add created_by column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'custom_pages' 
        AND column_name = 'created_by'
    ) THEN
        ALTER TABLE custom_pages 
        ADD COLUMN created_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE custom_pages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'custom_pages' AND policyname = 'custom_pages_read_policy') THEN
        DROP POLICY "custom_pages_read_policy" ON custom_pages;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'custom_pages' AND policyname = 'custom_pages_insert_policy') THEN
        DROP POLICY "custom_pages_insert_policy" ON custom_pages;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'custom_pages' AND policyname = 'custom_pages_update_policy') THEN
        DROP POLICY "custom_pages_update_policy" ON custom_pages;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'custom_pages' AND policyname = 'custom_pages_delete_policy') THEN
        DROP POLICY "custom_pages_delete_policy" ON custom_pages;
    END IF;
END $$;

-- Create policies with unique names
CREATE POLICY "custom_pages_read_policy" ON custom_pages
    FOR SELECT USING (true);

CREATE POLICY "custom_pages_insert_policy" ON custom_pages
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND
        created_by = auth.uid()
    );

CREATE POLICY "custom_pages_update_policy" ON custom_pages
    FOR UPDATE USING (
        auth.uid() = created_by OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'ultra_admin')
        )
    );

CREATE POLICY "custom_pages_delete_policy" ON custom_pages
    FOR DELETE USING (
        auth.uid() = created_by OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'ultra_admin')
        )
    );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_custom_pages_created_by ON custom_pages(created_by);
CREATE INDEX IF NOT EXISTS idx_custom_pages_class_id ON custom_pages(class_id); 