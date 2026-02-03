import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TextField,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Pagination,
    Alert,
    IconButton,
    InputAdornment,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    useTheme,
    useMediaQuery,
    CircularProgress,
    Tooltip,
    Button,
    Avatar,
    LinearProgress,
    Grid,
    Divider,
    alpha,
    Card,
    CardContent
} from '@mui/material';
import {
    Search as SearchIcon,
    Refresh as RefreshIcon,
    Visibility as VisibilityIcon,
    PlayCircleFilled as PlayCircleFilledIcon,
    LocalFireDepartment as LocalFireDepartmentIcon,
    EmojiEvents as EmojiEventsIcon,
    WaterDrop as WaterDropIcon,
    TrendingUp as TrendingUpIcon,
    CalendarToday as CalendarTodayIcon,
    Close as CloseIcon,
    CheckCircle as CheckCircleIcon,
    Restaurant as RestaurantIcon,
    FitnessCenter as FitnessCenterIcon,
    SentimentVerySatisfied as SentimentVerySatisfiedIcon,
    SentimentSatisfied as SentimentSatisfiedIcon,
    SentimentNeutral as SentimentNeutralIcon,
    SentimentDissatisfied as SentimentDissatisfiedIcon,
    SentimentVeryDissatisfied as SentimentVeryDissatisfiedIcon,
    Chat as ChatIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PageFade from '../components/PageFade';
import { glassCard, glassInput, glassDialog } from '../styles/glassmorphism';
import { accentColors, containerVariants, itemVariants } from '../styles';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Mood configuration
const moodConfig = {
    great: { icon: SentimentVerySatisfiedIcon, color: '#10B981', label: 'Great' },
    good: { icon: SentimentSatisfiedIcon, color: '#6366F1', label: 'Good' },
    okay: { icon: SentimentNeutralIcon, color: '#FFB020', label: 'Okay' },
    tired: { icon: SentimentDissatisfiedIcon, color: '#F97316', label: 'Tired' },
    bad: { icon: SentimentVeryDissatisfiedIcon, color: '#EF4444', label: 'Bad' }
};

// Status colors
const getStatusConfig = (status) => {
    switch(status) {
        case 'active': return { color: accentColors.emerald.main, label: 'Active', bgColor: accentColors.emerald.light };
        case 'completed': return { color: accentColors.sky.main, label: 'Completed', bgColor: accentColors.sky.light };
        case 'paused': return { color: accentColors.amber.main, label: 'Paused', bgColor: accentColors.amber.light };
        case 'draft': return { color: '#9CA3AF', label: 'Draft', bgColor: '#F3F4F6' };
        default: return { color: '#9CA3AF', label: status, bgColor: '#F3F4F6' };
    }
};

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, color, gradient }) => {
    const theme = useTheme();
    return (
        <Card sx={{ 
            ...glassCard(theme),
            height: '100%',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <CardContent sx={{ p: 2 }}>
                <Box sx={{
                    position: 'absolute',
                    top: -20,
                    right: -20,
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: `${color}15`,
                    pointerEvents: 'none',
                }} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: gradient || `linear-gradient(135deg, ${color}, ${color}dd)`,
                        boxShadow: `0 4px 12px ${color}40`
                    }}>
                        <Icon sx={{ color: 'white', fontSize: 20 }} />
                    </Box>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {value}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {label}
                        </Typography>
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
};

// Progress Detail Dialog
const PlanProgressDialog = ({ open, onClose, planId, theme }) => {
    const [loading, setLoading] = useState(true);
    const [progressData, setProgressData] = useState(null);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (open && planId) {
            fetchPlanProgress();
        }
    }, [open, planId]);

    const fetchPlanProgress = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`${apiBaseUrl}/api/admin/active-plans/${planId}/progress`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                setProgressData(data);
            } else {
                throw new Error('Failed to fetch progress');
            }
        } catch (err) {
            console.error('Error fetching plan progress:', err);
            setError('Failed to load plan progress');
        } finally {
            setLoading(false);
        }
    };

    const handleMessageUser = () => {
        if (progressData?.plan?.user?._id) {
            navigate('/admin/chats', { state: { userId: progressData.plan.user._id } });
        }
    };

    if (!open) return null;

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    ...glassDialog(theme),
                    maxHeight: '90vh'
                }
            }}
        >
            <DialogTitle sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                borderBottom: `1px solid ${theme.palette.divider}`,
                pb: 2
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PlayCircleFilledIcon sx={{ color: accentColors.emerald.main }} />
                    <Typography variant="h6" fontWeight={600}>
                        Plan Progress Details
                    </Typography>
                </Box>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            
            <DialogContent sx={{ pt: 3 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Alert severity="error">{error}</Alert>
                ) : progressData ? (
                    <Box>
                        {/* User Info */}
                        <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 2, 
                            mb: 3,
                            p: 2,
                            borderRadius: 2,
                            bgcolor: alpha(theme.palette.primary.main, 0.05)
                        }}>
                            <Avatar 
                                src={progressData.plan.user?.profileImageUrl}
                                sx={{ 
                                    width: 56, 
                                    height: 56,
                                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                                }}
                            >
                                {progressData.plan.user?.name?.charAt(0).toUpperCase() || '?'}
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="h6" fontWeight={600}>
                                    {progressData.plan.user?.name || 'Unknown User'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {progressData.plan.user?.email}
                                </Typography>
                            </Box>
                            <Tooltip title="Message User">
                                <IconButton 
                                    onClick={handleMessageUser}
                                    sx={{ 
                                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
                                    }}
                                >
                                    <ChatIcon color="primary" />
                                </IconButton>
                            </Tooltip>
                        </Box>

                        {/* Plan Info */}
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                            {progressData.plan.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {progressData.plan.description || 'No description'}
                        </Typography>
                        
                        {/* Stats Grid */}
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={6} sm={3}>
                                <StatCard 
                                    icon={TrendingUpIcon}
                                    label="Overall Progress"
                                    value={`${progressData.stats.overallProgress}%`}
                                    color={accentColors.emerald.main}
                                />
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <StatCard 
                                    icon={LocalFireDepartmentIcon}
                                    label="Current Streak"
                                    value={`${progressData.stats.currentStreak} days`}
                                    color={accentColors.amber.main}
                                />
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <StatCard 
                                    icon={EmojiEventsIcon}
                                    label="Longest Streak"
                                    value={`${progressData.stats.longestStreak} days`}
                                    color={accentColors.violet.main}
                                />
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <StatCard 
                                    icon={WaterDropIcon}
                                    label="Avg Water"
                                    value={`${progressData.stats.avgWaterIntake} glasses`}
                                    color={accentColors.sky.main}
                                />
                            </Grid>
                        </Grid>

                        {/* Progress Bar */}
                        <Box sx={{ mb: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Days: {progressData.stats.daysElapsed} / {progressData.stats.totalDays}
                                </Typography>
                                <Typography variant="body2" fontWeight={600} sx={{ color: accentColors.emerald.main }}>
                                    {progressData.stats.overallProgress}% Complete
                                </Typography>
                            </Box>
                            <LinearProgress 
                                variant="determinate" 
                                value={progressData.stats.overallProgress}
                                sx={{
                                    height: 10,
                                    borderRadius: 5,
                                    backgroundColor: alpha(accentColors.emerald.main, 0.2),
                                    '& .MuiLinearProgress-bar': {
                                        borderRadius: 5,
                                        backgroundColor: accentColors.emerald.main
                                    }
                                }}
                            />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                <Typography variant="caption" color="text.secondary">
                                    Logged: {progressData.stats.daysLogged} days
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Completed: {progressData.stats.completedDays} days
                                </Typography>
                            </Box>
                        </Box>

                        {/* Mood Distribution */}
                        {progressData.stats.moodCounts && Object.keys(progressData.stats.moodCounts).length > 0 && (
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                    Mood Distribution
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    {Object.entries(progressData.stats.moodCounts).map(([mood, count]) => {
                                        const config = moodConfig[mood] || moodConfig.okay;
                                        const MoodIcon = config.icon;
                                        return (
                                            <Chip
                                                key={mood}
                                                icon={<MoodIcon sx={{ color: `${config.color} !important` }} />}
                                                label={`${config.label}: ${count}`}
                                                size="small"
                                                sx={{
                                                    bgcolor: alpha(config.color, 0.1),
                                                    color: config.color,
                                                    fontWeight: 500
                                                }}
                                            />
                                        );
                                    })}
                                </Box>
                            </Box>
                        )}

                        {/* Recent Progress Entries */}
                        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                            Recent Progress Entries
                        </Typography>
                        {progressData.progress && progressData.progress.length > 0 ? (
                            <TableContainer component={Paper} sx={{ ...glassCard(theme), maxHeight: 300 }}>
                                <Table size="small" stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Date</TableCell>
                                            <TableCell>Meals</TableCell>
                                            <TableCell>Exercise</TableCell>
                                            <TableCell>Water</TableCell>
                                            <TableCell>Mood</TableCell>
                                            <TableCell>Weight</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {progressData.progress.slice(0, 14).map((entry, idx) => {
                                            const meals = entry.mealsCompleted || {};
                                            const mealsCompleted = [meals.breakfast, meals.lunch, meals.dinner, meals.snack].filter(Boolean).length;
                                            const mConfig = moodConfig[entry.mood] || moodConfig.okay;
                                            const MoodIcon = mConfig.icon;
                                            
                                            return (
                                                <TableRow key={idx} hover>
                                                    <TableCell>
                                                        <Typography variant="body2">
                                                            {new Date(entry.date).toLocaleDateString()}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <RestaurantIcon sx={{ fontSize: 16, color: accentColors.emerald.main }} />
                                                            <Typography variant="body2">
                                                                {mealsCompleted}/4
                                                            </Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        {entry.exerciseCompleted ? (
                                                            <CheckCircleIcon sx={{ fontSize: 18, color: accentColors.emerald.main }} />
                                                        ) : (
                                                            <Typography variant="body2" color="text.secondary">-</Typography>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2">
                                                            {entry.waterIntake || 0} 💧
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Tooltip title={mConfig.label}>
                                                            <MoodIcon sx={{ fontSize: 20, color: mConfig.color }} />
                                                        </Tooltip>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2">
                                                            {entry.weight ? `${entry.weight} kg` : '-'}
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        ) : (
                            <Alert severity="info" sx={{ mt: 1 }}>
                                No progress entries logged yet
                            </Alert>
                        )}

                        {/* Weight Trend */}
                        {progressData.stats.weights && progressData.stats.weights.length > 0 && (
                            <Box sx={{ mt: 3 }}>
                                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                    Weight History
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    {progressData.stats.weights.slice(-7).map((w, idx) => (
                                        <Chip
                                            key={idx}
                                            label={`${new Date(w.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: ${w.weight}kg`}
                                            size="small"
                                            variant="outlined"
                                        />
                                    ))}
                                </Box>
                            </Box>
                        )}

                        {/* Feedback */}
                        {progressData.plan.feedback?.rating && (
                            <Box sx={{ mt: 3, p: 2, borderRadius: 2, bgcolor: alpha(accentColors.amber.main, 0.1) }}>
                                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                    User Feedback
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <Typography variant="body2">Rating:</Typography>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <span key={star} style={{ color: star <= progressData.plan.feedback.rating ? accentColors.amber.main : '#D1D5DB' }}>
                                            ★
                                        </span>
                                    ))}
                                </Box>
                                {progressData.plan.feedback.comment && (
                                    <Typography variant="body2" color="text.secondary">
                                        "{progressData.plan.feedback.comment}"
                                    </Typography>
                                )}
                            </Box>
                        )}
                    </Box>
                ) : null}
            </DialogContent>
            
            <DialogActions sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                <Button onClick={onClose} variant="outlined">
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default function AdminActivePlansPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('active');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [message, setMessage] = useState({ type: '', text: '' });
    
    const [progressDialogOpen, setProgressDialogOpen] = useState(false);
    const [selectedPlanId, setSelectedPlanId] = useState(null);

    useEffect(() => {
        fetchPlans();
    }, [page, statusFilter]);
    
    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchPlans();
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchPlans = async () => {
        setLoading(true);
        try {
            let url = `${apiBaseUrl}/api/admin/active-plans?page=${page}&limit=10`;
            if (search) url += `&search=${encodeURIComponent(search)}`;
            if (statusFilter) url += `&status=${statusFilter}`;

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                setPlans(data.plans);
                setTotalPages(data.totalPages);
                setTotal(data.total);
            } else {
                throw new Error('Failed to fetch plans');
            }
        } catch (error) {
            console.error('Error fetching plans:', error);
            setMessage({ type: 'error', text: 'Failed to load plans' });
        } finally {
            setLoading(false);
        }
    };

    const handleViewProgress = (planId) => {
        setSelectedPlanId(planId);
        setProgressDialogOpen(true);
    };

    const handleMessageUser = (userId) => {
        if (!userId) return;
        navigate('/admin/chats', { state: { userId } });
    };

    return (
        <PageFade>
            <Box sx={{ p: isMobile ? 2 : 4, maxWidth: 1600, mx: 'auto' }}>
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <PlayCircleFilledIcon sx={{ fontSize: 40, color: accentColors.emerald.main }} />
                        <Typography 
                            variant="h4" 
                            sx={{ 
                                fontWeight: 800, 
                                background: `linear-gradient(45deg, ${accentColors.emerald.main} 30%, ${accentColors.sky.main} 90%)`, 
                                WebkitBackgroundClip: 'text', 
                                WebkitTextFillColor: 'transparent' 
                            }}
                        >
                            Active Plans
                        </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Monitor user plan progress and engagement
                    </Typography>
                </motion.div>
                
                {message.text && (
                    <Alert 
                        severity={message.type} 
                        onClose={() => setMessage({type: '', text: ''})} 
                        sx={{ mb: 2 }}
                    >
                        {message.text}
                    </Alert>
                )}

                {/* Filters */}
                <Paper sx={{ ...glassCard(theme), mb: 3, p: 2 }}>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                        <TextField
                            placeholder="Search by user name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            sx={{ ...glassInput(theme), minWidth: 280, flex: 1 }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon color="action" />
                                    </InputAdornment>
                                ),
                            }}
                            size="small"
                        />
                        <FormControl sx={{ minWidth: 150 }} size="small">
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={statusFilter}
                                label="Status"
                                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                                sx={glassInput(theme)}
                            >
                                <MenuItem value="all">All Statuses</MenuItem>
                                <MenuItem value="active">Active</MenuItem>
                                <MenuItem value="completed">Completed</MenuItem>
                                <MenuItem value="paused">Paused</MenuItem>
                                <MenuItem value="draft">Draft</MenuItem>
                            </Select>
                        </FormControl>
                        <Tooltip title="Refresh">
                            <IconButton onClick={fetchPlans} color="primary">
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Paper>

                {/* Summary Stats */}
                <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        Showing {plans.length} of {total} plans
                    </Typography>
                </Box>

                {/* Plans Table */}
                <Paper sx={{ ...glassCard(theme), overflow: 'hidden' }}>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                            <CircularProgress />
                        </Box>
                    ) : plans.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 6 }}>
                            <PlayCircleFilledIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                            <Typography color="text.secondary">
                                No plans found
                            </Typography>
                        </Box>
                    ) : (
                        <TableContainer sx={{ maxHeight: 'calc(100vh - 350px)' }}>
                            <Table stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>User</TableCell>
                                        <TableCell>Plan</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Progress</TableCell>
                                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Streak</TableCell>
                                        <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Days</TableCell>
                                        <TableCell align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    <AnimatePresence>
                                        {plans.map((plan, index) => {
                                            const statusConfig = getStatusConfig(plan.status);
                                            return (
                                                <motion.tr
                                                    key={plan._id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    component={TableRow}
                                                    hover
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={() => handleViewProgress(plan._id)}
                                                >
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                            <Avatar 
                                                                src={plan.user?.profileImageUrl}
                                                                sx={{ 
                                                                    width: 40, 
                                                                    height: 40,
                                                                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                                                                }}
                                                            >
                                                                {plan.user?.name?.charAt(0).toUpperCase() || '?'}
                                                            </Avatar>
                                                            <Box>
                                                                <Typography variant="subtitle2" fontWeight={600}>
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
                                                    <TableCell>
                                                        <Chip 
                                                            label={statusConfig.label}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: alpha(statusConfig.color, 0.1),
                                                                color: statusConfig.color,
                                                                fontWeight: 600
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, minWidth: 150 }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <LinearProgress 
                                                                variant="determinate" 
                                                                value={plan.overallProgress || 0}
                                                                sx={{
                                                                    flex: 1,
                                                                    height: 8,
                                                                    borderRadius: 4,
                                                                    backgroundColor: alpha(accentColors.emerald.main, 0.2),
                                                                    '& .MuiLinearProgress-bar': {
                                                                        borderRadius: 4,
                                                                        backgroundColor: accentColors.emerald.main
                                                                    }
                                                                }}
                                                            />
                                                            <Typography 
                                                                variant="caption" 
                                                                sx={{ 
                                                                    color: accentColors.emerald.main, 
                                                                    fontWeight: 600, 
                                                                    minWidth: 35 
                                                                }}
                                                            >
                                                                {plan.overallProgress || 0}%
                                                            </Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <LocalFireDepartmentIcon 
                                                                sx={{ 
                                                                    fontSize: 18, 
                                                                    color: plan.currentStreak > 0 ? accentColors.amber.main : 'text.disabled' 
                                                                }} 
                                                            />
                                                            <Typography variant="body2" fontWeight={500}>
                                                                {plan.currentStreak || 0}
                                                            </Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {plan.daysElapsed || 0} / {plan.totalDays || 0}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                                                        <Tooltip title="View Details">
                                                            <IconButton 
                                                                size="small"
                                                                onClick={() => handleViewProgress(plan._id)}
                                                                sx={{ color: theme.palette.primary.main }}
                                                            >
                                                                <VisibilityIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Message User">
                                                            <IconButton 
                                                                size="small"
                                                                onClick={() => handleMessageUser(plan.user?._id)}
                                                                sx={{ color: accentColors.sky.main }}
                                                            >
                                                                <ChatIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </TableCell>
                                                </motion.tr>
                                            );
                                        })}
                                    </AnimatePresence>
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                            <Pagination 
                                count={totalPages} 
                                page={page} 
                                onChange={(e, value) => setPage(value)}
                                color="primary"
                            />
                        </Box>
                    )}
                </Paper>

                {/* Progress Dialog */}
                <PlanProgressDialog 
                    open={progressDialogOpen}
                    onClose={() => setProgressDialogOpen(false)}
                    planId={selectedPlanId}
                    theme={theme}
                />
            </Box>
        </PageFade>
    );
}
