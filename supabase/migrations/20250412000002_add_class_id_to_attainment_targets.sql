DO $$
BEGIN
    -- Check if attainment_targets table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'attainment_targets') THEN
        -- Add class_id column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'attainment_targets' AND column_name = 'class_id') THEN
            ALTER TABLE attainment_targets
            ADD COLUMN class_id UUID REFERENCES classes(id) ON DELETE CASCADE;
            
            -- Create index for the new column
            CREATE INDEX idx_attainment_targets_class_id ON attainment_targets(class_id);
        END IF;
    END IF;
END $$; 