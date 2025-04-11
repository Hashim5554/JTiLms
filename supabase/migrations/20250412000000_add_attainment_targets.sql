/*
  # Add attainment targets table

  1. New Tables
    - `attainment_targets`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `created_by` (uuid, references profiles)
      - `class_id` (uuid, references classes)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `attainment_targets` table
    - Add policies for viewing and creating targets
*/

-- Create attainment targets table
CREATE TABLE IF NOT EXISTS attainment_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE attainment_targets ENABLE ROW LEVEL SECURITY;

-- Create policies
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

-- Add index for created_by column
CREATE INDEX IF NOT EXISTS idx_attainment_targets_created_by 
ON attainment_targets(created_by);

-- Add index for class_id column
CREATE INDEX IF NOT EXISTS idx_attainment_targets_class_id 
ON attainment_targets(class_id); 