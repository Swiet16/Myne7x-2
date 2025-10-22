-- Create team_members table for managing team information
CREATE TABLE IF NOT EXISTS team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  bio TEXT,
  picture_url TEXT,
  is_owner BOOLEAN DEFAULT false,
  badge_type TEXT CHECK (badge_type IN ('golden_pro', 'pro', 'instagram', NULL)),
  social_links JSONB DEFAULT '{}'::jsonb,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can view team members" ON team_members
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage team members" ON team_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Create index for ordering
CREATE INDEX IF NOT EXISTS idx_team_members_display_order ON team_members(display_order);
CREATE INDEX IF NOT EXISTS idx_team_members_is_owner ON team_members(is_owner) WHERE is_owner = true;

-- Create trigger for updated_at
CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default owner (customize this)
INSERT INTO team_members (name, bio, picture_url, is_owner, badge_type, social_links, display_order)
VALUES (
  'Myne7x',
  'Founder & Lead Developer',
  '',
  true,
  'golden_pro',
  '{
    "github": "myne7x",
    "youtube": "",
    "facebook": "",
    "instagram": "",
    "x": ""
  }'::jsonb,
  0
)
ON CONFLICT DO NOTHING;