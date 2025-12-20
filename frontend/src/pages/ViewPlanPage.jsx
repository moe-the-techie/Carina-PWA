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
    useMediaQuery
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBackIos';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FeedbackIcon from '@mui/icons-material/Feedback';
import FlagIcon from '@mui/icons-material/Flag';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import { motion, AnimatePresence } from 'framer-motion';
import PageFade from '../components/PageFade';
import LoadingBackdrop from '../components/LoadingBackdrop';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: [0.16, 1, 0.3, 1]
        }
    }
};

export default function ViewPlanPage () {
    const theme = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const { id } = useParams();
    const form = location.state?.form;
    
    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
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

    useEffect(() => {
        if (form) {
            fetchPlan(form._id);
        } else if (id) {
            // If no form in state, fetch by form ID from URL
            fetchPlan(id);
        } else {
            setError('No form data provided');
            setLoading(false);
        }
    }, [form, id]);

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
                                <Grid container spacing={2} sx={{ mb: 4 }}>
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
                                        <Grid item xs={6} md={3} key={index}>
                                            <Paper 
                                                sx={{ 
                                                    ...glassCardStyle, 
                                                    p: { xs: 2, sm: 3 },
                                                    position: 'relative',
                                                    overflow: 'hidden',
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
                                                    width: 80,
                                                    height: 80,
                                                    borderRadius: '50%',
                                                    background: `${stat.color}10`,
                                                    pointerEvents: 'none',
                                                }} />
                                                <Box sx={{
                                                    width: 44,
                                                    height: 44,
                                                    borderRadius: 2,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    background: stat.gradient,
                                                    boxShadow: `0 4px 12px ${stat.color}40`,
                                                    mb: 1.5
                                                }}>
                                                    <stat.icon sx={{ color: 'white', fontSize: 22 }} />
                                                </Box>
                                                <Typography 
                                                    variant="h5" 
                                                    sx={{ 
                                                        fontWeight: 700, 
                                                        mb: 0.5,
                                                        fontSize: { xs: '1.25rem', sm: '1.5rem' }
                                                    }}
                                                >
                                                    {stat.value}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {stat.label}
                                                </Typography>
                                            </Paper>
                                        </Grid>
                                    ))}
                                </Grid>
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
                                    
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} md={6}>
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                                Title
                                            </Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 500, mb: 2 }}>
                                                {plan.title}
                                            </Typography>
                                            
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                                Description
                                            </Typography>
                                            <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                                                {plan.description || 'Personalized nutrition plan'}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <Box sx={{
                                                p: 2,
                                                borderRadius: 2,
                                                backgroundColor: theme.palette.mode === 'dark' 
                                                    ? 'rgba(255,255,255,0.03)'
                                                    : 'rgba(0,0,0,0.02)',
                                            }}>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
                                                    Macro Targets
                                                </Typography>
                                                <Grid container spacing={1}>
                                                    {[
                                                        { label: 'Protein', value: plan.goals?.targetProtein, color: '#EF4444' },
                                                        { label: 'Carbs', value: plan.goals?.targetCarbs, color: '#F59E0B' },
                                                        { label: 'Fats', value: plan.goals?.targetFats, color: '#10B981' },
                                                    ].map((macro) => (
                                                        <Grid item xs={4} key={macro.label}>
                                                            <Box sx={{ textAlign: 'center' }}>
                                                                <Typography 
                                                                    variant="h6" 
                                                                    sx={{ 
                                                                        fontWeight: 700,
                                                                        color: macro.color,
                                                                    }}
                                                                >
                                                                    {macro.value || '--'}g
                                                                </Typography>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {macro.label}
                                                                </Typography>
                                                            </Box>
                                                        </Grid>
                                                    ))}
                                                </Grid>
                                            </Box>
                                        </Grid>
                                    </Grid>
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
                                        
                                        <Grid container spacing={2}>
                                            {[
                                                { label: 'Avoid', items: plan.recommendations.avoid, color: '#EF4444', bgColor: alpha('#EF4444', 0.1) },
                                                { label: 'Use Carefully', items: plan.recommendations.useCarefully, color: '#F59E0B', bgColor: alpha('#F59E0B', 0.1) },
                                                { label: 'Eat Daily', items: plan.recommendations.eatDaily, color: '#10B981', bgColor: alpha('#10B981', 0.1) },
                                                { label: 'Exercise', items: plan.recommendations.exercise, color: '#3B82F6', bgColor: alpha('#3B82F6', 0.1) },
                                            ].map((category, idx) => (
                                                <Grid item xs={12} sm={6} md={3} key={idx}>
                                                    <Box sx={{
                                                        p: 2,
                                                        borderRadius: 2,
                                                        backgroundColor: category.bgColor,
                                                        border: `1px solid ${alpha(category.color, 0.2)}`,
                                                        height: '100%',
                                                    }}>
                                                        <Typography 
                                                            variant="subtitle2" 
                                                            sx={{ 
                                                                color: category.color, 
                                                                fontWeight: 600,
                                                                mb: 1.5 
                                                            }}
                                                        >
                                                            {category.label}
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                                            {category.items?.length > 0 ? (
                                                                category.items.map((item, index) => (
                                                                    <Chip 
                                                                        key={index} 
                                                                        label={item.length > 25 ? `${item.substring(0, 25)}...` : item} 
                                                                        size="small" 
                                                                        onClick={() => openChipDetailDialog(item, `${category.label} Item`, category.label)}
                                                                        sx={{ 
                                                                            cursor: 'pointer',
                                                                            backgroundColor: alpha(category.color, 0.15),
                                                                            color: category.color,
                                                                            fontWeight: 500,
                                                                            '&:hover': { 
                                                                                backgroundColor: alpha(category.color, 0.25),
                                                                            } 
                                                                        }}
                                                                    />
                                                                ))
                                                            ) : (
                                                                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                                    None specified
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </Box>
                                                </Grid>
                                            ))}
                                        </Grid>
                                    </Paper>
                                </motion.div>
                            )}

                            {/* Weekly Meal Plans */}
                            {plan.weeklyPlans && plan.weeklyPlans.length > 0 && (
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
                                                background: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.dark})`,
                                                boxShadow: `0 4px 12px ${theme.palette.secondary.main}40`,
                                            }}>
                                                <RestaurantIcon sx={{ color: 'white', fontSize: 20 }} />
                                            </Box>
                                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                Weekly Meal Plan
                                            </Typography>
                                        </Box>
                                        
                                        {plan.weeklyPlans.map((day, index) => (
                                            <Accordion 
                                                key={index} 
                                                sx={{ 
                                                    mb: 1,
                                                    borderRadius: 2,
                                                    overflow: 'hidden',
                                                    '&:before': { display: 'none' },
                                                    boxShadow: 'none',
                                                    border: `1px solid ${theme.palette.divider}`,
                                                    '&.Mui-expanded': {
                                                        margin: 0,
                                                        mb: 1,
                                                    }
                                                }}
                                            >
                                                <AccordionSummary 
                                                    expandIcon={<ExpandMoreIcon />}
                                                    sx={{ 
                                                        backgroundColor: theme.palette.mode === 'dark' 
                                                            ? 'rgba(255,255,255,0.02)'
                                                            : 'rgba(0,0,0,0.02)',
                                                    }}
                                                >
                                                    <Box sx={{ 
                                                        display: 'flex', 
                                                        justifyContent: 'space-between', 
                                                        alignItems: 'center',
                                                        width: '100%', 
                                                        pr: 2,
                                                    }}>
                                                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                                            Day {day.day} - {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day.day - 1]}
                                                        </Typography>
                                                        {day.totalCalories && (
                                                            <Chip 
                                                                label={`${day.totalCalories} kcal`}
                                                                size="small"
                                                                sx={{
                                                                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                                                                    color: 'white',
                                                                    fontWeight: 600,
                                                                }}
                                                            />
                                                        )}
                                                    </Box>
                                                </AccordionSummary>
                                                <AccordionDetails sx={{ p: 2 }}>
                                                    <Grid container spacing={2}>
                                                        {[
                                                            { label: 'Breakfast', icon: '🌅', data: day.breakfast, color: theme.palette.primary.main },
                                                            { label: 'Lunch', icon: '🍽️', data: day.lunch, color: theme.palette.secondary.main },
                                                            { label: 'Dinner', icon: '🌙', data: day.dinner, color: '#8B5CF6' },
                                                            { label: 'Snacks', icon: '🍪', data: day.snacks, color: '#F59E0B' },
                                                        ].filter(meal => meal.data).map((meal, mealIndex) => (
                                                            <Grid item xs={12} sm={6} lg={3} key={mealIndex}>
                                                                <Card 
                                                                    sx={{ 
                                                                        height: '100%',
                                                                        borderRadius: 2,
                                                                        border: `1px solid ${alpha(meal.color, 0.2)}`,
                                                                        boxShadow: 'none',
                                                                        transition: 'all 0.2s ease',
                                                                        '&:hover': {
                                                                            transform: 'translateY(-2px)',
                                                                            boxShadow: `0 4px 12px ${alpha(meal.color, 0.2)}`,
                                                                        }
                                                                    }}
                                                                >
                                                                    <CardContent sx={{ p: 2 }}>
                                                                        <Typography 
                                                                            variant="subtitle2" 
                                                                            sx={{ 
                                                                                color: meal.color,
                                                                                fontWeight: 600,
                                                                                mb: 1,
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                gap: 1
                                                                            }}
                                                                        >
                                                                            {meal.icon} {meal.label}
                                                                        </Typography>
                                                                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                                                            {meal.data.name}
                                                                        </Typography>
                                                                        <Chip 
                                                                            label={`${meal.data.calories} cal`}
                                                                            size="small"
                                                                            sx={{
                                                                                backgroundColor: alpha(meal.color, 0.1),
                                                                                color: meal.color,
                                                                                fontSize: '0.7rem',
                                                                                fontWeight: 600,
                                                                                height: 22,
                                                                            }}
                                                                        />
                                                                        {meal.data.description && (
                                                                            <Typography 
                                                                                variant="body2" 
                                                                                color="text.secondary"
                                                                                sx={{ mt: 1, fontSize: '0.8rem', lineHeight: 1.4 }}
                                                                            >
                                                                                {meal.data.description}
                                                                            </Typography>
                                                                        )}
                                                                    </CardContent>
                                                                </Card>
                                                            </Grid>
                                                        ))}
                                                    </Grid>
                                                </AccordionDetails>
                                            </Accordion>
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
        </PageFade>
    );
};