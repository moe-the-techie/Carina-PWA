import React, { useState, useEffect } from 'react';
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
    alpha,
    Card,
    CardContent
} from '@mui/material';
import {
    Search as SearchIcon,
    Email as EmailIcon,
    Refresh as RefreshIcon,
    PlayCircleFilled as PlayCircleFilledIcon,
    LocalFireDepartment as LocalFireDepartmentIcon,
    EmojiEvents as EmojiEventsIcon,
    WaterDrop as WaterDropIcon,
    TrendingUp as TrendingUpIcon,
    CalendarToday as CalendarTodayIcon,
    Close as CloseIcon,
    CheckCircle as CheckCircleIcon,
    SentimentVerySatisfied as SentimentVerySatisfiedIcon,
    SentimentSatisfied as SentimentSatisfiedIcon,
    SentimentNeutral as SentimentNeutralIcon,
    SentimentDissatisfied as SentimentDissatisfiedIcon,
    SentimentVeryDissatisfied as SentimentVeryDissatisfiedIcon,
    Chat as ChatIcon,
    MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PageFade from '../components/PageFade';
import PlanActionsDialog from '../components/PlanActionsDialog';
import { glassCard, glassInput, glassDialog } from '../styles/glassmorphism';
import { accentColors } from '../styles';
import { MEAL_CARD_CONFIG } from '../utils/mealVisuals';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Mood configuration
const moodConfig = {
    great: { icon: SentimentVerySatisfiedIcon, color: '#10B981', label: 'Great' },
    good: { icon: SentimentSatisfiedIcon, color: '#6366F1', label: 'Good' },
    okay: { icon: SentimentNeutralIcon, color: '#FFB020', label: 'Okay' },
    tired: { icon: SentimentDissatisfiedIcon, color: '#F97316', label: 'Tired' },
    bad: { icon: SentimentVeryDissatisfiedIcon, color: '#EF4444', label: 'Bad' }
};

const mealIcons = MEAL_CARD_CONFIG;

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

const formatDisplayDate = (value) => {
    if (!value) return 'Not set';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Not set';
    return date.toLocaleDateString();
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
    const isPhone = useMediaQuery(theme.breakpoints.down('sm'));

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
            fullScreen={isPhone}
            PaperProps={{
                sx: {
                    ...glassDialog(theme),
                    maxHeight: isPhone ? '100vh' : '90vh',
                    m: isPhone ? 0 : undefined
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
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2.5 }}>
                            <Chip
                                icon={<CalendarTodayIcon sx={{ fontSize: 16 }} />}
                                label={`Created: ${formatDisplayDate(progressData.plan.createdAt)}`}
                                size="small"
                                variant="outlined"
                            />
                            <Chip
                                icon={<PlayCircleFilledIcon sx={{ fontSize: 16 }} />}
                                label={`Activated: ${formatDisplayDate(progressData.plan.activatedAt)}`}
                                size="small"
                                variant="outlined"
                            />
                        </Box>
                        
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
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                                                            {mealIcons.map((meal) => {
                                                                const taken = Boolean(meals[meal.key]);
                                                                const MealIcon = meal.icon;
                                                                const baseColor = meal.color;
                                                                return (
                                                                    <Tooltip key={meal.key} title={`${meal.label}: ${taken ? 'Taken' : 'Not taken'}`}>
                                                                        <Box
                                                                            sx={{
                                                                                width: 24,
                                                                                height: 24,
                                                                                borderRadius: '50%',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center',
                                                                                bgcolor: taken
                                                                                    ? alpha(accentColors.emerald.main, 0.12)
                                                                                    : alpha(baseColor, 0.12),
                                                                                color: taken
                                                                                    ? accentColors.emerald.main
                                                                                    : baseColor,
                                                                                border: `1px solid ${taken
                                                                                    ? alpha(accentColors.emerald.main, 0.3)
                                                                                    : alpha(baseColor, 0.28)}`
                                                                            }}
                                                                        >
                                                                            <MealIcon sx={{ fontSize: 14 }} />
                                                                        </Box>
                                                                    </Tooltip>
                                                                );
                                                            })}
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

export default function AdminPlansPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const isPhone = useMediaQuery(theme.breakpoints.down('sm'));
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [message, setMessage] = useState({ type: '', text: '' });
    
    const [progressDialogOpen, setProgressDialogOpen] = useState(false);
    const [selectedPlanId, setSelectedPlanId] = useState(null);
    const [updatingPlanId, setUpdatingPlanId] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [planToDelete, setPlanToDelete] = useState(null);
    const [actionsDialogOpen, setActionsDialogOpen] = useState(false);
    const [selectedPlanForActions, setSelectedPlanForActions] = useState(null);

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

    const handleEditPlan = (plan) => {
        const userId = plan?.user?._id;
        const formId = typeof plan?.form === 'string' ? plan.form : plan?.form?._id;

        if (!userId || !formId) {
            setMessage({ type: 'error', text: 'This plan cannot be edited because the related user/form is missing.' });
            return;
        }

        navigate('/admin/plan-builder', {
            state: {
                selectedUser: userId,
                selectedForm: formId
            }
        });
    };

    const handleStatusChange = async (plan, nextStatus) => {
        if (!plan?._id || !nextStatus || plan.status === nextStatus) {
            return;
        }

        setUpdatingPlanId(plan._id);
        try {
            const response = await fetch(`${apiBaseUrl}/api/admin/plans/${plan._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ status: nextStatus })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData?.error || 'Failed to update plan status');
            }

            setPlans((prev) => prev.map((p) => (
                p._id === plan._id
                    ? {
                        ...p,
                        status: nextStatus,
                        activatedAt: nextStatus === 'active' ? (p.activatedAt || new Date().toISOString()) : p.activatedAt
                    }
                    : p
            )));
            setMessage({ type: 'success', text: 'Plan status updated successfully.' });
        } catch (error) {
            console.error('Error updating plan status:', error);
            setMessage({ type: 'error', text: error.message || 'Failed to update plan status.' });
        } finally {
            setUpdatingPlanId(null);
        }
    };

    const openDeleteDialog = (plan) => {
        setPlanToDelete(plan);
        setDeleteDialogOpen(true);
    };

    const handleOpenActionsDialog = (event, plan) => {
        event.stopPropagation();
        setSelectedPlanForActions(plan);
        setActionsDialogOpen(true);
    };

    const handleCloseActionsDialog = () => {
        setActionsDialogOpen(false);
        setSelectedPlanForActions(null);
    };

    const handleDeletePlan = async () => {
        if (!planToDelete?._id) {
            setDeleteDialogOpen(false);
            return;
        }

        setUpdatingPlanId(planToDelete._id);
        try {
            const response = await fetch(`${apiBaseUrl}/api/admin/plans/${planToDelete._id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData?.error || 'Failed to delete plan');
            }

            setMessage({ type: 'success', text: 'Plan deleted successfully.' });
            setDeleteDialogOpen(false);
            setPlanToDelete(null);
            await fetchPlans();
        } catch (error) {
            console.error('Error deleting plan:', error);
            setMessage({ type: 'error', text: error.message || 'Failed to delete plan.' });
        } finally {
            setUpdatingPlanId(null);
        }
    };

    return (
        <PageFade>
            <Box sx={{ p: isPhone ? 1.5 : isMobile ? 2 : 4, maxWidth: 1600, mx: 'auto' }}>
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                        <PlayCircleFilledIcon sx={{ fontSize: { xs: 32, sm: 36, md: 40 }, color: accentColors.emerald.main }} />
                        <Typography 
                            variant={isPhone ? 'h5' : 'h4'}
                            sx={{ 
                                fontWeight: 800, 
                                background: `linear-gradient(45deg, ${accentColors.emerald.main} 30%, ${accentColors.sky.main} 90%)`, 
                                WebkitBackgroundClip: 'text', 
                                WebkitTextFillColor: 'transparent' 
                            }}
                        >
                            Plans
                        </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Manage plans, update statuses, edit plans, and remove outdated ones
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
                <Paper sx={{ ...glassCard(theme), mb: 3, p: isPhone ? 1.5 : 2 }}>
                    <Box
                        sx={{
                            display: 'flex',
                            gap: 1.5,
                            flexWrap: 'wrap',
                            alignItems: isPhone ? 'stretch' : 'center',
                            flexDirection: isPhone ? 'column' : 'row'
                        }}
                    >
                        <TextField
                            placeholder="Search by user name, email, or plan title..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            sx={{ ...glassInput(theme), minWidth: isPhone ? 0 : 280, width: isPhone ? '100%' : 'auto', flex: 1 }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon color="action" />
                                    </InputAdornment>
                                ),
                            }}
                            size="small"
                        />
                        <FormControl sx={{ minWidth: isPhone ? 0 : 150, width: isPhone ? '100%' : 'auto' }} size="small">
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
                            <IconButton onClick={fetchPlans} color="primary" sx={{ alignSelf: isPhone ? 'flex-end' : 'center' }}>
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
                    ) : isPhone ? (
                        <Box sx={{ p: 1.25, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                            <AnimatePresence>
                                {plans.map((plan, index) => {
                                    const statusConfig = getStatusConfig(plan.status);
                                    return (
                                        <motion.div
                                            key={plan._id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.04 }}
                                        >
                                            <Card
                                                onClick={() => handleViewProgress(plan._id)}
                                                sx={{
                                                    borderRadius: 4,
                                                    border: '1px solid transparent',
                                                    boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)',
                                                    transition: 'all 0.3s ease',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <CardContent>
                                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                                                        <Box sx={{ display: 'flex', gap: 2, minWidth: 0 }}>
                                                            <Avatar
                                                                src={plan.user?.profileImageUrl}
                                                                sx={{
                                                                    width: 56,
                                                                    height: 56,
                                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                                                    border: `2px solid ${theme.palette.background.paper}`,
                                                                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                                                    fontSize: '1.5rem',
                                                                    fontWeight: 600
                                                                }}
                                                            >
                                                                {plan.user?.name?.charAt(0).toUpperCase() || '?'}
                                                            </Avatar>
                                                            <Box sx={{ minWidth: 0 }}>
                                                                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }} noWrap>
                                                                    {plan.user?.name || 'Unknown'}
                                                                </Typography>
                                                                <Typography
                                                                    variant="body2"
                                                                    color="text.secondary"
                                                                    sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}
                                                                    noWrap
                                                                >
                                                                    <EmailIcon sx={{ fontSize: 14 }} />
                                                                    {plan.user?.email || ''}
                                                                </Typography>
                                                            </Box>
                                                        </Box>
                                                        <Box
                                                            onClick={(e) => e.stopPropagation()}
                                                            sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.75, flexShrink: 0 }}
                                                        >
                                                            <IconButton onClick={(e) => handleOpenActionsDialog(e, plan)}>
                                                                <MoreVertIcon />
                                                            </IconButton>
                                                            <Chip
                                                                label={statusConfig.label}
                                                                size="small"
                                                                sx={{
                                                                    bgcolor: alpha(statusConfig.color, 0.1),
                                                                    color: statusConfig.color,
                                                                    fontWeight: 600,
                                                                    flexShrink: 0,
                                                                    '& .MuiChip-label': {
                                                                        whiteSpace: 'nowrap'
                                                                    }
                                                                }}
                                                            />
                                                        </Box>
                                                    </Box>

                                                <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                                                    {plan.title || 'Nutrition Plan'}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                                    Duration: {plan.duration} week{plan.duration > 1 ? 's' : ''}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                                    Created: {formatDisplayDate(plan.createdAt)}
                                                </Typography>

                                                <Box sx={{ mt: 1.25 }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                        <Typography variant="caption" color="text.secondary">Progress</Typography>
                                                        <Typography variant="caption" sx={{ color: accentColors.emerald.main, fontWeight: 700 }}>
                                                            {plan.overallProgress || 0}%
                                                        </Typography>
                                                    </Box>
                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={plan.overallProgress || 0}
                                                        sx={{
                                                            height: 7,
                                                            borderRadius: 4,
                                                            backgroundColor: alpha(accentColors.emerald.main, 0.2),
                                                            '& .MuiLinearProgress-bar': {
                                                                borderRadius: 4,
                                                                backgroundColor: accentColors.emerald.main
                                                            }
                                                        }}
                                                    />
                                                </Box>

                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1, mb: 1.25 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        <LocalFireDepartmentIcon
                                                            sx={{
                                                                fontSize: 16,
                                                                color: plan.currentStreak > 0 ? accentColors.amber.main : 'text.disabled'
                                                            }}
                                                        />
                                                        <Typography variant="caption" color="text.secondary">
                                                            Streak: {plan.currentStreak || 0}
                                                        </Typography>
                                                    </Box>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Days: {plan.daysElapsed || 0} / {plan.totalDays || 0}
                                                    </Typography>
                                                </Box>

                                                    <Box onClick={(e) => e.stopPropagation()}>
                                                        <FormControl size="small" fullWidth>
                                                            <InputLabel>Update Status</InputLabel>
                                                            <Select
                                                                value={plan.status || 'draft'}
                                                                label="Update Status"
                                                                onChange={(e) => handleStatusChange(plan, e.target.value)}
                                                                disabled={updatingPlanId === plan._id}
                                                            >
                                                                <MenuItem value="draft">Draft</MenuItem>
                                                                <MenuItem value="active">Active</MenuItem>
                                                                <MenuItem value="paused">Paused</MenuItem>
                                                                <MenuItem value="completed">Completed</MenuItem>
                                                            </Select>
                                                        </FormControl>
                                                        {updatingPlanId === plan._id && <CircularProgress size={16} sx={{ mt: 1.25, ml: 0.5 }} />}
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
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
                                        <TableCell>Status Control</TableCell>
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
                                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                                            Created: {formatDisplayDate(plan.createdAt)}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                                            Activated: {formatDisplayDate(plan.activatedAt)}
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
                                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                                        <FormControl size="small" sx={{ minWidth: 130 }}>
                                                            <Select
                                                                value={plan.status || 'draft'}
                                                                onClick={(e) => e.stopPropagation()}
                                                                onChange={(e) => handleStatusChange(plan, e.target.value)}
                                                                disabled={updatingPlanId === plan._id}
                                                            >
                                                                <MenuItem value="draft">Draft</MenuItem>
                                                                <MenuItem value="active">Active</MenuItem>
                                                                <MenuItem value="paused">Paused</MenuItem>
                                                                <MenuItem value="completed">Completed</MenuItem>
                                                            </Select>
                                                        </FormControl>
                                                    </TableCell>
                                                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                                                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                                                            <Button
                                                                variant="contained"
                                                                size="small"
                                                                onClick={(e) => handleOpenActionsDialog(e, plan)}
                                                                sx={{
                                                                    borderRadius: 2,
                                                                    textTransform: 'none',
                                                                    boxShadow: 'none',
                                                                    '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }
                                                                }}
                                                            >
                                                                Actions
                                                            </Button>
                                                            {updatingPlanId === plan._id && (
                                                                <CircularProgress size={16} />
                                                            )}
                                                        </Box>
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
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2, borderTop: `1px solid ${theme.palette.divider}`, px: isPhone ? 1 : 0 }}>
                            <Pagination 
                                count={totalPages} 
                                page={page} 
                                onChange={(e, value) => setPage(value)}
                                color="primary"
                                size={isPhone ? 'small' : 'medium'}
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

                <PlanActionsDialog
                    open={actionsDialogOpen}
                    onClose={handleCloseActionsDialog}
                    plan={selectedPlanForActions}
                    onViewDetails={(plan) => handleViewProgress(plan._id)}
                    onMessage={handleMessageUser}
                    onEdit={handleEditPlan}
                    onDelete={openDeleteDialog}
                    isDeleting={updatingPlanId === selectedPlanForActions?._id}
                />

                <Dialog
                    open={deleteDialogOpen}
                    onClose={() => {
                        if (updatingPlanId !== planToDelete?._id) {
                            setDeleteDialogOpen(false);
                            setPlanToDelete(null);
                        }
                    }}
                    maxWidth="xs"
                    fullWidth
                >
                    <DialogTitle>Delete Plan</DialogTitle>
                    <DialogContent>
                        <Typography variant="body2" color="text.secondary">
                            Are you sure you want to delete 
                            <Typography component="span" sx={{ fontWeight: 700, mx: 0.5, color: 'text.primary' }}>
                                {planToDelete?.title || 'this plan'}
                            </Typography>
                            ? This action cannot be undone.
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button
                            onClick={() => {
                                setDeleteDialogOpen(false);
                                setPlanToDelete(null);
                            }}
                            disabled={updatingPlanId === planToDelete?._id}
                        >
                            Cancel
                        </Button>
                        <Button
                            color="error"
                            variant="contained"
                            onClick={handleDeletePlan}
                            disabled={updatingPlanId === planToDelete?._id}
                        >
                            {updatingPlanId === planToDelete?._id ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </PageFade>
    );
}
