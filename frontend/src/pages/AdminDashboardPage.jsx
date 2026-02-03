import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Grid,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    Tooltip,
    Skeleton,
    Avatar,
    useMediaQuery,
    alpha,
    LinearProgress,
    CircularProgress
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import ChatIcon from '@mui/icons-material/Chat';
import PeopleIcon from '@mui/icons-material/People';
import DescriptionIcon from '@mui/icons-material/Description';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
import EditIcon from '@mui/icons-material/Edit';
import PageFade from '../components/PageFade';
import { useCachedData } from '../hooks/useCachedData';
import { 
    glassCard, 
    containerVariants, 
    itemVariants, 
    gradientText, 
    accentColors,
    pageWrapper 
} from '../styles';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Helper to calculate plan progress
const calculatePlanProgress = (plan) => {
    if (!plan?.activatedAt || !plan?.duration) return 0;
    const activatedDate = new Date(plan.activatedAt);
    const now = new Date();
    const durationInDays = plan.duration * 7;
    const daysPassed = Math.floor((now - activatedDate) / (1000 * 60 * 60 * 24));
    return Math.min(Math.round((daysPassed / durationInDays) * 100), 100);
};

export default function AdminDashboardPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // Use shared glass card style
    const glassCardStyle = glassCard(theme);

    // Fetch dashboard data with caching - stale-while-revalidate
    const fetchDashboardData = useCallback(async () => {
        const response = await fetch(`${apiBaseUrl}/api/admin/dashboard`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch dashboard data');
        }

        return response.json();
    }, []);

    const {
        data: dashboardData,
        isLoading: loading,
        isRefreshing,
        error,
    } = useCachedData(
        'admin_dashboard',
        fetchDashboardData,
        {
            cacheTTL: 2 * 60 * 1000, // 2 minutes for admin dashboard
            initialData: { stats: {}, recentUsers: [], recentForms: [] },
        }
    );

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
                <Box sx={{ 
                    p: { xs: 2, sm: 3, md: 4 },
                    minHeight: '100vh',
                    background: theme.palette.mode === 'dark'
                        ? `linear-gradient(135deg, ${theme.palette.background.default} 0%, #1a1a2e 100%)`
                        : `linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)`,
                }}>
                    <Box sx={{ mb: 4 }}>
                        <Skeleton variant="text" width="30%" height={48} sx={{ mb: 1 }} />
                        <Skeleton variant="text" width="50%" height={24} />
                    </Box>
                    <Grid container spacing={2} sx={{ mb: 4 }}>
                        {[1, 2, 3, 4].map((i) => (
                            <Grid size={{ xs: 6, md: 3 }} key={i}>
                                <Paper sx={{ ...glassCardStyle, p: 3 }}>
                                    <Skeleton variant="circular" width={48} height={48} sx={{ mb: 2 }} />
                                    <Skeleton variant="text" width="60%" height={32} />
                                    <Skeleton variant="text" width="80%" height={20} />
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, lg: 6 }}>
                            <Paper sx={{ ...glassCardStyle, p: 3, height: 400 }}>
                                <Skeleton variant="text" width="40%" height={32} sx={{ mb: 2 }} />
                                <Skeleton variant="rectangular" width="100%" height={300} />
                            </Paper>
                        </Grid>
                        <Grid size={{ xs: 12, lg: 6 }}>
                            <Paper sx={{ ...glassCardStyle, p: 3, height: 400 }}>
                                <Skeleton variant="text" width="40%" height={32} sx={{ mb: 2 }} />
                                <Skeleton variant="rectangular" width="100%" height={300} />
                            </Paper>
                        </Grid>
                    </Grid>
                </Box>
            </PageFade>
        );
    }

    const stats = [
        {
            label: 'Total Users',
            value: dashboardData.totalUsers || 0,
            icon: PeopleIcon,
            color: theme.palette.primary.main,
            gradient: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
            link: '/admin/users'
        },
        {
            label: 'Total Forms',
            value: dashboardData.totalForms || 0,
            icon: DescriptionIcon,
            color: theme.palette.secondary.main,
            gradient: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.dark})`,
            link: '/admin/forms'
        },
        {
            label: 'Pending Forms',
            value: dashboardData.pendingForms || 0,
            icon: PendingActionsIcon,
            color: accentColors.amber.main,
            gradient: `linear-gradient(135deg, ${accentColors.amber.main}, ${accentColors.amber.dark})`,
            link: '/admin/forms'
        },
        {
            label: 'Active Plans',
            value: dashboardData.activePlans || 0,
            icon: AssignmentTurnedInIcon,
            color: accentColors.emerald.main,
            gradient: `linear-gradient(135deg, ${accentColors.emerald.main}, ${accentColors.emerald.dark})`,
            link: '/admin/active-plans'
        }
    ];

    return (
        <PageFade>
            <Box sx={{ 
                ...pageWrapper(theme),
                p: { xs: 1.5, sm: 3, md: 4 },
                display: 'flex',
                flexDirection: 'column',
            }}>
                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Box sx={{ mb: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography 
                                variant="h4" 
                                sx={{ 
                                    ...gradientText(theme),
                                    mb: 0.5
                                }}
                            >
                                Admin Dashboard
                            </Typography>
                            {isRefreshing && (
                                <CircularProgress size={20} sx={{ color: accentColors.emerald.main }} />
                            )}
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                            Overview of platform activity and performance
                        </Typography>
                    </Box>
                </motion.div>

                {/* Stats Cards */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <Grid container spacing={2} sx={{ mb: 4 }}>
                        {stats.map((stat, index) => (
                            <Grid size={{ xs: 6, md: 3 }} key={index}>
                                <motion.div variants={itemVariants}>
                                    <Paper 
                                        onClick={() => stat.link && navigate(stat.link)}
                                        sx={{ 
                                            ...glassCardStyle, 
                                            p: { xs: 2, sm: 3 },
                                            position: 'relative',
                                            overflow: 'hidden',
                                            cursor: stat.link ? 'pointer' : 'default',
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                transform: 'translateY(-4px)',
                                                boxShadow: theme.palette.mode === 'dark'
                                                    ? '0 20px 40px rgba(0, 0, 0, 0.4)'
                                                    : '0 20px 40px rgba(0, 0, 0, 0.1)',
                                            }
                                        }}
                                    >
                                        <Box sx={{
                                            position: 'absolute',
                                            top: -20,
                                            right: -20,
                                            width: 100,
                                            height: 100,
                                            borderRadius: '50%',
                                            background: `${stat.color}10`,
                                            pointerEvents: 'none',
                                        }} />
                                        <Box sx={{
                                            width: 48,
                                            height: 48,
                                            borderRadius: 2,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: stat.gradient,
                                            boxShadow: `0 4px 12px ${stat.color}40`,
                                            mb: 2
                                        }}>
                                            <stat.icon sx={{ color: 'white', fontSize: 24 }} />
                                        </Box>
                                        <Typography 
                                            variant="h4" 
                                            sx={{ 
                                                fontWeight: 700, 
                                                mb: 0.5,
                                                color: theme.palette.text.primary 
                                            }}
                                        >
                                            {stat.value}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {stat.label}
                                        </Typography>
                                    </Paper>
                                </motion.div>
                            </Grid>
                        ))}
                    </Grid>
                </motion.div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <Paper sx={{ 
                            p: 2, 
                            mb: 3, 
                            backgroundColor: alpha(theme.palette.error.main, 0.1),
                            border: `1px solid ${theme.palette.error.main}`,
                            borderRadius: 2 
                        }}>
                            <Typography color="error" sx={{ fontWeight: 500 }}>
                                ⚠️ {error}
                            </Typography>
                        </Paper>
                    </motion.div>
                )}

                {/* Recent Activity */}
                <Box
                    component={motion.div}
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}
                >
                    <Grid container spacing={2} alignItems="stretch" sx={{ flexGrow: 1 }}>
                        {/* Recent Users */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <motion.div variants={itemVariants} style={{ height: '100%' }}>
                                <Paper sx={{ ...glassCardStyle, p: 0, height: '100%', minHeight: 400, display: 'flex', flexDirection: 'column' }}>
                                    <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
                                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                            Recent Users
                                        </Typography>
                                    </Box>
                                    <TableContainer sx={{ flexGrow: 1 }}>
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>User</TableCell>
                                                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Joined</TableCell>
                                                    <TableCell align="right">Action</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {dashboardData.recentUsers.map((user) => (
                                                    <TableRow key={user._id} hover>
                                                        <TableCell>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                                <Avatar 
                                                                    src={user.profileImageUrl}
                                                                    sx={{ 
                                                                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                                                        fontWeight: 600
                                                                    }}
                                                                >
                                                                    {user.name.charAt(0).toUpperCase()}
                                                                </Avatar>
                                                                <Box>
                                                                    <Typography variant="subtitle2">
                                                                        {user.name}
                                                                    </Typography>
                                                                    <Typography variant="caption" color="text.secondary">
                                                                        {user.email}
                                                                    </Typography>
                                                                </Box>
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                                                            {new Date(user.createdAt).toLocaleDateString()}
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            <Tooltip title="Message User">
                                                                <IconButton 
                                                                    size="small" 
                                                                    onClick={() => handleMessageUser(user._id)}
                                                                    sx={{ color: theme.palette.primary.main }}
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
                                </Paper>
                            </motion.div>
                        </Grid>

                        {/* Recent Forms */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <motion.div variants={itemVariants} style={{ height: '100%' }}>
                                <Paper sx={{ ...glassCardStyle, p: 0, height: '100%', minHeight: 400, display: 'flex', flexDirection: 'column' }}>
                                    <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
                                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                            Recent Forms
                                        </Typography>
                                    </Box>
                                    <TableContainer sx={{ flexGrow: 1 }}>
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>User</TableCell>
                                                    <TableCell>Status</TableCell>
                                                    <TableCell align="right">Action</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {dashboardData.recentForms.map((form) => (
                                                    <TableRow key={form._id} hover>
                                                        <TableCell>
                                                            <Typography variant="subtitle2">
                                                                {form.user?.name || 'Unknown'}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {new Date(form.createdAt).toLocaleDateString()}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip 
                                                                label={form.reviewed ? 'Reviewed' : 'Pending'} 
                                                                size="small"
                                                                sx={{ 
                                                                    bgcolor: form.reviewed 
                                                                        ? alpha(theme.palette.success.main, 0.1) 
                                                                        : alpha(theme.palette.warning.main, 0.1),
                                                                    color: form.reviewed 
                                                                        ? theme.palette.success.main 
                                                                        : theme.palette.warning.main,
                                                                    fontWeight: 600
                                                                }}
                                                            />
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            {form.user?._id && (
                                                                <Tooltip title="Message User">
                                                                    <IconButton 
                                                                        size="small" 
                                                                        onClick={() => handleMessageUser(form.user._id)}
                                                                        sx={{ color: theme.palette.primary.main }}
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
                                </Paper>
                            </motion.div>
                        </Grid>
                    </Grid>

                    {/* Recent Active Plans */}
                    {dashboardData.recentActivePlans && dashboardData.recentActivePlans.length > 0 && (
                        <motion.div variants={itemVariants}>
                            <Paper sx={{ ...glassCardStyle, p: 0, mt: 2, display: 'flex', flexDirection: 'column' }}>
                                <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <PlayCircleFilledIcon sx={{ color: accentColors.emerald.main }} />
                                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                        Recently Activated Plans
                                    </Typography>
                                </Box>
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>User</TableCell>
                                                <TableCell>Plan</TableCell>
                                                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Progress</TableCell>
                                                <TableCell align="right">Activated</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {dashboardData.recentActivePlans.map((plan) => {
                                                const progress = calculatePlanProgress(plan);
                                                return (
                                                    <TableRow key={plan._id} hover>
                                                        <TableCell>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                                <Avatar 
                                                                    sx={{ 
                                                                        background: `linear-gradient(135deg, ${accentColors.emerald.main}, ${accentColors.emerald.dark})`,
                                                                        fontWeight: 600,
                                                                        width: 36,
                                                                        height: 36
                                                                    }}
                                                                >
                                                                    {plan.user?.name?.charAt(0).toUpperCase() || '?'}
                                                                </Avatar>
                                                                <Box>
                                                                    <Typography variant="subtitle2">
                                                                        {plan.user?.name || 'Unknown'}
                                                                    </Typography>
                                                                    <Typography variant="caption" color="text.secondary">
                                                                        {plan.user?.email || ''}
                                                                    </Typography>
                                                                </Box>
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2" fontWeight={500}>
                                                                {plan.title || 'Nutrition Plan'}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {plan.duration} week{plan.duration > 1 ? 's' : ''}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, minWidth: 120 }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <LinearProgress 
                                                                    variant="determinate" 
                                                                    value={progress}
                                                                    sx={{
                                                                        flex: 1,
                                                                        height: 6,
                                                                        borderRadius: 3,
                                                                        backgroundColor: alpha(accentColors.emerald.main, 0.2),
                                                                        '& .MuiLinearProgress-bar': {
                                                                            borderRadius: 3,
                                                                            backgroundColor: accentColors.emerald.main
                                                                        }
                                                                    }}
                                                                />
                                                                <Typography variant="caption" sx={{ color: accentColors.emerald.main, fontWeight: 600, minWidth: 35 }}>
                                                                    {progress}%
                                                                </Typography>
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            <Typography variant="caption" color="text.secondary">
                                                                {plan.activatedAt ? new Date(plan.activatedAt).toLocaleDateString() : '-'}
                                                            </Typography>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Paper>
                        </motion.div>
                    )}
                </Box>
            </Box>
        </PageFade>
    );
}
