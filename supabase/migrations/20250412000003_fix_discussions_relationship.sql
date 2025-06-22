-- Drop existing discussions table if it exists
DROP TABLE IF EXISTS discussions CASCADE;

-- Create discussions table with proper foreign key relationship
CREATE TABLE discussions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view discussions in their class"
  ON discussions FOR SELECT
  USING (
    class_id IN (
      SELECT class_id FROM class_assignments
      WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'ultra_admin', 'teacher')
    )
  );

CREATE POLICY "Users can create discussions in their class"
  ON discussions FOR INSERT
  WITH CHECK (
    class_id IN (
      SELECT class_id FROM class_assignments
      WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'ultra_admin', 'teacher')
    )
  );

CREATE POLICY "Users can update their own discussions"
  ON discussions FOR UPDATE
  USING (
    created_by = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'ultra_admin', 'teacher')
    )
  )
  WITH CHECK (
    created_by = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'ultra_admin', 'teacher')
    )
  );

CREATE POLICY "Users can delete their own discussions"
  ON discussions FOR DELETE
  USING (
    created_by = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'ultra_admin', 'teacher')
    )
  );

-- Create updated_at trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON discussions
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime();

-- Create function to get discussions with profiles
CREATE OR REPLACE FUNCTION get_discussions_with_profiles()
RETURNS TABLE (
  id UUID,
  content TEXT,
  created_by UUID,
  class_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  username TEXT,
  role TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.content,
    d.created_by,
    d.class_id,
    d.created_at,
    d.updated_at,
    p.username,
    p.role
  FROM discussions d
  LEFT JOIN profiles p ON d.created_by = p.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT ON discussions TO authenticated;
GRANT INSERT ON discussions TO authenticated;
GRANT UPDATE ON discussions TO authenticated;
GRANT DELETE ON discussions TO authenticated;
GRANT EXECUTE ON FUNCTION get_discussions_with_profiles TO authenticated; 