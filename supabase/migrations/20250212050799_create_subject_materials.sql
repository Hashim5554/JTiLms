-- Create subject_materials table
CREATE TABLE IF NOT EXISTS public.subject_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    file_url TEXT,
    due_date TIMESTAMPTZ,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_subject_materials_subject_id ON public.subject_materials(subject_id);
CREATE INDEX IF NOT EXISTS idx_subject_materials_created_by ON public.subject_materials(created_by);

-- Add RLS policies for subject_materials
ALTER TABLE public.subject_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subject materials are viewable by authenticated users"
    ON public.subject_materials FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Subject materials are insertable by teachers and admins"
    ON public.subject_materials FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND (role = 'teacher' OR role = 'admin' OR role = 'ultra_admin')
        )
    );

CREATE POLICY "Subject materials are updatable by teachers and admins"
    ON public.subject_materials FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND (role = 'teacher' OR role = 'admin' OR role = 'ultra_admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND (role = 'teacher' OR role = 'admin' OR role = 'ultra_admin')
        )
    );

CREATE POLICY "Subject materials are deletable by teachers and admins"
    ON public.subject_materials FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND (role = 'teacher' OR role = 'admin' OR role = 'ultra_admin')
        )
    );

-- Create trigger for updated_at
CREATE TRIGGER set_subject_materials_updated_at
    BEFORE UPDATE ON public.subject_materials
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at(); 