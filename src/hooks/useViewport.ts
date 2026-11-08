// ============================================================
// DevSpend — useViewport Hook
// Responsive Breakpoint & Device Viewport Detection
// ============================================================

import { useState, useEffect } from 'react';

export interface ViewportState {
  width: number;
  height: number;
  isMobile: boolean; // < 768px
  isTablet: boolean; // 768px - 1024px
  isDesktop: boolean; // > 1024px
  orientation: 'portrait' | 'landscape';
}

export function useViewport(): ViewportState {
  const [viewport, setViewport] = useState<ViewportState>(() => {
    if (typeof window === 'undefined') {
      return {
        width: 1200,
        height: 800,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        orientation: 'landscape',
      };
    }
    const width = window.innerWidth;
    const height = window.innerHeight;
    return {
      width,
      height,
      isMobile: width < 768,
      isTablet: width >= 768 && width <= 1024,
      isDesktop: width > 1024,
      orientation: height >= width ? 'portrait' : 'landscape',
    };
  });

  useEffect(() => {
    let timeoutId: any = null;

    const handleResize = () => {
      // Debounce slightly for 60fps responsiveness without layout thrashing
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        setViewport({
          width,
          height,
          isMobile: width < 768,
          isTablet: width >= 768 && width <= 1024,
          isDesktop: width > 1024,
          orientation: height >= width ? 'portrait' : 'landscape',
        });
      }, 50);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleResize, { passive: true });

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return viewport;
}

export default useViewport;
