import { useState, useEffect } from 'react';

interface OrientationState {
  isPortrait: boolean;
  isMobile: boolean;
}

export const useOrientation = (): OrientationState => {
  const [state, setState] = useState<OrientationState>(() => {
    if (typeof window === 'undefined') {
      return { isPortrait: false, isMobile: false };
    }
    
    const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isPortrait = window.innerHeight > window.innerWidth;
    
    return { isPortrait, isMobile };
  });

  useEffect(() => {
    const checkOrientation = () => {
      const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isPortrait = window.innerHeight > window.innerWidth;
      
      setState({ isPortrait, isMobile });
    };

    // Check on mount
    checkOrientation();

    // Listen for orientation changes
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    // Also use matchMedia for more reliable detection
    const mediaQuery = window.matchMedia('(orientation: portrait)');
    const handleMediaChange = () => checkOrientation();
    
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleMediaChange);
    }

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
      
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaChange);
      } else {
        mediaQuery.removeListener(handleMediaChange);
      }
    };
  }, []);

  return state;
};
