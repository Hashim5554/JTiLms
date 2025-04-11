-- Drop existing attainment_targets table if it exists
DROP TABLE IF EXISTS attainment_targets;

-- Recreate attainment_targets table with proper foreign key relationship
CREATE TABLE attainment_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create a foreign key constraint with a specific name
ALTER TABLE attainment_targets
ADD CONSTRAINT attainment_targets_created_by_fkey
FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- Enable Row Level Security
ALTER TABLE attainment_targets ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow read access to all users" ON attainment_targets
    FOR SELECT USING (true);

CREATE POLICY "Allow insert for authenticated users" ON attainment_targets
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for creators" ON attainment_targets
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Allow delete for creators" ON attainment_targets
    FOR DELETE USING (auth.uid() = created_by);

-- Create index for better performance
CREATE INDEX idx_attainment_targets_created_by ON attainment_targets(created_by);
CREATE INDEX idx_attainment_targets_class_id ON attainment_targets(class_id); 