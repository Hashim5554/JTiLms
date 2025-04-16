-- Create function to setup RLS policies for custom_pages
CREATE OR REPLACE FUNCTION public.create_custom_pages_policies()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Enable RLS
  ALTER TABLE public.custom_pages ENABLE ROW LEVEL SECURITY;

  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Allow read access to all users" ON public.custom_pages;
  DROP POLICY IF EXISTS "Allow all operations for ultra_admin" ON public.custom_pages;
  DROP POLICY IF EXISTS "Allow all operations for admin" ON public.custom_pages;

  -- Create policies
  -- Allow all users to read custom pages
  CREATE POLICY "Allow read access to all users" ON public.custom_pages
    FOR SELECT USING (true);

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