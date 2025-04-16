-- Add name column to classes table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'classes'
        AND column_name = 'name'
    ) THEN
        ALTER TABLE classes ADD COLUMN name TEXT;
    END IF;
END $$; 