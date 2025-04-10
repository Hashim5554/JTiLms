/*
  # Add announcements relations and fix foreign keys

  1. Changes
    - Add foreign key relationship between announcements and profiles
    - Add proper indexes for performance
    - Update RLS policies
*/

-- Add foreign key constraint if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'announcements_created_by_fkey'
  ) THEN
    ALTER TABLE announcements
    ADD CONSTRAINT announcements_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES profiles(id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- Add index for created_by column
CREATE INDEX IF NOT EXISTS idx_announcements_created_by 
ON announcements(created_by);

-- Enable RLS if not already enabled
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Update or create RLS policies
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Announcements are viewable by everyone" ON announcements;
  DROP POLICY IF EXISTS "Only admins can create announcements" ON announcements;
  
  -- Create new policies
  CREATE POLICY "Announcements are viewable by everyone"
    ON announcements FOR SELECT
    USING (true);

  CREATE POLICY "Only admins can create announcements"
    ON announcements FOR INSERT
    WITH CHECK (is_admin_or_ultra(auth.uid()));
END $$;