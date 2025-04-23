-- Create a trigger to sync profile roles to auth.users metadata
CREATE OR REPLACE FUNCTION sync_user_role_to_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the role in auth.users metadata whenever a profile's role changes
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{role}',
    to_jsonb(NEW.role)
  )
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on profiles table
DROP TRIGGER IF EXISTS sync_role_to_metadata ON profiles;
CREATE TRIGGER sync_role_to_metadata
AFTER INSERT OR UPDATE OF role ON profiles
FOR EACH ROW
EXECUTE FUNCTION sync_user_role_to_metadata();

-- Fix existing users by syncing all profile roles to auth.users metadata
DO $$
BEGIN
  UPDATE auth.users u
  SET raw_user_meta_data = jsonb_set(
    COALESCE(u.raw_user_meta_data, '{}'::jsonb),
    '{role}',
    to_jsonb(p.role)
  )
  FROM profiles p
  WHERE u.id = p.id;
END;
$$; 