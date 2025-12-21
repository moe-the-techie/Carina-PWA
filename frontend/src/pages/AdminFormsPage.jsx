import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    Chip,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Pagination,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Card,
    CardContent,
    CardActions,
    Divider,
    Avatar,
    useMediaQuery,
    Rating,
    CircularProgress,
    Backdrop,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Skeleton,
    IconButton,
    Tooltip,
    LinearProgress,
    alpha,
    InputAdornment,
    TextField,
    Fade,
    Zoom,
    Slide
} from '@mui/material';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});
import ChatIcon from '@mui/icons-material/Chat';
import FeedbackIcon from '@mui/icons-material/Feedback';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
import DescriptionIcon from '@mui/icons-material/Description';
import PersonIcon from '@mui/icons-material/Person';
import ScaleIcon from '@mui/icons-material/Scale';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { useTheme } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import PageFade from '../components/PageFade';
import LoadingBackdrop from '../components/LoadingBackdrop';
import ImageViewerDialog from '../components/ImageViewerDialog';
import FormActionsDialog from '../components/FormActionsDialog';
import { spacing, borderRadius, transitions, accentColors } from '../styles';
import { glassCard, glassInput, glassDialog } from '../styles/glassmorphism';
import { containerVariants, itemVariants } from '../styles/animations';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function AdminFormsPage() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const navigate = useNavigate();
    const [forms, setForms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [reviewedFilter, setReviewedFilter] = useState('');
    const [selectedForm, setSelectedForm] = useState(null);
    const [formDetailsOpen, setFormDetailsOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [planDetailsOpen, setPlanDetailsOpen] = useState(false);
    const [planLoading, setPlanLoading] = useState(false);
    const [openedFromFeedback, setOpenedFromFeedback] = useState(false);
    const [imageDialogOpen, setImageDialogOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [actionsDialogOpen, setActionsDialogOpen] = useState(false);
    const [selectedFormForActions, setSelectedFormForActions] = useState(null);
    
    // Chip detail dialog state
    const [chipDetailDialogOpen, setChipDetailDialogOpen] = useState(false);
    const [selectedChipContent, setSelectedChipContent] = useState('');
    const [selectedChipTitle, setSelectedChipTitle] = useState('');
    const [selectedChipCategory, setSelectedChipCategory] = useState('');

    useEffect(() => {
        fetchForms();
    }, [page, reviewedFilter]);

    const fetchForms = async () => {
        try {
            setLoading(true);
            let url = `${apiBaseUrl}/api/admin/forms?page=${page}&limit=10`;
            if (reviewedFilter !== '') {
                url += `&reviewed=${reviewedFilter}`;
            }

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch forms');
            }

            const data = await response.json();
            setForms(data.forms);
            setTotalPages(data.totalPages);
        } catch (error) {
            console.error('Error fetching forms:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    // Function to open chip detail dialog
    const openChipDetailDialog = (content, title, category) => {
        setSelectedChipContent(content);
        setSelectedChipTitle(title);
        setSelectedChipCategory(category);
        setChipDetailDialogOpen(true);
    };

    const sendPlan = async (form) => {
        try {
            setPlanLoading(true);
            // Navigate to plan builder with form data
            navigate('/admin/plan-builder', { 
                state: { 
                    selectedUser: form.user._id,
                    selectedForm: form._id,
                    formData: form
                }
            });
        } finally {
            // Reset loading state after a short delay to allow navigation
            setTimeout(() => setPlanLoading(false), 500);
        }
    };

    const handleFilterChange = (event) => {
        setReviewedFilter(event.target.value);
        setPage(1);
    };

    const handlePageChange = (event, newPage) => {
        setPage(newPage);
    };

    const openFormDetails = (form) => {
        setSelectedForm(form);
        setFormDetailsOpen(true);
    };

    const handleMessageUser = (userId) => {
        if (!userId || userId === 'null' || userId === 'undefined') {
            setError('Cannot message user: Invalid user ID');
            return;
        }
        
        navigate('/admin/chats', { state: { userId } });
    };

    const viewPlan = async (form) => {
        try {
            setPlanLoading(true);
            setError('');
            
            const response = await fetch(`${apiBaseUrl}/api/admin/forms/${form._id}/plan`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    setError('No plan found for this form');
                    return;
                }
                throw new Error('Failed to fetch plan');
            }

            const data = await response.json();
            setSelectedPlan(data.plan);
            setPlanDetailsOpen(true);
        } catch (error) {
            console.error('Error fetching plan:', error);
            setError(error.message);
        } finally {
            setPlanLoading(false);
        }
    };

    const viewFeedback = async (form) => {
        setOpenedFromFeedback(true);
        await viewPlan(form);
        // Scroll to feedback section after a brief delay to allow dialog to render
        setTimeout(() => {
            const feedbackElement = document.querySelector('[data-testid="user-feedback"]');
            if (feedbackElement) {
                feedbackElement.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
            }
        }, 500);
    };

    const handleOpenActionsDialog = (form) => {
        setSelectedFormForActions(form);
        setActionsDialogOpen(true);
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

    // Stats for header
    const getStats = () => {
        const pending = forms.filter(f => !f.reviewed).length;
        const reviewed = forms.filter(f => f.reviewed).length;
        const withFeedback = forms.filter(f => f.planSent).length;
        return { pending, reviewed, withFeedback, total: forms.length };
    };

    if (loading && forms.length === 0) {
        return (
            <PageFade>
                <Box sx={{ 
                    p: { xs: 2, sm: 3, md: 4 },
                    minHeight: '100vh',
                    background: theme.palette.mode === 'dark'
                        ? `linear-gradient(135deg, ${theme.palette.background.default} 0%, #1a1a2e 100%)`
                        : `linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)`,
                }}>
                    {/* Header Skeleton */}
                    <Box sx={{ mb: 4 }}>
                        <Skeleton variant="text" width="30%" height={48} sx={{ mb: 1 }} />
                        <Skeleton variant="text" width="50%" height={24} />
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
                        
                    {/* Cards Skeleton */}
                    <Grid container spacing={2}>
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <Grid item xs={12} sm={6} lg={4} key={i}>
                                <Paper sx={{ ...glassCardStyle, p: 2.5 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                        <Skeleton variant="circular" width={48} height={48} />
                                        <Box sx={{ flex: 1 }}>
                                            <Skeleton variant="text" width="70%" height={24} />
                                            <Skeleton variant="text" width="50%" height={18} />
                                        </Box>
                                    </Box>
                                    <Divider sx={{ my: 2 }} />
                                    <Skeleton variant="rectangular" width="100%" height={60} sx={{ borderRadius: 2 }} />
                                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                                        <Skeleton variant="rounded" width={80} height={28} />
                                        <Skeleton variant="rounded" width={80} height={28} />
                                    </Box>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            </PageFade>
        );
    }

    const stats = getStats();

    return (
        <PageFade>
            <Box sx={{ 
                p: { xs: 2, sm: 3, md: 4 },
                minHeight: '100vh',
                background: theme.palette.mode === 'dark'
                    ? `linear-gradient(135deg, ${theme.palette.background.default} 0%, #1a1a2e 100%)`
                    : `linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)`,
            }}>
                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Box sx={{ 
                        mb: 4, 
                        display: 'flex', 
                        flexDirection: { xs: 'column', md: 'row' },
                        justifyContent: 'space-between',
                        alignItems: { xs: 'flex-start', md: 'center' },
                        gap: 2
                    }}>
                        <Box>
                            <Typography 
                                variant="h4" 
                                sx={{ 
                                    fontWeight: 700,
                                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                    backgroundClip: 'text',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    mb: 0.5
                                }}
                            >
                                Form Management
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Review and manage user nutrition assessment forms
                            </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <Tooltip title="Refresh">
                                <IconButton 
                                    onClick={fetchForms}
                                    sx={{
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
                                    <RefreshIcon />
                                </IconButton>
                            </Tooltip>
                            
                            <FormControl 
                                size="small" 
                                sx={{ 
                                    minWidth: 180,
                                    '& .MuiOutlinedInput-root': {
                                        backgroundColor: theme.palette.mode === 'dark' 
                                            ? 'rgba(255,255,255,0.05)' 
                                            : 'rgba(255,255,255,0.9)',
                                        borderRadius: 2,
                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                            borderColor: theme.palette.primary.main,
                                        }
                                    }
                                }}
                            >
                                <InputLabel>Status Filter</InputLabel>
                                <Select
                                    value={reviewedFilter}
                                    onChange={handleFilterChange}
                                    label="Status Filter"
                                    startAdornment={
                                        <InputAdornment position="start">
                                            <FilterListIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                                        </InputAdornment>
                                    }
                                >
                                    <MenuItem value="">All Forms</MenuItem>
                                    <MenuItem value="false">Pending Review</MenuItem>
                                    <MenuItem value="true">Reviewed</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>
                </motion.div>

                {/* Stats Cards */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <Grid container spacing={2} sx={{ mb: 4 }}>
                        {[
                            { 
                                label: 'Total Forms', 
                                value: stats.total, 
                                icon: DescriptionIcon, 
                                color: theme.palette.primary.main,
                                gradient: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`
                            },
                            { 
                                label: 'Pending Review', 
                                value: stats.pending, 
                                icon: CalendarTodayIcon, 
                                color: '#F59E0B',
                                gradient: 'linear-gradient(135deg, #F59E0B, #D97706)'
                            },
                            { 
                                label: 'Reviewed', 
                                value: stats.reviewed, 
                                icon: PersonIcon, 
                                color: '#10B981',
                                gradient: 'linear-gradient(135deg, #10B981, #059669)'
                            },
                            { 
                                label: 'Plans Sent', 
                                value: stats.withFeedback, 
                                icon: FeedbackIcon, 
                                color: '#8B5CF6',
                                gradient: 'linear-gradient(135deg, #8B5CF6, #7C3AED)'
                            },
                        ].map((stat, index) => (
                            <Grid item xs={6} md={3} key={index}>
                                <motion.div variants={itemVariants}>
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

                {/* Forms Grid */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <Grid container spacing={2}>
                        <AnimatePresence mode="popLayout">
                            {forms.map((form, index) => (
                                <Grid item xs={12} sm={6} lg={4} key={form._id}>
                                    <motion.div
                                        variants={itemVariants}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <Paper 
                                            sx={{ 
                                                ...glassCardStyle,
                                                p: 0,
                                                cursor: 'pointer',
                                                '&:hover': {
                                                    transform: 'translateY(-4px)',
                                                    boxShadow: theme.palette.mode === 'dark'
                                                        ? '0 20px 40px rgba(0, 0, 0, 0.4)'
                                                        : '0 20px 40px rgba(0, 0, 0, 0.12)',
                                                    '& .action-button': {
                                                        opacity: 1,
                                                    }
                                                }
                                            }}
                                            onClick={() => handleOpenActionsDialog(form)}
                                        >
                                            {/* Status Bar */}
                                            <Box sx={{
                                                height: 4,
                                                background: form.reviewed 
                                                    ? form.planSent 
                                                        ? 'linear-gradient(90deg, #10B981, #34D399)'
                                                        : 'linear-gradient(90deg, #3B82F6, #60A5FA)'
                                                    : 'linear-gradient(90deg, #F59E0B, #FBBF24)',
                                            }} />
                                            
                                            <Box sx={{ p: 2.5 }}>
                                                {/* Header */}
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0 }}>
                                                        <Avatar
                                                            src={form.user?.profileImageUrl}
                                                            sx={{
                                                                width: 48,
                                                                height: 48,
                                                                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                                                fontSize: '1.1rem',
                                                                fontWeight: 600,
                                                            }}
                                                        >
                                                            {form.user?.name?.charAt(0)?.toUpperCase()}
                                                        </Avatar>
                                                        <Box sx={{ minWidth: 0, flex: 1 }}>
                                                            <Typography 
                                                                variant="subtitle1" 
                                                                sx={{ 
                                                                    fontWeight: 600,
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    whiteSpace: 'nowrap'
                                                                }}
                                                            >
                                                                {form.user?.name || 'Unknown User'}
                                                            </Typography>
                                                            <Typography 
                                                                variant="caption" 
                                                                color="text.secondary"
                                                                sx={{
                                                                    display: 'block',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    whiteSpace: 'nowrap'
                                                                }}
                                                            >
                                                                {form.user?.email}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                    <IconButton 
                                                        size="small" 
                                                        className="action-button"
                                                        sx={{ 
                                                            opacity: { xs: 1, md: 0.6 },
                                                            transition: 'opacity 0.2s',
                                                        }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleOpenActionsDialog(form);
                                                        }}
                                                    >
                                                        <MoreVertIcon />
                                                    </IconButton>
                                                </Box>

                                                {/* Weight Info Card */}
                                                <Box sx={{
                                                    p: 2,
                                                    borderRadius: 2,
                                                    backgroundColor: theme.palette.mode === 'dark' 
                                                        ? 'rgba(255,255,255,0.03)'
                                                        : 'rgba(0,0,0,0.02)',
                                                    mb: 2
                                                }}>
                                                    <Grid container spacing={2}>
                                                        <Grid item xs={6}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <ScaleIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                                                                <Box>
                                                                    <Typography variant="caption" color="text.secondary">
                                                                        Current
                                                                    </Typography>
                                                                    <Typography variant="body2" fontWeight={600}>
                                                                        {form.currentWeight} kg
                                                                    </Typography>
                                                                </Box>
                                                            </Box>
                                                        </Grid>
                                                        <Grid item xs={6}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                {form.desiredWeight < form.currentWeight ? (
                                                                    <TrendingDownIcon sx={{ fontSize: 18, color: 'success.main' }} />
                                                                ) : (
                                                                    <TrendingUpIcon sx={{ fontSize: 18, color: 'info.main' }} />
                                                                )}
                                                                <Box>
                                                                    <Typography variant="caption" color="text.secondary">
                                                                        Goal
                                                                    </Typography>
                                                                    <Typography variant="body2" fontWeight={600}>
                                                                        {form.desiredWeight} kg
                                                                    </Typography>
                                                                </Box>
                                                            </Box>
                                                        </Grid>
                                                    </Grid>
                                                </Box>

                                                {/* Footer */}
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                        <Chip
                                                            label={form.reviewed ? 'Reviewed' : 'Pending'}
                                                            size="small"
                                                            sx={{
                                                                fontWeight: 600,
                                                                fontSize: '0.7rem',
                                                                backgroundColor: form.reviewed 
                                                                    ? alpha('#10B981', 0.1)
                                                                    : alpha('#F59E0B', 0.1),
                                                                color: form.reviewed ? '#10B981' : '#F59E0B',
                                                                border: `1px solid ${form.reviewed ? '#10B98130' : '#F59E0B30'}`,
                                                            }}
                                                        />
                                                        {form.reviewed && form.planSent && (
                                                            <Chip
                                                                label="Plan Sent"
                                                                size="small"
                                                                sx={{
                                                                    fontWeight: 600,
                                                                    fontSize: '0.7rem',
                                                                    backgroundColor: alpha('#8B5CF6', 0.1),
                                                                    color: '#8B5CF6',
                                                                    border: '1px solid #8B5CF630',
                                                                }}
                                                            />
                                                        )}
                                                    </Box>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {new Date(form.createdAt).toLocaleDateString()}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Paper>
                                    </motion.div>
                                </Grid>
                            ))}
                        </AnimatePresence>
                    </Grid>
                </motion.div>

                {/* Pagination */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        mt: 4,
                        pt: 3,
                        borderTop: `1px solid ${theme.palette.divider}`
                    }}>
                        <Pagination
                            count={totalPages}
                            page={page}
                            onChange={handlePageChange}
                            color="primary"
                            size={isMobile ? 'small' : 'medium'}
                            sx={{
                                '& .MuiPaginationItem-root': {
                                    fontWeight: 500,
                                    borderRadius: 2,
                                    '&.Mui-selected': {
                                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                                        boxShadow: `0 4px 12px ${theme.palette.primary.main}40`,
                                    }
                                }
                            }}
                        />
                    </Box>
                </motion.div>

                {/* Form Actions Dialog */}
                <FormActionsDialog
                    open={actionsDialogOpen}
                    onClose={() => setActionsDialogOpen(false)}
                    form={selectedFormForActions}
                    onViewDetails={openFormDetails}
                    onSendPlan={sendPlan}
                    onViewPlan={viewPlan}
                    onEditPlan={sendPlan}
                    onMessageUser={handleMessageUser}
                    onViewFeedback={viewFeedback}
                    planLoading={planLoading}
                />

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
                    }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            📋 Form Details
                        </Typography>
                    </DialogTitle>
                    <DialogContent sx={{ mt: 2 }}>
                        {selectedForm && (
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <Card sx={{ 
                                        display: 'flex', 
                                        flexDirection: 'column', 
                                        height: '100%',
                                        borderRadius: 2,
                                        boxShadow: 'none',
                                        border: `1px solid ${theme.palette.divider}`,
                                    }}>
                                        <CardContent sx={{ flexGrow: 1 }}>
                                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <PersonIcon color="primary" />
                                                User Information
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
                                                <Avatar
                                                    src={selectedForm.user?.profileImageUrl}
                                                    alt={selectedForm.user?.name}
                                                    sx={{ 
                                                        width: 48, 
                                                        height: 48,
                                                        cursor: selectedForm.user?.profileImageUrl ? 'pointer' : 'default',
                                                        '&:hover': selectedForm.user?.profileImageUrl ? {
                                                            opacity: 0.8,
                                                            transition: 'opacity 0.2s'
                                                        } : {}
                                                    }}
                                                    onClick={() => {
                                                        if (selectedForm.user?.profileImageUrl) {
                                                            setSelectedImage(selectedForm.user.profileImageUrl);
                                                            setImageDialogOpen(true);
                                                        }
                                                    }}
                                                >
                                                    {!selectedForm.user?.profileImageUrl && selectedForm.user?.name?.charAt(0)?.toUpperCase()}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="subtitle1">{selectedForm.user?.name}</Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {selectedForm.user?.email}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            <Typography><strong>Name:</strong> {selectedForm.user?.name}</Typography>
                                            <Typography><strong>Email:</strong> {selectedForm.user?.email}</Typography>
                                            <Typography><strong>Gender:</strong> {selectedForm.user?.gender}</Typography>
                                            <Typography><strong>Date of Birth:</strong> {
                                                selectedForm.user?.dateOfBirth 
                                                    ? new Date(selectedForm.user.dateOfBirth).toLocaleDateString()
                                                    : 'Not provided'
                                            }</Typography>
                                        </CardContent>
                                        <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
                                            <Button 
                                                variant="outlined"
                                                color="primary"
                                                onClick={() => {
                                                    setFormDetailsOpen(false);
                                                    handleMessageUser(selectedForm?.user?._id);
                                                }}
                                                startIcon={<ChatIcon />}
                                                size="small"
                                            >
                                                Message User
                                            </Button>
                                        </CardActions>
                                    </Card>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                        <CardContent sx={{ flexGrow: 1 }}>
                                            <Typography variant="h6" gutterBottom>
                                                Weight Information
                                            </Typography>
                                            <Typography><strong>Current Weight:</strong> {selectedForm.currentWeight}kg</Typography>
                                            <Typography><strong>Min Weight:</strong> {selectedForm.minWeight}kg</Typography>
                                            <Typography><strong>Max Weight:</strong> {selectedForm.maxWeight}kg</Typography>
                                            <Typography><strong>Desired Weight:</strong> {selectedForm.desiredWeight}kg</Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                        <CardContent sx={{ flexGrow: 1 }}>
                                            <Typography variant="h6" gutterBottom>
                                                Medical Information
                                            </Typography>
                                            <Typography><strong>Allergies:</strong> {
                                                selectedForm.allergies?.length > 0 
                                                    ? selectedForm.allergies.join(', ') 
                                                    : 'None'
                                            }</Typography>
                                            <Typography><strong>Health Conditions:</strong> {
                                                selectedForm.healthConditions?.length > 0 
                                                    ? selectedForm.healthConditions.join(', ') 
                                                    : 'None'
                                            }</Typography>
                                            <Typography><strong>Medications:</strong> {
                                                selectedForm.medications?.length > 0 
                                                    ? selectedForm.medications.join(', ') 
                                                    : 'None'
                                            }</Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                        <CardContent sx={{ flexGrow: 1 }}>
                                            <Typography variant="h6" gutterBottom>
                                                Lifestyle Information
                                            </Typography>
                                            <Typography><strong>Breakfast:</strong> {selectedForm.breakfast}</Typography>
                                            <Typography><strong>Snack Time:</strong> {selectedForm.snackTime}</Typography>
                                            <Typography><strong>Sugar Intake:</strong> {selectedForm.sugar} tsp/day</Typography>
                                            <Divider sx={{ my: 1 }} />
                                            <Typography><strong>Current Smoker:</strong> {selectedForm.currentSmoker ? 'Yes' : 'No'}</Typography>
                                            <Typography><strong>Obesity History:</strong> {selectedForm.obesityHistory ? 'Yes' : 'No'}</Typography>
                                            <Typography><strong>Stays Hydrated:</strong> {selectedForm.hydrated ? 'Yes' : 'No'}</Typography>
                                            <Typography><strong>Night Eater:</strong> {selectedForm.nightEater ? 'Yes' : 'No'}</Typography>
                                            <Typography><strong>Coffee Drinker:</strong> {selectedForm.coffee ? 'Yes' : 'No'}</Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {/* Action Buttons Card */}
                                {!selectedForm.reviewed && (
                                    <Grid item xs={12}>
                                        <Card>
                                            <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
                                                <Button 
                                                    variant="contained" 
                                                    color="primary"
                                                    disabled={planLoading}
                                                    onClick={() => {
                                                        sendPlan(selectedForm);
                                                        setFormDetailsOpen(false);
                                                    }}
                                                >
                                                    {planLoading ? 'Loading...' : 'Send Plan'}
                                                </Button>
                                            </CardActions>
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

                {/* Plan Details Dialog */}
                <Dialog 
                    open={planDetailsOpen} 
                    onClose={() => {
                        setPlanDetailsOpen(false);
                        setOpenedFromFeedback(false);
                    }}
                    maxWidth="lg"
                    fullWidth
                    fullScreen={isMobile}
                    TransitionComponent={Transition}
                    sx={{
                        '& .MuiDialog-paper': {
                            margin: { xs: 0, sm: 2 },
                            maxHeight: { xs: '100vh', sm: 'calc(100vh - 64px)' }
                        }
                    }}
                >
                    <DialogTitle sx={{ 
                        p: { xs: 2, sm: 3 },
                        position: 'sticky',
                        top: 0,
                        backgroundColor: theme.palette.mode === 'dark' ? 'background.paper' : 'background.default',
                        zIndex: 1,
                        borderBottom: 1,
                        borderColor: 'divider'
                    }}>
                        <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: { xs: 0.5, sm: 1 },
                            flexWrap: 'wrap'
                        }}>
                            {openedFromFeedback && (
                                <FeedbackIcon color="primary" sx={{ fontSize: { xs: 20, sm: 24 } }} />
                            )}
                            <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                                Plan Details
                            </Typography>
                            {openedFromFeedback && (
                                <Chip 
                                    label="Viewing from Feedback" 
                                    color="primary" 
                                    size="small"
                                    sx={{ ml: { xs: 0, sm: 1 }, fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                                />
                            )}
                        </Box>
                    </DialogTitle>
                    <DialogContent>
                        {planLoading ? (
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <Card>
                                        <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
                                            <Skeleton variant="text" width="40%" height={32} sx={{ mb: 2 }} />
                                            <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                                                <Grid item xs={12} md={6}>
                                                    <Skeleton variant="text" width="80%" />
                                                    <Skeleton variant="text" width="90%" />
                                                    <Skeleton variant="text" width="60%" />
                                                </Grid>
                                                <Grid item xs={12} md={6}>
                                                    <Skeleton variant="text" width="70%" />
                                                    <Skeleton variant="text" width="50%" />
                                                </Grid>
                                            </Grid>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Card>
                                        <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
                                            <Skeleton variant="text" width="30%" height={32} sx={{ mb: 2 }} />
                                            <Skeleton variant="text" width="60%" />
                                            <Skeleton variant="text" width="60%" />
                                            <Skeleton variant="text" width="60%" />
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Card>
                                        <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
                                            <Skeleton variant="text" width="30%" height={32} sx={{ mb: 2 }} />
                                            <Skeleton variant="text" width="60%" />
                                            <Skeleton variant="text" width="60%" />
                                            <Skeleton variant="text" width="60%" />
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        ) : selectedPlan && (
                            <Grid container spacing={3}>
                                {/* Plan Overview */}
                                <Grid item xs={12}>
                                    <Card data-testid="plan-overview">
                                        <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
                                            <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                                                Plan Overview
                                            </Typography>
                                            <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                                                <Grid item xs={12} md={6}>
                                                    <Typography variant="body2" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, mb: 0.5 }}>
                                                        <strong>Title:</strong> {selectedPlan.title}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, mb: 0.5, wordBreak: 'break-word' }}>
                                                        <strong>Description:</strong> {selectedPlan.description || 'No description'}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, mb: 0.5 }}>
                                                        <strong>Duration:</strong> {selectedPlan.duration} week(s)
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
                                                        <strong>Status:</strong> 
                                                        <Chip 
                                                            label={selectedPlan.status} 
                                                            color={selectedPlan.status === 'active' ? 'success' : selectedPlan.status === 'completed' ? 'info' : selectedPlan.status === 'paused' ? 'warning' : 'default'}
                                                            size="small"
                                                            sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                                                        />
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={12} md={6}>
                                                    <Typography variant="body2" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, mb: 0.5 }}>
                                                        <strong>Created by:</strong> {selectedPlan.createdBy?.name || 'Unknown'}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, mb: 0.5 }}>
                                                        <strong>Created:</strong> {new Date(selectedPlan.createdAt).toLocaleString()}
                                                    </Typography>
                                                    {selectedPlan.activatedAt && (
                                                        <Typography variant="body2" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, mb: 0.5 }}>
                                                            <strong>Activated:</strong> {new Date(selectedPlan.activatedAt).toLocaleString()}
                                                        </Typography>
                                                    )}
                                                    {selectedPlan.completedAt && (
                                                        <Typography variant="body2" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, mb: 0.5 }}>
                                                            <strong>Completed:</strong> {new Date(selectedPlan.completedAt).toLocaleString()}
                                                        </Typography>
                                                    )}
                                                </Grid>
                                            </Grid>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {/* Goals */}
                                <Grid item xs={12} md={6}>
                                    <Card>
                                        <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
                                            <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                                                Goals
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, mb: 0.5 }}>
                                                <strong>Target Weight:</strong> {selectedPlan.goals?.targetWeight || 'Not set'}kg
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, mb: 0.5 }}>
                                                <strong>Target Calories:</strong> {selectedPlan.goals?.targetCalories || 'Not set'}
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, mb: 0.5 }}>
                                                <strong>Target Protein:</strong> {selectedPlan.goals?.targetProtein || 'Not set'}g
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, mb: 0.5 }}>
                                                <strong>Target Carbs:</strong> {selectedPlan.goals?.targetCarbs || 'Not set'}g
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, mb: 0.5 }}>
                                                <strong>Target Fats:</strong> {selectedPlan.goals?.targetFats || 'Not set'}g
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {/* Recommendations */}
                                <Grid item xs={12}>
                                    <Card>
                                        <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
                                            <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                                                Dietary Recommendations
                                            </Typography>
                                            
                                            <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                                                {/* General Recommendations */}
                                                <Grid item xs={12} md={6}>
                                                    <Box sx={{ mb: { xs: 1.5, sm: 2 } }}>
                                                        <Typography variant="subtitle2" color="error.main" gutterBottom sx={{ fontSize: { xs: '0.875rem', sm: '0.875rem' } }}>
                                                            Foods to Avoid:
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                                                            {selectedPlan.recommendations?.avoid?.length > 0 ? (
                                                                selectedPlan.recommendations.avoid.map((item, index) => (
                                                                    <Chip 
                                                                        key={index} 
                                                                        label={item.length > 30 ? `${item.substring(0, 30)}...` : item}
                                                                        onClick={() => openChipDetailDialog(item, 'Avoid Item', 'Avoid')}
                                                                        color="error" 
                                                                        size="small"
                                                                        sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
                                                                    />
                                                                ))
                                                            ) : (
                                                                <Typography variant="body2" color="text.secondary">None specified</Typography>
                                                            )}
                                                        </Box>
                                                    </Box>

                                                    <Box sx={{ mb: { xs: 1.5, sm: 2 } }}>
                                                        <Typography variant="subtitle2" color="warning.main" gutterBottom sx={{ fontSize: { xs: '0.875rem', sm: '0.875rem' } }}>
                                                            Use Carefully:
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', gap: { xs: 0.3, sm: 0.5 }, flexWrap: 'wrap', mb: { xs: 0.5, sm: 1 } }}>
                                                            {selectedPlan.recommendations?.useCarefully?.length > 0 ? (
                                                                selectedPlan.recommendations.useCarefully.map((item, index) => (
                                                                    <Chip 
                                                                        key={index} 
                                                                        label={item.length > 30 ? `${item.substring(0, 30)}...` : item}
                                                                        onClick={() => openChipDetailDialog(item, 'Use Carefully Item', 'Use Carefully')}
                                                                        color="warning" 
                                                                        size="small"
                                                                        sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
                                                                    />
                                                                ))
                                                            ) : (
                                                                <Typography variant="body2" color="text.secondary">None specified</Typography>
                                                            )}
                                                        </Box>
                                                    </Box>

                                                    <Box sx={{ mb: { xs: 1.5, sm: 2 } }}>
                                                        <Typography variant="subtitle2" color="success.main" gutterBottom sx={{ fontSize: { xs: '0.875rem', sm: '0.875rem' } }}>
                                                            Recommended Daily:
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', gap: { xs: 0.3, sm: 0.5 }, flexWrap: 'wrap', mb: { xs: 0.5, sm: 1 } }}>
                                                            {selectedPlan.recommendations?.eatDaily?.length > 0 ? (
                                                                selectedPlan.recommendations.eatDaily.map((item, index) => (
                                                                    <Chip 
                                                                        key={index} 
                                                                        label={item.length > 30 ? `${item.substring(0, 30)}...` : item}
                                                                        onClick={() => openChipDetailDialog(item, 'Recommended Daily Item', 'Eat Daily')}
                                                                        color="success" 
                                                                        size="small"
                                                                        sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
                                                                    />
                                                                ))
                                                            ) : (
                                                                <Typography variant="body2" color="text.secondary">None specified</Typography>
                                                            )}
                                                        </Box>
                                                    </Box>

                                                    <Box sx={{ mb: { xs: 0.5, sm: 1 } }}>
                                                        <Typography variant="subtitle2" color="info.main" gutterBottom sx={{ fontSize: { xs: '0.875rem', sm: '0.875rem' } }}>
                                                            Exercise Recommendations:
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', gap: { xs: 0.3, sm: 0.5 }, flexWrap: 'wrap' }}>
                                                            {selectedPlan.recommendations?.exercise?.length > 0 ? (
                                                                selectedPlan.recommendations.exercise.map((item, index) => (
                                                                    <Chip 
                                                                        key={index} 
                                                                        label={item.length > 30 ? `${item.substring(0, 30)}...` : item}
                                                                        onClick={() => openChipDetailDialog(item, 'Exercise Recommendation', 'Exercise')}
                                                                        color="info" 
                                                                        size="small"
                                                                        sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
                                                                    />
                                                                ))
                                                            ) : (
                                                                <Typography variant="body2" color="text.secondary">None specified</Typography>
                                                            )}
                                                        </Box>
                                                    </Box>
                                                </Grid>

                                                {/* Meal-specific Recommendations */}
                                                <Grid item xs={12} md={6}>
                                                    {['breakfast', 'lunch', 'dinner'].map((mealType) => (
                                                        selectedPlan.recommendations?.[mealType]?.some(cat => cat.items?.length > 0) && (
                                                            <Box key={mealType} sx={{ mb: 2 }}>
                                                                <Typography variant="subtitle2" color="primary.main" gutterBottom sx={{ textTransform: 'capitalize' }}>
                                                                    {mealType} Recommendations:
                                                                </Typography>
                                                                {selectedPlan.recommendations[mealType].map((category, catIndex) => (
                                                                    category.items?.length > 0 && (
                                                                        <Box key={catIndex} sx={{ mb: 1 }}>
                                                                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                                                                                {category.category}:
                                                                            </Typography>
                                                                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                                                                                {category.items.map((item, itemIndex) => (
                                                                                    <Chip 
                                                                                        key={itemIndex} 
                                                                                        label={item.length > 30 ? `${item.substring(0, 30)}...` : item}
                                                                                        onClick={() => openChipDetailDialog(item, `${category.category} Item`, `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} - ${category.category}`)}
                                                                                        size="small"
                                                                                        variant="outlined"
                                                                                        color="primary"
                                                                                        sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
                                                                                    />
                                                                                ))}
                                                                            </Box>
                                                                        </Box>
                                                                    )
                                                                ))}
                                                            </Box>
                                                        )
                                                    ))}
                                                </Grid>
                                            </Grid>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {/* Warnings */}
                                {selectedPlan.warnings && selectedPlan.warnings.length > 0 && (
                                    <Grid item xs={12}>
                                        <Card>
                                            <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
                                                <Typography variant="h6" gutterBottom sx={{ color: 'error.main', display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 }, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                                                    ⚠️ Important Warnings
                                                </Typography>
                                                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                                    {selectedPlan.warnings.map((warning, index) => (
                                                        <Chip 
                                                            key={index} 
                                                            label={warning.length > 30 ? `${warning.substring(0, 30)}...` : warning}
                                                            onClick={() => openChipDetailDialog(warning, 'Important Warning', 'Warnings')}
                                                            color="error" 
                                                            variant="outlined"
                                                            sx={{ 
                                                                fontWeight: 'bold',
                                                                cursor: 'pointer',
                                                                '&:hover': { opacity: 0.8 },
                                                                '& .MuiChip-label': {
                                                                    fontWeight: 'bold'
                                                                }
                                                            }}
                                                        />
                                                    ))}
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                )}

                                {/* User Info */}
                                <Grid item xs={12} md={6}>
                                    <Card>
                                        <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
                                            <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                                                User Information
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, mb: 0.5 }}>
                                                <strong>Name:</strong> {selectedPlan.user?.name || 'N/A'}
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, mb: 0.5 }}>
                                                <strong>Email:</strong> {selectedPlan.user?.email || 'N/A'}
                                            </Typography>
                                            {selectedPlan.form?.currentWeight && (
                                                <Typography variant="body2" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, mb: 0.5 }}>
                                                    <strong>Current Weight:</strong> {selectedPlan.form.currentWeight}kg
                                                </Typography>
                                            )}
                                            {selectedPlan.form?.desiredWeight && (
                                                <Typography variant="body2" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, mb: 0.5 }}>
                                                    <strong>Desired Weight:</strong> {selectedPlan.form.desiredWeight}kg
                                                </Typography>
                                            )}
                                            {selectedPlan.form?.height && (
                                                <Typography variant="body2" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, mb: 0.5 }}>
                                                    <strong>Height:</strong> {selectedPlan.form.height}cm
                                                </Typography>
                                            )}
                                            {selectedPlan.form?.age && (
                                                <Typography variant="body2" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, mb: 0.5 }}>
                                                    <strong>Age:</strong> {selectedPlan.form.age}
                                                </Typography>
                                            )}
                                            {selectedPlan.form?.gender && (
                                                <Typography variant="body2" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, mb: 0.5 }}>
                                                    <strong>Gender:</strong> {selectedPlan.form.gender}
                                                </Typography>
                                            )}
                                            {selectedPlan.form?.activityLevel && (
                                                <Typography variant="body2" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, mb: 0.5 }}>
                                                    <strong>Activity Level:</strong> {selectedPlan.form.activityLevel}
                                                </Typography>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {/* Health & Dietary Info */}
                                {selectedPlan.form && (selectedPlan.form.healthConditions?.length > 0 || 
                                    selectedPlan.form.allergies?.length > 0 || 
                                    selectedPlan.form.dietaryRestrictions?.length > 0 ||
                                    selectedPlan.form.currentDiet ||
                                    selectedPlan.form.supplementsOrMedications?.length > 0) && (
                                    <Grid item xs={12}>
                                        <Card>
                                            <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
                                                <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                                                    Health & Dietary Information
                                                </Typography>
                                                <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                                                    {selectedPlan.form.healthConditions?.length > 0 && (
                                                        <Grid item xs={12} sm={6} md={4}>
                                                            <Typography variant="subtitle2" color="error.main" gutterBottom sx={{ fontSize: { xs: '0.875rem', sm: '0.875rem' } }}>
                                                                Health Conditions:
                                                            </Typography>
                                                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                                                {selectedPlan.form.healthConditions.map((condition, idx) => (
                                                                    <Chip 
                                                                        key={idx} 
                                                                        label={condition.length > 30 ? `${condition.substring(0, 30)}...` : condition}
                                                                        onClick={() => openChipDetailDialog(condition, 'Health Condition', 'Health Information')}
                                                                        size="small" 
                                                                        color="error" 
                                                                        variant="outlined"
                                                                        sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
                                                                    />
                                                                ))}
                                                            </Box>
                                                        </Grid>
                                                    )}
                                                    {selectedPlan.form.allergies?.length > 0 && (
                                                        <Grid item xs={12} sm={6} md={4}>
                                                            <Typography variant="subtitle2" color="warning.main" gutterBottom sx={{ fontSize: { xs: '0.875rem', sm: '0.875rem' } }}>
                                                                Allergies:
                                                            </Typography>
                                                            <Box sx={{ display: 'flex', gap: { xs: 0.3, sm: 0.5 }, flexWrap: 'wrap' }}>
                                                                {selectedPlan.form.allergies.map((allergy, idx) => (
                                                                    <Chip 
                                                                        key={idx} 
                                                                        label={allergy.length > 30 ? `${allergy.substring(0, 30)}...` : allergy}
                                                                        onClick={() => openChipDetailDialog(allergy, 'Allergy', 'Health Information')}
                                                                        size="small" 
                                                                        color="warning" 
                                                                        variant="outlined"
                                                                        sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
                                                                    />
                                                                ))}
                                                            </Box>
                                                        </Grid>
                                                    )}
                                                    {selectedPlan.form.dietaryRestrictions?.length > 0 && (
                                                        <Grid item xs={12} sm={6} md={4}>
                                                            <Typography variant="subtitle2" color="info.main" gutterBottom sx={{ fontSize: { xs: '0.875rem', sm: '0.875rem' } }}>
                                                                Dietary Restrictions:
                                                            </Typography>
                                                            <Box sx={{ display: 'flex', gap: { xs: 0.3, sm: 0.5 }, flexWrap: 'wrap' }}>
                                                                {selectedPlan.form.dietaryRestrictions.map((restriction, idx) => (
                                                                    <Chip 
                                                                        key={idx} 
                                                                        label={restriction.length > 30 ? `${restriction.substring(0, 30)}...` : restriction}
                                                                        onClick={() => openChipDetailDialog(restriction, 'Dietary Restriction', 'Health Information')}
                                                                        size="small" 
                                                                        color="info" 
                                                                        variant="outlined"
                                                                        sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
                                                                    />
                                                                ))}
                                                            </Box>
                                                        </Grid>
                                                    )}
                                                    {selectedPlan.form.currentDiet && (
                                                        <Grid item xs={12} sm={6} md={4}>
                                                            <Typography variant="subtitle2" color="primary.main" gutterBottom sx={{ fontSize: { xs: '0.875rem', sm: '0.875rem' } }}>
                                                                Current Diet:
                                                            </Typography>
                                                            <Typography variant="body2" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                                                                {selectedPlan.form.currentDiet}
                                                            </Typography>
                                                        </Grid>
                                                    )}
                                                    {selectedPlan.form.supplementsOrMedications?.length > 0 && (
                                                        <Grid item xs={12} sm={6} md={4}>
                                                            <Typography variant="subtitle2" color="secondary.main" gutterBottom sx={{ fontSize: { xs: '0.875rem', sm: '0.875rem' } }}>
                                                                Supplements/Medications:
                                                            </Typography>
                                                            <Box sx={{ display: 'flex', gap: { xs: 0.3, sm: 0.5 }, flexWrap: 'wrap' }}>
                                                                {selectedPlan.form.supplementsOrMedications.map((item, idx) => (
                                                                    <Chip 
                                                                        key={idx} 
                                                                        label={item.length > 30 ? `${item.substring(0, 30)}...` : item}
                                                                        onClick={() => openChipDetailDialog(item, 'Supplement/Medication', 'Health Information')}
                                                                        size="small" 
                                                                        color="secondary" 
                                                                        variant="outlined"
                                                                        sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
                                                                    />
                                                                ))}
                                                            </Box>
                                                        </Grid>
                                                    )}
                                                </Grid>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                )}

                                {/* User Feedback */}
                                <Grid item xs={12} md={6}>
                                    <Card data-testid="user-feedback" sx={{
                                        ...(openedFromFeedback && {
                                            border: 2,
                                            borderColor: 'primary.main',
                                            backgroundColor: theme.palette.mode === 'dark' 
                                                ? 'rgba(144, 202, 249, 0.1)' 
                                                : 'rgba(25, 118, 210, 0.05)'
                                        })
                                    }}>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <FeedbackIcon color="primary" />
                                                User Feedback
                                                {openedFromFeedback && (
                                                    <Chip 
                                                        label="Focus" 
                                                        color="primary" 
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                )}
                                            </Typography>
                                            {selectedPlan.feedback?.rating ? (
                                                <Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                        <Typography variant="body2" fontWeight="bold">Rating:</Typography>
                                                        <Rating value={selectedPlan.feedback.rating} readOnly size="small" />
                                                        <Chip 
                                                            label={`${selectedPlan.feedback.rating}/5`}
                                                            color={selectedPlan.feedback.rating >= 4 ? 'success' : selectedPlan.feedback.rating >= 3 ? 'warning' : 'error'}
                                                            size="small"
                                                        />
                                                    </Box>
                                                    {selectedPlan.feedback.comment && (
                                                        <Box sx={{ mt: 2 }}>
                                                            <Typography variant="body2" fontWeight="bold">Comment:</Typography>
                                                            <Paper 
                                                                elevation={0} 
                                                                sx={{ 
                                                                    p: 1.5, 
                                                                    mt: 0.5, 
                                                                    backgroundColor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50',
                                                                    border: 1,
                                                                    borderColor: 'divider'
                                                                }}
                                                            >
                                                                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                                                                    "{selectedPlan.feedback.comment}"
                                                                </Typography>
                                                            </Paper>
                                                        </Box>
                                                    )}
                                                    {selectedPlan.feedback.submittedAt && (
                                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                                                            Submitted on: {new Date(selectedPlan.feedback.submittedAt).toLocaleString()}
                                                        </Typography>
                                                    )}
                                                    <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            color="primary"
                                                            onClick={() => {
                                                                const planOverviewElement = document.querySelector('[data-testid="plan-overview"]');
                                                                if (planOverviewElement) {
                                                                    planOverviewElement.scrollIntoView({ 
                                                                        behavior: 'smooth', 
                                                                        block: 'start' 
                                                                    });
                                                                }
                                                            }}
                                                            sx={{ fontSize: '0.75rem' }}
                                                        >
                                                            View Complete Plan Details
                                                        </Button>
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            color="secondary"
                                                            disabled={planLoading}
                                                            onClick={() => {
                                                                const associatedForm = forms.find(form => form._id === selectedPlan.form._id || form._id === selectedPlan.form);
                                                                if (associatedForm) {
                                                                    sendPlan(associatedForm);
                                                                    setPlanDetailsOpen(false);
                                                                }
                                                            }}
                                                            sx={{ fontSize: '0.75rem' }}
                                                        >
                                                            {planLoading ? 'Loading...' : 'Edit Plan Based on Feedback'}
                                                        </Button>
                                                    </Box>
                                                </Box>
                                            ) : (
                                                <Box sx={{ 
                                                    p: 2, 
                                                    textAlign: 'center',
                                                    backgroundColor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50',
                                                    borderRadius: 1
                                                }}>
                                                    <FeedbackIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                                                    <Typography variant="body2" color="text.secondary">
                                                        No feedback submitted yet
                                                    </Typography>
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        color="primary"
                                                        onClick={() => {
                                                            const planOverviewElement = document.querySelector('[data-testid="plan-overview"]');
                                                            if (planOverviewElement) {
                                                                planOverviewElement.scrollIntoView({ 
                                                                    behavior: 'smooth', 
                                                                    block: 'start' 
                                                                });
                                                            }
                                                        }}
                                                        sx={{ mt: 2, fontSize: '0.75rem' }}
                                                    >
                                                        View Complete Plan Details
                                                    </Button>
                                                </Box>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Grid>

                            </Grid>
                        )}
                        {!planLoading && !selectedPlan && (
                            <Box sx={{ 
                                display: 'flex', 
                                flexDirection: 'column',
                                alignItems: 'center', 
                                justifyContent: 'center',
                                minHeight: { xs: '200px', sm: '300px' },
                                gap: 2,
                                p: 2
                            }}>
                                <Typography variant="h6" color="text.secondary" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                                    No plan data available
                                </Typography>
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions>
                        {selectedPlan && !planLoading && (
                            <Button 
                                variant="contained" 
                                color="primary"
                                disabled={planLoading}
                                onClick={() => {
                                    // Find the form associated with this plan
                                    const associatedForm = forms.find(form => form._id === selectedPlan.form._id || form._id === selectedPlan.form);
                                    if (associatedForm) {
                                        sendPlan(associatedForm);
                                        setPlanDetailsOpen(false);
                                        setOpenedFromFeedback(false);
                                    }
                                }}
                                sx={{ mr: 1 }}
                            >
                                {planLoading ? 'Loading...' : 'Edit Plan'}
                            </Button>
                        )}
                        <Button onClick={() => {
                            setPlanDetailsOpen(false);
                            setOpenedFromFeedback(false);
                        }}>Close</Button>
                    </DialogActions>
                </Dialog>

                <ImageViewerDialog
                    open={imageDialogOpen}
                    imageUrl={selectedImage}
                    onClose={() => setImageDialogOpen(false)}
                />

                {/* Chip Detail Dialog */}
                <Dialog 
                    open={chipDetailDialogOpen} 
                    onClose={() => setChipDetailDialogOpen(false)} 
                    maxWidth="sm" 
                    fullWidth
                    fullScreen={isSmallMobile}
                    TransitionComponent={Transition}
                    sx={{
                        '& .MuiDialog-paper': {
                            borderRadius: { xs: 0, sm: 2 },
                            maxHeight: { xs: '100vh', sm: '80vh' },
                            margin: { xs: 0, sm: 2 }
                        }
                    }}
                >
                    <DialogTitle sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: { xs: 0.5, sm: 1 },
                        p: { xs: 2, sm: 2.5 },
                        backgroundColor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50',
                        borderBottom: 1,
                        borderColor: 'divider',
                        flexWrap: 'wrap'
                    }}>
                        <Typography variant="h6" component="span" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
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
                    <DialogContent sx={{ p: { xs: 2, sm: 3 }, mt: { xs: 0.5, sm: 1 } }}>
                        <Typography 
                            variant="body1" 
                            sx={{ 
                                lineHeight: 1.6,
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                fontSize: { xs: '0.875rem', sm: '1rem' }
                            }}
                        >
                            {selectedChipContent}
                        </Typography>
                    </DialogContent>
                    <DialogActions sx={{ 
                        p: { xs: 2, sm: 2 }, 
                        borderTop: 1, 
                        borderColor: 'divider',
                        '& .MuiButton-root': {
                            width: { xs: '100%', sm: 'auto' }
                        }
                    }}>
                        <Button 
                            onClick={() => setChipDetailDialogOpen(false)}
                            variant="contained"
                            color="primary"
                        >
                            Close
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Navigation Loading Backdrop */}
                <Backdrop
                    sx={{ 
                        color: (theme) => theme.palette.primary.main,
                        zIndex: (theme) => theme.zIndex.modal + 1 
                    }}
                    open={planLoading}
                >
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <CircularProgress color="primary" size={60} />
                        <Typography sx={{ mt: 2, color: 'primary.main' }}>Loading Plan Builder...</Typography>
                    </Box>
                </Backdrop>
            </Box>
        </PageFade>
    );
}
