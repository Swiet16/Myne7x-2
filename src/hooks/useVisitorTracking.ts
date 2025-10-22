import { useEffect, useRef } from 'react';
import { trackVisitor, getDeviceInfo, getSessionId } from '@/lib/api/visitors';

// Location data structure
interface LocationData {
  country_name?: string;
  country_code?: string;
  city?: string;
  region?: string;
  ip?: string;
}

// Try multiple geolocation APIs with fallbacks
async function getLocationData(): Promise<LocationData> {
  // API 1: ipapi.co (Primary)
  try {
    const response = await fetch('https://ipapi.co/json/', {
      headers: { 'Accept': 'application/json' }
    });
    if (response.ok) {
      const data = await response.json();
      if (data.country_name && data.country_name !== 'Unknown') {
        return {
          country_name: data.country_name,
          country_code: data.country_code,
          city: data.city,
          region: data.region,
          ip: data.ip
        };
      }
    }
  } catch (error) {
    console.log('ipapi.co failed, trying fallback...');
  }

  // API 2: ip-api.com (Fallback 1)
  try {
    const response = await fetch('https://ip-api.com/json/?fields=status,country,countryCode,regionName,city,query');
    if (response.ok) {
      const data = await response.json();
      if (data.status === 'success' && data.country) {
        return {
          country_name: data.country,
          country_code: data.countryCode,
          city: data.city,
          region: data.regionName,
          ip: data.query
        };
      }
    }
  } catch (error) {
    console.log('ip-api.com failed, trying next fallback...');
  }

  // API 3: ipwhois.app (Fallback 2)
  try {
    const response = await fetch('https://ipwhois.app/json/');
    if (response.ok) {
      const data = await response.json();
      if (data.country && data.country !== 'Unknown') {
        return {
          country_name: data.country,
          country_code: data.country_code,
          city: data.city,
          region: data.region,
          ip: data.ip
        };
      }
    }
  } catch (error) {
    console.log('ipwhois.app failed, trying last fallback...');
  }

  // API 4: ipgeolocation.io (Fallback 3 - Free tier: 30,000 requests/month)
  try {
    const response = await fetch('https://api.ipgeolocation.io/ipgeo?apiKey=free');
    if (response.ok) {
      const data = await response.json();
      if (data.country_name && data.country_name !== 'Unknown') {
        return {
          country_name: data.country_name,
          country_code: data.country_code2,
          city: data.city,
          region: data.state_prov,
          ip: data.ip
        };
      }
    }
  } catch (error) {
    console.log('All geolocation APIs failed');
  }

  // All APIs failed - return Unknown
  return {
    country_name: 'Unknown',
    country_code: 'XX',
    city: 'Unknown',
    region: 'Unknown',
    ip: 'Unknown'
  };
}

export const useVisitorTracking = () => {
  const hasTracked = useRef(false);

  useEffect(() => {
    // Prevent duplicate tracking
    if (hasTracked.current) return;
    hasTracked.current = true;

    const trackVisit = async () => {
      try {
        // Get device info
        const { device, browser, os } = getDeviceInfo();
        const sessionId = getSessionId();

        // Get location data with fallbacks
        const locationData = await getLocationData(); 
        
        // Track the visitor
        await trackVisitor({
          ip_address: locationData?.ip || 'Unknown',
          country: locationData?.country_name || 'Unknown',
          country_code: locationData?.country_code || 'Unknown',
          city: locationData?.city || 'Unknown',
          region: locationData?.region || 'Unknown',
          user_agent: navigator.userAgent,
          page_path: window.location.pathname,
          referrer: document.referrer || 'Direct',
          device_type: device,
          browser: browser,
          os: os,
          session_id: sessionId,
        });
      } catch (error) {
        console.error('Error tracking visitor:', error);
      }
    };

    trackVisit();
  }, []);
};