-- Create custom_pages table
CREATE TABLE IF NOT EXISTS custom_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    path TEXT NOT NULL UNIQUE,
    content TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE custom_pages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow read access to all users" ON custom_pages;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON custom_pages;
DROP POLICY IF EXISTS "Allow update for creators" ON custom_pages;
DROP POLICY IF EXISTS "Allow delete for creators" ON custom_pages;

-- Create policies
CREATE POLICY "Allow read access to all users" ON custom_pages
    FOR SELECT USING (true);

CREATE POLICY "Allow insert for authenticated users" ON custom_pages
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for creators" ON custom_pages
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Allow delete for creators" ON custom_pages
    FOR DELETE USING (auth.uid() = created_by);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_custom_pages_created_by ON custom_pages(created_by);
CREATE INDEX IF NOT EXISTS idx_custom_pages_class_id ON custom_pages(class_id); 