import { useState, useEffect } from 'react';

export const TABLET_LANDSCAPE_QUERY = '(min-width: 900px) and (orientation: landscape)';

/**
 * Hook to detect if the current device/viewport is in tablet landscape mode
 * (viewport width >= 900px and landscape orientation).
 * Dynamically reacts to window resizing and tablet rotation mid-use.
 */
export function useTabletLandscape(): boolean {
  const [isTabletLandscape, setIsTabletLandscape] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(TABLET_LANDSCAPE_QUERY).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mql = window.matchMedia(TABLET_LANDSCAPE_QUERY);
    
    const updateMatches = () => {
      setIsTabletLandscape(mql.matches);
    };

    // Run once on mount to ensure fresh sync
    updateMatches();

    // Listen to media query changes
    if (mql.addEventListener) {
      mql.addEventListener('change', updateMatches);
    } else {
      // Fallback for older browsers
      mql.addListener(updateMatches);
    }

    // Also listen to window resize and orientationchange events
    window.addEventListener('resize', updateMatches);
    window.addEventListener('orientationchange', updateMatches);

    return () => {
      if (mql.removeEventListener) {
        mql.removeEventListener('change', updateMatches);
      } else {
        mql.removeListener(updateMatches);
      }
      window.removeEventListener('resize', updateMatches);
      window.removeEventListener('orientationchange', updateMatches);
    };
  }, []);

  return isTabletLandscape;
}
