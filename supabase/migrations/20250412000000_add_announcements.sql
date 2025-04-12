-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access to announcements"
    ON announcements FOR SELECT
    USING (true);

CREATE POLICY "Allow authenticated users to create announcements"
    ON announcements FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow users to update their own announcements"
    ON announcements FOR UPDATE
    TO authenticated
    USING (auth.uid() = created_by);

CREATE POLICY "Allow users to delete their own announcements"
    ON announcements FOR DELETE
    TO authenticated
    USING (auth.uid() = created_by);

-- Create indexes
CREATE INDEX IF NOT EXISTS announcements_created_by_idx ON announcements(created_by);
CREATE INDEX IF NOT EXISTS announcements_class_id_idx ON announcements(class_id);
CREATE INDEX IF NOT EXISTS announcements_created_at_idx ON announcements(created_at DESC); 