import React, { useState, useEffect } from 'react';
import PageFade from '../components/PageFade.jsx';
import { 
    TextField, 
    Button, 
    MenuItem, 
    Typography, 
    Box, 
    IconButton, 
    LinearProgress,
    Stepper,
    Step,
    StepLabel,
    Collapse,
    Fade,
    Chip,
    Paper,
    useMediaQuery,
    keyframes
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import FlagIcon from '@mui/icons-material/Flag';
import MonitorWeightIcon from '@mui/icons-material/MonitorWeight';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import ChecklistIcon from '@mui/icons-material/Checklist';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import LoadingBackdrop from '../components/LoadingBackdrop.jsx';
import FormCheckBox from '../components/FormCheckBox.jsx';
import FormGroup from '@mui/material/FormGroup';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { spacing, borderRadius, transitions, shadows } from '../styles';
import { glassCard, glassInput } from '../styles/glassmorphism';
import { pageVariants, itemVariants } from '../styles/animations';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const MAX_GOALS = 5;
const MAX_GOAL_LENGTH = 200;

// Keyframes for animations
const shimmer = keyframes`
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
`;

const float = keyframes`
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-5px); }
`;

// Step configuration
const steps = [
    { label: 'Medical History', icon: MedicalServicesIcon },
    { label: 'Your Goals', icon: FlagIcon },
    { label: 'Weight Data', icon: MonitorWeightIcon },
    { label: 'Meal Habits', icon: RestaurantIcon },
    { label: 'Lifestyle', icon: ChecklistIcon },
];

export default function NewFormPage () {
    const theme = useTheme();
    const navigate = useNavigate();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [activeStep, setActiveStep] = useState(0);
    const [formData, setFormData] = useState({
        currentWeight: '',
        allergies: [''],
        currentSmoker: false,
        healthConditions: [''],
        medications: [''],
        goals: [''],
        minWeight: '',
        maxWeight: '',
        desiredWeight: '',
        obesityHistory: false,
        hydrated: false,
        breakfast: '',
        nightEater: false,
        coffee: false,
        sugar: '',
        snackTime: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const [backendError, setBackendError] = useState('');
    const [scrolledDown, setScrolledDown] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolledDown(window.scrollY > 0);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Calculate form progress
    const calculateProgress = () => {
        let filled = 0;
        let total = 7; // Required fields count
        
        if (formData.currentWeight) filled++;
        if (formData.minWeight) filled++;
        if (formData.maxWeight) filled++;
        if (formData.desiredWeight) filled++;
        if (formData.breakfast) filled++;
        if (formData.snackTime) filled++;
        if (formData.sugar !== '') filled++;
        
        return (filled / total) * 100;
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleListChange = (field, index, value) => {
        const updatedList = [...formData[field]];
        updatedList[index] = value;
        setFormData((prevData) => ({ ...prevData, [field]: updatedList }));
    };

    const addListItem = (field) => {
        setFormData((prevData) => ({
            ...prevData,
            [field]: [...prevData[field], '']
        }));
    };

    const isValidTextEntry = (text) => /^[a-zA-Z0-9\s]+$/.test(text);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.currentWeight) {
            newErrors.currentWeight = 'Please enter your current weight.';
        }

        if (!formData.minWeight) {
            newErrors.minWeight = 'Please enter your minimum weight.';
        }

        if (!formData.maxWeight) {
            newErrors.maxWeight = 'Please enter your maximum weight.';
        }

        if (!formData.desiredWeight) {
            newErrors.desiredWeight = 'Please enter your desired weight.';
        }

        if (!['Always', 'Sometimes', 'Never'].includes(formData.breakfast)) {
            newErrors.breakfast = 'Breakfast field must be Always, Sometimes, or Never.';
        }

        if (!['Before Lunch', 'After Lunch'].includes(formData.snackTime)) {
            newErrors.snackTime = 'Snack time must be Before Lunch or After Lunch.';
        }

        if (formData.sugar === '' || formData.sugar < 0) {
            newErrors.sugar = 'Please enter a valid sugar amount.';
        }

        ['allergies', 'healthConditions', 'medications', 'goals'].forEach(field => {
            formData[field].forEach((item, index) => {
                if (item.trim() !== '' && !isValidTextEntry(item)) {
                    newErrors[`${field}_${index}`] = 'Only letters, numbers, and spaces are allowed.';
                }
            });
        });

        setFormErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setBackendError('');
        const token = localStorage.getItem('token');

        if (!token) {
            setBackendError('You must be logged in to submit a form.');
            return;
        }

        if (!validateForm()) return;

        const sanitizedData = { ...formData };
        ['allergies', 'healthConditions', 'medications', 'goals'].forEach(field => {
            sanitizedData[field] = sanitizedData[field].filter(item => item.trim() !== '');
        });

        try {
            setSubmitting(true);

            const response = await fetch(`${apiBaseUrl}/api/forms`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(sanitizedData),
            });

            const data = await response.json();

            if (!response.ok) {
                if (data && data.error) {
                    setBackendError(data.error);
                } else {
                    setBackendError(`Failed to submit form: ${response.status}`);
                }
                return;
            }

        } catch (error) {
            console.error('Network error:', error);
            setBackendError('Network error: ' + error.message);
        } finally {
            setSubmitting(false);
            navigate('/form-success');
        }
    }

    // Glassmorphism card style
    const glassCardStyle = {
        background: theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.05)'
            : 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: 4,
        border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.9)'}`,
        boxShadow: theme.palette.mode === 'dark'
            ? '0 8px 32px rgba(0, 0, 0, 0.3)'
            : '0 8px 32px rgba(0, 0, 0, 0.08)',
        p: { xs: 2.5, sm: 3 },
        transition: 'all 0.3s ease',
        '&:hover': {
            boxShadow: theme.palette.mode === 'dark'
                ? '0 12px 40px rgba(0, 0, 0, 0.4)'
                : '0 12px 40px rgba(0, 0, 0, 0.12)',
            transform: 'translateY(-2px)',
        }
    };

    // Input field style
    const inputStyle = {
        '& .MuiFilledInput-root': {
            borderRadius: 2,
            backgroundColor: theme.palette.mode === 'dark' 
                ? 'rgba(255,255,255,0.05)'
                : 'rgba(0,0,0,0.02)',
            transition: 'all 0.3s ease',
            '&:hover': {
                backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(0,0,0,0.04)',
            },
            '&.Mui-focused': {
                backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255,255,255,0.1)'
                    : 'rgba(0,0,0,0.02)',
            }
        },
        '& .MuiInputLabel-root': {
            fontWeight: 500,
        },
        mb: 2,
    };

    return (
        <PageFade>
            {/* Background with gradient */}
            <Box
                sx={{
                    minHeight: '100vh',
                    background: theme.palette.mode === 'dark'
                        ? `linear-gradient(135deg, ${theme.palette.background.default} 0%, #1a1a2e 100%)`
                        : `linear-gradient(135deg, #f5f7fa 0%, #e8f5e9 50%, #f5f7fa 100%)`,
                    position: 'relative',
                    pb: 4,
                }}
            >
                {/* Decorative background elements */}
                <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
                    <Box sx={{
                        position: 'absolute',
                        width: 400,
                        height: 400,
                        borderRadius: '50%',
                        background: `radial-gradient(circle, ${theme.palette.primary.main}15, transparent)`,
                        top: '-10%',
                        right: '-10%',
                    }} />
                    <Box sx={{
                        position: 'absolute',
                        width: 300,
                        height: 300,
                        borderRadius: '50%',
                        background: `radial-gradient(circle, ${theme.palette.secondary.main}10, transparent)`,
                        bottom: '10%',
                        left: '-5%',
                    }} />
                </Box>

                {/* Sticky Header */}
                <Box
                    sx={{
                        position: 'sticky',
                        top: 0,
                        zIndex: 100,
                        background: theme.palette.mode === 'dark'
                            ? 'rgba(26, 26, 46, 0.9)'
                            : 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        px: 2,
                        py: 1.5,
                        borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                        transition: 'all 0.4s ease',
                        ...(scrolledDown && {
                            boxShadow: theme.palette.mode === 'dark'
                                ? '0 4px 30px rgba(0,0,0,0.3)'
                                : '0 4px 30px rgba(0,0,0,0.08)',
                        }),
                    }}
                >
                    <Box sx={{ maxWidth: 800, mx: 'auto', position: 'relative' }}>
                        <IconButton 
                            onClick={() => navigate(-1)} 
                            sx={{ 
                                position: 'absolute', 
                                top: '50%', 
                                left: 0, 
                                transform: 'translateY(-50%)',
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
                            <ArrowBackIcon sx={{ fontSize: { xs: 24, sm: 28 }, color: theme.palette.text.primary }} />
                        </IconButton>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography 
                                variant="h5" 
                                sx={{ 
                                    fontWeight: 700,
                                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                    backgroundClip: 'text',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                }}
                            >
                                Nutrition Assessment
                            </Typography>
                            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                Complete your profile for a personalized plan
                            </Typography>
                        </Box>
                    </Box>
                    
                    {/* Progress Bar */}
                    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
                                Form Progress
                            </Typography>
                            <Typography variant="caption" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
                                {Math.round(calculateProgress())}%
                            </Typography>
                        </Box>
                        <LinearProgress 
                            variant="determinate" 
                            value={calculateProgress()} 
                            sx={{
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: theme.palette.mode === 'dark' 
                                    ? 'rgba(255,255,255,0.1)' 
                                    : 'rgba(0,0,0,0.08)',
                                '& .MuiLinearProgress-bar': {
                                    borderRadius: 3,
                                    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                }
                            }}
                        />
                    </Box>
                </Box>

                <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 800, mx: 'auto', position: 'relative', zIndex: 1 }}>
                    {/* Introduction */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Paper
                            sx={{
                                ...glassCardStyle,
                                mb: 3,
                                textAlign: 'center',
                                background: theme.palette.mode === 'dark'
                                    ? `linear-gradient(135deg, rgba(145, 235, 78, 0.1), rgba(110, 20, 177, 0.1))`
                                    : `linear-gradient(135deg, rgba(145, 235, 78, 0.15), rgba(110, 20, 177, 0.08))`,
                            }}
                        >
                            <Typography 
                                variant="body1" 
                                sx={{ 
                                    color: theme.palette.text.secondary,
                                    lineHeight: 1.7,
                                }}
                            >
                                ✨ Please fill out the form below with accurate information. 
                                This will help us create your <strong>personalized nutrition plan</strong>.
                            </Typography>
                        </Paper>
                    </motion.div>

                    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

                            {/* Section 1 - Medical History */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                            >
                                <Paper sx={glassCardStyle}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
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
                                            <MedicalServicesIcon sx={{ color: 'white', fontSize: 22 }} />
                                        </Box>
                                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                            Medical History
                                        </Typography>
                                    </Box>
                                    
                                    {['allergies', 'healthConditions', 'medications'].map((field) => (
                                        <Box key={field} sx={{ mb: 3 }}>
                                            <Typography variant="subtitle2" sx={{ mb: 1.5, color: theme.palette.text.secondary, fontWeight: 500 }}>
                                                {field === 'allergies' ? '🍽️ Allergies' : field === 'healthConditions' ? '❤️ Health Conditions' : '💊 Medications'}
                                            </Typography>
                                            {formData[field].map((item, index) => (
                                                <TextField
                                                    key={index}
                                                    fullWidth
                                                    variant="filled"
                                                    label={`${field === 'allergies' ? 'Allergy' : field === 'healthConditions' ? 'Health Condition' : 'Medication'} ${index + 1} (Leave blank if none)`}
                                                    value={item}
                                                    onChange={(e) => handleListChange(field, index, e.target.value)}
                                                    error={!!formErrors[`${field}_${index}`]}
                                                    helperText={formErrors[`${field}_${index}`] || ''}
                                                    sx={inputStyle}
                                                />
                                            ))}
                                            <Button 
                                                onClick={() => addListItem(field)} 
                                                variant="outlined" 
                                                fullWidth
                                                startIcon={<AddCircleOutlineIcon />}
                                                sx={{
                                                    borderStyle: 'dashed',
                                                    borderWidth: 2,
                                                    borderRadius: 2,
                                                    py: 1.5,
                                                    textTransform: 'none',
                                                    fontWeight: 500,
                                                    transition: 'all 0.3s ease',
                                                    '&:hover': {
                                                        borderStyle: 'dashed',
                                                        borderWidth: 2,
                                                        transform: 'translateY(-2px)',
                                                    }
                                                }}
                                            >
                                                Add {field === 'allergies' ? 'Allergy' : field === 'healthConditions' ? 'Health Condition' : 'Medication'}
                                            </Button>
                                        </Box>
                                    ))}
                                </Paper>
                            </motion.div>

                            {/* Section 2 - Goals */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                            >
                                <Paper sx={glassCardStyle}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
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
                                            <FlagIcon sx={{ color: 'white', fontSize: 22 }} />
                                        </Box>
                                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                            Your Goals
                                        </Typography>
                                    </Box>
                                    
                                    <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary, lineHeight: 1.6 }}>
                                        🎯 What are your health and fitness goals? (e.g., lose weight, build muscle, improve energy)
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
                                        <Chip 
                                            label={`${formData.goals.filter(g => g.trim()).length}/${MAX_GOALS} goals`} 
                                            size="small"
                                            color="primary"
                                            variant="outlined"
                                        />
                                        <Chip 
                                            label={`Max ${MAX_GOAL_LENGTH} chars each`} 
                                            size="small"
                                            variant="outlined"
                                        />
                                    </Box>
                                    
                                    {formData.goals.map((goal, index) => (
                                        <TextField
                                            key={index}
                                            fullWidth
                                            variant="filled"
                                            label={`Goal ${index + 1}`}
                                            placeholder="Enter your goal here..."
                                            value={goal}
                                            onChange={(e) => handleListChange('goals', index, e.target.value)}
                                            error={!!formErrors[`goals_${index}`]}
                                            helperText={formErrors[`goals_${index}`] || `${goal.length}/${MAX_GOAL_LENGTH} characters`}
                                            inputProps={{ maxLength: MAX_GOAL_LENGTH }}
                                            sx={inputStyle}
                                            multiline
                                            rows={2}
                                        />
                                    ))}
                                    {formData.goals[formData.goals.length - 1]?.trim() !== '' && formData.goals.length < MAX_GOALS && (
                                        <Button 
                                            onClick={() => addListItem('goals')} 
                                            variant="outlined" 
                                            fullWidth
                                            startIcon={<AddCircleOutlineIcon />}
                                            sx={{
                                                borderStyle: 'dashed',
                                                borderWidth: 2,
                                                borderRadius: 2,
                                                py: 1.5,
                                                textTransform: 'none',
                                                fontWeight: 500,
                                                mt: 1,
                                            }}
                                        >
                                            Add Goal ({formData.goals.length}/{MAX_GOALS})
                                        </Button>
                                    )}
                                </Paper>
                            </motion.div>

                            {/* Section 3 - Weight Data */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.3 }}
                            >
                                <Paper sx={glassCardStyle}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                                        <Box sx={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: 2,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: `linear-gradient(135deg, #4ECDC4, #44A08D)`,
                                            boxShadow: `0 4px 12px rgba(78, 205, 196, 0.4)`,
                                        }}>
                                            <MonitorWeightIcon sx={{ color: 'white', fontSize: 22 }} />
                                        </Box>
                                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                            Weight Data
                                        </Typography>
                                    </Box>
                                    
                                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                                        <TextField 
                                            fullWidth 
                                            type="number" 
                                            name="currentWeight" 
                                            label="⚖️ Current Weight (kg)" 
                                            value={formData.currentWeight} 
                                            onChange={handleChange} 
                                            error={!!formErrors.currentWeight} 
                                            helperText={formErrors.currentWeight} 
                                            variant="filled" 
                                            sx={inputStyle} 
                                        />
                                        <TextField 
                                            fullWidth 
                                            type="number" 
                                            name="desiredWeight" 
                                            label="🎯 Desired Weight (kg)" 
                                            value={formData.desiredWeight} 
                                            onChange={handleChange} 
                                            error={!!formErrors.desiredWeight} 
                                            helperText={formErrors.desiredWeight} 
                                            variant="filled" 
                                            sx={inputStyle} 
                                        />
                                        <TextField 
                                            fullWidth 
                                            type="number" 
                                            name="minWeight" 
                                            label="📉 Minimum Weight (kg)" 
                                            value={formData.minWeight} 
                                            onChange={handleChange} 
                                            error={!!formErrors.minWeight} 
                                            helperText={formErrors.minWeight} 
                                            variant="filled" 
                                            sx={inputStyle} 
                                        />
                                        <TextField 
                                            fullWidth 
                                            type="number" 
                                            name="maxWeight" 
                                            label="📈 Maximum Weight (kg)" 
                                            value={formData.maxWeight} 
                                            onChange={handleChange} 
                                            error={!!formErrors.maxWeight} 
                                            helperText={formErrors.maxWeight} 
                                            variant="filled" 
                                            sx={inputStyle} 
                                        />
                                    </Box>
                                </Paper>
                            </motion.div>

                            {/* Section 4 - Meal Habits */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.4 }}
                            >
                                <Paper sx={glassCardStyle}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                                        <Box sx={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: 2,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: `linear-gradient(135deg, #FF6B6B, #EE5A5A)`,
                                            boxShadow: `0 4px 12px rgba(255, 107, 107, 0.4)`,
                                        }}>
                                            <RestaurantIcon sx={{ color: 'white', fontSize: 22 }} />
                                        </Box>
                                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                            Meal Habits
                                        </Typography>
                                    </Box>
                                    
                                    <TextField 
                                        select 
                                        fullWidth 
                                        name="breakfast" 
                                        label="🌅 Do you eat breakfast?" 
                                        value={formData.breakfast} 
                                        onChange={handleChange} 
                                        error={!!formErrors.breakfast} 
                                        helperText={formErrors.breakfast} 
                                        variant="filled" 
                                        sx={inputStyle}
                                    >
                                        <MenuItem value="Always">Always</MenuItem>
                                        <MenuItem value="Sometimes">Sometimes</MenuItem>
                                        <MenuItem value="Never">Never</MenuItem>
                                    </TextField>
                                    
                                    <TextField 
                                        select 
                                        fullWidth 
                                        name="snackTime" 
                                        label="🍪 When do you snack?" 
                                        value={formData.snackTime} 
                                        onChange={handleChange} 
                                        error={!!formErrors.snackTime} 
                                        helperText={formErrors.snackTime} 
                                        variant="filled" 
                                        sx={inputStyle}
                                    >
                                        <MenuItem value="Before Lunch">Before Lunch</MenuItem>
                                        <MenuItem value="After Lunch">After Lunch</MenuItem>
                                    </TextField>
                                    
                                    <TextField 
                                        fullWidth 
                                        type="number" 
                                        name="sugar" 
                                        label="🍬 Sugar intake (teaspoons per day)" 
                                        value={formData.sugar} 
                                        onChange={handleChange} 
                                        error={!!formErrors.sugar} 
                                        helperText={formErrors.sugar} 
                                        variant="filled" 
                                        sx={inputStyle} 
                                    />
                                </Paper>
                            </motion.div>

                            {/* Section 5 - Lifestyle */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.5 }}
                            >
                                <Paper sx={glassCardStyle}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                                        <Box sx={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: 2,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: `linear-gradient(135deg, #A78BFA, #8B5CF6)`,
                                            boxShadow: `0 4px 12px rgba(167, 139, 250, 0.4)`,
                                        }}>
                                            <ChecklistIcon sx={{ color: 'white', fontSize: 22 }} />
                                        </Box>
                                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                            Lifestyle Habits
                                        </Typography>
                                    </Box>
                                    
                                    <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                                        Select all that apply to you:
                                    </Typography>
                                    
                                    <FormGroup sx={{ 
                                        gap: 1,
                                        '& .MuiFormControlLabel-root': {
                                            p: 1.5,
                                            borderRadius: 2,
                                            backgroundColor: theme.palette.mode === 'dark' 
                                                ? 'rgba(255,255,255,0.02)'
                                                : 'rgba(0,0,0,0.02)',
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                backgroundColor: theme.palette.mode === 'dark' 
                                                    ? 'rgba(255,255,255,0.05)'
                                                    : 'rgba(0,0,0,0.04)',
                                            }
                                        }
                                    }}>
                                        <FormCheckBox checked={formData.currentSmoker} onChange={handleChange} name="currentSmoker" label="🚬 I currently smoke" />
                                        <FormCheckBox checked={formData.obesityHistory} onChange={handleChange} name="obesityHistory" label="📊 I have a history of obesity" />
                                        <FormCheckBox checked={formData.hydrated} onChange={handleChange} name="hydrated" label="💧 I stay well hydrated" />
                                        <FormCheckBox checked={formData.nightEater} onChange={handleChange} name="nightEater" label="🌙 I often eat at night" />
                                        <FormCheckBox checked={formData.coffee} onChange={handleChange} name="coffee" label="☕ I drink coffee daily" />
                                    </FormGroup>
                                    
                                    {backendError && (
                                        <Paper 
                                            sx={{ 
                                                mt: 3, 
                                                p: 2, 
                                                backgroundColor: 'error.light', 
                                                borderRadius: 2,
                                                border: `1px solid ${theme.palette.error.main}`,
                                            }}
                                        >
                                            <Typography color="error.dark" sx={{ fontWeight: 500 }}>
                                                ⚠️ {backendError}
                                            </Typography>
                                        </Paper>
                                    )}
                                </Paper>
                            </motion.div>

                            {/* Submit Button */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.6 }}
                            >
                                <Button 
                                    type="submit" 
                                    variant="contained" 
                                    size="large"
                                    fullWidth
                                    disabled={submitting}
                                    endIcon={<ArrowForwardIcon />}
                                    sx={{ 
                                        py: 2,
                                        borderRadius: 3,
                                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.darker || theme.palette.primary.dark})`,
                                        boxShadow: `0 10px 30px ${theme.palette.primary.main}40`,
                                        textTransform: 'none',
                                        fontSize: '1.1rem',
                                        fontWeight: 600,
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            transform: 'translateY(-2px)',
                                            boxShadow: `0 15px 40px ${theme.palette.primary.main}50`,
                                        },
                                        '&:disabled': {
                                            background: theme.palette.action.disabledBackground,
                                        }
                                    }}
                                >
                                    {submitting ? 'Submitting...' : 'Submit Assessment'}
                                </Button>
                            </motion.div>
                        </Box>
                    </form>
                </Box>
            </Box>
            <LoadingBackdrop open={submitting} />
        </PageFade>
    );
}
