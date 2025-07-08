# Fix Pending Users Issue

## Problem Description
New Google OAuth accounts are being created as 'student' users with no class assigned, and they appear in the admin users page even though they shouldn't have access.

## Root Cause
The database trigger and SessionContext are not consistently creating new users with 'pending' status.

## Solution Steps

### Step 1: Run the Database Migration
Copy and paste this SQL into your Supabase dashboard SQL editor:

```sql
-- Final fix for pending users - ensure all new Google OAuth users get 'pending' status
-- This migration should be run in the Supabase dashboard SQL editor

-- First, let's check the current state
SELECT 
  'Current users and their roles:' as info,
  u.email,
  p.role,
  p.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY p.created_at DESC;

-- Update the trigger function to ensure new users get 'pending' status
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the improved handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_username TEXT;
  user_role TEXT;
BEGIN
  -- Extract username from user metadata or email
  user_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  );
  
  -- ALWAYS set new users to 'pending' status regardless of metadata
  user_role := 'pending';
  
  -- Insert profile with 'pending' status
  INSERT INTO public.profiles (
    id,
    email,
    username,
    role,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    user_username,
    user_role,
    now(),
    now()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;

-- Update existing users who don't have proper roles to 'pending'
UPDATE public.profiles 
SET role = 'pending', updated_at = now()
WHERE role = 'student' 
  AND id NOT IN (
    SELECT DISTINCT user_id 
    FROM class_assignments 
    WHERE user_id IS NOT NULL
  )
  AND created_at > now() - interval '1 day'; -- Only recent users

-- Create a function to manually fix existing users
CREATE OR REPLACE FUNCTION public.fix_existing_users_to_pending()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
  updated_count INTEGER := 0;
  error_count INTEGER := 0;
BEGIN
  -- Find users who are students but have no class assignments and update them to pending
  FOR user_record IN 
    SELECT p.id, p.email, p.username
    FROM public.profiles p
    LEFT JOIN class_assignments ca ON p.id = ca.user_id
    WHERE p.role = 'student' 
      AND ca.user_id IS NULL
      AND p.created_at > now() - interval '7 days' -- Only recent users
  LOOP
    BEGIN
      UPDATE public.profiles 
      SET role = 'pending', updated_at = now()
      WHERE id = user_record.id;
      updated_count := updated_count + 1;
    EXCEPTION
      WHEN OTHERS THEN
        error_count := error_count + 1;
        RAISE WARNING 'Failed to update user % to pending: %', user_record.id, SQLERRM;
    END;
  END LOOP;
  
  RETURN jsonb_build_object(
    'updated', updated_count,
    'errors', error_count
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.fix_existing_users_to_pending() TO authenticated;

-- Run the function to fix existing users
SELECT public.fix_existing_users_to_pending();

-- Show the results after the fix
SELECT 
  'Users after fix:' as info,
  u.email,
  p.role,
  p.created_at,
  CASE WHEN ca.user_id IS NOT NULL THEN 'Has Class' ELSE 'No Class' END as class_status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN class_assignments ca ON p.id = ca.user_id
ORDER BY p.created_at DESC;
```

### Step 2: Clear Browser Data
1. Clear your browser's local storage and cookies for your app domain
2. Sign out of any existing sessions

### Step 3: Test the Fix
1. Try logging in with a new Google account
2. You should see the "Access Pending" screen instead of the main app
3. Check the admin users page - pending users should be handled separately

### Step 4: Verify in Admin Panel
Run this query to check the current state:

```sql
-- Check current user status
SELECT 
  u.email,
  p.role,
  p.created_at,
  CASE WHEN ca.user_id IS NOT NULL THEN 'Has Class' ELSE 'No Class' END as class_status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN class_assignments ca ON p.id = ca.user_id
ORDER BY p.created_at DESC;
```

## Expected Results

After implementing these fixes:

1. **New Google OAuth users** will get 'pending' status automatically
2. **Pending users** will see the "Access Pending" screen instead of the main app
3. **Admin users** can approve pending users from the admin panel
4. **Existing users without classes** will be moved to 'pending' status
5. **No more "glitched" access** for unauthorized users

## Admin Workflow

1. **Pending users** appear in a separate section in the admin panel
2. **Admins can approve** pending users by changing their role to 'student', 'teacher', or 'admin'
3. **Students need class assignments** after approval
4. **Approved users** get full access to the system

## Troubleshooting

If you still see issues:

1. **Check the migration results** - look for any error messages
2. **Verify the trigger is working** - new users should get 'pending' status
3. **Clear browser cache** and try again
4. **Check console logs** for any error messages

## Next Steps

Once the fix is working:

1. **Test with multiple Google accounts** to ensure consistency
2. **Set up proper admin workflow** for approving users
3. **Assign classes** to approved students
4. **Monitor the system** for any new issues 