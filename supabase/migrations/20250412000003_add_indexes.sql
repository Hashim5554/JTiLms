-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_private_discussions_created_by 
ON private_discussions(created_by);

CREATE INDEX IF NOT EXISTS idx_private_discussions_recipient_id 
ON private_discussions(recipient_id);

CREATE INDEX IF NOT EXISTS idx_private_discussions_class_id 
ON private_discussions(class_id);

CREATE INDEX IF NOT EXISTS idx_attainment_targets_created_by 
ON attainment_targets(created_by);

CREATE INDEX IF NOT EXISTS idx_attainment_targets_class_id 
ON attainment_targets(class_id); 