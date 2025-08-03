-- Remove notifications table if it exists
DROP TABLE IF EXISTS notifications CASCADE;

-- Drop any functions that might reference notifications
DROP FUNCTION IF EXISTS notify_discussion_participants(UUID, UUID, UUID);
DROP FUNCTION IF EXISTS create_notification(UUID, TEXT, UUID);
DROP FUNCTION IF EXISTS get_user_notifications(UUID);

-- Remove any triggers that might reference notifications
-- (These would be on discussions and private_discussions tables)
DO $$
BEGIN
  -- Drop any triggers that might be trying to create notifications
  IF EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name LIKE '%notification%'
  ) THEN
    -- This is a generic approach - specific trigger names would need to be known
    RAISE NOTICE 'Found notification-related triggers, but specific names unknown';
  END IF;
END $$;

-- Ensure discussions and private_discussions tables are clean
-- (These should already be properly set up by previous migrations)

-- Grant necessary permissions to ensure everything works
GRANT SELECT, INSERT, UPDATE, DELETE ON discussions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON private_discussions TO authenticated; 