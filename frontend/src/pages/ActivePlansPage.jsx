import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Skeleton,
    Chip,
    LinearProgress,
    IconButton,
    Divider,
    alpha,
    Paper,
    Grid,
    Alert,
    Checkbox,
    Button,
    Slider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Snackbar,
    CircularProgress,
    Tooltip
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import PageFade from '../components/PageFade';
import { spacing, borderRadius, accentColors, shadows } from '../styles';
import { glassCard, glassButton, glassDialog } from '../styles/glassmorphism';
import { pageTitle } from '../styles/typography';
import { containerVariants, itemVariants } from '../styles/animations';
import { useCachedData } from '../hooks/useCachedData';

// Icons
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import WbTwilightIcon from '@mui/icons-material/WbTwilight';
import NightsStayIcon from '@mui/icons-material/NightsStay';
import CookieIcon from '@mui/icons-material/Cookie';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LocalDrinkIcon from '@mui/icons-material/LocalDrink';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import SentimentNeutralIcon from '@mui/icons-material/SentimentNeutral';
import SentimentSatisfiedIcon from '@mui/icons-material/SentimentSatisfied';
import SentimentVerySatisfiedIcon from '@mui/icons-material/SentimentVerySatisfied';
import ScaleIcon from '@mui/icons-material/Scale';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import SaveIcon from '@mui/icons-material/Save';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Get today's day name for meal display
const getTodayDayName = () => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[new Date().getDay()];
};

const getDayLabel = (dayName) => {
    return dayName.charAt(0).toUpperCase() + dayName.slice(1);
};

// Mood configuration
const moodConfig = {
    great: { icon: SentimentVerySatisfiedIcon, color: '#10B981', label: 'Great' },
    good: { icon: SentimentSatisfiedIcon, color: '#6366F1', label: 'Good' },
    okay: { icon: SentimentNeutralIcon, color: '#FFB020', label: 'Okay' },
    tired: { icon: SentimentDissatisfiedIcon, color: '#F97316', label: 'Tired' },
    bad: { icon: SentimentVeryDissatisfiedIcon, color: '#EF4444', label: 'Bad' }
};

// Meal configuration
const mealConfig = [
    { title: 'Breakfast', key: 'breakfast', icon: WbSunnyIcon, color: '#FFB020' },
    { title: 'Lunch', key: 'lunch', icon: WbTwilightIcon, color: '#10B981' },
    { title: 'Dinner', key: 'dinner', icon: NightsStayIcon, color: '#6366F1' },
    { title: 'Snack', key: 'snack', icon: CookieIcon, color: '#EC4899' }
];

// Trackable Meal Card component
const TrackableMealCard = ({ title, content, mealKey, icon: Icon, color, completed, onToggle, saving }) => {
    const theme = useTheme();
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <Card sx={{
                ...glassCard(theme),
                mb: 2,
                overflow: 'hidden',
                borderLeft: `4px solid ${completed ? accentColors.emerald.main : color}`,
                opacity: completed ? 0.85 : 1,
                transition: 'all 0.3s ease'
            }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <Checkbox
                            checked={completed}
                            onChange={() => onToggle(mealKey)}
                            disabled={saving}
                            icon={<CheckCircleOutlineIcon />}
                            checkedIcon={<CheckCircleIcon />}
                            sx={{
                                p: 0,
                                color: color,
                                '&.Mui-checked': {
                                    color: accentColors.emerald.main
                                }
                            }}
                        />
                        <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <Box sx={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: alpha(completed ? accentColors.emerald.main : color, 0.15)
                                }}>
                                    <Icon sx={{ fontSize: 16, color: completed ? accentColors.emerald.main : color }} />
                                </Box>
                                <Typography 
                                    variant="subtitle2" 
                                    fontWeight={600}
                                    sx={{ 
                                        textDecoration: completed ? 'line-through' : 'none',
                                        color: completed ? 'text.secondary' : 'text.primary'
                                    }}
                                >
                                    {title}
                                </Typography>
                                {completed && (
                                    <Chip 
                                        label="Done" 
                                        size="small" 
                                        sx={{ 
                                            height: 20, 
                                            fontSize: '0.65rem',
                                            backgroundColor: alpha(accentColors.emerald.main, 0.15),
                                            color: accentColors.emerald.main
                                        }} 
                                    />
                                )}
                            </Box>
                            <Typography 
                                variant="body2" 
                                color="text.secondary" 
                                sx={{ 
                                    whiteSpace: 'pre-wrap',
                                    pl: 4.5
                                }}
                            >
                                {content || 'Not specified'}
                            </Typography>
                        </Box>
                    </Box>
                </CardContent>
            </Card>
        </motion.div>
    );
};

