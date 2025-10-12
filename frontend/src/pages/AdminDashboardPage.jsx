import React, { useState, useEffect } from 'react';
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
    Chip
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import PageFade from '../components/PageFade';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function AdminDashboardPage() {
    const theme = useTheme();
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

    if (loading) {
        return (
            <PageFade>
                <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography>Loading dashboard...</Typography>
                </Box>
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
            <Box sx={{ p: 3 }}>
                <Typography variant="h4" gutterBottom>
                    Admin Dashboard
                </Typography>

                {/* Stats Cards */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={2.4}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>
                                    Total Users
                                </Typography>
                                <Typography variant="h4">
                                    {dashboardData.totalUsers || 0}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2.4}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>
                                    Total Forms
                                </Typography>
                                <Typography variant="h4">
                                    {dashboardData.totalForms || 0}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2.4}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>
                                    Pending Forms
                                </Typography>
                                <Typography variant="h4" color="warning.main">
                                    {dashboardData.pendingForms || 0}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2.4}>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2.4}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>
                                    Active Plans
                                </Typography>
                                <Typography variant="h4" color="success.main">
                                    {dashboardData.activePlans || 0}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Recent Activity */}
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Recent Users
                                </Typography>
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Name</TableCell>
                                                <TableCell>Email</TableCell>
                                                <TableCell>Joined</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {dashboardData.recentUsers.map((user) => (
                                                <TableRow key={user._id}>
                                                    <TableCell>{user.name}</TableCell>
                                                    <TableCell>{user.email}</TableCell>
                                                    <TableCell>
                                                        {new Date(user.createdAt).toLocaleDateString()}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Recent Forms
                                </Typography>
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>User</TableCell>
                                                <TableCell>Status</TableCell>
                                                <TableCell>Date</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {dashboardData.recentForms.map((form) => (
                                                <TableRow key={form._id}>
                                                    <TableCell>{form.user?.name || 'Unknown'}</TableCell>
                                                    <TableCell>
                                                        <Chip 
                                                            label={form.reviewed ? 'Reviewed' : 'Pending'} 
                                                            color={form.reviewed ? 'success' : 'warning'}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        {new Date(form.createdAt).toLocaleDateString()}
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
