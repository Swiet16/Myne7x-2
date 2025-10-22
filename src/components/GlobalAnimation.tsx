import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WebsiteAnimations } from './WebsiteAnimations';
import { useLocation } from 'react-router-dom';

export const GlobalAnimation = () => {
  const [animationType, setAnimationType] = useState<string>('none');
  const [applyTo, setApplyTo] = useState<'home' | 'all'>('all');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const location = useLocation();

  useEffect(() => {
    loadAnimationSettings();
    
    // Detect dark mode
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode();
    
    // Watch for dark mode changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  const loadAnimationSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('website_animation')
        .select('animation_type, apply_to, is_active')
        .eq('is_active', true)
        .limit(1)
        .single();

      if (!error && data) {
        setAnimationType(data.animation_type);
        setApplyTo(data.apply_to as 'home' | 'all');
      }
    } catch (error) {
      console.error('Error loading animation settings:', error);
    }
  };

  // Determine if animation should be shown
  const shouldShowAnimation = () => {
    if (animationType === 'none') return false;
    if (applyTo === 'all') return true;
    if (applyTo === 'home' && location.pathname === '/') return true;
    return false;
  };

  if (!shouldShowAnimation()) return null;

  return <WebsiteAnimations animationType={animationType} isDarkMode={isDarkMode} />;
};