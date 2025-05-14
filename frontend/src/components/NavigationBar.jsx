import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import IconButton from '@mui/material/IconButton';
import HomeFilledIcon from '@mui/icons-material/HomeFilled';
import SettingsIcon from '@mui/icons-material/Settings';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';

export default function NavigationBar() {
  const location = useLocation();
  const theme = useTheme();

  const navItems = [
    { to: '/home', icon: <HomeFilledIcon />, label: 'Home' },
    { to: '/chat', icon: <ChatBubbleIcon />, label: 'Chat'},
    { to: '/settings', icon: <SettingsIcon />, label: 'Settings' }
  ];

  return (
    <Box
      component="nav"
      className="fixed bottom-0 md:top-0 md:bottom-auto w-full shadow-md z-50 h-[10vh]"
      sx={{
        backgroundColor: theme.palette.primary.main,
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
        {navItems.map(({ to, icon, label }) => {
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
                        borderRadius: 15, // optional: square background
                        color: '#000',
                        backgroundColor: isActive ? theme.palette.primary.darker : 'transparent',
                        '&:hover': {
                        backgroundColor: theme.palette.primary.darker,
                        },
                    }}
                >
                    {React.cloneElement(icon, {
                        fontSize: 'inherit',
                        sx: { fontSize: '5vh' }, // or larger if you like
                    })}
                </IconButton>

              </Link>
            </li>
          );
        })}
      </Box>
    </Box>
  );
}
