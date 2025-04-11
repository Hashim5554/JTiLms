/*
  # Fix discussions relationships

  1. Changes
    - Add foreign key relationship between discussions and profiles
    - Add proper indexes for performance
    - Update RLS policies
*/

-- Add foreign key constraint if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'discussions_created_by_fkey'
  ) THEN
    ALTER TABLE discussions
    ADD CONSTRAINT discussions_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES profiles(id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- Add index for created_by column
CREATE INDEX IF NOT EXISTS idx_discussions_created_by 
ON discussions(created_by);

-- Enable RLS if not already enabled
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;

-- Update or create RLS policies
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Discussions are viewable by everyone" ON discussions;
  DROP POLICY IF EXISTS "Only authenticated users can create discussions" ON discussions;
  
  -- Create new policies
  CREATE POLICY "Discussions are viewable by everyone"
    ON discussions FOR SELECT
    USING (true);

  CREATE POLICY "Only authenticated users can create discussions"
    ON discussions FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);
END $$; 