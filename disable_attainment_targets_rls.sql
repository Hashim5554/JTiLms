-- Disable RLS on attainment_targets table
-- This fixes the upload and delete issues for attainment targets

-- Drop existing policies for attainment_targets if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON attainment_targets;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON attainment_targets;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON attainment_targets;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON attainment_targets;
DROP POLICY IF EXISTS "Enable read access for all users" ON attainment_targets;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON attainment_targets;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON attainment_targets;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON attainment_targets;

-- Disable RLS on the attainment_targets table
ALTER TABLE attainment_targets DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'attainment_targets';

-- Also check if the storage bucket exists and create it if needed
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'attainment-targets',
  'attainment-targets',
  true,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create a simple policy for the storage bucket to allow all operations
DROP POLICY IF EXISTS "Allow all operations for attainment targets" ON storage.objects;
CREATE POLICY "Allow all operations for attainment targets" ON storage.objects
  FOR ALL USING (bucket_id = 'attainment-targets')
  WITH CHECK (bucket_id = 'attainment-targets');

-- Verify the bucket exists
SELECT * FROM storage.buckets WHERE id = 'attainment-targets'; 