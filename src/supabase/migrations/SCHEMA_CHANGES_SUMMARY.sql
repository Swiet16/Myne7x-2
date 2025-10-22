-- =====================================================
-- COMPLETE SQL SCHEMA FOR PROFILE PICTURES AND PRODUCT ENHANCEMENTS
-- =====================================================
-- This file documents all database schema changes for:
-- 1. Profile picture upload functionality
-- 2. Product team/owner configuration
-- 3. Unlimited product descriptions
-- =====================================================

-- =====================================================
-- PART 1: PROFILES TABLE MODIFICATIONS
-- =====================================================

-- Add profile_picture_url column to store user profile pictures
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN profiles.profile_picture_url IS 
'URL to user profile picture stored in Supabase Storage. Pictures are organized by email/user_id in profile-pictures bucket.';

-- Create index for faster profile picture lookups
CREATE INDEX IF NOT EXISTS idx_profiles_profile_picture 
ON profiles(profile_picture_url);

-- Note: last_profile_edit_at already exists from previous migration
-- This column tracks the 60-day edit restriction

-- =====================================================
-- PART 2: PRODUCTS TABLE MODIFICATIONS
-- =====================================================

-- Add team/owner configuration fields
ALTER TABLE products
ADD COLUMN IF NOT EXISTS creator TEXT,
ADD COLUMN IF NOT EXISTS developer TEXT,
ADD COLUMN IF NOT EXISTS graphics_designer TEXT,
ADD COLUMN IF NOT EXISTS team_type TEXT CHECK (team_type IN ('owner', 'team', 'custom'));

-- Make description unlimited (change from VARCHAR to TEXT if needed)
-- TEXT type in PostgreSQL can store unlimited characters
ALTER TABLE products
ALTER COLUMN description TYPE TEXT;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_products_team_type 
ON products(team_type);

CREATE INDEX IF NOT EXISTS idx_products_creator 
ON products(creator);

-- Add documentation comments
COMMENT ON COLUMN products.creator IS 
'Name of the product creator. Can be "Owner", "Team Myne7x", or custom name.';

COMMENT ON COLUMN products.developer IS 
'Name of the product developer. Can be "Owner", "Team Myne7x", or custom name.';

COMMENT ON COLUMN products.graphics_designer IS 
'Name of the graphics designer. Can be "Owner", "Team Myne7x", or custom name.';

COMMENT ON COLUMN products.team_type IS 
'Type of team configuration: 
- "owner": Single creator (all fields set to "Owner")
- "team": Team-created product (all fields set to "Team Myne7x")
- "custom": Custom individual names for each role';

COMMENT ON COLUMN products.description IS 
'Product description with unlimited text length. Use TEXT type to support detailed descriptions.';

-- =====================================================
-- PART 3: STORAGE BUCKET FOR PROFILE PICTURES
-- =====================================================

-- Create storage bucket for profile pictures (public access)
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-pictures', 'profile-pictures', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- PART 4: STORAGE POLICIES FOR PROFILE PICTURES
-- =====================================================

-- Policy 1: Allow authenticated users to upload their own profile pictures
-- Files are organized by user_id in folder structure
CREATE POLICY IF NOT EXISTS "Users can upload their own profile pictures"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-pictures' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Allow authenticated users to update their own profile pictures
CREATE POLICY IF NOT EXISTS "Users can update their own profile pictures"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-pictures' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Allow authenticated users to delete their own profile pictures
CREATE POLICY IF NOT EXISTS "Users can delete their own profile pictures"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-pictures' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Allow public read access to all profile pictures
CREATE POLICY IF NOT EXISTS "Public can view profile pictures"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-pictures');

-- Add documentation comment
COMMENT ON POLICY "Users can upload their own profile pictures" ON storage.objects IS 
'Allows authenticated users to upload profile pictures in their own folder. 
Folder structure: profile-pictures/{user_email_sanitized}/profile_picture.{ext}
Example: profile-pictures/john_example_com/profile_picture.jpg';

-- =====================================================
-- PART 5: EXAMPLE QUERIES AND USAGE
-- =====================================================

-- Example 1: Select user profile with picture
-- SELECT id, email, full_name, profile_picture_url, last_profile_edit_at
-- FROM profiles
-- WHERE user_id = 'user-uuid-here';

