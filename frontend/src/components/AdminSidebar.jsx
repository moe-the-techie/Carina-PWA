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
    useMediaQuery
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import DescriptionIcon from '@mui/icons-material/Description';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import TemplateIcon from '@mui/icons-material/FileCopy';
import LogoutIcon from '@mui/icons-material/Logout';

const drawerWidth = 240;

export default function AdminSidebar({ onLogout }) {
    const location = useLocation();
    const theme = useTheme();
    
    const menuItems = [
        { to: '/admin/dashboard', icon: <DashboardIcon />, label: 'Home' },
        { to: '/admin/users', icon: <PeopleIcon />, label: 'Users' },
        { to: '/admin/forms', icon: <DescriptionIcon />, label: 'Forms' },
        { to: '/admin/templates', icon: <TemplateIcon />, label: 'Templates' },
        { to: '/admin/plan-builder', icon: <RestaurantMenuIcon />, label: 'Plan Builder' },
    ];

    const drawer = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, bgcolor: theme.palette.primary.main, color: 'white' }}>
                <Typography variant="h6" noWrap>
                    Carina Admin
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Admin Panel
                </Typography>
            </Box>
            
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
                                    {item.icon}
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
                    <ListItemButton onClick={onLogout}>
                        <ListItemIcon>
                            <LogoutIcon />
                        </ListItemIcon>
                        <ListItemText primary="Logout" />
                    </ListItemButton>
                </ListItem>
            </List>
        </Box>
    );

    return (
        <Box
            component="nav"
            sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        >
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
    );
}
