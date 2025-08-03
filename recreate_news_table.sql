-- Recreate News Table
-- This script recreates the news table that was accidentally deleted
-- Based on the Home page analysis, this table supports:
-- - Latest news (last 7 days) and old news (older than 7 days)
-- - News creation, deletion, and management
-- - Soft delete functionality with is_deleted flag
-- - Move between recent and old news by updating created_at
-- - Real-time updates via Supabase subscriptions

-- Create the news table
CREATE TABLE IF NOT EXISTS news (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Create indexes for better performance (removed conditional indexes that use NOW())
CREATE INDEX IF NOT EXISTS idx_news_created_at ON news(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_created_by ON news(created_by);
CREATE INDEX IF NOT EXISTS idx_news_is_deleted ON news(is_deleted);
CREATE INDEX IF NOT EXISTS idx_news_title ON news(title);
CREATE INDEX IF NOT EXISTS idx_news_created_at_is_deleted ON news(created_at DESC, is_deleted);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_news_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_news_updated_at_trigger
  BEFORE UPDATE ON news
  FOR EACH ROW
  EXECUTE FUNCTION update_news_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE news ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow all authenticated users to read news
CREATE POLICY "Allow all users to read news" ON news
  FOR SELECT USING (auth.role() IS NOT NULL AND is_deleted = FALSE);

-- Allow admins, ultra_admins, and teachers to create news
CREATE POLICY "Allow admins and teachers to create news" ON news
  FOR INSERT WITH CHECK (
    auth.role() IN ('admin', 'ultra_admin', 'teacher')
  );

-- Allow admins and ultra_admins to update news
CREATE POLICY "Allow admins to update news" ON news
  FOR UPDATE USING (
    auth.role() IN ('admin', 'ultra_admin')
  );

-- Allow admins and ultra_admins to delete news
CREATE POLICY "Allow admins to delete news" ON news
  FOR DELETE USING (
    auth.role() IN ('admin', 'ultra_admin')
  );

-- Create a function to move news between recent and old
CREATE OR REPLACE FUNCTION move_news_to_old(news_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE news 
  SET created_at = NOW() - INTERVAL '8 days'
  WHERE id = news_id;
END;
$$ LANGUAGE plpgsql;

-- Create a function to move news back to recent
CREATE OR REPLACE FUNCTION move_news_to_recent(news_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE news 
  SET created_at = NOW() - INTERVAL '1 day'
  WHERE id = news_id;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get recent news (last 7 days)
CREATE OR REPLACE FUNCTION get_recent_news()
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  is_deleted BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT n.id, n.title, n.content, n.created_by, n.created_at, n.updated_at, n.is_deleted
  FROM news n
  WHERE n.created_at >= NOW() - INTERVAL '7 days'
    AND n.is_deleted = FALSE
  ORDER BY n.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get old news (older than 7 days)
CREATE OR REPLACE FUNCTION get_old_news()
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  is_deleted BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT n.id, n.title, n.content, n.created_by, n.created_at, n.updated_at, n.is_deleted
  FROM news n
  WHERE n.created_at < NOW() - INTERVAL '7 days'
    AND n.is_deleted = FALSE
  ORDER BY n.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Insert some sample news data for testing
INSERT INTO news (title, content, created_by) VALUES
  ('Welcome to the New School Year!', 'We are excited to welcome all students and staff to the new academic year. Let''s make it a great one!', (SELECT id FROM auth.users LIMIT 1)),
  ('Important: Parent-Teacher Meeting', 'Parent-teacher meetings will be held next week. Please check your email for the schedule.', (SELECT id FROM auth.users LIMIT 1)),
  ('Sports Day Announcement', 'Sports day will be held on Friday. All students are encouraged to participate in various events.', (SELECT id FROM auth.users LIMIT 1)),
  ('Library Week Celebration', 'This week we celebrate our library with special events and book fairs. Don''t miss out!', (SELECT id FROM auth.users LIMIT 1)),
  ('Science Fair Results', 'Congratulations to all participants in the science fair. Results will be announced tomorrow.', (SELECT id FROM auth.users LIMIT 1))
ON CONFLICT DO NOTHING;

-- Create some old news (older than 7 days) for testing
INSERT INTO news (title, content, created_by, created_at) VALUES
  ('Last Year''s Annual Day', 'Our annual day celebration was a huge success. Thank you to everyone who participated.', (SELECT id FROM auth.users LIMIT 1), NOW() - INTERVAL '10 days'),
  ('Summer Vacation Notice', 'Summer vacation will begin from next month. Please collect your books and clear your lockers.', (SELECT id FROM auth.users LIMIT 1), NOW() - INTERVAL '15 days'),
  ('Exam Schedule Released', 'The final exam schedule has been released. Please check the notice board for details.', (SELECT id FROM auth.users LIMIT 1), NOW() - INTERVAL '20 days')
ON CONFLICT DO NOTHING;

-- Grant necessary permissions
GRANT ALL ON news TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Verify the table was created successfully
SELECT 
  'News table created successfully!' as status,
  COUNT(*) as total_news_count,
  COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as recent_news_count,
  COUNT(CASE WHEN created_at < NOW() - INTERVAL '7 days' THEN 1 END) as old_news_count
FROM news WHERE is_deleted = FALSE; 