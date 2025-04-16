-- Enable Row Level Security
ALTER TABLE private_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE due_works ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create custom_pages table if it doesn't exist
CREATE TABLE IF NOT EXISTS custom_pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  is_published BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Add created_by column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'custom_pages' 
    AND column_name = 'created_by'
  ) THEN
    ALTER TABLE custom_pages ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Enable RLS for custom_pages
ALTER TABLE custom_pages ENABLE ROW LEVEL SECURITY;

-- Create function to setup RLS policies for custom_pages
CREATE OR REPLACE FUNCTION public.create_custom_pages_policies()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Allow read access to all users" ON public.custom_pages;
  DROP POLICY IF EXISTS "Allow all operations for ultra_admin" ON public.custom_pages;
  DROP POLICY IF EXISTS "Allow all operations for admin" ON public.custom_pages;

  -- Create policies
  -- Allow all users to read published custom pages
  CREATE POLICY "Allow read access to all users" ON public.custom_pages
    FOR SELECT USING (is_published = true);

  -- Allow ultra_admin to perform all operations
  CREATE POLICY "Allow all operations for ultra_admin" ON public.custom_pages
    FOR ALL USING (auth.role() = 'ultra_admin');

  -- Allow admin to perform all operations
  CREATE POLICY "Allow all operations for admin" ON public.custom_pages
    FOR ALL USING (auth.role() = 'admin');
END;
$$;

-- Execute the function
SELECT public.create_custom_pages_policies(); 