-- Example 2: Select products with team information
-- SELECT id, title, description, creator, developer, graphics_designer, team_type
-- FROM products
-- WHERE team_type = 'team';

-- Example 3: Get all products by a specific creator
-- SELECT id, title, price, creator
-- FROM products
-- WHERE creator = 'Team Myne7x'
-- ORDER BY created_at DESC;

-- Example 4: Find products with custom team configurations
-- SELECT id, title, creator, developer, graphics_designer
-- FROM products
-- WHERE team_type = 'custom';

-- Example 5: Update user profile picture
-- UPDATE profiles
-- SET profile_picture_url = 'https://storage.url/profile-pictures/user@email.com/profile_picture.jpg',
--     updated_at = NOW()
-- WHERE user_id = 'user-uuid-here';

-- =====================================================
-- PART 6: DATA MIGRATION (If Needed)
-- =====================================================

-- If you have existing products without team_type, you can set default values:
-- UPDATE products
-- SET team_type = 'custom'
-- WHERE team_type IS NULL;

-- =====================================================
-- PART 7: FOLDER STRUCTURE DOCUMENTATION
-- =====================================================

/*
STORAGE FOLDER STRUCTURE:

profile-pictures/
├── {sanitized_email_or_user_id}/
│   ├── profile_picture.jpg (or .png, .gif, etc.)
│   └── (old versions are automatically replaced)

Example:
profile-pictures/
├── aziz_gmail_com/
│   └── profile_picture.jpg
├── john_doe_example_com/
│   └── profile_picture.png
└── user_abc123/
    └── profile_picture.gif

Note: Email addresses are sanitized by replacing non-alphanumeric 
characters with underscores to create valid folder names.
*/

-- =====================================================
-- PART 8: SECURITY NOTES
-- =====================================================

/*
SECURITY CONSIDERATIONS:

1. Profile Pictures:
   - Users can only upload/update/delete their own pictures
   - Public can view all profile pictures (read-only)
   - Folder structure prevents users from accessing other users' folders
   - Maximum file size should be enforced at application level (5MB recommended)

2. Profile Data:
   - 60-day edit restriction is enforced at application level
   - last_profile_edit_at tracks when profile details were last changed
   - Profile picture uploads are separate and not restricted by 60-day rule

3. Product Data:
   - Team/owner fields are optional (nullable)
   - team_type has CHECK constraint to ensure valid values
   - Description is unlimited but should be sanitized at application level

4. Row Level Security (RLS):
   - Ensure RLS policies are enabled on profiles and products tables
   - Storage policies prevent unauthorized access to user folders
*/

-- =====================================================
-- PART 9: PERFORMANCE OPTIMIZATION
-- =====================================================

/*
INDEXES CREATED:

1. idx_profiles_profile_picture
   - Speeds up queries filtering by profile_picture_url
   - Useful for finding users with/without profile pictures

2. idx_products_team_type
   - Enables fast filtering by team_type
   - Optimizes queries like "get all team products"

3. idx_products_creator
   - Speeds up searches by creator name
   - Useful for "created by Team Myne7x" queries

These indexes improve query performance significantly for large datasets.
*/

-- =====================================================
-- PART 10: COMPLETE SCHEMA REFERENCE
-- =====================================================

/*
PROFILES TABLE SCHEMA (Updated):

CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL,
  full_name TEXT,
  whatsapp_number TEXT,
  telegram_id TEXT,
  profile_picture_url TEXT,                    -- NEW: Profile picture URL
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_profile_edit_at TIMESTAMP WITH TIME ZONE  -- NEW: Tracks 60-day restriction
);

PRODUCTS TABLE SCHEMA (Updated):

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,                            -- UPDATED: Now unlimited (TEXT type)
  price NUMERIC NOT NULL,
  price_pkr NUMERIC,
  category TEXT,
  tags TEXT[],
  image_url TEXT,
  file_url TEXT,
  feature_images TEXT[],
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  product_animation TEXT,
  creator TEXT,                                -- NEW: Creator name
  developer TEXT,                              -- NEW: Developer name
  graphics_designer TEXT,                      -- NEW: Graphics designer name
  team_type TEXT CHECK (team_type IN ('owner', 'team', 'custom')),  -- NEW: Team type
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
*/

-- =====================================================
-- END OF SCHEMA CHANGES DOCUMENTATION
-- =====================================================
