/**
 * Custom hook to provide mobile-optimized animation configurations
 * Automatically adjusts animation durations and behaviors based on screen size and user preferences
 */

import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 600;

export const useResponsiveAnimation = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    };

    // Check for reduced motion preference
    const checkReducedMotion = () => {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
    };

    // Initial checks
    checkMobile();
    checkReducedMotion();

    // Event listeners
    window.addEventListener('resize', checkMobile);
    
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    mediaQuery.addEventListener('change', checkReducedMotion);

    return () => {
      window.removeEventListener('resize', checkMobile);
      mediaQuery.removeEventListener('change', checkReducedMotion);
    };
  }, []);

  // Get responsive duration (shorter on mobile, minimal if reduced motion)
  const getDuration = (desktop, mobile = desktop * 0.5) => {
    if (prefersReducedMotion) return 0.1;
    return isMobile ? mobile : desktop;
  };

  // Get responsive delay (shorter on mobile)
  const getDelay = (desktop, mobile = desktop * 0.5) => {
    if (prefersReducedMotion) return 0;
    return isMobile ? mobile : desktop;
  };

  // Get responsive stagger (less on mobile)
  const getStagger = (desktop, mobile = desktop * 0.5) => {
    if (prefersReducedMotion) return 0;
    return isMobile ? mobile : desktop;
  };

  // Get responsive spring config
  const getSpring = (config) => {
    if (prefersReducedMotion) {
      return { type: 'tween', duration: 0.1 };
    }
    
    if (isMobile) {
      return {
        ...config,
        stiffness: config.stiffness * 1.3, // Slightly stiffer on mobile
        damping: config.damping * 1.2,     // More damping on mobile
      };
    }
    
    return config;
  };

  // Get responsive ease
  const getEase = (ease = [0.16, 1, 0.3, 1]) => {
    if (prefersReducedMotion) return 'linear';
    return isMobile ? 'easeOut' : ease;
  };

  return {
    isMobile,
    prefersReducedMotion,
    getDuration,
    getDelay,
    getStagger,
    getSpring,
    getEase,
    // Quick presets
    presets: {
      fast: {
        duration: getDuration(0.2, 0.1),
        ease: getEase(),
      },
      normal: {
        duration: getDuration(0.4, 0.2),
        ease: getEase(),
      },
      slow: {
        duration: getDuration(0.6, 0.3),
        ease: getEase(),
      },
      spring: getSpring({
        type: 'spring',
        stiffness: 300,
        damping: 25,
      }),
      gentleSpring: getSpring({
        type: 'spring',
        stiffness: 200,
        damping: 20,
      }),
    }
  };
};

export default useResponsiveAnimation;