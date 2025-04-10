/*
  # Add custom pages system

  1. New Tables
    - `custom_pages`
      - `id` (uuid, primary key)
      - `title` (text)
      - `path` (text)
      - `content` (text)
      - `class_id` (uuid, references classes)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
*/

-- Create custom pages table
CREATE TABLE custom_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  path TEXT NOT NULL UNIQUE,
  content TEXT,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE custom_pages ENABLE ROW LEVEL SECURITY;

-- Policies for custom pages
CREATE POLICY "Custom pages are viewable by assigned users and ultra admins"
  ON custom_pages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM class_assignments ca
      WHERE ca.class_id = custom_pages.class_id
      AND ca.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'ultra_admin'
    )
  );

CREATE POLICY "Only ultra admins can modify custom pages"
  ON custom_pages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'ultra_admin'
    )
  );