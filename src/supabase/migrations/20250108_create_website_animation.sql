-- Create website_animation table for global background animations
CREATE TABLE IF NOT EXISTS public.website_animation (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  animation_type TEXT NOT NULL DEFAULT 'none',
  is_active BOOLEAN DEFAULT true,
  apply_to TEXT NOT NULL DEFAULT 'all', -- 'home' or 'all'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_by UUID REFERENCES auth.users(id)
);

-- Create index for faster queries
CREATE INDEX idx_website_animation_active ON public.website_animation(is_active);

-- Insert default row (no animation)
INSERT INTO public.website_animation (animation_type, is_active, apply_to)
VALUES ('none', true, 'all');

-- Enable RLS
ALTER TABLE public.website_animation ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read (to display animations)
CREATE POLICY "Anyone can view website animation"
  ON public.website_animation
  FOR SELECT
  USING (true);

-- Policy: Only super_admin can update
CREATE POLICY "Only super_admin can update website animation"
  ON public.website_animation
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'super_admin'
    )
  );

-- Policy: Only super_admin can insert
CREATE POLICY "Only super_admin can insert website animation"
  ON public.website_animation
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'super_admin'
    )
  );

-- Policy: Only super_admin can delete
CREATE POLICY "Only super_admin can delete website animation"
  ON public.website_animation
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'super_admin'
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_website_animation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_website_animation_timestamp
  BEFORE UPDATE ON public.website_animation
  FOR EACH ROW
  EXECUTE FUNCTION update_website_animation_updated_at();

COMMENT ON TABLE public.website_animation IS 'Stores global website background animation settings';
COMMENT ON COLUMN public.website_animation.animation_type IS 'Type of animation: none, data-flow, particles, waves, matrix, neural-network, cosmic-dust';
COMMENT ON COLUMN public.website_animation.apply_to IS 'Where to apply: home (homepage only) or all (all pages)';