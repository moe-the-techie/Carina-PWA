import AdminSidebar from './AdminSidebar';
import { Box } from '@mui/material';

const drawerWidth = 240;

export default function AdminLayout({ children, onLogout }) {

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <AdminSidebar onLogout={onLogout} />
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    ml: { md: `${drawerWidth}px` },
                    minHeight: '100vh',
                    bgcolor: 'background.default'
                }}
            >
                {children}
            </Box>
        </Box>
    );
}
