-- Final Enhanced Supabase setup for Myne7x website
-- This script handles all database setup with proper error handling
-- Run this script in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create website_images table with proper constraints
CREATE TABLE IF NOT EXISTS website_images (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  image_url TEXT NOT NULL CHECK (image_url != ''),
  alt_text TEXT DEFAULT 'Website image',
  is_hero_image BOOLEAN DEFAULT false,
  is_slider_image BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 1 CHECK (display_order > 0),
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create contact_details table with proper constraints
CREATE TABLE IF NOT EXISTS contact_details (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  phone_number TEXT,
  email TEXT CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create storage bucket for images with proper configuration
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'images', 
    'images', 
    true, 
    52428800, -- 50MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  )
  ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Storage bucket already exists or could not be created: %', SQLERRM;
END $$;

-- Enable RLS on tables
ALTER TABLE website_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_details ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public can view website images" ON website_images;
DROP POLICY IF EXISTS "Authenticated users can insert website images" ON website_images;
DROP POLICY IF EXISTS "Users can update their own website images" ON website_images;
DROP POLICY IF EXISTS "Users can delete their own website images" ON website_images;
DROP POLICY IF EXISTS "Admin can manage all website images" ON website_images;

DROP POLICY IF EXISTS "Public can view contact details" ON contact_details;
DROP POLICY IF EXISTS "Authenticated users can manage contact details" ON contact_details;
DROP POLICY IF EXISTS "Admin can manage contact details" ON contact_details;

-- Create comprehensive RLS policies for website_images
CREATE POLICY "Public can view website images" ON website_images
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert website images" ON website_images
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own website images" ON website_images
  FOR UPDATE USING (
    auth.uid() = uploaded_by OR 
    auth.email() = 'myne7x@gmail.com' OR
    auth.jwt() ->> 'email' = 'myne7x@gmail.com'
  );

CREATE POLICY "Users can delete their own website images" ON website_images
  FOR DELETE USING (
    auth.uid() = uploaded_by OR 
    auth.email() = 'myne7x@gmail.com' OR
    auth.jwt() ->> 'email' = 'myne7x@gmail.com'
  );

CREATE POLICY "Admin can manage all website images" ON website_images
  FOR ALL USING (
    auth.email() = 'myne7x@gmail.com' OR
    auth.jwt() ->> 'email' = 'myne7x@gmail.com'
  );

-- Create comprehensive RLS policies for contact_details
CREATE POLICY "Public can view contact details" ON contact_details
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage contact details" ON contact_details
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can manage contact details" ON contact_details
  FOR ALL USING (
    auth.email() = 'myne7x@gmail.com' OR
    auth.jwt() ->> 'email' = 'myne7x@gmail.com'
  );

-- Drop existing storage policies to avoid conflicts
DROP POLICY IF EXISTS "Public can view images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;
DROP POLICY IF EXISTS "Admin can manage all images" ON storage.objects;

-- Create comprehensive storage policies for the images bucket
CREATE POLICY "Public can view images" ON storage.objects
  FOR SELECT USING (bucket_id = 'images');

CREATE POLICY "Authenticated users can upload images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'images' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'images' AND (
      auth.uid()::text = (storage.foldername(name))[1] OR
      auth.email() = 'myne7x@gmail.com' OR
      auth.jwt() ->> 'email' = 'myne7x@gmail.com'
    )
  );

CREATE POLICY "Users can delete their own images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'images' AND (
      auth.uid()::text = (storage.foldername(name))[1] OR
      auth.email() = 'myne7x@gmail.com' OR
      auth.jwt() ->> 'email' = 'myne7x@gmail.com'
    )
  );

CREATE POLICY "Admin can manage all images" ON storage.objects
  FOR ALL USING (
    bucket_id = 'images' AND (
      auth.email() = 'myne7x@gmail.com' OR
      auth.jwt() ->> 'email' = 'myne7x@gmail.com'
    )
  );

-- Create or replace function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at (drop first to avoid conflicts)
DROP TRIGGER IF EXISTS update_website_images_updated_at ON website_images;
CREATE TRIGGER update_website_images_updated_at
    BEFORE UPDATE ON website_images
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_contact_details_updated_at ON contact_details;
CREATE TRIGGER update_contact_details_updated_at
    BEFORE UPDATE ON contact_details
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default contact details if none exist
INSERT INTO contact_details (phone_number, email, address)
SELECT '+92 309 6626615', 'myne7x@gmail.com', 'Digital Innovation Center, Karachi, Pakistan'
WHERE NOT EXISTS (SELECT 1 FROM contact_details);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_website_images_hero ON website_images(is_hero_image) WHERE is_hero_image = true;
CREATE INDEX IF NOT EXISTS idx_website_images_slider ON website_images(is_slider_image) WHERE is_slider_image = true;
CREATE INDEX IF NOT EXISTS idx_website_images_order ON website_images(display_order);
CREATE INDEX IF NOT EXISTS idx_website_images_uploaded_by ON website_images(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_website_images_created_at ON website_images(created_at DESC);

-- Grant necessary permissions
DO $$
BEGIN
  -- Grant permissions to authenticated users
  GRANT ALL ON website_images TO authenticated;
  GRANT ALL ON contact_details TO authenticated;
  
  -- Grant select permissions to anonymous users
  GRANT SELECT ON website_images TO anon;
  GRANT SELECT ON contact_details TO anon;
  
  -- Grant usage on sequences
  GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
  GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Some permissions could not be granted: %', SQLERRM;
END $$;

-- Create a function to check if setup is complete
CREATE OR REPLACE FUNCTION check_myne7x_setup()
RETURNS TABLE (
  component TEXT,
  status TEXT,
  details TEXT
) AS $$
BEGIN
  -- Check tables
  RETURN QUERY
  SELECT 
    'website_images table'::TEXT,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'website_images') 
         THEN 'OK'::TEXT 
         ELSE 'MISSING'::TEXT 
    END,
    'Table for storing website images'::TEXT;
    
  RETURN QUERY
  SELECT 
    'contact_details table'::TEXT,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contact_details') 
         THEN 'OK'::TEXT 
         ELSE 'MISSING'::TEXT 
    END,
    'Table for storing contact information'::TEXT;
    
  -- Check storage bucket
  RETURN QUERY
  SELECT 
    'images storage bucket'::TEXT,
    CASE WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'images') 
         THEN 'OK'::TEXT 
         ELSE 'MISSING'::TEXT 
    END,
    'Storage bucket for images'::TEXT;
    
  -- Check default contact data
  RETURN QUERY
  SELECT 
    'default contact data'::TEXT,
    CASE WHEN EXISTS (SELECT 1 FROM contact_details) 
         THEN 'OK'::TEXT 
         ELSE 'MISSING'::TEXT 
    END,
    'Default contact information'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Display setup status
SELECT * FROM check_myne7x_setup();

-- Success message
DO $$
BEGIN
  RAISE NOTICE '=== Myne7x Database Setup Complete ===';
  RAISE NOTICE 'Tables created: website_images, contact_details';
  RAISE NOTICE 'Storage bucket created: images';
  RAISE NOTICE 'RLS policies applied for security';
  RAISE NOTICE 'Default contact details inserted';
  RAISE NOTICE 'Indexes created for performance';
  RAISE NOTICE 'Setup verification function created: check_myne7x_setup()';
  RAISE NOTICE '==========================================';
END $$;
