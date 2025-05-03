-- Create tables for custom page components

-- Table for storing component types
CREATE TABLE component_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default component types
INSERT INTO component_types (name, description, icon) VALUES
('heading', 'Heading text with different sizes', 'Type'),
('paragraph', 'Regular paragraph text', 'Text'),
('image', 'Image with optional caption', 'Image'),
('card', 'Card with title, content and optional image', 'Square'),
('grid', 'Grid layout for organizing content', 'LayoutGrid'),
('divider', 'Horizontal divider line', 'SeparatorHorizontal'),
('button', 'Clickable button with link', 'ExternalLink'),
('list', 'Ordered or unordered list', 'List'),
('quote', 'Blockquote with optional attribution', 'Quote'),
('video', 'Embedded video content', 'Video'),
('table', 'Simple table for structured data', 'Table'),
('file', 'Downloadable file attachment', 'FileDown');

-- Table for page components
CREATE TABLE page_components (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL REFERENCES custom_pages(id) ON DELETE CASCADE,
  component_type_id UUID NOT NULL REFERENCES component_types(id),
  position INTEGER NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add config column to custom_pages for layout settings
ALTER TABLE custom_pages ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{"layout": "standard", "theme": "default"}';

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to page_components
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON page_components
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Add permissions
ALTER TABLE component_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_components ENABLE ROW LEVEL SECURITY;

-- Policies for component_types (only admin can modify, all can view)
CREATE POLICY "Anyone can view component types"
  ON component_types FOR SELECT
  USING (true);
  
CREATE POLICY "Only admins can insert component types"
  ON component_types FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');
  
CREATE POLICY "Only admins can update component types"
  ON component_types FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');
  
CREATE POLICY "Only admins can delete component types"
  ON component_types FOR DELETE
  USING (auth.jwt() ->> 'role' = 'admin');

-- Policies for page_components
CREATE POLICY "Anyone can view page components"
  ON page_components FOR SELECT
  USING (true);
  
CREATE POLICY "Only admins can insert page components"
  ON page_components FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');
  
CREATE POLICY "Only admins can update page components"
  ON page_components FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');
  
CREATE POLICY "Only admins can delete page components"
  ON page_components FOR DELETE
  USING (auth.jwt() ->> 'role' = 'admin');

-- Grant access to authenticated users
GRANT SELECT ON component_types TO authenticated;
GRANT SELECT ON page_components TO authenticated;
GRANT INSERT, UPDATE, DELETE ON component_types TO authenticated;
GRANT INSERT, UPDATE, DELETE ON page_components TO authenticated; 