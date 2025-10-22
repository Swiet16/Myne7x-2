-- Create website_visitors table for tracking visitor analytics
CREATE TABLE IF NOT EXISTS website_visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT NOT NULL, -- Unique identifier for each visitor (generated client-side)
  page_url TEXT NOT NULL,
  country TEXT,
  country_code TEXT,
  city TEXT,
  region TEXT,
  ip_address TEXT,
  user_agent TEXT,
  device_type TEXT, -- mobile, tablet, desktop
  browser TEXT,
  os TEXT,
  referrer TEXT,
  session_id TEXT,
  visit_duration INTEGER DEFAULT 0, -- in seconds
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_visitors_created_at ON website_visitors(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visitors_visitor_id ON website_visitors(visitor_id);
CREATE INDEX IF NOT EXISTS idx_visitors_country ON website_visitors(country);
CREATE INDEX IF NOT EXISTS idx_visitors_country_code ON website_visitors(country_code);
CREATE INDEX IF NOT EXISTS idx_visitors_session_id ON website_visitors(session_id);
CREATE INDEX IF NOT EXISTS idx_visitors_page_url ON website_visitors(page_url);

-- Create a view for daily visitor stats
CREATE OR REPLACE VIEW daily_visitor_stats AS
SELECT 
  DATE(created_at) as visit_date,
  COUNT(DISTINCT visitor_id) as unique_visitors,
  COUNT(*) as total_visits,
  COUNT(DISTINCT session_id) as total_sessions,
  COUNT(DISTINCT country) as countries_count
FROM website_visitors
GROUP BY DATE(created_at)
ORDER BY visit_date DESC;

-- Create a view for country stats
CREATE OR REPLACE VIEW visitor_country_stats AS
SELECT 
  country,
  country_code,
  COUNT(DISTINCT visitor_id) as unique_visitors,
  COUNT(*) as total_visits,
  COUNT(DISTINCT session_id) as sessions
FROM website_visitors
WHERE country IS NOT NULL
GROUP BY country, country_code
ORDER BY unique_visitors DESC;

-- Create a view for real-time visitor stats (last 24 hours)
CREATE OR REPLACE VIEW realtime_visitor_stats AS
SELECT 
  COUNT(DISTINCT visitor_id) as unique_visitors_24h,
  COUNT(*) as total_visits_24h,
  COUNT(DISTINCT session_id) as sessions_24h,
  COUNT(DISTINCT country) as countries_24h,
  COUNT(CASE WHEN created_at >= NOW() - INTERVAL '1 hour' THEN 1 END) as visits_last_hour,
  COUNT(DISTINCT CASE WHEN created_at >= NOW() - INTERVAL '5 minutes' THEN visitor_id END) as active_now
FROM website_visitors
WHERE created_at >= NOW() - INTERVAL '24 hours';

-- Enable RLS (Row Level Security)
ALTER TABLE website_visitors ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert visitor data (for tracking)
CREATE POLICY "Allow insert for all users" ON website_visitors
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Allow admins to view all visitor data
CREATE POLICY "Allow select for admins" ON website_visitors
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Allow public access to views for stats (admins only through API)
GRANT SELECT ON daily_visitor_stats TO authenticated;
GRANT SELECT ON visitor_country_stats TO authenticated;
GRANT SELECT ON realtime_visitor_stats TO authenticated;

-- Create function to update visit duration
CREATE OR REPLACE FUNCTION update_visit_duration(
  p_visitor_id TEXT,
  p_session_id TEXT,
  p_duration INTEGER
)
RETURNS void AS $$
BEGIN
  UPDATE website_visitors
  SET 
    visit_duration = p_duration,
    updated_at = NOW()
  WHERE visitor_id = p_visitor_id 
    AND session_id = p_session_id
    AND created_at = (
      SELECT MAX(created_at) 
      FROM website_visitors 
      WHERE visitor_id = p_visitor_id 
        AND session_id = p_session_id
    );
END;
$$ LANGUAGE plpgsql;

-- Create function to get growth stats
CREATE OR REPLACE FUNCTION get_visitor_growth_stats(days INTEGER DEFAULT 30)
RETURNS TABLE(
  date DATE,
  unique_visitors BIGINT,
  total_visits BIGINT,
  growth_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH daily_stats AS (
    SELECT 
      DATE(created_at) as visit_date,
      COUNT(DISTINCT visitor_id) as visitors,
      COUNT(*) as visits
    FROM website_visitors
    WHERE created_at >= CURRENT_DATE - days
    GROUP BY DATE(created_at)
  ),
  stats_with_previous AS (
    SELECT 
      visit_date,
      visitors,
      visits,
      LAG(visitors) OVER (ORDER BY visit_date) as prev_visitors
    FROM daily_stats
  )
  SELECT 
    visit_date as date,
    visitors as unique_visitors,
    visits as total_visits,
    CASE 
      WHEN prev_visitors IS NULL OR prev_visitors = 0 THEN 0
      ELSE ROUND(((visitors - prev_visitors)::NUMERIC / prev_visitors * 100), 2)
    END as growth_rate
  FROM stats_with_previous
  ORDER BY visit_date DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE website_visitors IS 'Stores website visitor tracking data with country detection and analytics';
COMMENT ON VIEW daily_visitor_stats IS 'Daily aggregated visitor statistics';
COMMENT ON VIEW visitor_country_stats IS 'Visitor statistics grouped by country';
COMMENT ON VIEW realtime_visitor_stats IS 'Real-time visitor statistics for the last 24 hours';