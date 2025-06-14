import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import IconButton from '@mui/material/IconButton';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import HomeFilledIcon from '@mui/icons-material/Home';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import SettingsIcon from '@mui/icons-material/Settings';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';

export default function NavigationBar() {
  const location = useLocation();
  const theme = useTheme();

  const navItems = [
    { to: '/home', outlinedIcon: <HomeOutlinedIcon />, filledIcon: <HomeFilledIcon />, label: 'Home' },
    { to: '/chat', outlinedIcon: <ChatBubbleOutlineIcon />, filledIcon: <ChatBubbleIcon />, label: 'Chat' },
    { to: '/settings', outlinedIcon: <SettingsOutlinedIcon />, filledIcon: <SettingsIcon />, label: 'Settings' }
  ];

  return (
    <Box
      component="nav"
      className="fixed bottom-0 md:top-0 md:bottom-auto w-full shadow-md z-50 h-[10vh]"
      sx={{
        backgroundColor: 'white', // white background
        display: 'flex',
        justifyContent: 'center',
        py: 1,
      }}
    >
      <Box
        component="ul"
        sx={{
          display: 'flex',
          justifyContent: 'space-around', // evenly spaced
          alignItems: 'center',
          width: '100%',
          height: '100%',
          listStyle: 'none',
          margin: 0,
          padding: 0,
        }}
      >
        {navItems.map(({ to, outlinedIcon, filledIcon, label }) => {
          const isActive = location.pathname === to;
          return (
            <li key={to}>
              <Link to={to}>
                <IconButton
                  color="inherit"
                  aria-label={label}
                  sx={{
                    width: '8vh', // match nav bar height
                    height: '8vh',
                    padding: 0, // remove default padding
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    
                    color: isActive ? theme.palette.primary.main : '#000',
                  }}
                >
                  {React.cloneElement(isActive ? filledIcon : outlinedIcon, {
                    fontSize: 'inherit',
                    sx: { fontSize: '5vh' }, // or larger if you like
                  })}
                </IconButton>
              </Link>
            </li>
          );
        })}
      </Box>
      <Divider sx={{ position: 'absolute', top: { xs: 0, md: 'auto' }, bottom: { xs: 'auto', md: 0 }, width: '100%' }} />
    </Box>
  );
}
