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

-- Create function to setup RLS policies for clubs
CREATE OR REPLACE FUNCTION public.create_clubs_policies()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Clubs are viewable by everyone" ON public.clubs;
  DROP POLICY IF EXISTS "Only admins can modify clubs" ON public.clubs;
  DROP POLICY IF EXISTS "Users can manage their own clubs" ON public.clubs;

  -- Create policies
  -- Allow everyone to view clubs
CREATE POLICY "Clubs are viewable by everyone"
    ON public.clubs
  FOR SELECT
  USING (true);

  -- Allow admins to modify clubs
CREATE POLICY "Only admins can modify clubs"
    ON public.clubs
    FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'ultra_admin')
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'ultra_admin')
      )
    );

  -- Allow users to manage their own clubs
  CREATE POLICY "Users can manage their own clubs"
    ON public.clubs
    FOR ALL
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);
END;
$$;

-- Execute the function to create policies
SELECT public.create_clubs_policies();