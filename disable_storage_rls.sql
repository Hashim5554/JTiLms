-- Disable RLS on storage bucket for custom page documents
-- This allows uploads to work without RLS policy conflicts

-- Drop existing policies for the custom-page-docs bucket
DROP POLICY IF EXISTS "Allow authenticated users to upload custom page documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow all users to view custom page documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins and teachers to delete custom page documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins and teachers to update custom page documents" ON storage.objects;

-- Disable RLS on the storage.objects table for the custom-page-docs bucket
-- Note: We can't disable RLS on specific buckets, so we'll create a simple policy that allows all operations
CREATE POLICY "Allow all operations for custom page docs" ON storage.objects
  FOR ALL USING (bucket_id = 'custom-page-docs')
  WITH CHECK (bucket_id = 'custom-page-docs');

-- Verify the bucket exists and is public
SELECT * FROM storage.buckets WHERE id = 'custom-page-docs'; 