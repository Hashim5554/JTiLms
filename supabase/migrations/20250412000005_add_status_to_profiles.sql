-- Add status column to profiles if it does not exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Set status to 'active' for existing users where status is NULL
UPDATE profiles SET status = 'active' WHERE status IS NULL; 