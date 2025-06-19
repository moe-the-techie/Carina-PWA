import React from 'react';
import PageFade from '../components/PageFade';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();
  const theme = useTheme();

  return (
    <PageFade>
    <div className="h-[90vh] flex flex-col items-center justify-center">
      <Box sx={{ backgroundColor: theme.palette.background.container, p: 4, borderRadius: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h1 className="text-3xl font-semibold text-blue-600 mb-4 text-center">
          Plans Page. (Under Construction)
        </h1>
        <Button onClick={() => navigate('/new-form')} variant="contained" color="primary" className="w-full" disableElevation>
          Add New Form
        </Button>
      </Box>
    </div>
    </PageFade>
  );
}
