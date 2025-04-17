-- Ensure classes table exists with correct structure
DO $$
BEGIN
  -- Create table if it doesn't exist
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'classes') THEN
    CREATE TABLE classes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      grade INTEGER NOT NULL CHECK (grade BETWEEN 3 AND 8),
      section TEXT NOT NULL CHECK (section IN ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H')),
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE(grade, section)
    );
  END IF;

  -- Add missing columns if they don't exist
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'classes' AND column_name = 'created_at') THEN
    ALTER TABLE classes ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
  END IF;

  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'classes' AND column_name = 'updated_at') THEN
    ALTER TABLE classes ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Classes are viewable by all authenticated users" ON classes;
DROP POLICY IF EXISTS "Only ultra admins can modify classes" ON classes;

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

-- Insert missing class combinations
DO $$
DECLARE
  g INTEGER;
  s TEXT;
  existing_class RECORD;
BEGIN
  FOR g IN 3..8 LOOP
    FOR s IN SELECT unnest(ARRAY['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']) LOOP
      -- Check if class already exists
      SELECT INTO existing_class * FROM classes WHERE classes.grade = g AND classes.section = s;
      IF NOT FOUND THEN
        INSERT INTO classes (grade, section)
        VALUES (g, s);
      END IF;
    END LOOP;
  END LOOP;
END $$; 