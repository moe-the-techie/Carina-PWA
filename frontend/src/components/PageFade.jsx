import React from 'react';
import { Box, Fade } from '@mui/material';

export default function PageFade({ children }) {
  return (
    <Fade in timeout={300}>
      <Box sx={{ width: '100%', height: '100%' }}>
        {children}
      </Box>
    </Fade>
  );
}
