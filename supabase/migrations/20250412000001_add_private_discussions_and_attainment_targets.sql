/*
  # Add private discussions and attainment targets tables

  1. New Tables
    - `private_discussions`
      - `id` (uuid, primary key)
      - `content` (text)
      - `created_by` (uuid, references profiles)
      - `recipient_id` (uuid, references profiles)
      - `class_id` (uuid, references classes)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `attainment_targets`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `created_by` (uuid, references profiles)
      - `class_id` (uuid, references classes)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for private discussions and attainment targets
    - Drop and recreate custom_pages policies to avoid conflicts
*/

-- Drop existing tables if they exist (to start fresh)
DROP TABLE IF EXISTS private_discussions CASCADE;
DROP TABLE IF EXISTS attainment_targets CASCADE;

-- Create attainment_targets table first
CREATE TABLE attainment_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create private_discussions table
CREATE TABLE private_discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  recipient_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

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

-- Step 4: Drop existing custom_pages policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON custom_pages;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON custom_pages;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON custom_pages;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON custom_pages;

-- Step 5: Recreate custom_pages policies
CREATE POLICY "Enable read access for all users" ON custom_pages
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON custom_pages
  FOR INSERT WITH CHECK (auth.role() IN ('admin', 'ultra_admin'));

CREATE POLICY "Enable update for authenticated users only" ON custom_pages
  FOR UPDATE USING (auth.role() IN ('admin', 'ultra_admin'));

CREATE POLICY "Enable delete for authenticated users only" ON custom_pages
  FOR DELETE USING (auth.role() IN ('admin', 'ultra_admin')); 