import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { 
    Box, 
    Typography, 
    Paper, 
    Divider, 
    Button, 
    useTheme, 
    Grid, 
    Chip, 
    Avatar, 
    Accordion, 
    AccordionSummary, 
    AccordionDetails, 
    Card, 
    CardContent, 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    DialogActions, 
    TextField, 
    Rating, 
    Alert, 
    Snackbar, 
    Skeleton,
    IconButton,
    LinearProgress,
    alpha,
    Tooltip,
    useMediaQuery,
    Slide,
    Tabs,
    Tab
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBackIos';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FeedbackIcon from '@mui/icons-material/Feedback';
import DescriptionIcon from '@mui/icons-material/Description';
import FlagIcon from '@mui/icons-material/Flag';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import WbTwilightIcon from '@mui/icons-material/WbTwilight';
import NightsStayIcon from '@mui/icons-material/NightsStay';
import CookieIcon from '@mui/icons-material/Cookie';
import { motion, AnimatePresence } from 'framer-motion';
import PageFade from '../components/PageFade';
import LoadingBackdrop from '../components/LoadingBackdrop';
import { spacing, borderRadius, transitions, accentColors } from '../styles';
import { glassCard, glassDialog, glassButton } from '../styles/glassmorphism';
import { containerVariants, itemVariants } from '../styles/animations';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function ViewPlanPage () {
    const theme = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const { id } = useParams();
    const form = location.state?.form;
    
    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Form details state
    const [formData, setFormData] = useState(location.state?.form || null);
    const [formDetailsOpen, setFormDetailsOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imageDialogOpen, setImageDialogOpen] = useState(false);

    // Chip detail dialog state
    const [chipDetailDialogOpen, setChipDetailDialogOpen] = useState(false);
    const [selectedChipContent, setSelectedChipContent] = useState('');
    const [selectedChipTitle, setSelectedChipTitle] = useState('');
    const [selectedChipCategory, setSelectedChipCategory] = useState('');

    // Feedback state
    const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
    const [feedbackRating, setFeedbackRating] = useState(0);
    const [feedbackComment, setFeedbackComment] = useState('');
    const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');

    // Weekly plan state
    const [selectedDayTab, setSelectedDayTab] = useState(0);
    const daysOfWeek = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const dayLabels = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

    useEffect(() => {
        if (form) {
            fetchPlan(form._id);
        } else if (id) {
            // If no form in state, fetch by form ID from URL
            fetchPlan(id);
            fetchForm(id);
        } else {
            setError('No form data provided');
            setLoading(false);
        }
    }, [form, id]);

    const fetchForm = async (formId) => {
        try {
            const response = await fetch(`${apiBaseUrl}/api/forms/my/${formId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setFormData(data.form);
            }
        } catch (err) {
            console.error('Error fetching form details:', err);
        }
    };

    const fetchPlan = async (formId) => {
        try {
            setLoading(true);
            const response = await fetch(`${apiBaseUrl}/api/forms/my/${formId}/plan`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    setError('No plan available yet. Your form is being reviewed by our nutrition team.');
                    return;
                }
                throw new Error('Failed to fetch plan');
            }

            const data = await response.json();
            setPlan(data.plan);
            
            // Initialize feedback state if feedback exists
            if (data.plan.feedback) {
                setFeedbackRating(data.plan.feedback.rating || 0);
                setFeedbackComment(data.plan.feedback.comment || '');
            }
        } catch (error) {
            console.error('Error fetching plan:', error);
            setError('Error loading your plan. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    // Submit feedback
    const handleSubmitFeedback = async () => {
        if (feedbackRating === 0) {
            setSnackbarMessage('Please provide a rating');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            return;
        }

        try {
            setFeedbackSubmitting(true);
            const response = await fetch(`${apiBaseUrl}/api/plans/${plan._id}/feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    rating: feedbackRating,
                    comment: feedbackComment
                })
            });

            if (!response.ok) {
                throw new Error('Failed to submit feedback');
            }

            const data = await response.json();
            
            setPlan(prev => ({
                ...prev,
                feedback: data.feedback
            }));

            setSnackbarMessage('Feedback submitted successfully!');
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
            setFeedbackDialogOpen(false);
        } catch (error) {
            console.error('Error submitting feedback:', error);
            setSnackbarMessage('Failed to submit feedback. Please try again.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        } finally {
            setFeedbackSubmitting(false);
        }
    };

    const handleOpenFeedbackDialog = () => {
        if (plan?.feedback) {
            setFeedbackRating(plan.feedback.rating || 0);
            setFeedbackComment(plan.feedback.comment || '');
        }
        setFeedbackDialogOpen(true);
    };

    // Function to open chip detail dialog
    const openChipDetailDialog = (content, title, category) => {
        setSelectedChipContent(content);
        setSelectedChipTitle(title);
        setSelectedChipCategory(category);
        setChipDetailDialogOpen(true);
    };

    // Glassmorphism card style
    const glassCardStyle = {
        background: theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.03)'
            : 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: 3,
        border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
        boxShadow: theme.palette.mode === 'dark'
            ? '0 8px 32px rgba(0, 0, 0, 0.3)'
            : '0 8px 32px rgba(0, 0, 0, 0.06)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
    };

    if (loading) {
        return (
            <PageFade>
                <Box
                    sx={{
                        minHeight: '100vh',
                        background: theme.palette.mode === 'dark'
                            ? `linear-gradient(135deg, ${theme.palette.background.default} 0%, #1a1a2e 100%)`
                            : `linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)`,
                        p: { xs: 2, sm: 3, md: 4 },
                    }}
                >
                    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
                        {/* Header Skeleton */}
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', mb: 4 }}>
                            <Skeleton variant="text" width="50%" height={50} />
                        </Box>
                        
                        {/* Stats Cards Skeleton */}
                        <Grid container spacing={2} sx={{ mb: 4 }}>
                            {[1, 2, 3, 4].map((i) => (
                                <Grid item xs={6} md={3} key={i}>
                                    <Paper sx={{ ...glassCardStyle, p: 3 }}>
                                        <Skeleton variant="circular" width={48} height={48} sx={{ mb: 2 }} />
                                        <Skeleton variant="text" width="60%" height={32} />
                                        <Skeleton variant="text" width="80%" height={20} />
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>

                        {/* Content Skeleton */}
                        {[1, 2, 3].map((item) => (
                            <Paper key={item} sx={{ ...glassCardStyle, p: 3, mb: 2 }}>
                                <Skeleton variant="text" width="30%" height={32} sx={{ mb: 2 }} />
                                <Skeleton variant="rectangular" width="100%" height={120} sx={{ borderRadius: 2, mb: 2 }} />
                                <Skeleton variant="text" width="90%" height={20} />
                            </Paper>
                        ))}
                    </Box>
                </Box>
            </PageFade>
        );
    }

    if (error) {
        return (
            <PageFade>
                <Box 
                    sx={{
                        minHeight: '100vh',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: theme.palette.mode === 'dark'
                            ? `linear-gradient(135deg, ${theme.palette.background.default} 0%, #1a1a2e 100%)`
                            : `linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)`,
                        p: 3,
                        textAlign: 'center',
                    }}
                >
                    <IconButton 
                        onClick={() => navigate(-1)} 
                        sx={{ 
                            position: 'absolute', 
                            top: 20, 
                            left: 20,
                            backgroundColor: theme.palette.mode === 'dark' 
                                ? 'rgba(255,255,255,0.05)' 
                                : 'rgba(0,0,0,0.04)',
                        }}
                    >
                        <ArrowBackIcon sx={{ fontSize: 28, color: theme.palette.text.primary }} />
                    </IconButton>
                    
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Paper sx={{ ...glassCardStyle, p: 5, maxWidth: 500, textAlign: 'center' }}>
                            <Box sx={{
                                width: 80,
                                height: 80,
                                borderRadius: '50%',
                                background: `linear-gradient(135deg, ${theme.palette.primary.main}20, ${theme.palette.secondary.main}20)`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mx: 'auto',
                                mb: 3,
                            }}>
                                <TipsAndUpdatesIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />
                            </Box>
                            <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                                Plan in Progress
                            </Typography>
                            <Typography color="text.secondary" sx={{ mb: 2, lineHeight: 1.7 }}>
                                {error}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ opacity: 0.8 }}>
                                You'll be notified once your personalized plan is ready.
                            </Typography>
                            <Button
                                variant="contained"
                                onClick={() => navigate('/home')}
                                sx={{
                                    mt: 4,
                                    py: 1.5,
                                    px: 4,
                                    borderRadius: 3,
                                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                                    textTransform: 'none',
                                    fontWeight: 600,
                                }}
                            >
                                Return to Home
                            </Button>
                        </Paper>
                    </motion.div>
                </Box>
            </PageFade>
        );
    }

    return (
        <PageFade>
            <Box
                sx={{
                    minHeight: '100vh',
                    background: theme.palette.mode === 'dark'
                        ? `linear-gradient(135deg, ${theme.palette.background.default} 0%, #1a1a2e 100%)`
                        : `linear-gradient(135deg, #f8fafc 0%, #e8f5e9 50%, #f8fafc 100%)`,
                    position: 'relative',
                }}
            >
                {/* Decorative Background */}
                <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
                    <Box sx={{
                        position: 'absolute',
                        width: 400,
                        height: 400,
                        borderRadius: '50%',
                        background: `radial-gradient(circle, ${theme.palette.primary.main}10, transparent)`,
                        top: '-10%',
                        right: '-10%',
                    }} />
                    <Box sx={{
                        position: 'absolute',
                        width: 300,
                        height: 300,
                        borderRadius: '50%',
                        background: `radial-gradient(circle, ${theme.palette.secondary.main}08, transparent)`,
                        bottom: '20%',
                        left: '-5%',
                    }} />
                </Box>

                <Box sx={{ 
                    maxWidth: 1200, 
                    mx: 'auto', 
                    p: { xs: 2, sm: 3, md: 4 },
                    position: 'relative',
                    zIndex: 1,
                }}>
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            position: 'relative',
                            mb: 4
                        }}>
                            <IconButton 
                                onClick={() => navigate(-1)} 
                                sx={{ 
                                    position: 'absolute', 
                                    left: 0,
                                    backgroundColor: theme.palette.mode === 'dark' 
                                        ? 'rgba(255,255,255,0.05)' 
                                        : 'rgba(0,0,0,0.04)',
                                    '&:hover': {
                                        backgroundColor: theme.palette.mode === 'dark' 
                                            ? 'rgba(255,255,255,0.1)' 
                                            : 'rgba(0,0,0,0.08)',
                                    }
                                }}
                            >
                                <ArrowBackIcon sx={{ fontSize: { xs: 24, sm: 28 } }} />
                            </IconButton>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography 
                                    variant="h4"
                                    sx={{
                                        fontWeight: 700,
                                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                        backgroundClip: 'text',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
                                    }}
                                >
                                    My Nutrition Plan
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Your personalized dietary guidance
                                </Typography>
                            </Box>
                            
                            {/* View Form Button */}
                            {formData && (
                                <>
                                    <Button
                                        startIcon={<DescriptionIcon />}
                                        onClick={() => setFormDetailsOpen(true)}
                                        sx={{
                                            position: 'absolute',
                                            right: 0,
                                            display: { xs: 'none', sm: 'flex' },
                                            ...glassButton(theme, 'primary'),
                                            zIndex: 2
                                        }}
                                    >
                                        View Submission
                                    </Button>
                                    <IconButton
                                        onClick={() => setFormDetailsOpen(true)}
                                        sx={{
                                            position: 'absolute',
                                            right: 0,
                                            display: { xs: 'flex', sm: 'none' },
                                            backgroundColor: theme.palette.mode === 'dark' 
                                                ? 'rgba(255,255,255,0.05)' 
                                                : 'rgba(0,0,0,0.04)',
                                            zIndex: 2
                                        }}
                                    >
                                        <DescriptionIcon />
                                    </IconButton>
                                </>
                            )}
                        </Box>
                    </motion.div>

                    {plan && (
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            {/* Quick Stats Cards */}
                            <motion.div variants={itemVariants}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
                                    {[
                                        { 
                                            label: 'Target Weight', 
                                            value: `${plan.goals?.targetWeight || '--'} kg`, 
                                            icon: FlagIcon, 
                                            color: theme.palette.primary.main,
                                            gradient: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`
                                        },
                                        { 
                                            label: 'Daily Calories', 
                                            value: plan.goals?.targetCalories || '--', 
                                            icon: LocalFireDepartmentIcon, 
                                            color: '#F59E0B',
                                            gradient: 'linear-gradient(135deg, #F59E0B, #D97706)'
                                        },
                                        { 
                                            label: 'Duration', 
                                            value: `${plan.duration || '--'} weeks`, 
                                            icon: RestaurantIcon, 
                                            color: '#10B981',
                                            gradient: 'linear-gradient(135deg, #10B981, #059669)'
                                        },
                                        { 
                                            label: 'Status', 
                                            value: plan.status?.charAt(0).toUpperCase() + plan.status?.slice(1) || '--', 
                                            icon: plan.status === 'active' ? CheckCircleIcon : FitnessCenterIcon, 
                                            color: '#8B5CF6',
                                            gradient: 'linear-gradient(135deg, #8B5CF6, #7C3AED)'
                                        },
                                    ].map((stat, index) => (
                                        <Paper 
                                            key={index}
                                            sx={{ 
                                                ...glassCardStyle, 
                                                p: 3,
                                                position: 'relative',
                                                overflow: 'hidden',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 2,
                                                transition: 'all 0.3s',
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
                                                width: 56,
                                                height: 56,
                                                borderRadius: 2,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                background: stat.gradient,
                                                boxShadow: `0 4px 12px ${stat.color}40`,
                                                flexShrink: 0
                                            }}>
                                                <stat.icon sx={{ color: 'white', fontSize: 28 }} />
                                            </Box>
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Typography 
                                                    variant="h5" 
                                                    sx={{ 
                                                        fontWeight: 700, 
                                                        mb: 0.5,
                                                        fontSize: '1.75rem',
                                                        background: stat.gradient,
                                                        WebkitBackgroundClip: 'text',
                                                        WebkitTextFillColor: 'transparent',
                                                    }}
                                                >
                                                    {stat.value}
                                                </Typography>
                                                <Typography 
                                                    variant="body1" 
                                                    sx={{ 
                                                        color: 'text.secondary',
                                                        fontWeight: 500,
                                                        fontSize: '1rem'
                                                    }}
                                                >
                                                    {stat.label}
                                                </Typography>
                                            </Box>
                                        </Paper>
                                    ))}
                                </Box>
                            </motion.div>

                            {/* Plan Overview */}
                            <motion.div variants={itemVariants}>
                                <Paper sx={{ ...glassCardStyle, p: 3, mb: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                        <Box sx={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: 2,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                                            boxShadow: `0 4px 12px ${theme.palette.primary.main}40`,
                                        }}>
                                            <RestaurantIcon sx={{ color: 'white', fontSize: 20 }} />
                                        </Box>
                                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                            Plan Overview
                                        </Typography>
                                    </Box>
                                    
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                        <Box>
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                                                Title
                                            </Typography>
                                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                                                {plan.title}
                                            </Typography>
                                            
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                                                Description
                                            </Typography>
                                            <Typography variant="body1" sx={{ lineHeight: 1.8, fontSize: '1rem' }}>
                                                {plan.description || 'Personalized nutrition plan'}
                                            </Typography>
                                        </Box>
                                        <Box sx={{
                                            p: 3,
                                            borderRadius: 3,
                                            backgroundColor: theme.palette.mode === 'dark' 
                                                ? 'rgba(255,255,255,0.05)'
                                                : 'rgba(0,0,0,0.03)',
                                            border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`
                                        }}>
                                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                                                Macro Targets
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                {[
                                                    { label: 'Protein', value: plan.goals?.targetProtein, color: '#EF4444' },
                                                    { label: 'Carbs', value: plan.goals?.targetCarbs, color: '#F59E0B' },
                                                    { label: 'Fats', value: plan.goals?.targetFats, color: '#10B981' },
                                                ].map((macro) => (
                                                    <Box 
                                                        key={macro.label}
                                                        sx={{ 
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            p: 2,
                                                            borderRadius: 2,
                                                            backgroundColor: alpha(macro.color, 0.08),
                                                            border: `1px solid ${alpha(macro.color, 0.2)}`
                                                        }}
                                                    >
                                                        <Typography 
                                                            variant="body1"
                                                            sx={{ fontWeight: 500 }}
                                                        >
                                                            {macro.label}
                                                        </Typography>
                                                        <Typography 
                                                            variant="h5" 
                                                            sx={{ 
                                                                fontWeight: 700,
                                                                color: macro.color,
                                                            }}
                                                        >
                                                            {macro.value || '--'}g
                                                        </Typography>
                                                    </Box>
                                                ))}
                                            </Box>
                                        </Box>
                                    </Box>
                                </Paper>
                            </motion.div>

                            {/* Feedback Section */}
                            <motion.div variants={itemVariants}>
                                <Paper sx={{ ...glassCardStyle, p: 3, mb: 3 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Box sx={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: 2,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
                                                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
                                            }}>
                                                <FeedbackIcon sx={{ color: 'white', fontSize: 20 }} />
                                            </Box>
                                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                Your Feedback
                                            </Typography>
                                        </Box>
                                        <Button
                                            variant="contained"
                                            startIcon={<FeedbackIcon />}
                                            onClick={handleOpenFeedbackDialog}
                                            size="small"
                                            sx={{
                                                borderRadius: 2,
                                                textTransform: 'none',
                                                background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
                                                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                                            }}
                                        >
                                            {plan.feedback?.rating ? 'Update' : 'Give Feedback'}
                                        </Button>
                                    </Box>
                                    
                                    {plan.feedback?.rating ? (
                                        <Box sx={{
                                            p: 2,
                                            borderRadius: 2,
                                            backgroundColor: alpha('#8B5CF6', 0.1),
                                            border: '1px solid',
                                            borderColor: alpha('#8B5CF6', 0.2),
                                        }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                <Rating value={plan.feedback.rating} readOnly size="small" />
                                                <Typography variant="body2" color="text.secondary">
                                                    ({plan.feedback.rating}/5)
                                                </Typography>
                                            </Box>
                                            {plan.feedback.comment && (
                                                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                    "{plan.feedback.comment}"
                                                </Typography>
                                            )}
                                        </Box>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">
                                            Share your experience with this nutrition plan to help us improve our services.
                                        </Typography>
                                    )}
                                </Paper>
                            </motion.div>

                            {/* Warnings Section */}
                            {plan.warnings && plan.warnings.length > 0 && (
                                <motion.div variants={itemVariants}>
                                    <Paper 
                                        sx={{ 
                                            ...glassCardStyle, 
                                            p: 3, 
                                            mb: 3,
                                            background: theme.palette.mode === 'dark'
                                                ? alpha('#EF4444', 0.1)
                                                : alpha('#FEE2E2', 0.8),
                                            border: `1px solid ${alpha('#EF4444', 0.3)}`,
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                            <Box sx={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: 2,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                                                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
                                            }}>
                                                <WarningAmberIcon sx={{ color: 'white', fontSize: 20 }} />
                                            </Box>
                                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#DC2626' }}>
                                                ⚠️ Important Warnings
                                            </Typography>
                                        </Box>
                                        
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                            {plan.warnings.map((warning, index) => (
                                                <Box 
                                                    key={index} 
                                                    onClick={() => openChipDetailDialog(warning, 'Important Warning', 'Warnings')}
                                                    sx={{ 
                                                        p: 2, 
                                                        backgroundColor: 'white',
                                                        border: '1px solid',
                                                        borderColor: alpha('#EF4444', 0.3),
                                                        borderRadius: 2,
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s ease',
                                                        '&:hover': {
                                                            transform: 'translateY(-2px)',
                                                            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
                                                        }
                                                    }}
                                                >
                                                    <Typography variant="body2" sx={{ color: '#DC2626', fontWeight: 500 }}>
                                                        {warning.length > 150 ? `${warning.substring(0, 150)}...` : warning}
                                                    </Typography>
                                                </Box>
                                            ))}
                                        </Box>
                                    </Paper>
                                </motion.div>
                            )}

                            {/* Dietary Recommendations */}
                            {plan.recommendations && (
                                <motion.div variants={itemVariants}>
                                    <Paper sx={{ ...glassCardStyle, p: 3, mb: 3 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                                            <Box sx={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: 2,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                background: 'linear-gradient(135deg, #10B981, #059669)',
                                                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
                                            }}>
                                                <FitnessCenterIcon sx={{ color: 'white', fontSize: 20 }} />
                                            </Box>
                                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                Dietary Recommendations
                                            </Typography>
                                        </Box>
                                        
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                            {[
                                                { label: 'Avoid', items: plan.recommendations.avoid, color: '#EF4444', bgColor: alpha('#EF4444', 0.08), icon: '🚫' },
                                                { label: 'Use Carefully', items: plan.recommendations.useCarefully, color: '#F59E0B', bgColor: alpha('#F59E0B', 0.08), icon: '⚠️' },
                                                { label: 'Allowed', items: plan.recommendations.allowed, color: '#10B981', bgColor: alpha('#10B981', 0.08), icon: '✅' },
                                                { label: 'Exercise', items: plan.recommendations.exercise, color: '#3B82F6', bgColor: alpha('#3B82F6', 0.08), icon: '💪' },
                                            ].map((category, idx) => (
                                                <Box 
                                                    key={idx}
                                                    sx={{
                                                        p: 3,
                                                        borderRadius: 3,
                                                        backgroundColor: category.bgColor,
                                                        border: `2px solid ${alpha(category.color, 0.3)}`,
                                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                                        '&:hover': {
                                                            transform: 'translateY(-2px)',
                                                            boxShadow: `0 8px 24px ${alpha(category.color, 0.2)}`,
                                                        }
                                                    }}
                                                >
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                                                        <Typography variant="h5" sx={{ fontSize: '1.75rem' }}>
                                                            {category.icon}
                                                        </Typography>
                                                        <Typography 
                                                            variant="h6" 
                                                            sx={{ 
                                                                color: category.color, 
                                                                fontWeight: 700,
                                                                fontSize: '1.25rem'
                                                            }}
                                                        >
                                                            {category.label}
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                        {category.items?.length > 0 ? (
                                                            category.items.map((item, index) => (
                                                                <Chip 
                                                                    key={index} 
                                                                    label={item.length > 25 ? `${item.substring(0, 25)}...` : item} 
                                                                    size="medium" 
                                                                    onClick={() => openChipDetailDialog(item, `${category.label} Item`, category.label)}
                                                                    sx={{ 
                                                                        cursor: 'pointer',
                                                                        fontSize: '0.9rem',
                                                                        py: 2.5,
                                                                        px: 1.5,
                                                                        backgroundColor: theme.palette.mode === 'dark' ? alpha(category.color, 0.15) : 'white',
                                                                        color: theme.palette.mode === 'dark' ? 'white' : category.color,
                                                                        border: `1px solid ${alpha(category.color, 0.3)}`,
                                                                        fontWeight: 500,
                                                                        '&:hover': { 
                                                                            backgroundColor: alpha(category.color, 0.2),
                                                                            transform: 'scale(1.05)',
                                                                            boxShadow: `0 4px 12px ${alpha(category.color, 0.3)}`,
                                                                        },
                                                                        transition: 'all 0.2s'
                                                                    }}
                                                                />
                                                            ))
                                                        ) : (
                                                            <Typography variant="body1" color="text.secondary" sx={{ fontStyle: 'italic', py: 1 }}>
                                                                None specified
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Box>
                                            ))}
                                        </Box>
                                    </Paper>
                                </motion.div>
                            )}

                            {/* Weekly Meal Plan */}
                            {plan.weeklyPlan && (
                                <motion.div variants={itemVariants}>
                                    <Paper sx={{ ...glassCardStyle, p: 3, mb: 3 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                                            <Box sx={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: 2,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                                                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
                                            }}>
                                                <CalendarTodayIcon sx={{ color: 'white', fontSize: 20 }} />
                                            </Box>
                                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                Weekly Meal Plan
                                            </Typography>
                                        </Box>
                                        
                                        {/* Day Tabs */}
                                        <Tabs
                                            value={selectedDayTab}
                                            onChange={(e, newValue) => setSelectedDayTab(newValue)}
                                            variant="scrollable"
                                            scrollButtons="auto"
                                            sx={{
                                                mb: 3,
                                                borderBottom: 1,
                                                borderColor: 'divider',
                                                '& .MuiTab-root': {
                                                    minWidth: 'auto',
                                                    px: 2,
                                                    py: 1.5,
                                                    fontWeight: 600,
                                                    textTransform: 'none',
                                                },
                                                '& .Mui-selected': {
                                                    color: '#3B82F6',
                                                }
                                            }}
                                        >
                                            {daysOfWeek.map((day, index) => (
                                                <Tab 
                                                    key={day} 
                                                    label={dayLabels[index]} 
                                                    sx={{
                                                        fontSize: { xs: '0.85rem', sm: '0.95rem' },
                                                    }}
                                                />
                                            ))}
                                        </Tabs>

                                        {/* Day Content */}
                                        {daysOfWeek.map((day, dayIndex) => (
                                            <Box
                                                key={day}
                                                role="tabpanel"
                                                hidden={selectedDayTab !== dayIndex}
                                            >
                                                {selectedDayTab === dayIndex && (
                                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                                        {/* Breakfast */}
                                                        <Box sx={{
                                                            p: 2.5,
                                                            borderRadius: 3,
                                                            backgroundColor: alpha('#F59E0B', 0.08),
                                                            border: `2px solid ${alpha('#F59E0B', 0.3)}`,
                                                        }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                                                <WbSunnyIcon sx={{ color: '#F59E0B', fontSize: 24 }} />
                                                                <Typography variant="h6" sx={{ color: '#F59E0B', fontWeight: 600 }}>
                                                                    Breakfast
                                                                </Typography>
                                                            </Box>
                                                            <Typography 
                                                                variant="body1" 
                                                                sx={{ 
                                                                    whiteSpace: 'pre-wrap',
                                                                    lineHeight: 1.7,
                                                                    color: theme.palette.text.primary
                                                                }}
                                                            >
                                                                {plan.weeklyPlan[day]?.breakfast || 'Not specified'}
                                                            </Typography>
                                                        </Box>

                                                        {/* Lunch */}
                                                        <Box sx={{
                                                            p: 2.5,
                                                            borderRadius: 3,
                                                            backgroundColor: alpha('#10B981', 0.08),
                                                            border: `2px solid ${alpha('#10B981', 0.3)}`,
                                                        }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                                                <WbTwilightIcon sx={{ color: '#10B981', fontSize: 24 }} />
                                                                <Typography variant="h6" sx={{ color: '#10B981', fontWeight: 600 }}>
                                                                    Lunch
                                                                </Typography>
                                                            </Box>
                                                            <Typography 
                                                                variant="body1" 
                                                                sx={{ 
                                                                    whiteSpace: 'pre-wrap',
                                                                    lineHeight: 1.7,
                                                                    color: theme.palette.text.primary
                                                                }}
                                                            >
                                                                {plan.weeklyPlan[day]?.lunch || 'Not specified'}
                                                            </Typography>
                                                        </Box>

                                                        {/* Dinner */}
                                                        <Box sx={{
                                                            p: 2.5,
                                                            borderRadius: 3,
                                                            backgroundColor: alpha('#6366F1', 0.08),
                                                            border: `2px solid ${alpha('#6366F1', 0.3)}`,
                                                        }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                                                <NightsStayIcon sx={{ color: '#6366F1', fontSize: 24 }} />
                                                                <Typography variant="h6" sx={{ color: '#6366F1', fontWeight: 600 }}>
                                                                    Dinner
                                                                </Typography>
                                                            </Box>
                                                            <Typography 
                                                                variant="body1" 
                                                                sx={{ 
                                                                    whiteSpace: 'pre-wrap',
                                                                    lineHeight: 1.7,
                                                                    color: theme.palette.text.primary
                                                                }}
                                                            >
                                                                {plan.weeklyPlan[day]?.dinner || 'Not specified'}
                                                            </Typography>
                                                        </Box>

                                                        {/* Snack */}
                                                        <Box sx={{
                                                            p: 2.5,
                                                            borderRadius: 3,
                                                            backgroundColor: alpha('#EC4899', 0.08),
                                                            border: `2px solid ${alpha('#EC4899', 0.3)}`,
                                                        }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                                                <CookieIcon sx={{ color: '#EC4899', fontSize: 24 }} />
                                                                <Typography variant="h6" sx={{ color: '#EC4899', fontWeight: 600 }}>
                                                                    Snack
                                                                </Typography>
                                                            </Box>
                                                            <Typography 
                                                                variant="body1" 
                                                                sx={{ 
                                                                    whiteSpace: 'pre-wrap',
                                                                    lineHeight: 1.7,
                                                                    color: theme.palette.text.primary
                                                                }}
                                                            >
                                                                {plan.weeklyPlan[day]?.snack || 'Not specified'}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                )}
                                            </Box>
                                        ))}
                                    </Paper>
                                </motion.div>
                            )}


                        </motion.div>
                    )}
                </Box>
            </Box>

            {/* Chip Detail Dialog */}
            <Dialog 
                open={chipDetailDialogOpen} 
                onClose={() => setChipDetailDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                TransitionComponent={Transition}
                sx={{
                    '& .MuiDialog-paper': {
                        borderRadius: 3,
                    }
                }}
            >
                <DialogTitle sx={{ 
                    py: 2,
                    px: 3,
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}10, ${theme.palette.secondary.main}10)`,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {selectedChipTitle}
                    </Typography>
                    {selectedChipCategory && (
                        <Chip 
                            label={selectedChipCategory} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                        />
                    )}
                </DialogTitle>
                <DialogContent sx={{ p: 3, mt: 1 }}>
                    <Typography 
                        variant="body1" 
                        sx={{ 
                            lineHeight: 1.7,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word'
                        }}
                    >
                        {selectedChipContent}
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                    <Button 
                        onClick={() => setChipDetailDialogOpen(false)}
                        variant="contained"
                        sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                        }}
                    >
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Feedback Dialog */}
            <Dialog 
                open={feedbackDialogOpen} 
                onClose={() => !feedbackSubmitting && setFeedbackDialogOpen(false)} 
                maxWidth="sm" 
                fullWidth
                TransitionComponent={Transition}
                sx={{
                    '& .MuiDialog-paper': {
                        borderRadius: 3,
                    }
                }}
            >
                <DialogTitle sx={{ 
                    py: 2.5,
                    px: 3,
                    background: `linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(139, 92, 246, 0.05))`,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
                        }}>
                            <FeedbackIcon sx={{ color: 'white', fontSize: 20 }} />
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {plan?.feedback?.rating ? 'Update Your Feedback' : 'Share Your Feedback'}
                        </Typography>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ p: 3, mt: 2 }}>
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
                            How would you rate this nutrition plan?
                        </Typography>
                        <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 2,
                            p: 2,
                            borderRadius: 2,
                            backgroundColor: theme.palette.mode === 'dark' 
                                ? 'rgba(255,255,255,0.02)'
                                : 'rgba(0,0,0,0.02)',
                        }}>
                            <Rating
                                value={feedbackRating}
                                onChange={(event, newValue) => setFeedbackRating(newValue)}
                                size="large"
                                disabled={feedbackSubmitting}
                            />
                            {feedbackRating > 0 && (
                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                    ({feedbackRating}/5)
                                </Typography>
                            )}
                        </Box>
                    </Box>
                    
                    <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
                            Additional Comments (Optional)
                        </Typography>
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            placeholder="Share your thoughts about the plan, what worked well, or suggestions for improvement..."
                            value={feedbackComment}
                            onChange={(e) => setFeedbackComment(e.target.value)}
                            disabled={feedbackSubmitting}
                            variant="outlined"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                }
                            }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}`, gap: 1 }}>
                    <Button 
                        onClick={() => setFeedbackDialogOpen(false)}
                        disabled={feedbackSubmitting}
                        sx={{ borderRadius: 2, textTransform: 'none' }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSubmitFeedback}
                        variant="contained"
                        disabled={feedbackSubmitting || feedbackRating === 0}
                        sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
                            }
                        }}
                    >
                        {feedbackSubmitting ? 'Submitting...' : 'Submit Feedback'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={4000}
                onClose={() => setSnackbarOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert 
                    onClose={() => setSnackbarOpen(false)} 
                    severity={snackbarSeverity}
                    sx={{ 
                        width: '100%',
                        borderRadius: 2,
                    }}
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>

             {/* Form Details Dialog */}
             <Dialog 
                open={formDetailsOpen} 
                onClose={() => setFormDetailsOpen(false)}
                maxWidth="md"
                fullWidth
                TransitionComponent={Transition}
                sx={{
                    '& .MuiDialog-paper': {
                        borderRadius: 3,
                        background: theme.palette.mode === 'dark'
                            ? 'rgba(26, 26, 46, 0.95)'
                            : 'rgba(255, 255, 255, 0.98)',
                        backdropFilter: 'blur(20px)',
                    }
                }}
            >
                <DialogTitle sx={{
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}15, ${theme.palette.secondary.main}10)`,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    py: 2.5,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        📋 Submission Details
                    </Typography>
                    <IconButton onClick={() => setFormDetailsOpen(false)} size="small">
                            <ExpandMoreIcon sx={{ transform: 'rotate(180deg)' }} />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    {formData && (
                            <Grid container spacing={3}>
                            {/* Personal Information */}
                            <Grid item xs={12}>
                                <Card variant="outlined">
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom color="primary">Personal Information</Typography>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} md={6}>
                                                <Typography><strong>Name:</strong> {formData.user?.name || formData.name || 'N/A'}</Typography>
                                                <Typography><strong>Age:</strong> {formData.age}</Typography>
                                                <Typography><strong>Gender:</strong> {formData.gender}</Typography>
                                                <Typography><strong>Phone:</strong> {formData.phoneNumber || 'N/A'}</Typography>
                                                <Typography><strong>Profession:</strong> {formData.profession || 'N/A'}</Typography>
                                                <Typography><strong>Height:</strong> {formData.height} cm</Typography>
                                            </Grid>
                                            <Grid item xs={12} md={6}>
                                                <Typography><strong>Is Mother:</strong> {formData.isMother ? 'Yes' : 'No'}</Typography>
                                                {formData.isMother && <Typography><strong>Cycle:</strong> {formData.menstrualCycle || 'N/A'}</Typography>}
                                                <Typography><strong>Bowel Movement:</strong> {formData.bowelMovement || 'N/A'}</Typography>
                                                <Typography><strong>Physical Activity:</strong> {formData.physicalActivity || 'N/A'}</Typography>
                                                <Typography><strong>Who Cooks:</strong> {formData.whoCooks || 'N/A'}</Typography>
                                                <Typography><strong>Smoker:</strong> {formData.currentSmoker ? 'Yes' : 'No'}</Typography>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Health History */}
                            <Grid item xs={12} md={6}>
                                <Card variant="outlined" sx={{ height: '100%' }}>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom color="primary">Health History</Typography>
                                        <Typography><strong>Operations:</strong> {formData.operations || 'None'}</Typography>
                                        <Typography><strong>Health Conditions:</strong> {formData.healthConditions?.join(', ') || 'None'}</Typography>
                                        <Typography><strong>Family History:</strong> {formData.familyHistory || 'None'}</Typography>
                                        <Divider sx={{ my: 1 }} />
                                        <Typography><strong>Medications:</strong> {formData.takeMedication ? formData.medications?.join(', ') : 'None'}</Typography>
                                        <Typography><strong>Followed Advice:</strong> {formData.followedDietAdvice ? 'Yes' : 'No'}</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Blood Test */}
                            <Grid item xs={12} md={6}>
                                <Card variant="outlined" sx={{ height: '100%' }}>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom color="primary">Blood Test</Typography>
                                        {formData.bloodTest ? (
                                            <Grid container spacing={1}>
                                                {Object.entries(formData.bloodTest).map(([key, val]) => (
                                                    <Grid item xs={6} key={key}>
                                                        <Typography variant="body2"><strong>{key}:</strong> {val || '-'}</Typography>
                                                    </Grid>
                                                ))}
                                            </Grid>
                                        ) : <Typography>No Data</Typography>}
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Diet History & Measurements */}
                            <Grid item xs={12} md={6}>
                                <Card variant="outlined" sx={{ height: '100%' }}>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom color="primary">Diet History</Typography>
                                        <Typography><strong>Current Weight:</strong> {formData.currentWeight} kg</Typography>
                                        <Typography><strong>Min/Max:</strong> {formData.minWeight} / {formData.maxWeight} kg</Typography>
                                        <Typography><strong>Desired:</strong> {formData.desiredWeight} kg</Typography>
                                        <Divider sx={{ my: 1 }} />
                                        <Typography><strong>Tried Diet:</strong> {formData.triedDietBefore ? 'Yes' : 'No'}</Typography>
                                        <Typography><strong>Meds for Weight:</strong> {formData.weightLossMedication ? 'Yes' : 'No'}</Typography>
                                        <Typography><strong>History:</strong> {formData.weightChangeSinceBirth}</Typography>
                                        <Typography><strong>Always Overweight:</strong> {formData.alwaysOverweight ? 'Yes' : 'No'}</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Daily Intake & Goals */}
                            <Grid item xs={12}>
                                <Card variant="outlined">
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom color="primary">Daily Intake & Goals</Typography>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} md={6}>
                                                <Typography><strong>Breakfast:</strong> {formData.breakfast}</Typography>
                                                <Typography><strong>Lunch:</strong> {formData.lunch}</Typography>
                                                <Typography><strong>Dinner:</strong> {formData.dinner}</Typography>
                                            </Grid>
                                            <Grid item xs={12} md={6}>
                                                <Typography><strong>Dislikes:</strong> {formData.dislikedFood}</Typography>
                                                <Typography><strong>Diet Given:</strong> {formData.dietGiven}</Typography>
                                                <Typography><strong>Goals:</strong> {formData.goals?.join(', ')}</Typography>
                                                <Divider sx={{ my: 1 }} />
                                                <Typography><strong>Night Eater:</strong> {formData.nightEater ? 'Yes' : 'No'}</Typography>
                                                <Typography><strong>Coffee:</strong> {formData.coffee ? 'Yes' : 'No'}</Typography>
                                                <Typography><strong>Sugar:</strong> {formData.sugar} spoon(s)</Typography>
                                                <Typography><strong>Snack Time:</strong> {formData.snackTime}</Typography>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Grid>

                                {/* Inbody Images */}
                            {(formData.bodyImage || (formData.inbodyImages && formData.inbodyImages.length > 0)) && (
                                <Grid item xs={12}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                📸 Inbody Images ({
                                                    (formData.inbodyImages?.length || 0) + (formData.bodyImage ? 1 : 0)
                                                })
                                            </Typography>
                                            <Box sx={{ 
                                                display: 'grid', 
                                                gridTemplateColumns: { 
                                                    xs: '1fr', 
                                                    sm: 'repeat(2, 1fr)', 
                                                    md: 'repeat(3, 1fr)' 
                                                }, 
                                                gap: 2,
                                                mt: 2
                                            }}>
                                                {/* Legacy bodyImage */}
                                                {formData.bodyImage && (
                                                    <Paper
                                                        sx={{
                                                            position: 'relative',
                                                            borderRadius: 2,
                                                            overflow: 'hidden',
                                                            border: `2px solid ${theme.palette.divider}`,
                                                            cursor: 'pointer',
                                                            transition: 'all 0.3s ease',
                                                            '&:hover': {
                                                                transform: 'scale(1.02)',
                                                                boxShadow: theme.shadows[8],
                                                                borderColor: theme.palette.primary.main,
                                                            }
                                                        }}
                                                        onClick={() => {
                                                            setSelectedImage(formData.bodyImage);
                                                            setImageDialogOpen(true);
                                                        }}
                                                    >
                                                        <img
                                                            src={formData.bodyImage}
                                                            alt="Inbody Legacy"
                                                            style={{
                                                                width: '100%',
                                                                height: 200,
                                                                objectFit: 'cover',
                                                                display: 'block',
                                                            }}
                                                        />
                                                    </Paper>
                                                )}

                                                {/* Array inbodyImages */}
                                                {formData.inbodyImages && formData.inbodyImages.map((imageUrl, index) => (
                                                    <Paper
                                                        key={index}
                                                        sx={{
                                                            position: 'relative',
                                                            borderRadius: 2,
                                                            overflow: 'hidden',
                                                            border: `2px solid ${theme.palette.divider}`,
                                                            cursor: 'pointer',
                                                            transition: 'all 0.3s ease',
                                                            '&:hover': {
                                                                transform: 'scale(1.02)',
                                                                boxShadow: theme.shadows[8],
                                                                borderColor: theme.palette.primary.main,
                                                            }
                                                        }}
                                                        onClick={() => {
                                                            setSelectedImage(imageUrl);
                                                            setImageDialogOpen(true);
                                                        }}
                                                    >
                                                        <img
                                                            src={imageUrl}
                                                            alt={`Inbody ${index + 1}`}
                                                            style={{
                                                                width: '100%',
                                                                height: 200,
                                                                objectFit: 'cover',
                                                                display: 'block',
                                                            }}
                                                        />
                                                    </Paper>
                                                ))}
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            )}
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setFormDetailsOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            <ImageViewerDialog
                open={imageDialogOpen}
                imageUrl={selectedImage}
                onClose={() => setImageDialogOpen(false)}
            />
        </PageFade>
    );
};