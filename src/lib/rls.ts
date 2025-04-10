import { supabase } from './supabase';

export async function setupRLSPolicies() {
  try {
    // Custom Pages Policies
    await supabase.rpc('create_custom_pages_policies', {
      admin_role: 'ultra_admin',
      teacher_role: 'teacher'
    });

    // Announcements Policies
    await supabase.rpc('create_announcements_policies', {
      admin_role: 'ultra_admin',
      teacher_role: 'teacher'
    });

    // Afternoon Clubs Policies
    await supabase.rpc('create_clubs_policies', {
      admin_role: 'ultra_admin',
      teacher_role: 'teacher'
    });
  } catch (error) {
    console.error('Error setting up RLS policies:', error);
  }
}

// SQL for creating the policies
export const rlsPoliciesSQL = `
-- Custom Pages Policies
CREATE OR REPLACE FUNCTION create_custom_pages_policies(admin_role text, teacher_role text)
RETURNS void AS $$
BEGIN
  -- Enable RLS
  ALTER TABLE custom_pages ENABLE ROW LEVEL SECURITY;

  -- Create policies
  CREATE POLICY "Enable read access for all users" ON custom_pages
    FOR SELECT USING (true);

  CREATE POLICY "Enable insert for authenticated users only" ON custom_pages
    FOR INSERT WITH CHECK (auth.role() IN (admin_role, teacher_role));

  CREATE POLICY "Enable update for authenticated users only" ON custom_pages
    FOR UPDATE USING (auth.role() IN (admin_role, teacher_role));

  CREATE POLICY "Enable delete for authenticated users only" ON custom_pages
    FOR DELETE USING (auth.role() IN (admin_role, teacher_role));
END;
$$ LANGUAGE plpgsql;

-- Announcements Policies
CREATE OR REPLACE FUNCTION create_announcements_policies(admin_role text, teacher_role text)
RETURNS void AS $$
BEGIN
  -- Enable RLS
  ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

  -- Create policies
  CREATE POLICY "Enable read access for all users" ON announcements
    FOR SELECT USING (true);

  CREATE POLICY "Enable insert for authenticated users only" ON announcements
    FOR INSERT WITH CHECK (auth.role() IN (admin_role, teacher_role));

  CREATE POLICY "Enable update for authenticated users only" ON announcements
    FOR UPDATE USING (auth.role() IN (admin_role, teacher_role));

  CREATE POLICY "Enable delete for authenticated users only" ON announcements
    FOR DELETE USING (auth.role() IN (admin_role, teacher_role));
END;
$$ LANGUAGE plpgsql;

-- Afternoon Clubs Policies
CREATE OR REPLACE FUNCTION create_clubs_policies(admin_role text, teacher_role text)
RETURNS void AS $$
BEGIN
  -- Enable RLS
  ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
  ALTER TABLE club_members ENABLE ROW LEVEL SECURITY;
  ALTER TABLE club_attendances ENABLE ROW LEVEL SECURITY;

  -- Create policies for clubs table
  CREATE POLICY "Enable read access for all users" ON clubs
    FOR SELECT USING (true);

  CREATE POLICY "Enable insert for authenticated users only" ON clubs
    FOR INSERT WITH CHECK (auth.role() IN (admin_role, teacher_role));

  CREATE POLICY "Enable update for authenticated users only" ON clubs
    FOR UPDATE USING (auth.role() IN (admin_role, teacher_role));

  CREATE POLICY "Enable delete for authenticated users only" ON clubs
    FOR DELETE USING (auth.role() IN (admin_role, teacher_role));

  -- Create policies for club_members table
  CREATE POLICY "Enable read access for all users" ON club_members
    FOR SELECT USING (true);

  CREATE POLICY "Enable insert for authenticated users only" ON club_members
    FOR INSERT WITH CHECK (auth.role() IN (admin_role, teacher_role));

  CREATE POLICY "Enable update for authenticated users only" ON club_members
    FOR UPDATE USING (auth.role() IN (admin_role, teacher_role));

  CREATE POLICY "Enable delete for authenticated users only" ON club_members
    FOR DELETE USING (auth.role() IN (admin_role, teacher_role));

  -- Create policies for club_attendances table
  CREATE POLICY "Enable read access for all users" ON club_attendances
    FOR SELECT USING (true);

  CREATE POLICY "Enable insert for authenticated users only" ON club_attendances
    FOR INSERT WITH CHECK (auth.role() IN (admin_role, teacher_role));

  CREATE POLICY "Enable update for authenticated users only" ON club_attendances
    FOR UPDATE USING (auth.role() IN (admin_role, teacher_role));

  CREATE POLICY "Enable delete for authenticated users only" ON club_attendances
    FOR DELETE USING (auth.role() IN (admin_role, teacher_role));
END;
$$ LANGUAGE plpgsql;
`; 