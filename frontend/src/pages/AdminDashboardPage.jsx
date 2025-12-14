import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Box, 
    Typography, 
    Grid, 
    Card, 
    CardContent, 
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    Tooltip
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import { useTheme } from '@mui/material/styles';
import PageFade from '../components/PageFade';
import LoadingBackdrop from '../components/LoadingBackdrop';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function AdminDashboardPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    const [dashboardData, setDashboardData] = useState({
        stats: {},
        recentUsers: [],
        recentForms: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${apiBaseUrl}/api/admin/dashboard`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch dashboard data');
            }

            const data = await response.json();
            setDashboardData(data);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleMessageUser = (userId) => {
        if (!userId || userId === 'null' || userId === 'undefined') {
            console.error('Cannot message user: Invalid user ID');
            return;
        }
        
        navigate('/admin/chats', { state: { userId } });
    };

    if (loading) {
        return (
            <PageFade>
                <LoadingBackdrop open={loading} />
            </PageFade>
        );
    }

    if (error) {
        return (
            <PageFade>
                <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography color="error">Error: {error}</Typography>
                </Box>
            </PageFade>
        );
    }

    return (
        <PageFade>
            <Box sx={{ 
                p: { xs: 2, md: 3 },
                maxWidth: '100%',
                overflow: 'hidden'
            }}>
                <Typography 
                    variant="h4" 
                    gutterBottom
                    sx={{ 
                        fontSize: { xs: '1.5rem', md: '2rem' },
                        mb: { xs: 2, md: 3 }
                    }}
                >
                    Admin Dashboard
                </Typography>

                {/* Stats Cards */}
                <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: { xs: 3, md: 4 } }}>
                    <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                        <Card sx={{ height: '100%' }}>
                            <CardContent sx={{ p: { xs: 2, md: 2 } }}>
                                <Typography color="textSecondary" gutterBottom variant="body2">
                                    Total Users
                                </Typography>
                                <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}>
                                    {dashboardData.totalUsers || 0}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                        <Card sx={{ height: '100%' }}>
                            <CardContent sx={{ p: { xs: 2, md: 2 } }}>
                                <Typography color="textSecondary" gutterBottom variant="body2">
                                    Total Forms
                                </Typography>
                                <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}>
                                    {dashboardData.totalForms || 0}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                        <Card sx={{ height: '100%' }}>
                            <CardContent sx={{ p: { xs: 2, md: 2 } }}>
                                <Typography color="textSecondary" gutterBottom variant="body2">
                                    Pending Forms
                                </Typography>
                                <Typography variant="h4" color="warning.main" sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}>
                                    {dashboardData.pendingForms || 0}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                        <Card sx={{ height: '100%' }}>
                            <CardContent sx={{ p: { xs: 2, md: 2 } }}>
                                <Typography color="textSecondary" gutterBottom variant="body2">
                                    Active Plans
                                </Typography>
                                <Typography variant="h4" color="success.main" sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}>
                                    {dashboardData.activePlans || 0}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Recent Activity */}
                <Grid container spacing={{ xs: 2, md: 3 }}>
                    <Grid size={{ xs: 12, lg: 6 }}>
                        <Card sx={{ height: '100%' }}>
                            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                                <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
                                    Recent Users
                                </Typography>
                                <TableContainer sx={{ overflowX: 'auto' }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>Name</TableCell>
                                                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, fontSize: { xs: '0.75rem', md: '0.875rem' } }}>Email</TableCell>
                                                <TableCell sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>Joined</TableCell>
                                                <TableCell align="center" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {dashboardData.recentUsers.map((user) => (
                                                <TableRow key={user._id}>
                                                    <TableCell sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>{user.name}</TableCell>
                                                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, fontSize: { xs: '0.75rem', md: '0.875rem' } }}>{user.email}</TableCell>
                                                    <TableCell sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                                                        {new Date(user.createdAt).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Tooltip title="Message User">
                                                            <IconButton 
                                                                size="small" 
                                                                color="primary"
                                                                onClick={() => handleMessageUser(user._id)}
                                                            >
                                                                <ChatIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid size={{ xs: 12, lg: 6 }}>
                        <Card sx={{ height: '100%' }}>
                            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                                <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
                                    Recent Forms
                                </Typography>
                                <TableContainer sx={{ overflowX: 'auto' }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>User</TableCell>
                                                <TableCell sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>Status</TableCell>
                                                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, fontSize: { xs: '0.75rem', md: '0.875rem' } }}>Date</TableCell>
                                                <TableCell align="center" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {dashboardData.recentForms.map((form) => (
                                                <TableRow key={form._id}>
                                                    <TableCell sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>{form.user?.name || 'Unknown'}</TableCell>
                                                    <TableCell>
                                                        <Chip 
                                                            label={form.reviewed ? 'Reviewed' : 'Pending'} 
                                                            color={form.reviewed ? 'success' : 'warning'}
                                                            size="small"
                                                            sx={{ fontSize: { xs: '0.65rem', md: '0.75rem' } }}
                                                        />
                                                    </TableCell>
                                                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                                                        {new Date(form.createdAt).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        {form.user?._id && (
                                                            <Tooltip title="Message User">
                                                                <IconButton 
                                                                    size="small" 
                                                                    color="primary"
                                                                    onClick={() => handleMessageUser(form.user._id)}
                                                                >
                                                                    <ChatIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Box>
        </PageFade>
    );
}
