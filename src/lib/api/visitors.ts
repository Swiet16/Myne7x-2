import { supabase } from '@/integrations/supabase/client';

export interface VisitorData {
  ip_address?: string;
  country?: string;
  country_code?: string;
  city?: string;
  region?: string;
  user_agent: string;
  page_path: string;
  referrer: string;
  device_type: string;
  browser: string;
  os: string;
  session_id: string;
}

export interface VisitorStats {
  totalVisitors: number;
  todayVisitors: number;
  weekVisitors: number;
  monthVisitors: number;
  topCountries: { country: string; count: number }[];
  dailyVisitors: { date: string; count: number }[];
  hourlyVisitors: { hour: string; count: number }[];
}

// Track a visitor
export const trackVisitor = async (data: VisitorData) => {
  try {
    const { error } = await supabase
      .from('visitors')
      .insert([data]);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error tracking visitor:', error);
    return { success: false, error };
  }
};

// Get visitor statistics
export const getVisitorStats = async (): Promise<VisitorStats | null> => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get total visitors
    const { count: totalVisitors } = await supabase
      .from('visitors')
      .select('*', { count: 'exact', head: true });

    // Get today's visitors
    const { count: todayVisitors } = await supabase
      .from('visitors')
      .select('*', { count: 'exact', head: true })
      .gte('visited_at', today.toISOString());

    // Get this week's visitors
    const { count: weekVisitors } = await supabase
      .from('visitors')
      .select('*', { count: 'exact', head: true })
      .gte('visited_at', weekAgo.toISOString());

    // Get this month's visitors
    const { count: monthVisitors } = await supabase
      .from('visitors')
      .select('*', { count: 'exact', head: true })
      .gte('visited_at', monthAgo.toISOString());

    // Get ALL countries with their visit counts (not just top 5)
    const { data: countryData } = await supabase
      .from('visitors')
      .select('country')
      .not('country', 'is', null);

    const countryCounts = (countryData || []).reduce((acc: any, item) => {
      acc[item.country] = (acc[item.country] || 0) + 1;
      return acc;
    }, {});

    // Return ALL countries sorted by count, not just top 5
    const topCountries = Object.entries(countryCounts)
      .map(([country, count]) => ({ country, count: count as number }))
      .sort((a, b) => b.count - a.count);

    // Get daily visitors for the last 7 days
    const { data: dailyData } = await supabase
      .from('visitors')
      .select('visited_at')
      .gte('visited_at', weekAgo.toISOString())
      .order('visited_at', { ascending: true });

    const dailyVisitors = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const count = (dailyData || []).filter((v) => {
        const vDate = new Date(v.visited_at);
        return vDate.toDateString() === date.toDateString();
      }).length;
      return { date: dateStr, count };
    });

    // Get hourly visitors for today
    const { data: hourlyData } = await supabase
      .from('visitors')
      .select('visited_at')
      .gte('visited_at', today.toISOString())
      .order('visited_at', { ascending: true });

    const hourlyVisitors = Array.from({ length: 24 }, (_, i) => {
      const hour = `${i.toString().padStart(2, '0')}:00`;
      const count = (hourlyData || []).filter((v) => {
        const vDate = new Date(v.visited_at);
        return vDate.getHours() === i;
      }).length;
      return { hour, count };
    });

    return {
      totalVisitors: totalVisitors || 0,
      todayVisitors: todayVisitors || 0,
      weekVisitors: weekVisitors || 0,
      monthVisitors: monthVisitors || 0,
      topCountries,
      dailyVisitors,
      hourlyVisitors,
    };
  } catch (error) {
    console.error('Error getting visitor stats:', error);
    return null;
  }
};

// Get device info
export const getDeviceInfo = () => {
  const ua = navigator.userAgent;
  let device = 'Desktop';
  let browser = 'Unknown';
  let os = 'Unknown';

  // Detect device
  if (/mobile/i.test(ua)) device = 'Mobile';
  else if (/tablet/i.test(ua)) device = 'Tablet';

  // Detect browser
  if (/chrome/i.test(ua) && !/edg/i.test(ua)) browser = 'Chrome';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
  else if (/firefox/i.test(ua)) browser = 'Firefox';
  else if (/edg/i.test(ua)) browser = 'Edge';

  // Detect OS
  if (/windows/i.test(ua)) os = 'Windows';
  else if (/mac/i.test(ua)) os = 'macOS';
  else if (/linux/i.test(ua)) os = 'Linux';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/ios|iphone|ipad/i.test(ua)) os = 'iOS';

  return { device, browser, os };
};

// Generate session ID
export const getSessionId = () => {
  let sessionId = sessionStorage.getItem('visitor_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('visitor_session_id', sessionId);
  }
  return sessionId;
};