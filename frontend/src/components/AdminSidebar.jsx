import { Link, useLocation, useNavigate } from 'react-router-dom';
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
import CategoryIcon from '@mui/icons-material/Category';
import CampaignIcon from '@mui/icons-material/Campaign';
import PaymentIcon from '@mui/icons-material/Payment';
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import ThemeToggle from './ThemeToggle';
import { useUnreadCount } from '../contexts/UnreadCountContext';
import { useNavigation } from '../contexts/NavigationContext';
import { useUserProfile } from '../contexts/UserContext';
import { spacing, transitions, zIndex } from '../styles';

const drawerWidth = 240;

export default function AdminSidebar({ onLogout, mobileOpen, handleDrawerToggle }) {
    const location = useLocation();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { unreadCount } = useUnreadCount();
    const { startNavigation, getActivePath } = useNavigation();
    const { userProfile } = useUserProfile();

    const currentRole = userProfile?.user?.role;
    const isChatAdmin = currentRole === 'chat_admin';
    
    // Use the "visual" active path for instant feedback
    const activePath = getActivePath();
    
    // Handle navigation with instant feedback
    const handleNavClick = (e, to) => {
        e.preventDefault();
        if (to !== location.pathname) {
            startNavigation(to);
            navigate(to);
        }
        if (isMobile) handleDrawerToggle();
    };
    
    const menuItems = (isChatAdmin
        ? [
            { to: '/admin/chats', icon: <ChatIcon />, label: 'Chats', badge: unreadCount },
        ]
        : [
            { to: '/admin/dashboard', icon: <DashboardIcon />, label: 'Home' },
            { to: '/admin/users', icon: <PeopleIcon />, label: 'Users' },
            { to: '/admin/classes', icon: <CategoryIcon />, label: 'Classes', feature: 'VITE_ENABLE_USER_CLASSES' },
            { to: '/admin/forms', icon: <DescriptionIcon />, label: 'Forms' },
            { to: '/admin/payments', icon: <PaymentIcon />, label: 'Payments' },
            { to: '/admin/plans', icon: <PlayCircleFilledIcon />, label: 'Plans' },
            { to: '/admin/chats', icon: <ChatIcon />, label: 'Chats', badge: unreadCount },
            { to: '/admin/announcements', icon: <CampaignIcon />, label: 'Announcements', feature: 'VITE_ENABLE_ANNOUNCEMENTS' },
            { to: '/admin/templates', icon: <TemplateIcon />, label: 'Templates', feature: 'VITE_ENABLE_PLAN_TEMPLATES' },
            { to: '/admin/plan-builder', icon: <RestaurantMenuIcon />, label: 'Plan Builder' },
        ])
        .filter(item => !item.feature || import.meta.env[item.feature] !== 'false');

    const drawer = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {isMobile && (
                <Box sx={{ 
                    p: spacing.md, 
                    pt: `calc(64px + ${spacing.md * 8}px + env(safe-area-inset-top))`,
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
                        sx={{ color: 'white', transition: transitions.fast }}
                        aria-label="close drawer"
                    >
                        <CloseIcon />
                    </IconButton>
                </Box>
            )}
            
            {!isMobile && (
                <Box sx={{ p: spacing.md, bgcolor: theme.palette.primary.main, color: 'white' }}>
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
                    const isActive = activePath === item.to;
                    return (
                        <ListItem key={item.to} disablePadding>
                            <ListItemButton
                                component="a"
                                href={item.to}
                                onClick={(e) => handleNavClick(e, item.to)}
                                selected={isActive}
                                sx={{
                                    transition: transitions.fast,
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
                    <Box sx={{ width: '100%', px: spacing.md, py: spacing.sm }}>
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
                        zIndex: zIndex.drawer + 1,
                        pt: 'env(safe-area-inset-top)'
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
