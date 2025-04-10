/*
  # Create clubs table

  1. New Tables
    - `clubs`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `description` (text)
      - `created_by` (uuid, references profiles.id)
      - `created_at` (timestamp with time zone)
      - `updated_at` (timestamp with time zone)

  2. Security
    - Enable RLS on `clubs` table
    - Add policy for everyone to view clubs
    - Add policy for admins to modify clubs
*/

CREATE TABLE IF NOT EXISTS clubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clubs are viewable by everyone"
  ON clubs
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Only admins can modify clubs"
  ON clubs
  USING (is_admin_or_ultra(auth.uid()))
  WITH CHECK (is_admin_or_ultra(auth.uid()));