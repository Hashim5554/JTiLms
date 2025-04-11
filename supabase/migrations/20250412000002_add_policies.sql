-- Drop existing custom_pages policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON custom_pages;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON custom_pages;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON custom_pages;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON custom_pages;

-- Recreate custom_pages policies
CREATE POLICY "Enable read access for all users" ON custom_pages
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON custom_pages
  FOR INSERT WITH CHECK (auth.role() IN ('admin', 'ultra_admin'));

CREATE POLICY "Enable update for authenticated users only" ON custom_pages
  FOR UPDATE USING (auth.role() IN ('admin', 'ultra_admin'));

CREATE POLICY "Enable delete for authenticated users only" ON custom_pages
  FOR DELETE USING (auth.role() IN ('admin', 'ultra_admin'));

-- Private Discussions Policies
CREATE POLICY "Private discussions are viewable by participants"
  ON private_discussions FOR SELECT
  USING (
    created_by = auth.uid() OR
    recipient_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'ultra_admin')
    )
  );

CREATE POLICY "Users can create private discussions"
  ON private_discussions FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own private discussions"
  ON private_discussions FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own private discussions"
  ON private_discussions FOR DELETE
  USING (created_by = auth.uid());

-- Attainment Targets Policies
CREATE POLICY "Attainment targets are viewable by all"
  ON attainment_targets FOR SELECT
  USING (true);

CREATE POLICY "Only admins can create attainment targets"
  ON attainment_targets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'ultra_admin')
    )
  );

CREATE POLICY "Only admins can update attainment targets"
  ON attainment_targets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'ultra_admin')
    )
  );

CREATE POLICY "Only admins can delete attainment targets"
  ON attainment_targets FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'ultra_admin')
    )
  ); 