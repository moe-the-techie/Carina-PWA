/**
 * Navigation Loading Context
 * 
 * Provides immediate visual feedback when navigating between routes.
 * Shows a top progress bar and tracks navigation state for instant UI updates.
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, LinearProgress } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const NavigationContext = createContext();

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
};

/**
 * Top loading bar component - shows immediately on navigation
 */
const TopLoadingBar = ({ isNavigating }) => {
  const theme = useTheme();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isNavigating) {
      setVisible(true);
      setProgress(0);
      
      // Simulate progress - fast start, slow middle, wait at 90%
      let currentProgress = 0;
      intervalRef.current = setInterval(() => {
        currentProgress += Math.random() * 15;
        if (currentProgress > 90) {
          currentProgress = 90;
          clearInterval(intervalRef.current);
        }
        setProgress(currentProgress);
      }, 100);
    } else {
      // Complete the progress bar
      setProgress(100);
      clearInterval(intervalRef.current);
      
      // Hide after animation completes
      const timeout = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 300);
      
      return () => clearTimeout(timeout);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isNavigating]);

  if (!visible) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        height: '3px',
      }}
    >
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          height: '3px',
          backgroundColor: 'transparent',
          '& .MuiLinearProgress-bar': {
            backgroundColor: theme.palette.primary.main,
            transition: progress === 100 
              ? 'transform 0.2s ease-out' 
              : 'transform 0.1s linear',
          },
        }}
      />
    </Box>
  );
};

export const NavigationProvider = ({ children }) => {
  const location = useLocation();
  const [isNavigating, setIsNavigating] = useState(false);
  const [targetPath, setTargetPath] = useState(null);
  const previousPath = useRef(location.pathname);

  // Track when navigation starts (before component loads)
  const startNavigation = useCallback((path) => {
    if (path !== location.pathname) {
      setIsNavigating(true);
      setTargetPath(path);
    }
  }, [location.pathname]);

  // Track when navigation completes (component has loaded)
  useEffect(() => {
    // Navigation completed - we're at a new path
    if (previousPath.current !== location.pathname) {
      // Small delay to ensure the component has rendered
      const timeout = setTimeout(() => {
        setIsNavigating(false);
        setTargetPath(null);
      }, 50);
      
      previousPath.current = location.pathname;
      return () => clearTimeout(timeout);
    }
  }, [location.pathname]);

  // Get the "visual" active path - either the target we're navigating to or current location
  const getActivePath = useCallback(() => {
    return targetPath || location.pathname;
  }, [targetPath, location.pathname]);

  const value = {
    isNavigating,
    targetPath,
    currentPath: location.pathname,
    startNavigation,
    getActivePath,
  };

  return (
    <NavigationContext.Provider value={value}>
      <TopLoadingBar isNavigating={isNavigating} />
      {children}
    </NavigationContext.Provider>
  );
};

export default NavigationProvider;
