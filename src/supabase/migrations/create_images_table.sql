-- Create a table to store website images
CREATE TABLE public.website_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  image_url TEXT NOT NULL,
  is_hero_image BOOLEAN DEFAULT FALSE,
  is_slider_image BOOLEAN DEFAULT FALSE,
  display_order INT,
  alt_text TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable Row Level Security (RLS) for the table
ALTER TABLE public.website_images ENABLE ROW LEVEL SECURITY;

-- Create policies for website_images table

-- Policy for authenticated users to insert images (e.g., from admin dashboard)
CREATE POLICY "Authenticated users can insert images" ON public.website_images
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy for authenticated users to update their own images
CREATE POLICY "Authenticated users can update their own images" ON public.website_images
  FOR UPDATE USING (auth.uid() = uploaded_by);

-- Policy for authenticated users to delete their own images
CREATE POLICY "Authenticated users can delete their own images" ON public.website_images
  FOR DELETE USING (auth.uid() = uploaded_by);

-- Policy for all users (including anonymous) to view images
CREATE POLICY "All users can view images" ON public.website_images
  FOR SELECT USING (true);

-- Create a table to store contact details
CREATE TABLE public.contact_details (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  phone_number TEXT,
  email TEXT,
  address TEXT,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable Row Level Security (RLS) for the contact_details table
ALTER TABLE public.contact_details ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to insert contact details (e.g., from admin dashboard)
CREATE POLICY "Authenticated users can insert contact details" ON public.contact_details
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy for authenticated users to update contact details
CREATE POLICY "Authenticated users can update contact details" ON public.contact_details
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Policy for all users (including anonymous) to view contact details
CREATE POLICY "All users can view contact details" ON public.contact_details
  FOR SELECT USING (true);

-- Insert initial contact details if the table is empty
INSERT INTO public.contact_details (phone_number, email, address)
SELECT '+1234567890', 'info@myne7x.com', '123 Myne7x Street, Digital City'
WHERE NOT EXISTS (SELECT 1 FROM public.contact_details);

