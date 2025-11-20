import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import IconButton from '@mui/material/IconButton';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import HomeFilledIcon from '@mui/icons-material/Home';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import SettingsIcon from '@mui/icons-material/Settings';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import Badge from '@mui/material/Badge';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import ThemeToggle from './ThemeToggle';
import { useUnreadCount } from '../contexts/UnreadCountContext';

export default function NavigationBar() {
  const location = useLocation();
  const theme = useTheme();
  const { unreadCount } = useUnreadCount();

  const navItems = [
    { to: '/home', outlinedIcon: <HomeOutlinedIcon />, filledIcon: <HomeFilledIcon />, label: 'Home' },
    { to: '/chat', outlinedIcon: <ChatBubbleOutlineIcon />, filledIcon: <ChatBubbleIcon />, label: 'Chat' },
    { to: '/settings', outlinedIcon: <SettingsOutlinedIcon />, filledIcon: <SettingsIcon />, label: 'Settings' }
  ];

  return (
    <Box
      component="nav"
      className="fixed bottom-0 md:top-0 md:bottom-auto w-full shadow-md z-50"
      sx={{
        backgroundColor: theme.palette.background.paper,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        py: { xs: 0.5, md: 1 },
        height: { xs: '60px', md: '10vh' },
        minHeight: '60px',
        px: { xs: 1, md: 2 }
      }}
    >
      <Box
        component="ul"
        sx={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          width: '100%',
          height: '100%',
          listStyle: 'none',
          margin: 0,
          padding: 0,
          maxWidth: { xs: '100%', md: '600px' }
        }}
      >
        {navItems.map(({ to, outlinedIcon, filledIcon, label }) => {
          const isActive = location.pathname === to;
          return (
            <li key={to}>
              <Link to={to} style={{ textDecoration: 'none' }}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: { xs: '60px', md: '80px' },
                    py: { xs: 0.5, md: 1 }
                  }}
                >
                  <IconButton
                    color="inherit"
                    aria-label={label}
                    sx={{
                      width: { xs: '40px', md: '48px' },
                      height: { xs: '40px', md: '48px' },
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isActive ? theme.palette.primary.main : '#666',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)'
                      }
                    }}
                  >
                    {to === '/chat' ? (
                      <Badge badgeContent={unreadCount} color="error" max={99}>
                        {React.cloneElement(isActive ? filledIcon : outlinedIcon, {
                          fontSize: 'inherit',
                          sx: { fontSize: { xs: '20px', md: '24px' } }
                        })}
                      </Badge>
                    ) : (
                      React.cloneElement(isActive ? filledIcon : outlinedIcon, {
                        fontSize: 'inherit',
                        sx: { fontSize: { xs: '20px', md: '24px' } }
                      })
                    )}
                  </IconButton>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      fontSize: { xs: '10px', md: '12px' },
                      color: isActive ? theme.palette.primary.main : '#666',
                      mt: { xs: 0.25, md: 0.5 },
                      fontWeight: isActive ? 'bold' : 'normal'
                    }}
                  >
                    {label}
                  </Typography>
                </Box>
              </Link>
            </li>
          );
        })}
      </Box>
      <Box sx={{ 
        position: 'absolute', 
        right: { xs: 8, md: 16 },
        display: 'flex',
        alignItems: 'center'
      }}>
        <ThemeToggle />
      </Box>
      <Divider sx={{ 
        position: 'absolute', 
        top: { xs: 0, md: 'auto' }, 
        bottom: { xs: 'auto', md: 0 }, 
        width: '100%' 
      }} />
    </Box>
  );
}
