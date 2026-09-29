import { useState, useEffect } from 'react';

export const TABLET_LANDSCAPE_QUERY = '(min-width: 900px) and (orientation: landscape)';

/**
 * Pure helper function to verify if the viewport is currently in tablet landscape mode.
 * Any device in portrait orientation (phone or tablet of any width) returns false.
 */
export const checkIsTabletLandscape = (): boolean => {
  if (typeof window === 'undefined') return false;
  // A device is in portrait if height >= width OR orientation query is portrait
  const isPortrait = window.innerHeight >= window.innerWidth || window.matchMedia('(orientation: portrait)').matches;
  if (isPortrait) return false;

  // In landscape: must be at least 900px wide
  const isLandscape = window.innerWidth > window.innerHeight && window.matchMedia('(orientation: landscape)').matches;
  return isLandscape && window.innerWidth >= 900;
};

/**
 * Hook to detect if the current device/viewport is in tablet landscape mode
 * (viewport width >= 900px and landscape orientation).
 * Dynamically reacts to window resizing, screen orientation API, and tablet rotation mid-use.
 */
export function useTabletLandscape(): boolean {
  const [isTabletLandscape, setIsTabletLandscape] = useState<boolean>(() => checkIsTabletLandscape());

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mqlLandscape = window.matchMedia(TABLET_LANDSCAPE_QUERY);
    const mqlPortrait = window.matchMedia('(orientation: portrait)');
    
    const updateMatches = () => {
      setIsTabletLandscape(checkIsTabletLandscape());
    };

    // Run once on mount to ensure fresh sync
    updateMatches();

    // Listen to media query changes
    if (mqlLandscape.addEventListener) {
      mqlLandscape.addEventListener('change', updateMatches);
      mqlPortrait.addEventListener('change', updateMatches);
    } else {
      mqlLandscape.addListener(updateMatches);
      mqlPortrait.addListener(updateMatches);
    }

    // Listen to window resize, orientationchange and modern screen orientation events
    window.addEventListener('resize', updateMatches);
    window.addEventListener('orientationchange', updateMatches);
    window.screen?.orientation?.addEventListener?.('change', updateMatches);

    return () => {
      if (mqlLandscape.removeEventListener) {
        mqlLandscape.removeEventListener('change', updateMatches);
        mqlPortrait.removeEventListener('change', updateMatches);
      } else {
        mqlLandscape.removeListener(updateMatches);
        mqlPortrait.removeListener(updateMatches);
      }
      window.removeEventListener('resize', updateMatches);
      window.removeEventListener('orientationchange', updateMatches);
      window.screen?.orientation?.removeEventListener?.('change', updateMatches);
    };
  }, []);

  return isTabletLandscape;
}
