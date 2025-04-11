import { supabase } from './supabase';

export async function setupRLSPolicies() {
  try {
    // Create custom policies for custom_pages
    const { error: customPagesError } = await supabase.rpc('create_custom_pages_policies');
    if (customPagesError) throw customPagesError;

    // Create custom policies for announcements
    const { error: announcementsError } = await supabase.rpc('create_announcements_policies');
    if (announcementsError) throw announcementsError;

    // Create custom policies for clubs
    const { error: clubsError } = await supabase.rpc('create_clubs_policies');
    if (clubsError) throw clubsError;

    // Enable RLS on all tables
    const tables = [
      'custom_pages',
      'announcements',
      'clubs',
      'subjects',
      'library',
      'record_room',
      'timetable',
      'due_works'
    ];

    for (const table of tables) {
      const { error } = await supabase.rpc('enable_rls', { table_name: table });
      if (error) throw error;
    }

    // Create the SQL for the policies
    const sql = `
      -- Custom Pages Policies
      CREATE OR REPLACE FUNCTION create_custom_pages_policies()
      RETURNS void AS $$
      BEGIN
        -- Enable RLS
        ALTER TABLE custom_pages ENABLE ROW LEVEL SECURITY;

        -- Create policies
        CREATE POLICY "Enable read access for all users" ON custom_pages
          FOR SELECT USING (true);

        CREATE POLICY "Enable insert for ultra_admin only" ON custom_pages
          FOR INSERT WITH CHECK (auth.role() = 'ultra_admin');

        CREATE POLICY "Enable update for ultra_admin only" ON custom_pages
          FOR UPDATE USING (auth.role() = 'ultra_admin');

        CREATE POLICY "Enable delete for ultra_admin only" ON custom_pages
          FOR DELETE USING (auth.role() = 'ultra_admin');
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      -- Announcements Policies
      CREATE OR REPLACE FUNCTION create_announcements_policies()
      RETURNS void AS $$
      BEGIN
        -- Enable RLS
        ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

        -- Create policies
        CREATE POLICY "Enable read access for all users" ON announcements
          FOR SELECT USING (true);

        CREATE POLICY "Enable insert for ultra_admin and teachers" ON announcements
          FOR INSERT WITH CHECK (auth.role() IN ('ultra_admin', 'teacher'));

        CREATE POLICY "Enable update for ultra_admin and teachers" ON announcements
          FOR UPDATE USING (auth.role() IN ('ultra_admin', 'teacher'));

        CREATE POLICY "Enable delete for ultra_admin and teachers" ON announcements
          FOR DELETE USING (auth.role() IN ('ultra_admin', 'teacher'));
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      -- Clubs Policies
      CREATE OR REPLACE FUNCTION create_clubs_policies()
      RETURNS void AS $$
      BEGIN
        -- Enable RLS
        ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;

        -- Create policies
        CREATE POLICY "Enable read access for all users" ON clubs
          FOR SELECT USING (true);

        CREATE POLICY "Enable insert for ultra_admin and teachers" ON clubs
          FOR INSERT WITH CHECK (auth.role() IN ('ultra_admin', 'teacher'));

        CREATE POLICY "Enable update for ultra_admin and teachers" ON clubs
          FOR UPDATE USING (auth.role() IN ('ultra_admin', 'teacher'));

        CREATE POLICY "Enable delete for ultra_admin and teachers" ON clubs
          FOR DELETE USING (auth.role() IN ('ultra_admin', 'teacher'));
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      -- Enable RLS function
      CREATE OR REPLACE FUNCTION enable_rls(table_name text)
      RETURNS void AS $$
      BEGIN
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    // Execute the SQL
    const { error: sqlError } = await supabase.rpc('execute_sql', { sql });
    if (sqlError) throw sqlError;

    console.log('RLS policies setup completed successfully');
  } catch (error) {
    console.error('Error setting up RLS policies:', error);
    throw error;
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