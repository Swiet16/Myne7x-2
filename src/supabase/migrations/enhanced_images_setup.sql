-- Enhanced Supabase setup for image management
-- Run this script in your Supabase SQL Editor

-- Create website_images table if it doesn't exist
CREATE TABLE IF NOT EXISTS website_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  is_hero_image BOOLEAN DEFAULT false,
  is_slider_image BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 1,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create contact_details table if it doesn't exist
CREATE TABLE IF NOT EXISTS contact_details (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT,
  email TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create storage bucket for images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on website_images table
ALTER TABLE website_images ENABLE ROW LEVEL SECURITY;

-- Enable RLS on contact_details table
ALTER TABLE contact_details ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view website images" ON website_images;
DROP POLICY IF EXISTS "Authenticated users can insert website images" ON website_images;
DROP POLICY IF EXISTS "Users can update their own website images" ON website_images;
DROP POLICY IF EXISTS "Users can delete their own website images" ON website_images;
DROP POLICY IF EXISTS "Public can view contact details" ON contact_details;
DROP POLICY IF EXISTS "Authenticated users can manage contact details" ON contact_details;

-- Create RLS policies for website_images
CREATE POLICY "Public can view website images" ON website_images
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert website images" ON website_images
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own website images" ON website_images
  FOR UPDATE USING (auth.uid() = uploaded_by OR auth.email() = 'myne7x@gmail.com');

CREATE POLICY "Users can delete their own website images" ON website_images
  FOR DELETE USING (auth.uid() = uploaded_by OR auth.email() = 'myne7x@gmail.com');

-- Create RLS policies for contact_details
CREATE POLICY "Public can view contact details" ON contact_details
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage contact details" ON contact_details
  FOR ALL USING (auth.role() = 'authenticated');

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Public can view images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;

-- Create storage policies for the images bucket
CREATE POLICY "Public can view images" ON storage.objects
  FOR SELECT USING (bucket_id = 'images');

CREATE POLICY "Authenticated users can upload images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own images" ON storage.objects
  FOR DELETE USING (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
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

-- Grant necessary permissions
GRANT ALL ON website_images TO authenticated;
GRANT ALL ON contact_details TO authenticated;
GRANT SELECT ON website_images TO anon;
GRANT SELECT ON contact_details TO anon;
