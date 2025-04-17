/*
  # Add class system

  1. New Tables
    - `classes`
      - `id` (uuid, primary key)
      - `grade` (integer, 3-8)
      - `section` (text, A-H)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `class_assignments`
      - `id` (uuid, primary key)
      - `class_id` (uuid, references classes)
      - `user_id` (uuid, references profiles)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for class visibility and management
*/

-- Create classes table
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grade INTEGER NOT NULL CHECK (grade BETWEEN 3 AND 8),
  section TEXT NOT NULL CHECK (section IN ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(grade, section)
);

-- Create class assignments table
CREATE TABLE class_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(class_id, user_id)
);

-- Enable RLS
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_assignments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Classes are viewable by assigned users and ultra admins" ON classes;
DROP POLICY IF EXISTS "Only ultra admins can modify classes" ON classes;

-- Create new policies
CREATE POLICY "Classes are viewable by all authenticated users"
  ON classes FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Only ultra admins can modify classes"
  ON classes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'ultra_admin'
    )
  );

-- Policies for class assignments
CREATE POLICY "Class assignments are viewable by assigned users and ultra admins"
  ON class_assignments FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'ultra_admin'
    )
  );

CREATE POLICY "Only ultra admins can modify class assignments"
  ON class_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'ultra_admin'
    )
  );

-- Insert all possible class combinations
DO $$
DECLARE
  grade INTEGER;
  section TEXT;
BEGIN
  FOR grade IN 3..8 LOOP
    FOR section IN SELECT unnest(ARRAY['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']) LOOP
      INSERT INTO classes (grade, section)
      VALUES (grade, section);
    END LOOP;
  END LOOP;
END $$;