import React from 'react';
import { useMediaQuery, useTheme, Box } from '@mui/material';
import NavigationBar from './NavigationBar';

export default function AuthenticatedLayout({ children }) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  return (
    <Box
      sx={{
        minHeight: '100vh',
        pb: isDesktop ? 0 : '10vh', // padding bottom only on mobile
        pt: isDesktop ? '10vh' : 0, // padding top only on desktop
      }}
    >
      <NavigationBar />
      <main>
        {children}
      </main>
    </Box>
  );
}
