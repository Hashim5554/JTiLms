-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.classes;
DROP POLICY IF EXISTS "Enable insert for admins and ultraadmins" ON public.classes;
DROP POLICY IF EXISTS "Enable update for admins and ultraadmins" ON public.classes;
DROP POLICY IF EXISTS "Enable delete for admins and ultraadmins" ON public.classes;

-- Create new policies
CREATE POLICY "Enable read access for all authenticated users" ON public.classes
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for admins and ultraadmins" ON public.classes
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() IN (
            SELECT id FROM auth.users 
            WHERE raw_user_meta_data->>'role' IN ('admin', 'ultraadmin')
        )
    );

CREATE POLICY "Enable update for admins and ultraadmins" ON public.classes
    FOR UPDATE
    TO authenticated
    USING (
        auth.uid() IN (
            SELECT id FROM auth.users 
            WHERE raw_user_meta_data->>'role' IN ('admin', 'ultraadmin')
        )
    )
    WITH CHECK (
        auth.uid() IN (
            SELECT id FROM auth.users 
            WHERE raw_user_meta_data->>'role' IN ('admin', 'ultraadmin')
        )
    );

CREATE POLICY "Enable delete for admins and ultraadmins" ON public.classes
    FOR DELETE
    TO authenticated
    USING (
        auth.uid() IN (
            SELECT id FROM auth.users 
            WHERE raw_user_meta_data->>'role' IN ('admin', 'ultraadmin')
        )
    ); 