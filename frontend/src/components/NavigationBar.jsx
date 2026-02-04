import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import IconButton from '@mui/material/IconButton';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import HomeFilledIcon from '@mui/icons-material/Home';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import SettingsIcon from '@mui/icons-material/Settings';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import CampaignIcon from '@mui/icons-material/Campaign';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
import Badge from '@mui/material/Badge';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { useUnreadCount } from '../contexts/UnreadCountContext';
import { useAnnouncementNotifications } from '../contexts/AnnouncementNotificationContext';
import { useNavigation } from '../contexts/NavigationContext';
import { spacing, transitions, zIndex, accentColors } from '../styles';

export default function NavigationBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { unreadCount } = useUnreadCount();
  const { unreadCount: announcementUnreadCount } = useAnnouncementNotifications();
  const { startNavigation, getActivePath } = useNavigation();

  // Use the "visual" active path for instant feedback
  const activePath = getActivePath();

  const navItems = [
    { to: '/home', outlinedIcon: <HomeOutlinedIcon />, filledIcon: <HomeFilledIcon />, label: 'Forms' },
    { to: '/active-plans', outlinedIcon: <PlayCircleOutlineIcon />, filledIcon: <PlayCircleFilledIcon />, label: 'Active', activeColor: accentColors.emerald.main },
    { to: '/announcements', outlinedIcon: <CampaignOutlinedIcon />, filledIcon: <CampaignIcon />, label: 'News', feature: 'VITE_ENABLE_ANNOUNCEMENTS' },
    { to: '/chat', outlinedIcon: <ChatBubbleOutlineIcon />, filledIcon: <ChatBubbleIcon />, label: 'Chat' },
    { to: '/settings', outlinedIcon: <SettingsOutlinedIcon />, filledIcon: <SettingsIcon />, label: 'Settings' }
  ].filter(item => !item.feature || import.meta.env[item.feature] !== 'false');

  // Handle navigation with instant feedback
  const handleNavClick = (e, to) => {
    e.preventDefault();
    if (to !== location.pathname) {
      startNavigation(to);
      navigate(to);
    }
  };

  return (
    <Box
      component="nav"
      sx={{
        position: 'fixed',
        bottom: { xs: 0, md: 'auto' },
        top: { xs: 'auto', md: 0 },
        width: '100%',
        boxShadow: 3,
        zIndex: zIndex.navigation,
        backgroundColor: theme.palette.background.paper,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        pt: { xs: spacing.xs, md: spacing.sm },
        pb: { xs: `calc(${spacing.xs * 8}px + env(safe-area-inset-bottom))`, md: spacing.sm },
        height: { xs: 'auto', md: '10vh' },
        minHeight: '60px',
        px: { xs: spacing.sm, md: spacing.md }
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
        {navItems.map(({ to, outlinedIcon, filledIcon, label, activeColor }) => {
          const isActive = activePath === to;
          const itemColor = isActive ? (activeColor || theme.palette.primary.main) : theme.palette.text.secondary;
          return (
            <li key={to}>
              <Box
                component="a"
                href={to}
                onClick={(e) => handleNavClick(e, to)}
                sx={{ 
                  textDecoration: 'none',
                  cursor: 'pointer',
                  display: 'block',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
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
                      transition: transitions.fast,
                      color: itemColor,
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover
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
                    ) : to === '/announcements' ? (
                      <Badge badgeContent={announcementUnreadCount} color="error" max={99}>
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
                      color: itemColor,
                      mt: { xs: 0.25, md: 0.5 },
                      fontWeight: isActive ? 600 : 400,
                      transition: transitions.fast,
                    }}
                  >
                    {label}
                  </Typography>
                </Box>
              </Box>
            </li>
          );
        })}
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
