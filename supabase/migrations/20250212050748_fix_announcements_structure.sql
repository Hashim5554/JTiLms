-- Create moddatetime function if it doesn't exist
create or replace function moddatetime()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Drop existing announcements table if it exists
DROP TABLE IF EXISTS public.announcements CASCADE;

-- Create announcements table with proper structure
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Announcements are viewable by everyone"
  ON public.announcements FOR SELECT
  USING (true);

CREATE POLICY "Users can create announcements"
  ON public.announcements FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own announcements"
  ON public.announcements FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own announcements"
  ON public.announcements FOR DELETE
  USING (auth.uid() = created_by);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_announcements_created_by ON public.announcements(created_by);

-- Create updated_at trigger
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE PROCEDURE moddatetime();

-- Create a view that joins announcements with profiles
CREATE OR REPLACE VIEW public.announcements_with_profiles AS
SELECT 
  a.*,
  p.username,
  p.role
FROM public.announcements a
LEFT JOIN public.profiles p ON a.created_by = p.id; 