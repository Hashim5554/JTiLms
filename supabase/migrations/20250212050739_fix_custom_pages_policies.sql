-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow read access to all users" ON custom_pages;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON custom_pages;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON custom_pages;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON custom_pages;

-- Create new policies
CREATE POLICY "Allow read access to all users" ON custom_pages
  FOR SELECT USING (true);

CREATE POLICY "Allow insert for authenticated users" ON custom_pages
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for authenticated users" ON custom_pages
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow delete for authenticated users" ON custom_pages
  FOR DELETE USING (auth.role() = 'authenticated'); 