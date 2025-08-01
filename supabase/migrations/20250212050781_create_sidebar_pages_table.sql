-- Create sidebar_pages table to track which custom pages are in the sidebar for each class
CREATE TABLE IF NOT EXISTS sidebar_pages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    page_id UUID NOT NULL REFERENCES custom_pages(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(page_id, class_id)
);

-- Disable RLS since access will be controlled through frontend UI
ALTER TABLE sidebar_pages DISABLE ROW LEVEL SECURITY;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_sidebar_pages_class_id ON sidebar_pages(class_id);
CREATE INDEX IF NOT EXISTS idx_sidebar_pages_page_id ON sidebar_pages(page_id);
CREATE INDEX IF NOT EXISTS idx_sidebar_pages_order ON sidebar_pages(class_id, order_index);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sidebar_pages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_sidebar_pages_updated_at
    BEFORE UPDATE ON sidebar_pages
    FOR EACH ROW
    EXECUTE FUNCTION update_sidebar_pages_updated_at(); 