/*
  # Add notifications system and fix missing tables/relationships

  1. New Tables
    - `notifications`
    - `discussions` (if not exists)
    - `answer_keys` (if not exists)

  2. Add RLS policies with proper checks
*/

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('announcement', 'subject', 'library', 'record', 'club')),
  reference_id UUID NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create discussions table if it doesn't exist
CREATE TABLE IF NOT EXISTS discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create answer_keys table if it doesn't exist
CREATE TABLE IF NOT EXISTS answer_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answer_keys ENABLE ROW LEVEL SECURITY;

-- Notifications policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notifications' 
    AND policyname = 'Users can view their own notifications'
  ) THEN
    CREATE POLICY "Users can view their own notifications"
      ON notifications FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notifications' 
    AND policyname = 'Users can update their own notifications'
  ) THEN
    CREATE POLICY "Users can update their own notifications"
      ON notifications FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Discussions policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'discussions' 
    AND policyname = 'Discussions are viewable by everyone'
  ) THEN
    CREATE POLICY "Discussions are viewable by everyone"
      ON discussions FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'discussions' 
    AND policyname = 'All authenticated users can create discussions'
  ) THEN
    CREATE POLICY "All authenticated users can create discussions"
      ON discussions FOR INSERT
      WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- Answer keys policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'answer_keys' 
    AND policyname = 'Answer keys are viewable by assigned users'
  ) THEN
    CREATE POLICY "Answer keys are viewable by assigned users"
      ON answer_keys FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM class_assignments ca
          WHERE ca.class_id = answer_keys.class_id
          AND ca.user_id = auth.uid()
        )
        OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid()
          AND role IN ('admin', 'ultra_admin')
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'answer_keys' 
    AND policyname = 'Only admins can create answer keys'
  ) THEN
    CREATE POLICY "Only admins can create answer keys"
      ON answer_keys FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid()
          AND role IN ('admin', 'ultra_admin')
        )
      );
  END IF;
END $$;