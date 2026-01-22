import React from 'react';
import { useMediaQuery, useTheme, Box } from '@mui/material';
import NavigationBar from './NavigationBar';
import OnboardingOverlay from './OnboardingOverlay';

export default function AuthenticatedLayout({ children }) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  return (
    <Box
      sx={{
        minHeight: '100vh',
        pb: isDesktop ? 0 : 'calc(80px + env(safe-area-inset-bottom))', // Bottom padding for mobile nav bar
        pt: isDesktop ? '10vh' : 0,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <OnboardingOverlay />
      <NavigationBar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 0, md: 3 },
          maxWidth: '100vw',
          overflow: 'hidden'
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
