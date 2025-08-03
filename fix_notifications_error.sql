-- Fix notifications error by removing any references to the notifications table

-- Drop any functions that might be trying to access notifications
DROP FUNCTION IF EXISTS notify_discussion_participants(UUID, UUID, UUID);
DROP FUNCTION IF EXISTS create_notification(UUID, TEXT, UUID);
DROP FUNCTION IF EXISTS get_user_notifications(UUID);
DROP FUNCTION IF EXISTS handle_discussion_notification();
DROP FUNCTION IF EXISTS handle_private_discussion_notification();

-- Drop any triggers that might be trying to create notifications
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    -- Find and drop any triggers that might reference notifications
    FOR trigger_record IN 
        SELECT trigger_name, event_object_table 
        FROM information_schema.triggers 
        WHERE trigger_name LIKE '%notification%' 
        OR trigger_name LIKE '%notify%'
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || trigger_record.trigger_name || ' ON ' || trigger_record.event_object_table || ' CASCADE';
    END LOOP;
END $$;

-- Ensure the notifications table is completely removed
DROP TABLE IF EXISTS notifications CASCADE;

-- Verify discussions and private_discussions tables are working
-- These should already be properly set up by previous migrations 