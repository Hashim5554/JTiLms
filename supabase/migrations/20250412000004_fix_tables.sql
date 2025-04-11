-- Drop existing tables if they exist
DROP TABLE IF EXISTS private_discussions CASCADE;
DROP TABLE IF EXISTS attainment_targets CASCADE;

-- Create attainment_targets table with correct structure
CREATE TABLE attainment_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create private_discussions table with correct structure
CREATE TABLE private_discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  recipient_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE private_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attainment_targets ENABLE ROW LEVEL SECURITY;

-- Add basic policies
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
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own private discussions"
  ON private_discussions FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own private discussions"
  ON private_discussions FOR DELETE
  USING (created_by = auth.uid());

CREATE POLICY "Attainment targets are viewable by all"
  ON attainment_targets FOR SELECT
  USING (true);

CREATE POLICY "Only admins can create attainment targets"
  ON attainment_targets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'ultra_admin')
    )
  );

CREATE POLICY "Only admins can update attainment targets"
  ON attainment_targets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'ultra_admin')
    )
  );

CREATE POLICY "Only admins can delete attainment targets"
  ON attainment_targets FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'ultra_admin')
    )
  ); 