// Active Plan Card with Progress Tracking
const ActivePlanCardWithProgress = ({ plan, todayProgress, onProgressUpdate, saving }) => {
    const theme = useTheme();
    const navigate = useNavigate();
    const todayDay = getTodayDayName();
    const todayMeals = plan.planType === 'general'
        ? (plan.generalPlan || {})
        : (plan.weeklyPlan?.[todayDay] || {});
    
    const [localProgress, setLocalProgress] = useState({
        mealsCompleted: todayProgress?.mealsCompleted || { breakfast: false, lunch: false, dinner: false, snack: false },
        exerciseCompleted: todayProgress?.exerciseCompleted || false,
        waterIntake: todayProgress?.waterIntake || 0,
        mood: todayProgress?.mood || 'okay',
        weight: todayProgress?.weight || '',
        notes: todayProgress?.notes || ''
    });
    const [showNotes, setShowNotes] = useState(false);

    // Update local state when todayProgress changes
    useEffect(() => {
        if (todayProgress) {
            setLocalProgress({
                mealsCompleted: todayProgress.mealsCompleted || { breakfast: false, lunch: false, dinner: false, snack: false },
                exerciseCompleted: todayProgress.exerciseCompleted || false,
                waterIntake: todayProgress.waterIntake || 0,
                mood: todayProgress.mood || 'okay',
                weight: todayProgress.weight || '',
                notes: todayProgress.notes || ''
            });
        }
    }, [todayProgress]);

    const handleMealToggle = (mealKey) => {
        const newMealsCompleted = {
            ...localProgress.mealsCompleted,
            [mealKey]: !localProgress.mealsCompleted[mealKey]
        };
        const newProgress = { ...localProgress, mealsCompleted: newMealsCompleted };
        setLocalProgress(newProgress);
        onProgressUpdate(plan._id, newProgress);
    };

    const handleExerciseToggle = () => {
        const newProgress = { ...localProgress, exerciseCompleted: !localProgress.exerciseCompleted };
        setLocalProgress(newProgress);
        onProgressUpdate(plan._id, newProgress);
    };

    const handleWaterChange = (e, value) => {
        const newProgress = { ...localProgress, waterIntake: value };
        setLocalProgress(newProgress);
    };

    const handleWaterCommit = (e, value) => {
        onProgressUpdate(plan._id, { ...localProgress, waterIntake: value });
    };

    const handleMoodChange = (mood) => {
        const newProgress = { ...localProgress, mood };
        setLocalProgress(newProgress);
        onProgressUpdate(plan._id, newProgress);
    };

    const handleWeightChange = (e) => {
        const rawValue = e.target.value;
        if (rawValue === '') {
            setLocalProgress({ ...localProgress, weight: '' });
            return;
        }

        const parsed = Number(rawValue);
        if (Number.isNaN(parsed)) return;

        setLocalProgress({ ...localProgress, weight: String(Math.max(0, parsed)) });
    };

    const preventInvalidNumberKeys = (e) => {
        if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
            e.preventDefault();
        }
    };

    const handleNotesChange = (e) => {
        setLocalProgress({ ...localProgress, notes: e.target.value });
    };

    const handleSaveNotes = () => {
        onProgressUpdate(plan._id, localProgress);
        setShowNotes(false);
    };

    // Calculate completion percentage for today
    const mealsCompleted = Object.values(localProgress.mealsCompleted).filter(Boolean).length;
    const totalTasks = 4 + (plan.recommendations?.exercise?.length > 0 ? 1 : 0); // 4 meals + exercise if any
    const tasksCompleted = mealsCompleted + (localProgress.exerciseCompleted ? 1 : 0);
    const todayCompletion = Math.round((tasksCompleted / totalTasks) * 100);

    const handleViewPlan = () => {
        navigate(`/view-plan/${plan.form?._id || plan.form}`, { 
            state: { form: { _id: plan.form?._id || plan.form } } 
        });
    };

    return (
        <motion.div variants={itemVariants}>
            <Card 
                sx={{
                    ...glassCard(theme),
                    mb: 3,
                    overflow: 'hidden',
                    border: `2px solid ${alpha(accentColors.emerald.main, 0.3)}`,
                    boxShadow: `0 0 30px ${alpha(accentColors.emerald.main, 0.15)}`
                }}
            >
                {/* Header */}
                <Box 
                    sx={{
                        p: 2,
                        background: `linear-gradient(135deg, ${alpha(accentColors.emerald.main, 0.1)} 0%, ${alpha(accentColors.emerald.dark, 0.05)} 100%)`,
                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        cursor: 'pointer'
                    }}
                    onClick={handleViewPlan}
                >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <PlayCircleFilledIcon sx={{ color: accentColors.emerald.main, fontSize: 20 }} />
                                <Typography variant="h6" fontWeight={700}>
                                    {plan.title || 'Nutrition Plan'}
                                </Typography>
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {plan.currentStreak > 0 && (
                                <Chip
                                    icon={<WhatshotIcon sx={{ fontSize: 16 }} />}
                                    label={`${plan.currentStreak} day streak`}
                                    size="small"
                                    sx={{
                                        backgroundColor: alpha('#F97316', 0.15),
                                        color: '#F97316',
                                        fontWeight: 600,
                                        '& .MuiChip-icon': { color: '#F97316' }
                                    }}
                                />
                            )}
                            <ArrowForwardIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                        </Box>
                    </Box>

                    {/* Today's progress bar */}
                    <Box sx={{ mt: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                                Today's Progress
                            </Typography>
                            <Typography variant="caption" sx={{ color: accentColors.emerald.main, fontWeight: 600 }}>
                                {todayCompletion}%
                            </Typography>
                        </Box>
                        <LinearProgress 
                            variant="determinate" 
                            value={todayCompletion}
                            sx={{
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: alpha(accentColors.emerald.main, 0.2),
                                '& .MuiLinearProgress-bar': {
                                    borderRadius: 4,
                                    background: todayCompletion === 100 
                                        ? `linear-gradient(90deg, ${accentColors.emerald.main}, #FFD700)`
                                        : `linear-gradient(90deg, ${accentColors.emerald.main}, ${accentColors.emerald.light})`
                                }
                            }}
                        />
                    </Box>
                </Box>

                {/* Today's Meals - Trackable */}
                <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <RestaurantIcon sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
                        <Typography variant="subtitle1" fontWeight={600}>
                            Today's Meals ({getDayLabel(todayDay)})
                        </Typography>
                        <Chip 
                            label={`${mealsCompleted}/4`} 
                            size="small"
                            sx={{ 
                                ml: 'auto',
                                backgroundColor: mealsCompleted === 4 
                                    ? alpha(accentColors.emerald.main, 0.15) 
                                    : alpha(theme.palette.primary.main, 0.1),
                                color: mealsCompleted === 4 
                                    ? accentColors.emerald.main 
                                    : theme.palette.primary.main,
                                fontWeight: 600
                            }}
                        />
                    </Box>
                    
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                        {mealConfig.map((meal) => (
                            <TrackableMealCard 
                                key={meal.key}
                                title={meal.title}
                                content={todayMeals[meal.key]}
                                mealKey={meal.key}
                                icon={meal.icon}
                                color={meal.color}
                                completed={localProgress.mealsCompleted[meal.key]}
                                onToggle={handleMealToggle}
                                saving={saving}
                            />
                        ))}
                    </Box>
                </CardContent>

                {/* Exercise & Water Tracking */}
                <Box sx={{ px: 2, pb: 2 }}>
                    <Divider sx={{ mb: 2 }} />
                    
                    <Grid container spacing={2}>
                        {/* Exercise */}
                        {plan.recommendations?.exercise?.length > 0 && (
                            <Grid item xs={12} sm={6}>
                                <Box 
                                    sx={{ 
                                        p: 1.5, 
                                        borderRadius: 2,
                                        backgroundColor: alpha(localProgress.exerciseCompleted ? accentColors.emerald.main : '#6366F1', 0.1),
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1.5,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                    onClick={handleExerciseToggle}
                                >
                                    <Checkbox
                                        checked={localProgress.exerciseCompleted}
                                        disabled={saving}
                                        icon={<FitnessCenterIcon />}
                                        checkedIcon={<CheckCircleIcon />}
                                        sx={{
                                            p: 0,
                                            color: '#6366F1',
                                            '&.Mui-checked': { color: accentColors.emerald.main }
                                        }}
                                    />
                                    <Box>
                                        <Typography variant="body2" fontWeight={600}>
                                            Exercise
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {localProgress.exerciseCompleted ? 'Completed!' : 'Tap to mark done'}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Grid>
                        )}

                        {/* Water Intake */}
                        <Grid item xs={12} sm={plan.recommendations?.exercise?.length > 0 ? 6 : 12}>
                            <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: alpha('#3B82F6', 0.1) }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <LocalDrinkIcon sx={{ color: '#3B82F6', fontSize: 20 }} />
                                    <Typography variant="body2" fontWeight={600}>
                                        Water Intake
                                    </Typography>
                                    <Chip 
                                        label={`${localProgress.waterIntake} glasses`} 
                                        size="small"
                                        sx={{ 
                                            ml: 'auto',
                                            backgroundColor: alpha('#3B82F6', 0.2),
                                            color: '#3B82F6',
                                            fontWeight: 600
                                        }}
                                    />
                                </Box>
                                <Slider
                                    value={localProgress.waterIntake}
                                    onChange={handleWaterChange}
                                    onChangeCommitted={handleWaterCommit}
                                    min={0}
                                    max={12}
                                    step={1}
                                    marks={[
                                        { value: 0, label: '0' },
                                        { value: 8, label: '8' },
                                        { value: 12, label: '12' }
                                    ]}
                                    disabled={saving}
                                    sx={{
                                        color: '#3B82F6',
                                        '& .MuiSlider-thumb': {
                                            backgroundColor: '#3B82F6'
                                        }
                                    }}
                                />
                            </Box>
                        </Grid>
                    </Grid>

                    {/* Mood Tracker */}
                    <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, backgroundColor: alpha(theme.palette.background.paper, 0.5) }}>
                        <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                            How are you feeling today?
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
                            {Object.entries(moodConfig).map(([mood, config]) => {
                                const MoodIcon = config.icon;
                                const isSelected = localProgress.mood === mood;
                                return (
                                    <Tooltip title={config.label} key={mood}>
                                        <IconButton
                                            onClick={() => handleMoodChange(mood)}
                                            disabled={saving}
                                            sx={{
                                                backgroundColor: isSelected ? alpha(config.color, 0.2) : 'transparent',
                                                color: isSelected ? config.color : 'text.secondary',
                                                transition: 'all 0.2s',
                                                '&:hover': {
                                                    backgroundColor: alpha(config.color, 0.15)
                                                }
                                            }}
                                        >
                                            <MoodIcon />
                                        </IconButton>
                                    </Tooltip>
                                );
                            })}
                        </Box>
                    </Box>

                    {/* Weight & Notes */}
                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<NoteAddIcon />}
                            onClick={() => setShowNotes(true)}
                            sx={{ flex: 1, borderRadius: 2 }}
                        >
                            {localProgress.notes ? 'Edit Notes' : 'Add Notes'}
                        </Button>
                    </Box>
                </Box>

                {/* Notes Dialog */}
                <Dialog 
                    open={showNotes} 
                    onClose={() => setShowNotes(false)}
                    fullWidth
                    maxWidth="sm"
                    PaperProps={{ sx: glassDialog(theme) }}
                >
                    <DialogTitle>Daily Notes & Weight</DialogTitle>
                    <DialogContent>
                        <TextField
                            label="Today's Weight (kg)"
                            type="number"
                            value={localProgress.weight}
                            onChange={handleWeightChange}
                            onKeyDown={preventInvalidNumberKeys}
                            fullWidth
                            margin="normal"
                            inputProps={{ min: 0, step: 'any' }}
                            InputProps={{
                                startAdornment: <ScaleIcon sx={{ mr: 1, color: 'text.secondary' }} />
                            }}
                        />
                        <TextField
                            label="Notes"
                            multiline
                            rows={4}
                            value={localProgress.notes}
                            onChange={handleNotesChange}
                            fullWidth
                            margin="normal"
                            placeholder="How did today go? Any observations about your meals, energy levels, etc..."
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setShowNotes(false)}>Cancel</Button>
                        <Button 
                            onClick={handleSaveNotes} 
                            variant="contained"
                            startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
                            disabled={saving}
                        >
                            Save
                        </Button>
                    </DialogActions>
                </Dialog>
            </Card>
        </motion.div>
    );
};

