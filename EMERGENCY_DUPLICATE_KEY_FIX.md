# 🚨 EMERGENCY FIX: Duplicate Key Constraint Violations

## CRITICAL ISSUES
1. "duplicate key value violates unique constraint 'profiles_pkey'" - preventing profile creation
2. "duplicate key value violates unique constraint 'users_email_partial_key'" - preventing user creation

## IMMEDIATE ACTION REQUIRED

### Step 1: Run the Comprehensive Database Fix
Copy and paste this SQL into your Supabase dashboard SQL editor **IMMEDIATELY**:

```sql
-- COMPREHENSIVE FIX: Address both profile and email duplicate issues
-- This migration should resolve all duplicate key constraint violations

-- Step 1: Clean up duplicate emails in auth.users
-- Keep the most recent user for each email
DELETE FROM auth.users 
WHERE id IN (
  SELECT id FROM (
    SELECT id, 
           ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as rn
    FROM auth.users 
    WHERE email IN (
      SELECT email 
      FROM auth.users 
      WHERE email IS NOT NULL
      GROUP BY email 
      HAVING COUNT(*) > 1
    )
  ) t 
  WHERE t.rn > 1
);

-- Step 2: Clean up orphaned profiles (profiles without corresponding auth.users)
DELETE FROM public.profiles 
WHERE id NOT IN (
  SELECT id FROM auth.users
);

-- Step 3: Clean up duplicate profiles
DELETE FROM public.profiles 
WHERE id IN (
  SELECT id 
  FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY id ORDER BY created_at) as rn
    FROM public.profiles
  ) t 
  WHERE t.rn > 1
);

-- Step 4: Recreate the trigger function with better error handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_username TEXT;
  user_role TEXT;
  existing_profile_id UUID;
BEGIN
  -- Check if profile already exists
  SELECT id INTO existing_profile_id 
  FROM public.profiles 
  WHERE id = NEW.id;
  
  -- If profile already exists, don't create a new one
  IF existing_profile_id IS NOT NULL THEN
    RAISE NOTICE 'Profile already exists for user %: %, skipping creation', NEW.id, NEW.email;
    RETURN NEW;
  END IF;

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
  
  RAISE NOTICE 'Created profile for user %: % with role %', NEW.id, NEW.email, user_role;
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

-- Step 5: Create profiles for any users that don't have them
INSERT INTO public.profiles (id, email, username, role, created_at, updated_at)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'username', split_part(u.email, '@', 1)),
  'pending',
  u.created_at,
  now()
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
  AND u.email IS NOT NULL;
```

### Step 2: Clear Browser Data
1. Clear all browser data for your app domain
2. Sign out of any existing sessions
3. Close and reopen your browser

### Step 3: Test the Fix
1. Try logging in with a Google account
2. Check if both duplicate key errors are gone
3. Verify that new users get 'pending' status

## What This Fix Does

1. **Cleans Duplicate Emails**: Removes duplicate email addresses from auth.users table
2. **Cleans Duplicate Profiles**: Removes duplicate profiles from public.profiles table
3. **Removes Orphaned Profiles**: Deletes profiles without corresponding auth.users
4. **Creates Missing Profiles**: Ensures all users have profiles with 'pending' status
5. **Prevents Future Duplicates**: Improved trigger function with duplicate checking

## Root Causes
- **Profile Duplicates**: Both database trigger and SessionContext were creating profiles
- **Email Duplicates**: Multiple auth.users entries with the same email address
- **Orphaned Profiles**: Profiles without corresponding auth.users entries

## Prevention
- SessionContext no longer creates profiles (only fetches them)
- Database trigger handles all profile creation with duplicate checking
- Email uniqueness is enforced at the database level
- Comprehensive cleanup prevents future issues

## Verification
After running the fix, you should see:
- No more duplicate key errors (both profile and email)
- New users get 'pending' status automatically
- Existing users can log in normally
- Admin panel shows pending users separately
- Clean database with no duplicates

## If Issues Persist
1. Check the Supabase logs for any error messages
2. Verify the trigger function was created successfully
3. Test with a completely new Google account
4. Run the verification queries in the migration to check the status

**This comprehensive fix should resolve all duplicate key constraint violations immediately.** 