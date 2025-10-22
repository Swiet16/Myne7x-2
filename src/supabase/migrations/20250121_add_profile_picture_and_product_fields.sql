-- Add profile picture URL to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT,
ADD COLUMN IF NOT EXISTS last_profile_edit_at TIMESTAMP WITH TIME ZONE;

-- Add team/owner fields to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS creator TEXT,
ADD COLUMN IF NOT EXISTS developer TEXT,
ADD COLUMN IF NOT EXISTS graphics_designer TEXT,
ADD COLUMN IF NOT EXISTS team_type TEXT CHECK (team_type IN ('owner', 'team', 'custom')),
ALTER COLUMN description TYPE TEXT;

-- Create index for profile picture lookups
CREATE INDEX IF NOT EXISTS idx_profiles_profile_picture ON profiles(profile_picture_url);

-- Create index for product team type
CREATE INDEX IF NOT EXISTS idx_products_team_type ON products(team_type);

-- Add comment for clarity
COMMENT ON COLUMN profiles.profile_picture_url IS 'URL to user profile picture stored in Supabase Storage';
COMMENT ON COLUMN products.team_type IS 'Type of team: owner (single owner), team (Team Myne7x), or custom (user-defined)';
COMMENT ON COLUMN products.creator IS 'Name of the product creator';
COMMENT ON COLUMN products.developer IS 'Name of the product developer';
COMMENT ON COLUMN products.graphics_designer IS 'Name of the graphics designer';
