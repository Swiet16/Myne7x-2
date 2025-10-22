import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top whenever the pathname changes
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth' // Changed from 'instant' to 'smooth' to prevent black flash
    });
  }, [pathname]);

  return null;
};

export default ScrollToTop;