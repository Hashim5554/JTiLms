-- Drop existing announcements table if it exists
DROP TABLE IF EXISTS announcements CASCADE;

-- Create announcements table with proper relationships
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Announcements are viewable by everyone"
  ON announcements FOR SELECT
  USING (true);

CREATE POLICY "Only admins can create announcements"
  ON announcements FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Only admins can update announcements"
  ON announcements FOR UPDATE
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Only admins can delete announcements"
  ON announcements FOR DELETE
  USING (is_admin(auth.uid()));

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_announcements_created_by ON announcements(created_by); 