import AdminSidebar from './AdminSidebar';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import { useState } from 'react';

const drawerWidth = 240;

export default function AdminLayout({ children, onLogout }) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <AdminSidebar 
                onLogout={onLogout} 
                mobileOpen={mobileOpen}
                handleDrawerToggle={handleDrawerToggle}
            />
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    mt: { xs: '64px', md: 0 }, // Add top margin on mobile for AppBar
                    minHeight: '100vh',
                    bgcolor: 'background.default',
                    p: { xs: 2, md: 3 }, // Add padding for better mobile spacing
                    width: { xs: '100vw', md: `calc(100vw - ${drawerWidth}px)` } // Ensure proper width
                }}
            >
                {children}
            </Box>
        </Box>
    );
}
