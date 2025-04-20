-- Drop existing class_assignments table if it exists
DROP TABLE IF EXISTS class_assignments CASCADE;

-- Create class_assignments table with proper relationships
CREATE TABLE class_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(class_id, user_id)
);

-- Enable RLS
ALTER TABLE class_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Class assignments are viewable by everyone"
  ON class_assignments FOR SELECT
  USING (true);

CREATE POLICY "Only admins can modify class assignments"
  ON class_assignments FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_class_assignments_class_id ON class_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_class_assignments_user_id ON class_assignments(user_id); 