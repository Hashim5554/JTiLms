-- Enhance clubs table with additional fields
ALTER TABLE clubs
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS difficulty_level TEXT CHECK (difficulty_level IN ('Beginner', 'Intermediate', 'Advanced')),
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'full')),
ADD COLUMN IF NOT EXISTS requirements TEXT,
ADD COLUMN IF NOT EXISTS equipment_needed TEXT[],
ADD COLUMN IF NOT EXISTS achievements TEXT[],
ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_ratings INTEGER DEFAULT 0;

-- Create club_categories table
CREATE TABLE IF NOT EXISTS club_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO club_categories (name, description, icon) VALUES
    ('Sports', 'Physical activities and team sports', 'sports'),
    ('Arts', 'Creative and artistic activities', 'arts'),
    ('Science', 'Scientific exploration and experiments', 'science'),
    ('Technology', 'Coding, robotics, and digital skills', 'technology'),
    ('Music', 'Musical activities and performances', 'music'),
    ('Languages', 'Language learning and cultural exchange', 'languages'),
    ('Leadership', 'Leadership and personal development', 'leadership'),
    ('Community', 'Community service and social activities', 'community')
ON CONFLICT (name) DO NOTHING;

-- Create club_achievements table
CREATE TABLE IF NOT EXISTS club_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create club_ratings table
CREATE TABLE IF NOT EXISTS club_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(club_id, user_id)
);

-- Create function to update club rating
CREATE OR REPLACE FUNCTION update_club_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE clubs
    SET 
        rating = (
            SELECT COALESCE(AVG(rating), 0)
            FROM club_ratings
            WHERE club_id = NEW.club_id
        ),
        total_ratings = (
            SELECT COUNT(*)
            FROM club_ratings
            WHERE club_id = NEW.club_id
        )
    WHERE id = NEW.club_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for rating updates
CREATE TRIGGER update_club_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON club_ratings
FOR EACH ROW
EXECUTE FUNCTION update_club_rating();

-- Add RLS policies for new tables
ALTER TABLE club_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_ratings ENABLE ROW LEVEL SECURITY;

-- Policies for club_categories
CREATE POLICY "Enable read access for all users" ON club_categories
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON club_categories
    FOR INSERT WITH CHECK (auth.role() IN ('admin', 'teacher'));

CREATE POLICY "Enable update for authenticated users only" ON club_categories
    FOR UPDATE USING (auth.role() IN ('admin', 'teacher'));

CREATE POLICY "Enable delete for authenticated users only" ON club_categories
    FOR DELETE USING (auth.role() IN ('admin', 'teacher'));

-- Policies for club_achievements
CREATE POLICY "Enable read access for all users" ON club_achievements
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON club_achievements
    FOR INSERT WITH CHECK (auth.role() IN ('admin', 'teacher'));

CREATE POLICY "Enable update for authenticated users only" ON club_achievements
    FOR UPDATE USING (auth.role() IN ('admin', 'teacher'));

CREATE POLICY "Enable delete for authenticated users only" ON club_achievements
    FOR DELETE USING (auth.role() IN ('admin', 'teacher'));

-- Policies for club_ratings
CREATE POLICY "Enable read access for all users" ON club_ratings
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON club_ratings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for own ratings" ON club_ratings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for own ratings" ON club_ratings
    FOR DELETE USING (auth.uid() = user_id); 