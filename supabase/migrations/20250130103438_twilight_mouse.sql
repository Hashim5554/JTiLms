/*
  # Add subject links table

  1. New Tables
    - `subject_links`
      - `id` (uuid, primary key)
      - `subject_id` (uuid, references subjects)
      - `title` (text)
      - `url` (text)
      - `created_by` (uuid, references profiles)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `subject_links` table
    - Add policies for viewing and creating links
*/

-- Create subject links table
CREATE TABLE IF NOT EXISTS subject_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE subject_links ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Subject links are viewable by everyone"
  ON subject_links FOR SELECT
  USING (true);

CREATE POLICY "Only admins can create subject links"
  ON subject_links FOR INSERT
  WITH CHECK (is_admin_or_ultra(auth.uid()));

CREATE POLICY "Only admins can update their own subject links"
  ON subject_links FOR UPDATE
  USING (auth.uid() = created_by AND is_admin_or_ultra(auth.uid()))
  WITH CHECK (is_admin_or_ultra(auth.uid()));

CREATE POLICY "Only admins can delete their own subject links"
  ON subject_links FOR DELETE
  USING (auth.uid() = created_by AND is_admin_or_ultra(auth.uid()));