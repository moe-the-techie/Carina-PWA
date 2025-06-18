import React from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import LandingButton from '../components/LandingButton.jsx';
import PageFade from '../components/PageFade';

export default function SettingsPage({ onLogin }) {
  const navigate = useNavigate();
  const theme = useTheme();

  const handleLogout = () => {
    localStorage.removeItem('token');
    onLogin();
    navigate('/');
  };

  return (
    <PageFade>
    <div className="h-[90vh] flex flex-col items-center justify-center">
      <Box sx={{ backgroundColor: theme.palette.background.container, p: 4, borderRadius: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h1 className="text-3xl font-semibold text-blue-600 mb-4">
          Settings Page. (Under Construction)
        </h1>
        <p className="text-gray-700 mb-6">You are currently logged in!</p>
        <LandingButton onClick={handleLogout}>Logout</LandingButton>
      </Box>
    </div>
    </PageFade>
  );
}
