# Fix Google OAuth Issues

## Problems Identified

1. **Google OAuth users not getting profiles created automatically**
2. **All Google accounts showing the same display** (session/user data not differentiated)
3. **Missing class data** for students (profiles not being created properly)

## Solutions Implemented

### 1. Updated SessionContext
- Now automatically creates profiles for Google OAuth users when they sign in
- Properly handles both initial session and auth state changes
- Ensures each user gets their own unique profile

### 2. Updated App.tsx
- Properly syncs profile data from SessionContext to AuthStore
- Ensures consistent user data across the app

### 3. Created Database Migration
- Fixed the trigger function to properly handle Google OAuth users
- Added function to create missing profiles for existing users
- Improved error handling in profile creation

## Steps to Fix

### Step 1: Run the Database Migration
Run this SQL in your Supabase dashboard SQL editor:

```sql
-- Fix Google OAuth profile creation
-- This migration ensures that Google OAuth users get proper profiles created

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create improved handle_new_user function
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
  
  -- Extract role from user metadata or default to student
  user_role := COALESCE(
    NEW.raw_user_meta_data->>'role',
    'student'
  );
  
  -- Insert profile with all required fields
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

-- Create a function to manually create profiles for existing users
CREATE OR REPLACE FUNCTION public.create_missing_profiles()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
  created_count INTEGER := 0;
  error_count INTEGER := 0;
BEGIN
  -- Loop through all auth users that don't have profiles
  FOR user_record IN 
    SELECT 
      u.id,
      u.email,
      COALESCE(u.raw_user_meta_data->>'username', split_part(u.email, '@', 1)) as username,
      COALESCE(u.raw_user_meta_data->>'role', 'student') as role
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.id
    WHERE p.id IS NULL
  LOOP
    BEGIN
      INSERT INTO public.profiles (
        id,
        email,
        username,
        role,
        created_at,
        updated_at
      ) VALUES (
        user_record.id,
        user_record.email,
        user_record.username,
        user_record.role,
        now(),
        now()
      );
      created_count := created_count + 1;
    EXCEPTION
      WHEN OTHERS THEN
        error_count := error_count + 1;
        RAISE WARNING 'Failed to create profile for user %: %', user_record.id, SQLERRM;
    END;
  END LOOP;
  
  RETURN jsonb_build_object(
    'created', created_count,
    'errors', error_count
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_missing_profiles() TO authenticated;

-- Run the function to create missing profiles
SELECT public.create_missing_profiles();
```

### Step 2: Check Current State
Run this query to see the current state of users and profiles:

```sql
-- Check auth users vs profiles
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data,
  CASE WHEN p.id IS NOT NULL THEN 'Has Profile' ELSE 'Missing Profile' END as profile_status,
  p.role as profile_role,
  p.username as profile_username
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC;
```

### Step 3: Test the Fix
1. **Clear your browser's local storage and cookies** for your app domain
2. **Restart your development server**
3. **Try logging in with different Google accounts** - each should now show different user data
4. **Check the console logs** to see the profile creation process

### Step 4: Verify Profile Creation
After logging in, run this query to verify profiles are being created:

```sql
-- Check recent profiles
SELECT 
  id,
  email,
  username,
  role,
  created_at
FROM public.profiles
ORDER BY created_at DESC
LIMIT 10;
```

## Expected Results

After implementing these fixes:

1. **Each Google account will have its own unique profile** with proper email and username
2. **The "missing required data" error should be resolved** as profiles will be created automatically
3. **Students will need to be assigned to classes** (this is a separate process handled by admins)
4. **Console logs will show profile creation** when users sign in

## Troubleshooting

If you still see issues:

1. **Check the browser console** for any error messages
2. **Verify the migration ran successfully** in Supabase
3. **Check if profiles are being created** using the verification queries above
4. **Clear browser cache and try again**

## Next Steps

Once profiles are working correctly:

1. **Assign students to classes** using the admin interface
2. **Set up proper roles** for teachers and admins
3. **Test the complete user flow** from login to dashboard 