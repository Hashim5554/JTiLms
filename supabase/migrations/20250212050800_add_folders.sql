-- Add folder system for subject materials
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create folders table
CREATE TABLE IF NOT EXISTS public.folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    parent_folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add folder_id to subject_materials
ALTER TABLE public.subject_materials 
ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_folders_subject_id ON public.folders(subject_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent_folder_id ON public.folders(parent_folder_id);
CREATE INDEX IF NOT EXISTS idx_folders_created_by ON public.folders(created_by);
CREATE INDEX IF NOT EXISTS idx_subject_materials_folder_id ON public.subject_materials(folder_id);

-- Add RLS policies for folders
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Folders are viewable by authenticated users"
    ON public.folders FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Folders are insertable by teachers and admins"
    ON public.folders FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND (role = 'teacher' OR role = 'admin' OR role = 'ultra_admin')
        )
    );

CREATE POLICY "Folders are updatable by teachers and admins"
    ON public.folders FOR UPDATE
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

CREATE POLICY "Folders are deletable by teachers and admins"
    ON public.folders FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND (role = 'teacher' OR role = 'admin' OR role = 'ultra_admin')
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER set_folders_updated_at
    BEFORE UPDATE ON public.folders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at(); 