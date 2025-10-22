// Visitor tracking utilities
import { supabase } from '@/integrations/supabase/client';

// Generate a unique visitor ID (stored in localStorage)
export const getVisitorId = (): string => {
  const storageKey = 'myne7x_visitor_id';
  let visitorId = localStorage.getItem(storageKey);
  
  if (!visitorId) {
    visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem(storageKey, visitorId);
  }
  
  return visitorId;
};

// Generate a session ID (stored in sessionStorage)
export const getSessionId = (): string => {
  const storageKey = 'myne7x_session_id';
  let sessionId = sessionStorage.getItem(storageKey);
  
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    sessionStorage.setItem(storageKey, sessionId);
  }
  
  return sessionId;
};

// Detect device type
export const getDeviceType = (): string => {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
};

// Detect browser
export const getBrowser = (): string => {
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  if (ua.includes('Opera')) return 'Opera';
  return 'Unknown';
};

// Detect OS
export const getOS = (): string => {
  const ua = navigator.userAgent;
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac OS')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iOS')) return 'iOS';
  return 'Unknown';
};

// Get location data from IP (using ipapi.co - free tier)
export const getLocationData = async (): Promise<{
  country: string;
  country_code: string;
  city: string;
  region: string;
  ip: string;
} | null> => {
  try {
    const response = await fetch('https://ipapi.co/json/');
    if (response.ok) {
      const data = await response.json();
      return {
        country: data.country_name || 'Unknown',
        country_code: data.country_code || 'XX',
        city: data.city || 'Unknown',
        region: data.region || 'Unknown',
        ip: data.ip || 'Unknown'
      };
    }
  } catch (error) {
    console.error('Error fetching location:', error);
  }
  return null;
};

// Track page visit
export const trackPageVisit = async (pageUrl: string): Promise<void> => {
  try {
    const visitorId = getVisitorId();
    const sessionId = getSessionId();
    const locationData = await getLocationData();
    
    const visitData = {
      visitor_id: visitorId,
      session_id: sessionId,
      page_url: pageUrl,
      country: locationData?.country || null,
      country_code: locationData?.country_code || null,
      city: locationData?.city || null,
      region: locationData?.region || null,
      ip_address: locationData?.ip || null,
      user_agent: navigator.userAgent,
      device_type: getDeviceType(),
      browser: getBrowser(),
      os: getOS(),
      referrer: document.referrer || null
    };

    await supabase.from('website_visitors').insert(visitData);
  } catch (error) {
    console.error('Error tracking visit:', error);
  }
};

// Update visit duration (call on page unload)
export const updateVisitDuration = async (duration: number): Promise<void> => {
  try {
    const visitorId = getVisitorId();
    const sessionId = getSessionId();
    
    await supabase.rpc('update_visit_duration', {
      p_visitor_id: visitorId,
      p_session_id: sessionId,
      p_duration: duration
    });
  } catch (error) {
    console.error('Error updating visit duration:', error);
  }
};