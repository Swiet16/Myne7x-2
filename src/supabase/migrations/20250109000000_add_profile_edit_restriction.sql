-- Add last_profile_edit_at column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_profile_edit_at TIMESTAMPTZ;

-- Add a comment explaining the column
COMMENT ON COLUMN profiles.last_profile_edit_at IS 'Timestamp of the last profile edit. Used to enforce 60-day edit restriction.';