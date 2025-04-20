-- Fix due_works table relationships
ALTER TABLE due_works
  DROP CONSTRAINT IF EXISTS due_works_created_by_fkey,
  ADD CONSTRAINT due_works_created_by_fkey
    FOREIGN KEY (created_by)
    REFERENCES profiles(id)
    ON DELETE SET NULL;

-- Fix announcements table relationships
ALTER TABLE announcements
  DROP CONSTRAINT IF EXISTS announcements_created_by_fkey,
  ADD CONSTRAINT announcements_created_by_fkey
    FOREIGN KEY (created_by)
    REFERENCES profiles(id)
    ON DELETE SET NULL;

-- Fix custom_pages policies
DROP POLICY IF EXISTS "Allow read access to all users" ON custom_pages;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON custom_pages;
DROP POLICY IF EXISTS "Allow update for creators" ON custom_pages;
DROP POLICY IF EXISTS "Allow delete for creators" ON custom_pages;

-- Recreate custom_pages policies
CREATE POLICY "Allow read access to all users" ON custom_pages
  FOR SELECT USING (true);

CREATE POLICY "Allow insert for authenticated users" ON custom_pages
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for creators" ON custom_pages
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Allow delete for creators" ON custom_pages
  FOR DELETE USING (auth.uid() = created_by);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_due_works_created_by ON due_works(created_by);
CREATE INDEX IF NOT EXISTS idx_announcements_created_by ON announcements(created_by);
CREATE INDEX IF NOT EXISTS idx_custom_pages_created_by ON custom_pages(created_by); 