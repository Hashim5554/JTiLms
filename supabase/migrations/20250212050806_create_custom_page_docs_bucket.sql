-- Create storage bucket for custom page documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'custom-page-docs',
  'custom-page-docs',
  true,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create policy to allow authenticated users to upload documents
CREATE POLICY "Allow authenticated users to upload custom page documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'custom-page-docs' AND
    auth.role() IN ('admin', 'ultra_admin', 'teacher')
  );

-- Create policy to allow all users to view documents
CREATE POLICY "Allow all users to view custom page documents" ON storage.objects
  FOR SELECT USING (bucket_id = 'custom-page-docs');

-- Create policy to allow admins and teachers to delete documents
CREATE POLICY "Allow admins and teachers to delete custom page documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'custom-page-docs' AND
    auth.role() IN ('admin', 'ultra_admin', 'teacher')
  );

-- Create policy to allow admins and teachers to update documents
CREATE POLICY "Allow admins and teachers to update custom page documents" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'custom-page-docs' AND
    auth.role() IN ('admin', 'ultra_admin', 'teacher')
  ); 