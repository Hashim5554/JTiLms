-- Drop existing classes table if it exists
DROP TABLE IF EXISTS classes CASCADE;

-- Recreate classes table with proper structure
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grade INTEGER NOT NULL CHECK (grade BETWEEN 3 AND 8),
  section TEXT NOT NULL CHECK (section IN ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(grade, section)
);

-- Enable RLS
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Classes are viewable by all authenticated users"
  ON classes FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Only ultra admins can modify classes"
  ON classes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'ultra_admin'
    )
  );

-- Insert all possible class combinations
DO $$
DECLARE
  grade INTEGER;
  section TEXT;
BEGIN
  FOR grade IN 3..8 LOOP
    FOR section IN SELECT unnest(ARRAY['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']) LOOP
      INSERT INTO classes (grade, section)
      VALUES (grade, section);
    END LOOP;
  END LOOP;
END $$; 