-- Create achievers table
CREATE TABLE IF NOT EXISTS public.achievers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    achievement TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies
ALTER TABLE public.achievers ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read achievers
CREATE POLICY "Allow public read access on achievers"
    ON public.achievers
    FOR SELECT
    USING (true);

-- Allow admins to insert achievers
CREATE POLICY "Allow admin insert on achievers"
    ON public.achievers
    FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid()
                AND (role = 'admin' OR role = 'ultra_admin')
            )
        )
    );

-- Allow admins to update achievers
CREATE POLICY "Allow admin update on achievers"
    ON public.achievers
    FOR UPDATE
    USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid()
                AND (role = 'admin' OR role = 'ultra_admin')
            )
        )
    );

-- Allow admins to delete achievers
CREATE POLICY "Allow admin delete on achievers"
    ON public.achievers
    FOR DELETE
    USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid()
                AND (role = 'admin' OR role = 'ultra_admin')
            )
        )
    );

-- Create updated_at trigger
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.achievers
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at(); 