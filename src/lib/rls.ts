import { supabase } from './supabase';

export async function setupRLSPolicies() {
  try {
    console.log('Setting up RLS policies...');
    
    // Try to create custom policies for custom_pages but don't fail if it errors
    try {
      const { error: customPagesError } = await supabase.rpc('create_custom_pages_policies');
      if (customPagesError) {
        console.warn('Error creating custom_pages policies:', customPagesError);
      } else {
        console.log('Custom pages policies created successfully');
      }
    } catch (error) {
      console.warn('Failed to create custom_pages policies:', error);
    }

    // Try to create custom policies for announcements but don't fail if it errors
    try {
      const { error: announcementsError } = await supabase.rpc('create_announcements_policies');
      if (announcementsError) {
        console.warn('Error creating announcements policies:', announcementsError);
      } else {
        console.log('Announcements policies created successfully');
      }
    } catch (error) {
      console.warn('Failed to create announcements policies:', error);
    }

    // Try to create custom policies for clubs but don't fail if it errors
    try {
      const { error: clubsError } = await supabase.rpc('create_clubs_policies');
      if (clubsError) {
        console.warn('Error creating clubs policies:', clubsError);
      } else {
        console.log('Clubs policies created successfully');
      }
    } catch (error) {
      console.warn('Failed to create clubs policies:', error);
    }

    // Enable RLS on all tables, but don't fail if individual tables fail
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
      try {
        const { error } = await supabase.rpc('enable_rls', { table_name: table });
        if (error) {
          console.warn(`Error enabling RLS on ${table}:`, error);
        } else {
          console.log(`RLS enabled on ${table}`);
        }
      } catch (error) {
        console.warn(`Failed to enable RLS on ${table}:`, error);
      }
    }

    // Create the SQL for the policies - only try if the previous steps didn't completely fail
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

        CREATE POLICY "Enable insert for ultra_admin and admin" ON announcements
          FOR INSERT WITH CHECK (auth.role() IN ('ultra_admin', 'admin'));

        CREATE POLICY "Enable update for ultra_admin and admin" ON announcements
          FOR UPDATE USING (auth.role() IN ('ultra_admin', 'admin'));

        CREATE POLICY "Enable delete for ultra_admin and admin" ON announcements
          FOR DELETE USING (auth.role() IN ('ultra_admin', 'admin'));
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

        CREATE POLICY "Enable insert for ultra_admin and admin" ON clubs
          FOR INSERT WITH CHECK (auth.role() IN ('ultra_admin', 'admin'));

        CREATE POLICY "Enable update for ultra_admin and admin" ON clubs
          FOR UPDATE USING (auth.role() IN ('ultra_admin', 'admin'));

        CREATE POLICY "Enable delete for ultra_admin and admin" ON clubs
          FOR DELETE USING (auth.role() IN ('ultra_admin', 'admin'));
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

    try {
      const { error: sqlError } = await supabase.rpc('execute_sql', { sql });
      if (sqlError) {
        console.warn('Error executing SQL for policies:', sqlError);
      } else {
        console.log('SQL for policies executed successfully');
      }
    } catch (error) {
      console.warn('Failed to execute SQL for policies:', error);
    }

    console.log('RLS policies setup completed');
    return true;
  } catch (error) {
    console.error('Error in setupRLSPolicies:', error);
    // Don't throw the error, just return false to indicate failure
    return false;
  }
}

// SQL for creating the policies
export const rlsPoliciesSQL = `
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

  CREATE POLICY "Enable insert for ultra_admin and admin" ON announcements
    FOR INSERT WITH CHECK (auth.role() IN ('ultra_admin', 'admin'));

  CREATE POLICY "Enable update for ultra_admin and admin" ON announcements
    FOR UPDATE USING (auth.role() IN ('ultra_admin', 'admin'));

  CREATE POLICY "Enable delete for ultra_admin and admin" ON announcements
    FOR DELETE USING (auth.role() IN ('ultra_admin', 'admin'));
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

  CREATE POLICY "Enable insert for ultra_admin and admin" ON clubs
    FOR INSERT WITH CHECK (auth.role() IN ('ultra_admin', 'admin'));

  CREATE POLICY "Enable update for ultra_admin and admin" ON clubs
    FOR UPDATE USING (auth.role() IN ('ultra_admin', 'admin'));

  CREATE POLICY "Enable delete for ultra_admin and admin" ON clubs
    FOR DELETE USING (auth.role() IN ('ultra_admin', 'admin'));
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