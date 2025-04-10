/*
  # Fix due_works relationships

  1. Changes
    - Add foreign key relationship between due_works and profiles
    - Add proper indexes for performance
    - Update RLS policies
*/

-- Add foreign key constraint if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'due_works_created_by_fkey'
  ) THEN
    ALTER TABLE due_works
    ADD CONSTRAINT due_works_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES profiles(id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- Add index for created_by column
CREATE INDEX IF NOT EXISTS idx_due_works_created_by 
ON due_works(created_by);

-- Enable RLS if not already enabled
ALTER TABLE due_works ENABLE ROW LEVEL SECURITY;

-- Update or create RLS policies
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Due works are viewable by everyone" ON due_works;
  DROP POLICY IF EXISTS "Only admins can create due works" ON due_works;
  
  -- Create new policies
  CREATE POLICY "Due works are viewable by everyone"
    ON due_works FOR SELECT
    USING (true);

  CREATE POLICY "Only admins can create due works"
    ON due_works FOR INSERT
    WITH CHECK (is_admin_or_ultra(auth.uid()));
END $$; 