-- Enable Row Level Security
ALTER TABLE private_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attainment_targets ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX idx_private_discussions_created_by ON private_discussions(created_by);
CREATE INDEX idx_private_discussions_recipient_id ON private_discussions(recipient_id);
CREATE INDEX idx_private_discussions_class_id ON private_discussions(class_id);
CREATE INDEX idx_attainment_targets_created_by ON attainment_targets(created_by);
CREATE INDEX idx_attainment_targets_class_id ON attainment_targets(class_id);

-- Private Discussions Policies
CREATE POLICY "Private discussions are viewable by participants"
  ON private_discussions FOR SELECT
  USING (
    created_by = auth.uid() OR
    recipient_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'ultra_admin')
    )
  );

CREATE POLICY "Users can create private discussions"
  ON private_discussions FOR INSERT
  WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM class_assignments
      WHERE class_id = private_discussions.class_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own private discussions"
  ON private_discussions FOR UPDATE
  USING (
    created_by = auth.uid() AND
    updated_at = now()
  );

CREATE POLICY "Users can delete their own private discussions"
  ON private_discussions FOR DELETE
  USING (created_by = auth.uid());

-- Attainment Targets Policies
CREATE POLICY "Attainment targets are viewable by assigned users and admins"
  ON attainment_targets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM class_assignments ca
      WHERE ca.class_id = attainment_targets.class_id
      AND ca.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'ultra_admin')
    )
  );

CREATE POLICY "Only admins can create attainment targets"
  ON attainment_targets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'ultra_admin')
    )
  );

CREATE POLICY "Only admins can update their own attainment targets"
  ON attainment_targets FOR UPDATE
  USING (
    auth.uid() = created_by 
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'ultra_admin')
    )
  );

CREATE POLICY "Only admins can delete their own attainment targets"
  ON attainment_targets FOR DELETE
  USING (
    auth.uid() = created_by 
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'ultra_admin')
    )
  ); 