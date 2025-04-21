-- Drop existing due_works table if it exists
DROP TABLE IF EXISTS due_works CASCADE;

-- Create due_works table with proper foreign key relationship
CREATE TABLE due_works (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE due_works ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view due works in their class"
  ON due_works FOR SELECT
  USING (
    class_id IN (
      SELECT class_id FROM class_assignments
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create due works in their class"
  ON due_works FOR INSERT
  WITH CHECK (
    class_id IN (
      SELECT class_id FROM class_assignments
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own due works"
  ON due_works FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete their own due works"
  ON due_works FOR DELETE
  USING (created_by = auth.uid());

-- Create updated_at trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON due_works
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime();

-- Create function to get due works with profiles
CREATE OR REPLACE FUNCTION get_due_works_with_profiles()
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  due_date TIMESTAMPTZ,
  subject_id UUID,
  class_id UUID,
  created_by UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  username TEXT,
  role TEXT,
  subject_name TEXT
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
    p.username,
    p.role,
    s.name as subject_name
  FROM due_works dw
  LEFT JOIN profiles p ON dw.created_by = p.id
  LEFT JOIN subjects s ON dw.subject_id = s.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT ON due_works TO authenticated;
GRANT INSERT ON due_works TO authenticated;
GRANT UPDATE ON due_works TO authenticated;
GRANT DELETE ON due_works TO authenticated;
GRANT EXECUTE ON FUNCTION get_due_works_with_profiles TO authenticated; 