export default function ActivePlansPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    const [todayProgressMap, setTodayProgressMap] = useState({});
    const [saving, setSaving] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // Fetch active plans with caching - stale-while-revalidate
    const fetchActivePlansData = useCallback(async () => {
        const response = await fetch(`${apiBaseUrl}/api/plans/my`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch plans');
        }

        const data = await response.json();
        const active = (data.plans || []).filter(plan => plan.status === 'active');

        // Fetch today's progress for each active plan
        const progressPromises = active.map(plan => 
            fetch(`${apiBaseUrl}/api/plans/${plan._id}/progress/today`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            }).then(res => res.ok ? res.json() : null).catch(() => null)
        );

        const progressResults = await Promise.all(progressPromises);
        const progressMap = {};
        active.forEach((plan, index) => {
            if (progressResults[index]) {
                progressMap[plan._id] = progressResults[index].progress;
            }
        });

        return { activePlans: active, progressMap };
    }, []);

    const {
        data: plansData,
        isLoading: loading,
        isRefreshing,
        error,
        setData: setPlansData,
    } = useCachedData(
        'active_plans_with_progress',
        fetchActivePlansData,
        {
            cacheTTL: 5 * 60 * 1000, // 5 minutes
            initialData: { activePlans: [], progressMap: {} },
        }
    );

    const activePlans = plansData?.activePlans || [];

    // Sync progressMap from cache to local state
    useEffect(() => {
        if (plansData?.progressMap) {
            setTodayProgressMap(plansData.progressMap);
        }
    }, [plansData?.progressMap]);

    const handleProgressUpdate = useCallback(async (planId, progressData) => {
        try {
            setSaving(true);
            const response = await fetch(`${apiBaseUrl}/api/plans/${planId}/progress`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    date: new Date().toISOString(),
                    ...progressData
                })
            });

            if (!response.ok) {
                throw new Error('Failed to save progress');
            }

            const data = await response.json();
            
            // Update local state with new progress
            setTodayProgressMap(prev => ({
                ...prev,
                [planId]: data.progress
            }));

            // Update plan streaks in cached data
            setPlansData(prev => ({
                ...prev,
                activePlans: prev.activePlans.map(plan => 
                    plan._id === planId 
                        ? { ...plan, currentStreak: data.currentStreak, longestStreak: data.longestStreak }
                        : plan
                ),
                progressMap: {
                    ...prev.progressMap,
                    [planId]: data.progress
                }
            }));

            setSnackbar({ open: true, message: 'Progress saved!', severity: 'success' });
        } catch (err) {
            console.error('Error saving progress:', err);
            setSnackbar({ open: true, message: 'Failed to save progress', severity: 'error' });
        } finally {
            setSaving(false);
        }
    }, [setPlansData]);

    return (
        <PageFade>
            <Box
                sx={{
                    width: '100%',
                    maxWidth: '800px',
                    display: 'flex',
                    flexDirection: 'column',
                    pb: spacing.md,
                    pt: { xs: `calc(${theme.spacing(spacing.lg)} + env(safe-area-inset-top))`, md: spacing.md },
                    px: spacing.sm,
                    mx: 'auto',
                }}
            >
                {/* Header */}
                <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <EmojiEventsIcon sx={{ color: accentColors.emerald.main, fontSize: 28 }} />
                            <Typography 
                                variant="h4" 
                                sx={pageTitle(theme, { align: 'left' })}
                            >
                                Active Plans
                            </Typography>
                        </Box>
                        {isRefreshing && (
                            <CircularProgress size={20} sx={{ color: accentColors.emerald.main }} />
                        )}
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                        Track your daily meals and progress
                    </Typography>
                </Box>

                {loading ? (
                    <>
                        {[1, 2].map((item) => (
                            <Card key={item} sx={{ ...glassCard(theme), mb: 3 }}>
                                <CardContent>
                                    <Skeleton variant="text" width="60%" height={32} />
                                    <Skeleton variant="text" width="40%" height={24} sx={{ mb: 2 }} />
                                    <Skeleton variant="rectangular" height={8} sx={{ borderRadius: 4, mb: 2 }} />
                                    <Grid container spacing={2}>
                                        {[1, 2, 3, 4].map((i) => (
                                            <Grid item xs={6} key={i}>
                                                <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 2 }} />
                                            </Grid>
                                        ))}
                                    </Grid>
                                </CardContent>
                            </Card>
                        ))}
                    </>
                ) : error ? (
                    <Alert severity="error" sx={{ mb: 2 }}>{error?.message || 'Failed to load active plans'}</Alert>
                ) : activePlans.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Paper sx={{
                            ...glassCard(theme),
                            p: 4,
                            textAlign: 'center'
                        }}>
                            <FitnessCenterIcon sx={{ fontSize: 64, color: theme.palette.text.disabled, mb: 2 }} />
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                No Active Plans
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                You don't have any active nutrition plans at the moment.
                                Submit a new form to get a personalized plan!
                            </Typography>
                            <Box
                                component="button"
                                onClick={() => navigate('/new-form')}
                                sx={{
                                    ...glassButton(theme, 'primary'),
                                    px: 3,
                                    py: 1,
                                    border: 'none',
                                    borderRadius: borderRadius.md,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    fontSize: '0.875rem',
                                    fontWeight: 600
                                }}
                            >
                                <TipsAndUpdatesIcon sx={{ fontSize: 18 }} />
                                Submit New Form
                            </Box>
                        </Paper>
                    </motion.div>
                ) : (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {activePlans.map((plan) => (
                            <ActivePlanCardWithProgress 
                                key={plan._id}
                                plan={plan}
                                todayProgress={todayProgressMap[plan._id]}
                                onProgressUpdate={handleProgressUpdate}
                                saving={saving}
                            />
                        ))}
                    </motion.div>
                )}
            </Box>

            {/* Snackbar for feedback */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert 
                    onClose={() => setSnackbar({ ...snackbar, open: false })} 
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </PageFade>
    );
}
