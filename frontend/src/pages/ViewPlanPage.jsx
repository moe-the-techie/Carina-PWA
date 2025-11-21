import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Box, Typography, Paper, Divider, Button, useTheme, Grid, Chip, Accordion, AccordionSummary, AccordionDetails, Card, CardContent, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Rating, Alert, Snackbar } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBackIos';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FeedbackIcon from '@mui/icons-material/Feedback';
import PageFade from '../components/PageFade';

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
                    setError('No plan found for this form yet. Your plan may still be in preparation.');
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

    if (loading) {
        return (
            <PageFade>
                <Box p={3} textAlign="center">
                    <Typography>Loading your plan...</Typography>
                </Box>
            </PageFade>
        );
    }

    if (error) {
        return (
            <PageFade>
                <Box p={3} textAlign="center">
                    <Button onClick={() => navigate(-1)} sx={{ position: 'absolute', top: 12, left: 10, minWidth: 0, padding: 1 }}>
                        <ArrowBackIcon sx={{ fontSize: 32, color: 'black' }} />
                    </Button>
                    <Typography color="error" variant="h6" gutterBottom>
                        {error}
                    </Typography>
                    {form && (
                        <Typography color="textSecondary">
                            Your form was submitted successfully. The nutrition team is preparing your personalized plan.
                        </Typography>
                    )}
                </Box>
            </PageFade>
        );
    }

    return (
        <PageFade>
            <Box
            sx={{
                width: '100%',
                maxWidth: { xs: '100%', sm: 900, md: 1200 },
                mx: 'auto',
                p: { xs: 1, sm: 2, md: 3 },
                display: 'flex',
                flexDirection: 'column',
                gap: { xs: 1.5, sm: 2 },
            }}
            >
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    mb: { xs: 1, sm: 2 }
                }}
            >
                <Button 
                    onClick={() => navigate(-1)} 
                    sx={{ 
                        position: 'absolute', 
                        top: { xs: -8, sm: -12 }, 
                        left: { xs: -8, sm: -10 }, 
                        minWidth: 0, 
                        padding: { xs: 0.5, sm: 1 },
                        minHeight: { xs: '44px', sm: 'auto' }
                    }}
                >
                    <ArrowBackIcon sx={{ fontSize: { xs: 28, sm: 32 }, color: 'black' }} />
                </Button>
                <Typography 
                    variant="h4"
                    sx={{
                        fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
                        textAlign: 'center'
                    }}
                >
                    My Nutrition Plan
                </Typography>
            </Box>

            {plan && (
                <>
                    {/* Plan Overview */}
                    <Paper elevation={2} sx={{ p: 2, backgroundColor: theme.palette.background.container }}>
                        <Typography variant="h6" gutterBottom>Plan Overview</Typography>
                        <Typography><strong>Title:</strong> {plan.title}</Typography>
                        <Typography><strong>Description:</strong> {plan.description || 'Personalized nutrition plan'}</Typography>
                        <Typography><strong>Duration:</strong> {plan.duration} week(s)</Typography>
                        <Typography><strong>Status:</strong> 
                            <Chip 
                                label={plan.status} 
                                color={plan.status === 'active' ? 'success' : 'default'}
                                size="small"
                                sx={{ ml: 1 }}
                            />
                        </Typography>
                    </Paper>

                    {/* Feedback Section */}
                    <Paper elevation={2} sx={{ p: 2, backgroundColor: theme.palette.background.container }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">Your Feedback</Typography>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<FeedbackIcon />}
                                onClick={handleOpenFeedbackDialog}
                                size="small"
                            >
                                {plan.feedback?.rating ? 'Update Feedback' : 'Give Feedback'}
                            </Button>
                        </Box>
                        
                        {plan.feedback?.rating ? (
                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <Typography variant="body2" fontWeight="bold">Rating:</Typography>
                                    <Rating value={plan.feedback.rating} readOnly size="small" />
                                    <Typography variant="body2" color="text.secondary">
                                        ({plan.feedback.rating}/5)
                                    </Typography>
                                </Box>
                                {plan.feedback.comment && (
                                    <Box sx={{ mt: 1 }}>
                                        <Typography variant="body2" fontWeight="bold">Comment:</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {plan.feedback.comment}
                                        </Typography>
                                    </Box>
                                )}
                                {plan.feedback.submittedAt && (
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                        Submitted on: {new Date(plan.feedback.submittedAt).toLocaleString()}
                                    </Typography>
                                )}
                            </Box>
                        ) : (
                            <Typography variant="body2" color="text.secondary">
                                Share your experience with this nutrition plan to help us improve our services.
                            </Typography>
                        )}
                    </Paper>

                    {/* Important Warnings */}
                    {plan.warnings && plan.warnings.length > 0 && (
                        <Paper 
                            elevation={3} 
                            sx={{ 
                                p: 2, 
                                backgroundColor: theme.palette.error.light || '#ffebee',
                                border: `2px solid ${theme.palette.error.main}`,
                                borderRadius: 2
                            }}
                        >
                            <Typography 
                                variant="h6" 
                                gutterBottom 
                                sx={{ 
                                    color: 'error.main', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: 1,
                                    fontWeight: 'bold'
                                }}
                            >
                                ⚠️ IMPORTANT WARNINGS
                            </Typography>
                            <Typography variant="body2" color="error.main" sx={{ mb: 2, fontStyle: 'italic' }}>
                                Please read these warnings carefully before following your nutrition plan:
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {plan.warnings.map((warning, index) => (
                                    <Box 
                                        key={index} 
                                        onClick={() => openChipDetailDialog(warning, 'Important Warning', 'Warnings')}
                                        sx={{ 
                                            p: 1.5, 
                                            backgroundColor: 'white',
                                            border: '1px solid',
                                            borderColor: 'error.main',
                                            borderRadius: 1,
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: 1,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                backgroundColor: 'error.light',
                                                transform: 'translateY(-1px)',
                                                boxShadow: 2
                                            }
                                        }}
                                    >
                                        <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 'bold', minWidth: 'auto' }}>
                                            ⚠️
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 'bold', flex: 1 }}>
                                            {warning.length > 100 ? `${warning.substring(0, 100)}...` : warning}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Paper>
                    )}

                    {/* Goals and Targets */}
                    <Paper elevation={2} sx={{ p: 2, backgroundColor: theme.palette.background.container }}>
                        <Typography variant="h6" gutterBottom>Your Goals</Typography>
                        <Grid container spacing={{ xs: 1, sm: 2 }}>
                            <Grid item xs={12} sm={6} md={4}>
                                <Typography><strong>Target Weight:</strong> {plan.goals?.targetWeight || 'Not set'} kg</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={4}>
                                <Typography><strong>Daily Calories:</strong> {plan.goals?.targetCalories || 'Not set'}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={4}>
                                <Typography><strong>Protein:</strong> {plan.goals?.targetProtein || 'Not set'} g</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={4}>
                                <Typography><strong>Carbs:</strong> {plan.goals?.targetCarbs || 'Not set'} g</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={4}>
                                <Typography><strong>Fats:</strong> {plan.goals?.targetFats || 'Not set'} g</Typography>
                            </Grid>
                        </Grid>
                    </Paper>

                    {/* Dietary Recommendations */}
                    {plan.recommendations && (
                        <Paper elevation={2} sx={{ 
                            p: { xs: 1.5, sm: 2 }, 
                            backgroundColor: theme.palette.background.container 
                        }}>
                            <Typography variant="h6" gutterBottom>Dietary Recommendations</Typography>
                            <Grid container spacing={{ xs: 2, sm: 3 }}>
                                {/* Avoid */}
                                <Grid item xs={12} sm={6} md={3}>
                                    <Box>
                                        <Typography variant="subtitle2" color="error.main" gutterBottom>
                                            Avoid
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', minHeight: { xs: 32, sm: 40 } }}>
                                            {plan.recommendations.avoid?.length > 0 ? (
                                                plan.recommendations.avoid.map((item, index) => (
                                                    <Chip 
                                                        key={index} 
                                                        label={item.length > 30 ? `${item.substring(0, 30)}...` : item} 
                                                        color="error" 
                                                        size="small" 
                                                        onClick={() => openChipDetailDialog(item, 'Avoid Item', 'Avoid')}
                                                        sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'error.dark' } }}
                                                    />
                                                ))
                                            ) : (
                                                <Typography variant="body2" color="text.secondary">None specified</Typography>
                                            )}
                                        </Box>
                                    </Box>
                                </Grid>

                                {/* Use Carefully */}
                                <Grid item xs={12} sm={6} md={3}>
                                    <Box>
                                        <Typography variant="subtitle2" color="warning.main" gutterBottom>
                                            Use Carefully
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', minHeight: { xs: 32, sm: 40 } }}>
                                            {plan.recommendations.useCarefully?.length > 0 ? (
                                                plan.recommendations.useCarefully.map((item, index) => (
                                                    <Chip 
                                                        key={index} 
                                                        label={item.length > 30 ? `${item.substring(0, 30)}...` : item} 
                                                        color="warning" 
                                                        size="small" 
                                                        onClick={() => openChipDetailDialog(item, 'Use Carefully Item', 'Use Carefully')}
                                                        sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'warning.dark' } }}
                                                    />
                                                ))
                                            ) : (
                                                <Typography variant="body2" color="text.secondary">None specified</Typography>
                                            )}
                                        </Box>
                                    </Box>
                                </Grid>

                                {/* Eat Daily */}
                                <Grid item xs={12} sm={6} md={3}>
                                    <Box>
                                        <Typography variant="subtitle2" color="success.main" gutterBottom>
                                            Eat Daily
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', minHeight: { xs: 32, sm: 40 } }}>
                                            {plan.recommendations.eatDaily?.length > 0 ? (
                                                plan.recommendations.eatDaily.map((item, index) => (
                                                    <Chip 
                                                        key={index} 
                                                        label={item.length > 30 ? `${item.substring(0, 30)}...` : item} 
                                                        color="success" 
                                                        size="small" 
                                                        onClick={() => openChipDetailDialog(item, 'Eat Daily Item', 'Eat Daily')}
                                                        sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'success.dark' } }}
                                                    />
                                                ))
                                            ) : (
                                                <Typography variant="body2" color="text.secondary">None specified</Typography>
                                            )}
                                        </Box>
                                    </Box>
                                </Grid>

                                {/* Exercise */}
                                <Grid item xs={12} sm={6} md={3}>
                                    <Box>
                                        <Typography variant="subtitle2" color="info.main" gutterBottom>
                                            Exercise
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', minHeight: { xs: 32, sm: 40 } }}>
                                            {plan.recommendations.exercise?.length > 0 ? (
                                                plan.recommendations.exercise.map((item, index) => (
                                                    <Chip 
                                                        key={index} 
                                                        label={item.length > 30 ? `${item.substring(0, 30)}...` : item} 
                                                        color="info" 
                                                        size="small" 
                                                        onClick={() => openChipDetailDialog(item, 'Exercise Recommendation', 'Exercise')}
                                                        sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'info.dark' } }}
                                                    />
                                                ))
                                            ) : (
                                                <Typography variant="body2" color="text.secondary">None specified</Typography>
                                            )}
                                        </Box>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Paper>
                    )}

                    {/* Meal-Specific Food Options */}
                    {plan.recommendations && (
                        (() => {
                            // Check if any meal has categorized food options - with safety checks
                            const hasBreakfastOptions = Array.isArray(plan.recommendations.breakfast) && 
                                plan.recommendations.breakfast.some(cat => 
                                    cat && typeof cat === 'object' && Array.isArray(cat.items) && cat.items.length > 0
                                );
                            const hasLunchOptions = Array.isArray(plan.recommendations.lunch) && 
                                plan.recommendations.lunch.some(cat => 
                                    cat && typeof cat === 'object' && Array.isArray(cat.items) && cat.items.length > 0
                                );
                            const hasDinnerOptions = Array.isArray(plan.recommendations.dinner) && 
                                plan.recommendations.dinner.some(cat => 
                                    cat && typeof cat === 'object' && Array.isArray(cat.items) && cat.items.length > 0
                                );
                            
                            return (hasBreakfastOptions || hasLunchOptions || hasDinnerOptions) && (
                                <Paper elevation={2} sx={{ 
                                    p: { xs: 1.5, sm: 2 }, 
                                    backgroundColor: theme.palette.background.container 
                                }}>
                                    <Typography variant="h6" gutterBottom>Meal Food Options by Category</Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                        Choose from these recommended food options organized by nutritional categories for each meal
                                    </Typography>
                                    
                                    {/* Breakfast Categories */}
                                    {hasBreakfastOptions && (
                                        <Box sx={{ mb: 4 }}>
                                            <Typography variant="h6" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                Breakfast Options
                                            </Typography>
                                            <Grid container spacing={{ xs: 1, sm: 2 }}>
                                                {(plan.recommendations.breakfast || []).filter(cat => 
                                                    cat && typeof cat === 'object' && Array.isArray(cat.items) && cat.items.length > 0
                                                ).map((categoryData, categoryIndex) => (
                                                    <Grid item xs={12} sm={6} md={4} key={categoryIndex}>
                                                        <Box sx={{ p: 2, border: 1, borderColor: 'primary.light', borderRadius: 2, backgroundColor: 'primary.50' }}>
                                                            <Typography variant="subtitle2" color="primary" gutterBottom fontWeight="bold">
                                                                {categoryData.category}
                                                            </Typography>
                                                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                                                {(categoryData.items || []).filter(item => 
                                                                    typeof item === 'string'
                                                                ).map((item, itemIndex) => (
                                                                    <Chip 
                                                                        key={itemIndex} 
                                                                        label={item.length > 30 ? `${item.substring(0, 30)}...` : item} 
                                                                        color="primary" 
                                                                        size="small" 
                                                                        onClick={() => openChipDetailDialog(item, `${categoryData.category} Item`, `Breakfast - ${categoryData.category}`)}
                                                                        sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'primary.dark' } }}
                                                                    />
                                                                ))}
                                                            </Box>
                                                        </Box>
                                                    </Grid>
                                                ))}
                                            </Grid>
                                        </Box>
                                    )}

                                    {/* Lunch Categories */}
                                    {hasLunchOptions && (
                                        <Box sx={{ mb: 4 }}>
                                            <Typography variant="h6" color="secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                Lunch Options
                                            </Typography>
                                            <Grid container spacing={{ xs: 1, sm: 2 }}>
                                                {(plan.recommendations.lunch || []).filter(cat => 
                                                    cat && typeof cat === 'object' && Array.isArray(cat.items) && cat.items.length > 0
                                                ).map((categoryData, categoryIndex) => (
                                                    <Grid item xs={12} sm={6} md={4} key={categoryIndex}>
                                                        <Box sx={{ p: 2, border: 1, borderColor: 'secondary.light', borderRadius: 2, backgroundColor: 'secondary.50' }}>
                                                            <Typography variant="subtitle2" color="secondary" gutterBottom fontWeight="bold">
                                                                {categoryData.category}
                                                            </Typography>
                                                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                                                {(categoryData.items || []).filter(item => 
                                                                    typeof item === 'string'
                                                                ).map((item, itemIndex) => (
                                                                    <Chip 
                                                                        key={itemIndex} 
                                                                        label={item.length > 30 ? `${item.substring(0, 30)}...` : item} 
                                                                        color="secondary" 
                                                                        size="small" 
                                                                        onClick={() => openChipDetailDialog(item, `${categoryData.category} Item`, `Lunch - ${categoryData.category}`)}
                                                                        sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'secondary.dark' } }}
                                                                    />
                                                                ))}
                                                            </Box>
                                                        </Box>
                                                    </Grid>
                                                ))}
                                            </Grid>
                                        </Box>
                                    )}

                                    {/* Dinner Categories */}
                                    {hasDinnerOptions && (
                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="h6" color="success.main" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                Dinner Options
                                            </Typography>
                                            <Grid container spacing={{ xs: 1, sm: 2 }}>
                                                {(plan.recommendations.dinner || []).filter(cat => 
                                                    cat && typeof cat === 'object' && Array.isArray(cat.items) && cat.items.length > 0
                                                ).map((categoryData, categoryIndex) => (
                                                    <Grid item xs={12} sm={6} md={4} key={categoryIndex}>
                                                        <Box sx={{ p: 2, border: 1, borderColor: 'success.light', borderRadius: 2, backgroundColor: 'success.50' }}>
                                                            <Typography variant="subtitle2" color="success.main" gutterBottom fontWeight="bold">
                                                                {categoryData.category}
                                                            </Typography>
                                                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                                                {(categoryData.items || []).filter(item => 
                                                                    typeof item === 'string'
                                                                ).map((item, itemIndex) => (
                                                                    <Chip 
                                                                        key={itemIndex} 
                                                                        label={item.length > 30 ? `${item.substring(0, 30)}...` : item} 
                                                                        color="success" 
                                                                        size="small" 
                                                                        onClick={() => openChipDetailDialog(item, `${categoryData.category} Item`, `Dinner - ${categoryData.category}`)}
                                                                        sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'success.dark' } }}
                                                                    />
                                                                ))}
                                                            </Box>
                                                        </Box>
                                                    </Grid>
                                                ))}
                                            </Grid>
                                        </Box>
                                    )}
                                </Paper>
                            );
                        })()
                    )}

                    {/* Weekly Meal Plans */}
                    {plan.weeklyPlans && plan.weeklyPlans.length > 0 && (
                        <Paper elevation={2} sx={{ p: 2, backgroundColor: theme.palette.background.container }}>
                            <Typography variant="h6" gutterBottom>Weekly Meal Plan</Typography>
                            {plan.weeklyPlans.map((day, index) => (
                                <Accordion key={index} sx={{ mb: 1 }}>
                                    <AccordionSummary 
                                        expandIcon={<ExpandMoreIcon />}
                                        sx={{ 
                                            '& .MuiAccordionSummary-content': { 
                                                flexDirection: { xs: 'column', sm: 'row' },
                                                alignItems: { xs: 'flex-start', sm: 'center' },
                                                gap: { xs: 1, sm: 0 }
                                            }
                                        }}
                                    >
                                        <Box sx={{ 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            alignItems: { xs: 'flex-start', sm: 'center' },
                                            width: '100%', 
                                            pr: { xs: 1, sm: 2 },
                                            flexDirection: { xs: 'column', sm: 'row' },
                                            gap: { xs: 1, sm: 0 }
                                        }}>
                                            <Typography 
                                                variant="subtitle1" 
                                                fontWeight="bold"
                                                sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
                                            >
                                                Day {day.day} - {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day.day - 1]}
                                            </Typography>
                                            {day.totalCalories && (
                                                <Chip 
                                                    label={`${day.totalCalories} kcal`}
                                                    color="primary"
                                                    size="small"
                                                />
                                            )}
                                        </Box>
                                    </AccordionSummary>
                                    <AccordionDetails sx={{ p: { xs: 1, sm: 2 } }}>
                                        <Grid container spacing={{ xs: 1, sm: 2 }}>
                                            {/* Breakfast */}
                                            {day.breakfast && (
                                                <Grid item xs={12} sm={6} lg={3}>
                                                    <Card sx={{ height: '100%', minHeight: { xs: 'auto', sm: 120 } }}>
                                                        <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
                                                            <Typography variant="subtitle2" color="primary" gutterBottom>
                                                                🌅 Breakfast
                                                            </Typography>
                                                            <Typography 
                                                                variant="body2" 
                                                                fontWeight="bold"
                                                                sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                                                            >
                                                                {day.breakfast.name}
                                                            </Typography>
                                                            <Typography 
                                                                variant="caption" 
                                                                color="textSecondary"
                                                                sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                                                            >
                                                                {day.breakfast.calories} calories
                                                            </Typography>
                                                            {day.breakfast.description && (
                                                                <Typography 
                                                                    variant="body2" 
                                                                    sx={{ 
                                                                        mt: 1, 
                                                                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                                                        lineHeight: 1.4
                                                                    }}
                                                                >
                                                                    {day.breakfast.description}
                                                                </Typography>
                                                            )}
                                                        </CardContent>
                                                    </Card>
                                                </Grid>
                                            )}

                                            {/* Lunch */}
                                            {day.lunch && (
                                                <Grid item xs={12} sm={6} lg={3}>
                                                    <Card sx={{ height: '100%', minHeight: { xs: 'auto', sm: 120 } }}>
                                                        <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
                                                            <Typography variant="subtitle2" color="primary" gutterBottom>
                                                                🍽️ Lunch
                                                            </Typography>
                                                            <Typography 
                                                                variant="body2" 
                                                                fontWeight="bold"
                                                                sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                                                            >
                                                                {day.lunch.name}
                                                            </Typography>
                                                            <Typography 
                                                                variant="caption" 
                                                                color="textSecondary"
                                                                sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                                                            >
                                                                {day.lunch.calories} calories
                                                            </Typography>
                                                            {day.lunch.description && (
                                                                <Typography 
                                                                    variant="body2" 
                                                                    sx={{ 
                                                                        mt: 1, 
                                                                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                                                        lineHeight: 1.4
                                                                    }}
                                                                >
                                                                    {day.lunch.description}
                                                                </Typography>
                                                            )}
                                                        </CardContent>
                                                    </Card>
                                                </Grid>
                                            )}

                                            {/* Dinner */}
                                            {day.dinner && (
                                                <Grid item xs={12} sm={6} lg={3}>
                                                    <Card sx={{ height: '100%', minHeight: { xs: 'auto', sm: 120 } }}>
                                                        <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
                                                            <Typography variant="subtitle2" color="primary" gutterBottom>
                                                                🌙 Dinner
                                                            </Typography>
                                                            <Typography 
                                                                variant="body2" 
                                                                fontWeight="bold"
                                                                sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                                                            >
                                                                {day.dinner.name}
                                                            </Typography>
                                                            <Typography 
                                                                variant="caption" 
                                                                color="textSecondary"
                                                                sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                                                            >
                                                                {day.dinner.calories} calories
                                                            </Typography>
                                                            {day.dinner.description && (
                                                                <Typography 
                                                                    variant="body2" 
                                                                    sx={{ 
                                                                        mt: 1, 
                                                                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                                                        lineHeight: 1.4
                                                                    }}
                                                                >
                                                                    {day.dinner.description}
                                                                </Typography>
                                                            )}
                                                        </CardContent>
                                                    </Card>
                                                </Grid>
                                            )}

                                            {/* Snacks */}
                                            {day.snacks && day.snacks.length > 0 && (
                                                <Grid item xs={12} sm={6} lg={3}>
                                                    <Card sx={{ height: '100%', minHeight: { xs: 'auto', sm: 120 } }}>
                                                        <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
                                                            <Typography variant="subtitle2" color="primary" gutterBottom>
                                                                🥨 Snacks
                                                            </Typography>
                                                            {day.snacks.map((snack, snackIndex) => (
                                                                <Box key={snackIndex} sx={{ mb: { xs: 0.5, sm: 1 } }}>
                                                                    <Typography 
                                                                        variant="body2" 
                                                                        fontWeight="bold"
                                                                        sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                                                                    >
                                                                        {snack.name}
                                                                    </Typography>
                                                                    <Typography 
                                                                        variant="caption" 
                                                                        color="textSecondary"
                                                                        sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                                                                    >
                                                                        {snack.calories} calories
                                                                    </Typography>
                                                                    {snack.description && (
                                                                        <Typography 
                                                                            variant="body2" 
                                                                            sx={{ 
                                                                                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                                                                lineHeight: 1.3
                                                                            }}
                                                                        >
                                                                            {snack.description}
                                                                        </Typography>
                                                                    )}
                                                                </Box>
                                                            ))}
                                                        </CardContent>
                                                    </Card>
                                                </Grid>
                                            )}
                                        </Grid>
                                        {day.notes && (
                                            <Box sx={{ mt: 2 }}>
                                                <Typography variant="body2" fontWeight="bold">Daily Notes:</Typography>
                                                <Typography variant="body2" color="textSecondary">
                                                    {day.notes}
                                                </Typography>
                                            </Box>
                                        )}
                                    </AccordionDetails>
                                </Accordion>
                            ))}
                        </Paper>
                    )}
                </>
            )}

            {form && (
                <>
                    <Divider sx={{ my: 2 }}>
                        <Typography variant="body2" color="textSecondary">
                            Form Submission Details
                        </Typography>
                    </Divider>

                    <Paper elevation={2} sx={{ 
                        p: { xs: 1.5, sm: 2 }, 
                        backgroundColor: theme.palette.background.container 
                    }}>
                        <Typography variant="h6" gutterBottom>Weight Data</Typography>
                        <Typography>Current Weight: {form.currentWeight} kg</Typography>
                        <Typography>Min Weight: {form.minWeight} kg</Typography>
                        <Typography>Max Weight: {form.maxWeight} kg</Typography>
                        <Typography>Desired Weight: {form.desiredWeight} kg</Typography>
                    </Paper>

                    <Paper elevation={2} sx={{ 
                        p: { xs: 1.5, sm: 2 }, 
                        backgroundColor: theme.palette.background.container 
                    }}>
                        <Typography variant="h6" gutterBottom>Meal Recall</Typography>
                        <Typography>Breakfast: {form.breakfast}</Typography>
                        <Typography>Snack Time: {form.snackTime}</Typography>
                        <Typography>Sugar: {form.sugar} tsp/day</Typography>
                    </Paper>

                    <Paper elevation={2} sx={{ 
                        p: { xs: 1.5, sm: 2 }, 
                        backgroundColor: theme.palette.background.container 
                    }}>
                        <Typography variant="h6" gutterBottom>Medical History</Typography>
                        <Typography>Allergies: {form.allergies?.join(', ') || 'None'}</Typography>
                        <Typography>Health Conditions: {form.healthConditions?.join(', ') || 'None'}</Typography>
                        <Typography>Medications: {form.medications?.join(', ') || 'None'}</Typography>
                    </Paper>

                    <Paper elevation={2} sx={{ 
                        p: { xs: 1.5, sm: 2 }, 
                        backgroundColor: theme.palette.background.container 
                    }}>
                        <Typography variant="h6" gutterBottom>Lifestyle</Typography>
                        <Typography>Smoker: {form.currentSmoker ? 'Yes' : 'No'}</Typography>
                        <Typography>Obesity History: {form.obesityHistory ? 'Yes' : 'No'}</Typography>
                        <Typography>Hydrated: {form.hydrated ? 'Yes' : 'No'}</Typography>
                        <Typography>Night Eater: {form.nightEater ? 'Yes' : 'No'}</Typography>
                        <Typography>Coffee Drinker: {form.coffee ? 'Yes' : 'No'}</Typography>
                    </Paper>

                    <Typography variant="caption" align="center">
                        Form submitted on: {new Date(form.createdAt).toLocaleString()}
                    </Typography>
                </>
            )}
            
            {/* Chip Detail Dialog */}
            <Dialog 
                open={chipDetailDialogOpen} 
                onClose={() => setChipDetailDialogOpen(false)} 
                maxWidth="sm" 
                fullWidth
                sx={{
                    '& .MuiDialog-paper': {
                        borderRadius: 2,
                        maxHeight: '80vh'
                    }
                }}
            >
                <DialogTitle sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    backgroundColor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50',
                    borderBottom: 1,
                    borderColor: 'divider'
                }}>
                    <Typography variant="h6" component="span">
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
                            lineHeight: 1.6,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word'
                        }}
                    >
                        {selectedChipContent}
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                    <Button 
                        onClick={() => setChipDetailDialogOpen(false)}
                        variant="contained"
                        color="primary"
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
                        borderRadius: 2
                    }
                }}
            >
                <DialogTitle sx={{ 
                    backgroundColor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50',
                    borderBottom: 1,
                    borderColor: 'divider'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FeedbackIcon color="primary" />
                        <Typography variant="h6">
                            {plan?.feedback?.rating ? 'Update Your Feedback' : 'Share Your Feedback'}
                        </Typography>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ p: 3, mt: 2 }}>
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                            How would you rate this nutrition plan?
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                            <Rating
                                value={feedbackRating}
                                onChange={(event, newValue) => setFeedbackRating(newValue)}
                                size="large"
                                disabled={feedbackSubmitting}
                            />
                            {feedbackRating > 0 && (
                                <Typography variant="body2" color="text.secondary">
                                    ({feedbackRating}/5)
                                </Typography>
                            )}
                        </Box>
                    </Box>
                    
                    <Box>
                        <Typography variant="subtitle1" gutterBottom fontWeight="bold">
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
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider', gap: 1 }}>
                    <Button 
                        onClick={() => setFeedbackDialogOpen(false)}
                        disabled={feedbackSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSubmitFeedback}
                        variant="contained"
                        color="primary"
                        disabled={feedbackSubmitting || feedbackRating === 0}
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
                    sx={{ width: '100%' }}
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>
            </Box>
        </PageFade>
    );
};