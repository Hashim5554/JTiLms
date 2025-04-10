/*
  # Add class_id to announcements table

  1. Changes
    - Add class_id column to announcements table
    - Add foreign key constraint to classes table
    - Update RLS policies to consider class_id
*/

-- Add class_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'announcements' AND column_name = 'class_id'
  ) THEN
    ALTER TABLE announcements ADD COLUMN class_id UUID REFERENCES classes(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Update or create RLS policies
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Announcements are viewable by everyone" ON announcements;
  DROP POLICY IF EXISTS "Only admins can create announcements" ON announcements;
  
  -- Create new policies that consider class assignments
  CREATE POLICY "Announcements are viewable by everyone"
    ON announcements FOR SELECT
    USING (
      class_id IS NULL OR
      EXISTS (
        SELECT 1 FROM class_assignments ca
        WHERE ca.class_id = announcements.class_id
        AND ca.user_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'ultra_admin')
      )
    );

  CREATE POLICY "Only admins can create announcements"
    ON announcements FOR INSERT
    WITH CHECK (is_admin_or_ultra(auth.uid()));
END $$;