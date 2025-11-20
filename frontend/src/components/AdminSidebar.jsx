import { Link, useLocation } from 'react-router-dom';
import {
    Box,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Typography,
    Divider,
    useTheme,
    useMediaQuery,
    IconButton,
    AppBar,
    Toolbar,
    Badge
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import DescriptionIcon from '@mui/icons-material/Description';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import TemplateIcon from '@mui/icons-material/FileCopy';
import ChatIcon from '@mui/icons-material/Chat';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import ThemeToggle from './ThemeToggle';
import { useUnreadCount } from '../contexts/UnreadCountContext';

const drawerWidth = 240;

export default function AdminSidebar({ onLogout, mobileOpen, handleDrawerToggle }) {
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { unreadCount } = useUnreadCount();
    
    const menuItems = [
        { to: '/admin/dashboard', icon: <DashboardIcon />, label: 'Home' },
        { to: '/admin/users', icon: <PeopleIcon />, label: 'Users' },
        { to: '/admin/forms', icon: <DescriptionIcon />, label: 'Forms' },
        { to: '/admin/chats', icon: <ChatIcon />, label: 'Chats', badge: unreadCount },
        { to: '/admin/templates', icon: <TemplateIcon />, label: 'Templates' },
        { to: '/admin/plan-builder', icon: <RestaurantMenuIcon />, label: 'Plan Builder' },
    ];

    const drawer = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {isMobile && (
                <Box sx={{ 
                    p: 2, 
                    bgcolor: theme.palette.primary.main, 
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <Box>
                        <Typography variant="h6" noWrap>
                            Carina Admin
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.8 }}>
                            Admin Panel
                        </Typography>
                    </Box>
                    <IconButton 
                        onClick={handleDrawerToggle}
                        sx={{ color: 'white' }}
                        aria-label="close drawer"
                    >
                        <CloseIcon />
                    </IconButton>
                </Box>
            )}
            
            {!isMobile && (
                <Box sx={{ p: 2, bgcolor: theme.palette.primary.main, color: 'white' }}>
                    <Typography variant="h6" noWrap>
                        Carina Admin
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        Admin Panel
                    </Typography>
                </Box>
            )}
            
            <Divider />
            
            <List sx={{ flexGrow: 1 }}>
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.to;
                    return (
                        <ListItem key={item.to} disablePadding>
                            <ListItemButton
                                component={Link}
                                to={item.to}
                                selected={isActive}
                                onClick={isMobile ? handleDrawerToggle : undefined}
                                sx={{
                                    '&.Mui-selected': {
                                        bgcolor: theme.palette.primary.light,
                                        color: theme.palette.primary.contrastText,
                                        '&:hover': {
                                            bgcolor: theme.palette.primary.light,
                                        }
                                    }
                                }}
                            >
                                <ListItemIcon sx={{ color: isActive ? theme.palette.primary.contrastText : 'inherit' }}>
                                    {item.badge !== undefined && item.badge > 0 ? (
                                        <Badge badgeContent={item.badge} color="error" max={99}>
                                            {item.icon}
                                        </Badge>
                                    ) : (
                                        item.icon
                                    )}
                                </ListItemIcon>
                                <ListItemText primary={item.label} />
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>
            
            <Divider />
            
            <List>
                <ListItem disablePadding>
                    <ListItemButton 
                        onClick={() => {
                            onLogout();
                            if (isMobile) handleDrawerToggle();
                        }}
                    >
                        <ListItemIcon>
                            <LogoutIcon />
                        </ListItemIcon>
                        <ListItemText primary="Logout" />
                    </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                    <Box sx={{ width: '100%', px: 2, py: 1 }}>
                        <ThemeToggle />
                    </Box>
                </ListItem>
            </List>
        </Box>
    );

    return (
        <>
            {isMobile && (
                <AppBar 
                    position="fixed" 
                    sx={{ 
                        bgcolor: theme.palette.primary.main,
                        zIndex: theme.zIndex.drawer + 1 
                    }}
                >
                    <Toolbar>
                        <IconButton
                            color="inherit"
                            aria-label="open drawer"
                            edge="start"
                            onClick={handleDrawerToggle}
                            sx={{ mr: 2 }}
                        >
                            <MenuIcon />
                        </IconButton>
                        <Typography variant="h6" noWrap component="div">
                            Carina Admin
                        </Typography>
                        <Box sx={{ flexGrow: 1 }} />
                        <ThemeToggle />
                    </Toolbar>
                </AppBar>
            )}

            <Box
                component="nav"
                sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
            >
                {/* Mobile drawer */}
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{
                        keepMounted: true, // Better open performance on mobile.
                    }}
                    sx={{
                        display: { xs: 'block', md: 'none' },
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: drawerWidth,
                        },
                    }}
                >
                    {drawer}
                </Drawer>
                
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', md: 'block' },
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: drawerWidth,
                            position: 'fixed',
                            height: '100vh'
                        },
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>
        </>
    );
}
