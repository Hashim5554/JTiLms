-- Drop existing policies if they exist
DROP POLICY IF EXISTS "custom_pages_read_policy" ON custom_pages;
DROP POLICY IF EXISTS "custom_pages_insert_policy" ON custom_pages;
DROP POLICY IF EXISTS "custom_pages_update_policy" ON custom_pages;
DROP POLICY IF EXISTS "custom_pages_delete_policy" ON custom_pages;

-- Create new policies with unique names
CREATE POLICY "custom_pages_read_policy" ON custom_pages
  FOR SELECT USING (true);

CREATE POLICY "custom_pages_insert_policy" ON custom_pages
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "custom_pages_update_policy" ON custom_pages
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "custom_pages_delete_policy" ON custom_pages
  FOR DELETE USING (auth.role() = 'authenticated'); 