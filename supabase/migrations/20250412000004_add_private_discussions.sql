-- Drop existing private_discussions table if it exists
DROP TABLE IF EXISTS private_discussions CASCADE;

-- Create private_discussions table with proper foreign key relationships
CREATE TABLE private_discussions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE private_discussions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own private discussions"
  ON private_discussions FOR SELECT
  USING (
    created_by = auth.uid() OR
    recipient_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'ultra_admin', 'teacher')
    )
  );

CREATE POLICY "Users can create private discussions"
  ON private_discussions FOR INSERT
  WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own private discussions"
  ON private_discussions FOR UPDATE
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'ultra_admin', 'teacher')
    )
  )
  WITH CHECK (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'ultra_admin', 'teacher')
    )
  );

CREATE POLICY "Users can delete their own private discussions"
  ON private_discussions FOR DELETE
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'ultra_admin', 'teacher')
    )
  );

-- Create updated_at trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON private_discussions
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime();

-- Create function to get private discussions with profiles
CREATE OR REPLACE FUNCTION get_private_discussions_with_profiles()
RETURNS TABLE (
  id UUID,
  content TEXT,
  created_by UUID,
  recipient_id UUID,
  class_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  sender_username TEXT,
  sender_role TEXT,
  recipient_username TEXT,
  recipient_role TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pd.id,
    pd.content,
    pd.created_by,
    pd.recipient_id,
    pd.class_id,
    pd.created_at,
    pd.updated_at,
    sender.username AS sender_username,
    sender.role AS sender_role,
    recipient.username AS recipient_username,
    recipient.role AS recipient_role
  FROM private_discussions pd
  LEFT JOIN profiles sender ON pd.created_by = sender.id
  LEFT JOIN profiles recipient ON pd.recipient_id = recipient.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT ON private_discussions TO authenticated;
GRANT INSERT ON private_discussions TO authenticated;
GRANT UPDATE ON private_discussions TO authenticated;
GRANT DELETE ON private_discussions TO authenticated;
GRANT EXECUTE ON FUNCTION get_private_discussions_with_profiles TO authenticated; 