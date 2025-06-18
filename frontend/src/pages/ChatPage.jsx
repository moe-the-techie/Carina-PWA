import React from 'react';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import PageFade from '../components/PageFade';

export default function HomePage() {
  const theme = useTheme();

  return (
    <PageFade>
    <div className="h-[90vh] flex flex-col items-center justify-center">
      <Box sx= {{ backgroundColor: theme.palette.background.container, p: 4, borderRadius: 2 }}>
        <h1 className="text-3xl font-semibold text-blue-600">
          Chat Page. (Under Construction)
        </h1>
      </Box>
    </div>
    </PageFade>
  );
}
