-- Create custom_pages table if it doesn't exist
CREATE TABLE IF NOT EXISTS custom_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  path TEXT NOT NULL UNIQUE,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  config JSONB DEFAULT '{"layout": "standard", "theme": "default"}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to custom_pages table
DROP TRIGGER IF EXISTS set_timestamp_custom_pages ON custom_pages;
CREATE TRIGGER set_timestamp_custom_pages
BEFORE UPDATE ON custom_pages
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Enable RLS
ALTER TABLE custom_pages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view custom pages"
  ON custom_pages FOR SELECT
  USING (true);

CREATE POLICY "Only admins can insert custom pages"
  ON custom_pages FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'role' = 'admin' OR
    auth.jwt() ->> 'role' = 'ultra_admin'
  );

CREATE POLICY "Only admins can update custom pages"
  ON custom_pages FOR UPDATE
  USING (
    auth.jwt() ->> 'role' = 'admin' OR
    auth.jwt() ->> 'role' = 'ultra_admin'
  );

CREATE POLICY "Only admins can delete custom pages"
  ON custom_pages FOR DELETE
  USING (
    auth.jwt() ->> 'role' = 'admin' OR
    auth.jwt() ->> 'role' = 'ultra_admin'
  );

-- Grant permissions
GRANT ALL ON custom_pages TO authenticated; 