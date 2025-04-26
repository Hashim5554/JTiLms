# Database Error Fix Instructions

You're encountering a "Database error querying schema" when logging into newly created accounts. This is often due to missing columns, outdated schema caches, or incomplete database setup. Follow these steps to fix the issues:

## Option 1: Using the Supabase Dashboard (Recommended)

1. Login to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to the "SQL Editor" section in the left sidebar
4. Create a new query
5. Copy the entire contents of the `supabase/migrations/schema_fix_combined.sql` file and paste it into the SQL editor
6. Click "Run" to execute the SQL script
7. Wait for the script to complete (this may take a few seconds)
8. Refresh your application and try logging in again

## Option 2: Using the Database CLI (For Advanced Users)

If you have direct database access:

1. Connect to your Supabase Postgres database using psql or another Postgres client
2. Run the SQL script directly:
   ```
   psql -h YOUR_DB_HOST -U postgres -d postgres -f supabase/migrations/schema_fix_combined.sql
   ```

## What This Fix Does

The SQL script:

1. Creates necessary extensions (uuid-ossp, pgcrypto)
2. Adds the moddatetime function for timestamps
3. Ensures the auth schema exists
4. Creates or updates the users and profiles tables with all required columns
5. Adds the necessary triggers for timestamps
6. Creates a refresh_schema_cache function to refresh database statistics
7. Implements a robust create_new_user function
8. Sets up proper permissions and policies

## Verification

After running the script, you should test:

1. Logging in with existing accounts
2. Creating a new account and logging in with it
3. Checking that user profiles have all the required fields (email, created_at, updated_at)

If you still experience issues, please open the browser console (F12) and check for specific error messages which might provide more details about the problem. 