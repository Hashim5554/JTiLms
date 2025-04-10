/*
  # Add image_url to subjects table

  1. Changes
    - Add `image_url` column to the `subjects` table to store subject images
*/

-- Add image_url column to subjects table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subjects' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE subjects ADD COLUMN image_url TEXT;
  END IF;
END $$;