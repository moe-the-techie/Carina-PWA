import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
    Box,
    Typography,
    Paper,
    TextField,
    Button,
    Grid,
    Card,
    CardContent,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tabs,
    Tab,
    Divider,
    useMediaQuery,
    Slide,
    Skeleton,
    Alert,
    Tooltip
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PageFade from '../components/PageFade';
import ImageViewerDialog from '../components/ImageViewerDialog';
import PageErrorIndicator from '../components/PageErrorIndicator';
import { MEAL_TYPES, getMealVisualByType } from '../utils/mealVisuals';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Days of the week starting from Saturday
const DAYS_OF_WEEK = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const DAY_LABELS = {
    saturday: 'Saturday',
    sunday: 'Sunday',
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday'
};

const FRUIT_OPTIONS = [
    'Apple',
    'Apricot',
    'Almonds',
    'Avocado',
    'Banana',
    'Berries',
    'Beetroot',
    'Orange',
    'Olives',
    'Mango',
    'Melon',
    'Grapes',
    'Grapefruit',
    'Guava',
    'Pineapple',
    'Fruit Salad',
    'Fresh Fig',
    'Figs',
    'Dates',
    'Dried Peach/Pineapple',
    'Cherry',
    'Carrot',
    'Corn',
    'Green Beans',
    'Kaka',
    'Strawberry',
    'Blueberry',
    'Watermelon',
    'Kiwi',
    'Nectarine',
    'Pear',
    'Peach',
    'Papaya',
    'Pium',
    'Pomegranate',
    'Raisin tsp.',
    'Tangerine',
    'Nuts'
];

const normalizeFruits = (fruits) => {
    if (!Array.isArray(fruits)) return [];

    return fruits
        .map((fruit) => ({
            name: (fruit?.name || '').trim(),
            quantity: Number(fruit?.quantity)
        }))
        .filter((fruit) => fruit.name && Number.isFinite(fruit.quantity) && fruit.quantity > 0);
};

// Meal types for each day
// Helper function to create empty weekly plan
const createEmptyWeeklyPlan = () => {
    const plan = {};
    DAYS_OF_WEEK.forEach(day => {
        plan[day] = {
            breakfast: '',
            lunch: '',
            dinner: '',
            snack: ''
        };
    });
    return plan;
};

// Helper function to create a general plan (same meals for all days)
const createEmptyGeneralPlan = () => ({
    breakfast: '',
    lunch: '',
    dinner: '',
    snack: ''
});

// Helper function to create empty recommendations
const createEmptyRecommendations = () => ({
    avoid: [],
    useCarefully: [],
    allowed: [],
    exercise: [],
    notes: ''
});

export default function AdminPlanBuilderPage() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const location = useLocation();
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState('');
    const [userForms, setUserForms] = useState([]);
    const [selectedForm, setSelectedForm] = useState('');
    const [currentFormData, setCurrentFormData] = useState(null);
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [loading, setLoading] = useState(false);
    const [usersLoading, setUsersLoading] = useState(false);
    const [formsLoading, setFormsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isEditingPlan, setIsEditingPlan] = useState(false);
    const [editingPlanId, setEditingPlanId] = useState(null);
    
    // Template editing mode
    const [isEditingTemplate, setIsEditingTemplate] = useState(false);
    const [editingTemplateId, setEditingTemplateId] = useState(null);
    const [templateMetadata, setTemplateMetadata] = useState({
        name: '',
        description: '',
        category: 'General',
        tags: []
    });

    const [imageDialogOpen, setImageDialogOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [viewFormDetailsOpen, setViewFormDetailsOpen] = useState(false);
    
    // Current selected day tab
    const [selectedDayTab, setSelectedDayTab] = useState(0);
    
    // Plan data with new weekly structure
    const [planData, setPlanData] = useState({
        title: '',
        description: '',
        status: 'draft',
        duration: 1,
        planType: 'weekly',
        goals: {
            targetWeight: '',
            targetCalories: '',
            targetProtein: '',
            targetCarbs: '',
            targetFats: ''
        },
        weeklyPlan: createEmptyWeeklyPlan(),
        generalPlan: createEmptyGeneralPlan(),
        fruits: [],
        recommendations: createEmptyRecommendations(),
        warnings: []
    });

    // Chip detail dialog state
    const [chipDetailDialogOpen, setChipDetailDialogOpen] = useState(false);
    const [selectedChipContent, setSelectedChipContent] = useState('');
    const [selectedChipTitle, setSelectedChipTitle] = useState('');
    const [selectedChipCategory, setSelectedChipCategory] = useState('');

    // Copy day dialog
    const [copyDayDialogOpen, setCopyDayDialogOpen] = useState(false);
    const [copySourceDay, setCopySourceDay] = useState('');
    const [copyTargetDays, setCopyTargetDays] = useState([]);

    useEffect(() => {
        fetchUsers();
        if (import.meta.env.VITE_ENABLE_PLAN_TEMPLATES !== 'false') {
            fetchTemplates();
        }
    }, []);

    useEffect(() => {
        // Handle incoming state from AdminFormsPage or AdminTemplatesPage
        if (location.state) {
            const { selectedUser: userId, selectedForm: formId, formData, templateId, templateData, editTemplateId } = location.state;
            
            // Handle form-based plan creation/editing
            if (userId && formId) {
                setSelectedUser(userId);
                setSelectedForm(formId);
                if (formData) {
                    setCurrentFormData(formData);
                }
                
                // Check if there's an existing plan for this form
                loadExistingPlan(formId, formData);
                
                // Pre-populate plan data based on form
                if (formData) {
                    setPlanData(prev => ({
                        ...prev,
                        title: `Nutrition Plan for ${formData.user.name}`,
                        description: `Personalized nutrition plan based on submitted form`,
                        planType: 'weekly',
                        goals: {
                            targetWeight: formData.desiredWeight || '',
                            targetCalories: '',
                            targetProtein: '',
                            targetCarbs: '',
                            targetFats: ''
                        },
                        weeklyPlan: createEmptyWeeklyPlan(),
                        generalPlan: createEmptyGeneralPlan(),
                        fruits: [],
                        recommendations: createEmptyRecommendations(),
                        warnings: []
                    }));
                }
            }
            
            // Handle template-based plan creation
            if (templateId && templateData) {
                setPlanData(prev => ({
                    ...prev,
                    title: templateData.name,
                    description: templateData.description || '',
                    duration: templateData.duration,
                    planType: templateData.defaultPlanType || 'weekly',
                    goals: templateData.defaultGoals || {
                        targetWeight: '',
                        targetCalories: '',
                        targetProtein: '',
                        targetCarbs: '',
                        targetFats: ''
                    },
                    weeklyPlan: templateData.defaultWeeklyPlan || createEmptyWeeklyPlan(),
                    generalPlan: templateData.defaultGeneralPlan || createEmptyGeneralPlan(),
                    fruits: normalizeFruits(templateData.defaultFruits),
                    recommendations: templateData.defaultRecommendations || createEmptyRecommendations(),
                    warnings: templateData.defaultWarnings || []
                }));
                
                setSuccessMessage(`Using template: ${templateData.name}`);
                setTimeout(() => setSuccessMessage(''), 3000);
            }
            
            // Handle template editing
            if (editTemplateId && templateData) {
                setIsEditingTemplate(true);
                setEditingTemplateId(editTemplateId);
                setTemplateMetadata({
                    name: templateData.name,
                    description: templateData.description || '',
                    category: templateData.category || 'General',
                    tags: templateData.tags || []
                });
                setPlanData(prev => ({
                    ...prev,
                    title: templateData.name,
                    description: templateData.description || '',
                    duration: templateData.duration,
                    planType: templateData.defaultPlanType || 'weekly',
                    goals: templateData.defaultGoals || {
                        targetWeight: '',
                        targetCalories: '',
                        targetProtein: '',
                        targetCarbs: '',
                        targetFats: ''
                    },
                    weeklyPlan: templateData.defaultWeeklyPlan || createEmptyWeeklyPlan(),
                    generalPlan: templateData.defaultGeneralPlan || createEmptyGeneralPlan(),
                    fruits: normalizeFruits(templateData.defaultFruits),
                    recommendations: templateData.defaultRecommendations || createEmptyRecommendations(),
                    warnings: templateData.defaultWarnings || []
                }));
                
                setSuccessMessage(`Editing template: ${templateData.name}`);
                setTimeout(() => setSuccessMessage(''), 3000);
            }
        }
    }, [location.state]);

    useEffect(() => {
        if (selectedUser) {
            fetchUserForms();
        }
    }, [selectedUser]);

    useEffect(() => {
        if (selectedForm && userForms.length > 0) {
            const form = userForms.find(f => f._id === selectedForm);
            if (form) {
                setCurrentFormData(form);
            }
        } else if (!selectedForm) {
            setCurrentFormData(null);
        }
    }, [selectedForm, userForms]);

    const loadExistingPlan = async (formId, formData) => {
        try {
            const response = await fetch(`${apiBaseUrl}/api/admin/forms/${formId}/plan`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const existingPlan = data.plan;
                
                // Set editing state
                setIsEditingPlan(true);
                setEditingPlanId(existingPlan._id);
                
                const recommendations = existingPlan.recommendations || createEmptyRecommendations();
                setPlanData({
                    title: existingPlan.title,
                    description: existingPlan.description,
                    status: existingPlan.status || 'draft',
                    duration: existingPlan.duration,
                    planType: existingPlan.planType || 'weekly',
                    goals: existingPlan.goals || {
                        targetWeight: '',
                        targetCalories: '',
                        targetProtein: '',
                        targetCarbs: '',
                        targetFats: ''
                    },
                    weeklyPlan: existingPlan.weeklyPlan || createEmptyWeeklyPlan(),
                    generalPlan: existingPlan.generalPlan || createEmptyGeneralPlan(),
                    fruits: normalizeFruits(existingPlan.fruits),
                    recommendations: {
                        avoid: recommendations.avoid || [],
                        useCarefully: recommendations.useCarefully || [],
                        allowed: recommendations.allowed || [],
                        exercise: recommendations.exercise || [],
                        notes: recommendations.notes || ''
                    },
                    warnings: existingPlan.warnings || []
                });
                
                setSuccessMessage(`Editing existing plan: ${existingPlan.title}`);
                setTimeout(() => setSuccessMessage(''), 3000);
            } else if (response.status === 404) {
                // No existing plan - this is normal for new plans
                setIsEditingPlan(false);
                setEditingPlanId(null);
            } else {
                throw new Error('Failed to load existing plan');
            }
        } catch (error) {
            console.error('Error loading existing plan:', error);
            if (!error.message.includes('404')) {
                setError(error.message);
            }
        }
    };

    const fetchUsers = async () => {
        setUsersLoading(true);
        try {
            const response = await fetch(`${apiBaseUrl}/api/admin/users`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }

            const data = await response.json();
            setUsers(data.users);
        } catch (error) {
            console.error('Error fetching users:', error);
            setError(error.message);
        } finally {
            setUsersLoading(false);
        }
    };

    const fetchUserForms = async () => {
        setFormsLoading(true);
        try {
            const response = await fetch(`${apiBaseUrl}/api/admin/users/${selectedUser}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch user forms');
            }

            const data = await response.json();
            setUserForms(data.forms);
        } catch (error) {
            console.error('Error fetching user forms:', error);
            setError(error.message);
        } finally {
            setFormsLoading(false);
        }
    };

    const fetchTemplates = async () => {
        try {
            const response = await fetch(`${apiBaseUrl}/api/admin/templates?active=true&limit=100`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch templates');
            }

            const data = await response.json();
            setTemplates(data.templates);
        } catch (error) {
            console.error('Error fetching templates:', error);
            setError(error.message);
        }
    };

    const loadTemplate = async (templateId) => {
        try {
            const response = await fetch(`${apiBaseUrl}/api/admin/templates/${templateId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch template details');
            }

            const data = await response.json();
            const template = data.template;

            setPlanData(prev => ({
                ...prev,
                title: template.name,
                description: template.description || '',
                duration: template.duration,
                planType: template.defaultPlanType || 'weekly',
                goals: template.defaultGoals || {
                    targetWeight: '',
                    targetCalories: '',
                    targetProtein: '',
                    targetCarbs: '',
                    targetFats: ''
                },
                weeklyPlan: template.defaultWeeklyPlan || createEmptyWeeklyPlan(),
                generalPlan: template.defaultGeneralPlan || createEmptyGeneralPlan(),
                fruits: normalizeFruits(template.defaultFruits),
                recommendations: template.defaultRecommendations || createEmptyRecommendations(),
                warnings: template.defaultWarnings || []
            }));

            // Increment usage count
            await fetch(`${apiBaseUrl}/api/admin/templates/${templateId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ usageCount: template.usageCount + 1 })
            });

            setSuccessMessage(`Template "${template.name}" loaded successfully!`);
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            console.error('Error loading template:', error);
            setError(error.message);
        }
    };

    // Handle meal change for a specific day and meal type
    const handleMealChange = (day, mealType, value) => {
        setPlanData(prev => ({
            ...prev,
            weeklyPlan: {
                ...prev.weeklyPlan,
                [day]: {
                    ...prev.weeklyPlan[day],
                    [mealType]: value
                }
            }
        }));
    };

    // Handle general meal change (same meals for all days)
    const handleGeneralMealChange = (mealType, value) => {
        setPlanData(prev => ({
            ...prev,
            generalPlan: {
                ...prev.generalPlan,
                [mealType]: value
            }
        }));
    };

    // Copy a day's meals to other days
    const handleCopyDay = () => {
        if (!copySourceDay || copyTargetDays.length === 0) return;
        
        const sourceMeals = planData.weeklyPlan[copySourceDay];
        
        setPlanData(prev => {
            const newWeeklyPlan = { ...prev.weeklyPlan };
            copyTargetDays.forEach(targetDay => {
                newWeeklyPlan[targetDay] = { ...sourceMeals };
            });
            return { ...prev, weeklyPlan: newWeeklyPlan };
        });
        
        setCopyDayDialogOpen(false);
        setCopySourceDay('');
        setCopyTargetDays([]);
        setSuccessMessage(`Copied ${DAY_LABELS[copySourceDay]}'s meals to ${copyTargetDays.length} day(s)`);
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    // Helper functions for managing recommendations
    const [newFruitInput, setNewFruitInput] = useState({
        name: '',
        quantity: ''
    });

    const addFruit = () => {
        const fruitName = newFruitInput.name.trim();
        const quantity = Number(newFruitInput.quantity);

        if (!fruitName || !Number.isFinite(quantity) || quantity <= 0) {
            return;
        }

        setPlanData((prev) => {
            const existingIndex = (prev.fruits || []).findIndex((fruit) => fruit.name === fruitName);

            if (existingIndex >= 0) {
                return {
                    ...prev,
                    fruits: prev.fruits.map((fruit, index) => (
                        index === existingIndex ? { ...fruit, quantity } : fruit
                    ))
                };
            }

            return {
                ...prev,
                fruits: [...(prev.fruits || []), { name: fruitName, quantity }]
            };
        });

        setNewFruitInput({ name: '', quantity: '' });
    };

    const removeFruit = (index) => {
        setPlanData((prev) => ({
            ...prev,
            fruits: (prev.fruits || []).filter((_, itemIndex) => itemIndex !== index)
        }));
    };

    const [newRecommendationInputs, setNewRecommendationInputs] = useState({
        avoid: '',
        useCarefully: '',
        allowed: '',
        exercise: ''
    });

    const addRecommendation = (category, value) => {
        if (value.trim()) {
            setPlanData(prev => ({
                ...prev,
                recommendations: {
                    ...prev.recommendations,
                    [category]: [...(prev.recommendations[category] || []), value.trim()]
                }
            }));
        }
    };

    const removeRecommendation = (category, index) => {
        setPlanData(prev => ({
            ...prev,
            recommendations: {
                ...prev.recommendations,
                [category]: prev.recommendations[category].filter((_, i) => i !== index)
            }
        }));
    };

    // Helper functions for managing warnings
    const [newWarningInput, setNewWarningInput] = useState('');

    const addWarning = (value) => {
        if (value.trim()) {
            setPlanData(prev => ({
                ...prev,
                warnings: [...prev.warnings, value.trim()]
            }));
        }
    };

    const removeWarning = (index) => {
        setPlanData(prev => ({
            ...prev,
            warnings: prev.warnings.filter((_, i) => i !== index)
        }));
    };

    const handlePlanChange = (field, value) => {
        if (field.includes('.')) {
            const [parent, child] = field.split('.');
            setPlanData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }));
        } else {
            setPlanData(prev => ({ ...prev, [field]: value }));
        }
    };

    const preventInvalidNumberKeys = (e) => {
        if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
            e.preventDefault();
        }
    };

    const clampNumber = (rawValue, min = 0) => {
        if (rawValue === '') return '';
        const parsed = Number(rawValue);
        if (Number.isNaN(parsed)) return '';
        return Math.max(min, parsed);
    };

    // Function to open chip detail dialog
    const openChipDetailDialog = (content, title, category) => {
        setSelectedChipContent(content);
        setSelectedChipTitle(title);
        setSelectedChipCategory(category);
        setChipDetailDialogOpen(true);
    };

    const saveAsTemplate = async () => {
        const templateName = prompt('Enter a name for this template:');
        if (!templateName) return;

        const templateDescription = prompt('Enter a description for this template (optional):') || '';
        const templateCategory = prompt('Enter a category (Weight Loss, Weight Gain, Maintenance, Athletic, Medical, General):') || 'General';

        try {
            setLoading(true);
            const response = await fetch(`${apiBaseUrl}/api/admin/templates`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    name: templateName,
                    description: templateDescription,
                    category: templateCategory,
                    duration: planData.duration,
                    defaultPlanType: planData.planType,
                    defaultGoals: planData.goals,
                    defaultWeeklyPlan: planData.weeklyPlan,
                    defaultGeneralPlan: planData.generalPlan,
                    defaultFruits: planData.fruits,
                    defaultRecommendations: planData.recommendations,
                    defaultWarnings: planData.warnings
                })
            });

            if (!response.ok) {
                throw new Error('Failed to save template');
            }

            alert('Template saved successfully!');
        } catch (error) {
            console.error('Error saving template:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const updateTemplate = async () => {
        if (!isEditingTemplate || !editingTemplateId) {
            setError('Not in template editing mode');
            return;
        }

        if (!templateMetadata.name.trim()) {
            setError('Template name is required');
            return;
        }

        if (!planData.duration || planData.duration < 1) {
            setError('Duration must be at least 1 week');
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`${apiBaseUrl}/api/admin/templates/${editingTemplateId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    name: templateMetadata.name.trim(),
                    description: templateMetadata.description.trim(),
                    category: templateMetadata.category,
                    duration: planData.duration,
                    defaultPlanType: planData.planType,
                    defaultGoals: planData.goals,
                    defaultWeeklyPlan: planData.weeklyPlan,
                    defaultGeneralPlan: planData.generalPlan,
                    defaultFruits: planData.fruits,
                    defaultRecommendations: planData.recommendations,
                    defaultWarnings: planData.warnings,
                    tags: templateMetadata.tags.filter(tag => tag.trim() !== '')
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update template');
            }

            alert('Template updated successfully!');
            resetForm();
        } catch (error) {
            console.error('Error updating template:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setIsEditingTemplate(false);
        setEditingTemplateId(null);
        setTemplateMetadata({
            name: '',
            description: '',
            category: 'General',
            tags: []
        });
        setPlanData({
            title: '',
            description: '',
            status: 'draft',
            duration: 1,
            planType: 'weekly',
            goals: {
                targetWeight: '',
                targetCalories: '',
                targetProtein: '',
                targetCarbs: '',
                targetFats: ''
            },
            weeklyPlan: createEmptyWeeklyPlan(),
            generalPlan: createEmptyGeneralPlan(),
            fruits: [],
            recommendations: createEmptyRecommendations(),
            warnings: []
        });
        setSelectedUser('');
        setSelectedForm('');
        setUserForms([]);
        setIsEditingPlan(false);
        setEditingPlanId(null);
        window.history.replaceState({}, document.title);
    };

    const createPlan = async () => {
        if (!selectedUser || !selectedForm) {
            setError('Please select a user and form');
            return;
        }

        try {
            setLoading(true);
            
            const url = isEditingPlan 
                ? `${apiBaseUrl}/api/admin/plans/${editingPlanId}`
                : `${apiBaseUrl}/api/admin/plans`;
                
            const method = isEditingPlan ? 'PUT' : 'POST';
            
            const requestBody = isEditingPlan
                ? { ...planData }
                : {
                    userId: selectedUser,
                    formId: selectedForm,
                    templateId: selectedTemplate || null,
                    ...planData
                };

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`Failed to ${isEditingPlan ? 'update' : 'create'} plan`);
            }

            const data = await response.json();
            const wasEditing = isEditingPlan;
            
            resetForm();
            
            alert(`Plan ${wasEditing ? 'updated' : 'created'} successfully! The form has been marked as reviewed.`);
        } catch (error) {
            console.error('Error creating plan:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    // Get the current day based on tab index
    const currentDay = DAYS_OF_WEEK[selectedDayTab];

    return (
        <PageFade>
            <Box sx={{ 
                p: { xs: 1, sm: 2, md: 3 },
                maxWidth: '100%',
                overflow: 'hidden'
            }}>
                <Typography 
                    variant="h4"
                    sx={{ 
                        fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
                        textAlign: { xs: 'center', sm: 'left' },
                        mb: 2
                    }}
                >
                    {isEditingTemplate ? `Edit Template: ${templateMetadata.name}` : 'Plan Builder'}
                </Typography>

                {isEditingTemplate && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        You are editing a template. Changes will be saved to the template, not create a new plan.
                    </Alert>
                )}

                <PageErrorIndicator error={error} onClose={() => setError('')} sx={{ mb: 2 }} />

                {successMessage && (
                    <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage('')}>
                        {successMessage}
                    </Alert>
                )}

                <Grid container spacing={{ xs: 2, md: 3 }}>
                    {/* User and Form Selection - Only show when not editing template */}
                    {!isEditingTemplate && (
                        <Grid item xs={12} md={4}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Select User & Form
                                    </Typography>
                                    
                                    {usersLoading ? (
                                        <Skeleton variant="rectangular" height={56} sx={{ mb: 2, borderRadius: 1 }} />
                                    ) : (
                                        <FormControl fullWidth sx={{ mb: 2 }}>
                                            <InputLabel>Select User</InputLabel>
                                            <Select
                                                value={selectedUser}
                                                onChange={(e) => setSelectedUser(e.target.value)}
                                                label="Select User"
                                                MenuProps={{ disableScrollLock: true }}
                                            >
                                                {users.map((user) => (
                                                    <MenuItem key={user._id} value={user._id}>
                                                        {user.name} ({user.email})
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    )}

                                    {formsLoading ? (
                                        <Skeleton variant="rectangular" height={56} sx={{ mb: 2, borderRadius: 1 }} />
                                    ) : (
                                        <FormControl fullWidth sx={{ mb: 2 }}>
                                            <InputLabel>Select Form</InputLabel>
                                            <Select
                                                value={selectedForm}
                                                onChange={(e) => setSelectedForm(e.target.value)}
                                                label="Select Form"
                                                disabled={!selectedUser}
                                                MenuProps={{ disableScrollLock: true }}
                                            >
                                                {userForms.map((form) => (
                                                    <MenuItem key={form._id} value={form._id}>
                                                        Form from {new Date(form.createdAt).toLocaleDateString()} 
                                                        (Weight: {form.currentWeight}kg → {form.desiredWeight}kg)
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    )}

                    {/* Form Details - Only show when a form is selected */}
                    {!isEditingTemplate && currentFormData && (
                        <Grid item xs={12} md={4}>
                            <Card sx={{ height: '100%' }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Typography variant="h6">
                                            Form Details
                                        </Typography>
                                        <Button 
                                            size="small" 
                                            variant="outlined" 
                                            onClick={() => setViewFormDetailsOpen(true)}
                                            sx={{ minWidth: 'auto', borderRadius: 2 }}
                                        >
                                            View Full
                                        </Button>
                                    </Box>
                                    <Box sx={{ maxHeight: '200px', overflowY: 'auto' }}>
                                        <Typography variant="subtitle2" color="primary">Weight Goals</Typography>
                                        <Typography variant="body2" paragraph>
                                            Current: {currentFormData.currentWeight}kg → Desired: {currentFormData.desiredWeight}kg
                                        </Typography>
                                        
                                        <Typography variant="subtitle2" color="primary">Allergies</Typography>
                                        <Typography variant="body2" paragraph>
                                            {currentFormData.allergies && currentFormData.allergies.length > 0 
                                                ? currentFormData.allergies.join(', ') 
                                                : 'None'}
                                        </Typography>

                                        <Typography variant="subtitle2" color="primary">Health Conditions</Typography>
                                        <Typography variant="body2" paragraph>
                                            {currentFormData.healthConditions && currentFormData.healthConditions.length > 0 
                                                ? currentFormData.healthConditions.join(', ') 
                                                : 'None'}
                                        </Typography>

                                        <Typography variant="subtitle2" color="primary">Goals</Typography>
                                        <Typography variant="body2" paragraph>
                                            {currentFormData.goals && currentFormData.goals.length > 0 
                                                ? currentFormData.goals.join(', ') 
                                                : 'None'}
                                        </Typography>

                                        <Typography variant="subtitle2" color="primary">Daily Habits</Typography>
                                        <Typography variant="body2" paragraph>
                                            Water: {currentFormData.waterIntake ?? 'N/A'} glass(es) | Breakfast: {currentFormData.breakfastFrequency || 'N/A'}
                                            <br />
                                            Bread: {currentFormData.breadServings ?? 'N/A'} | Rice: {currentFormData.ricePlates ?? 'N/A'}
                                        </Typography>

                                        {(currentFormData.bodyImage || (currentFormData.inbodyImages && currentFormData.inbodyImages.length > 0)) && (
                                            <>
                                                <Typography variant="subtitle2" color="primary">Inbody Images</Typography>
                                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1, mb: 1 }}>
                                                    {currentFormData.bodyImage && (
                                                        <Box 
                                                            onClick={() => {
                                                                setSelectedImage(currentFormData.bodyImage);
                                                                setImageDialogOpen(true);
                                                            }}
                                                            sx={{ 
                                                                width: 60, 
                                                                height: 60, 
                                                                borderRadius: 1, 
                                                                overflow: 'hidden', 
                                                                cursor: 'pointer',
                                                                border: '1px solid #ddd',
                                                                '&:hover': { opacity: 0.8 }
                                                            }}
                                                        >
                                                            <img 
                                                                src={currentFormData.bodyImage} 
                                                                alt="Inbody" 
                                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                            />
                                                        </Box>
                                                    )}
                                                    {currentFormData.inbodyImages && currentFormData.inbodyImages.map((img, idx) => (
                                                        <Box 
                                                            key={idx}
                                                            onClick={() => {
                                                                setSelectedImage(img);
                                                                setImageDialogOpen(true);
                                                            }}
                                                            sx={{ 
                                                                width: 60, 
                                                                height: 60, 
                                                                borderRadius: 1, 
                                                                overflow: 'hidden', 
                                                                cursor: 'pointer',
                                                                border: '1px solid #ddd',
                                                                '&:hover': { opacity: 0.8 }
                                                            }}
                                                        >
                                                            <img 
                                                                src={img} 
                                                                alt={`Inbody ${idx}`} 
                                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                            />
                                                        </Box>
                                                    ))}
                                                </Box>
                                            </>
                                        )}
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    )}

                    {/* Template Selection - Only show when not editing template */}
                    {!isEditingTemplate && import.meta.env.VITE_ENABLE_PLAN_TEMPLATES !== 'false' && (
                        <Grid item xs={12} md={4}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Or Use Template
                                    </Typography>
                                    
                                    <FormControl fullWidth sx={{ mb: 2 }}>
                                        <InputLabel>Select Template</InputLabel>
                                        <Select
                                            value={selectedTemplate}
                                            onChange={(e) => {
                                                setSelectedTemplate(e.target.value);
                                                if (e.target.value) {
                                                    loadTemplate(e.target.value);
                                                }
                                            }}
                                            label="Select Template"
                                            MenuProps={{ disableScrollLock: true }}
                                        >
                                            <MenuItem value="">None</MenuItem>
                                            {templates.map((template) => (
                                                <MenuItem key={template._id} value={template._id}>
                                                    {template.name} ({template.category})
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <Typography variant="body2" color="text.secondary">
                                        Templates provide pre-built weekly meal plans that you can customize for specific users.
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    )}

                    {/* Plan Basic Info */}
                    <Grid item xs={12} md={isEditingTemplate ? 6 : 4}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    {isEditingTemplate ? 'Template Information' : 'Plan Information'}
                                </Typography>
                                
                                {isEditingTemplate ? (
                                    <>
                                        <TextField
                                            fullWidth
                                            label="Template Name"
                                            value={templateMetadata.name}
                                            onChange={(e) => setTemplateMetadata(prev => ({ ...prev, name: e.target.value }))}
                                            sx={{ mb: 2 }}
                                        />
                                        
                                        <TextField
                                            fullWidth
                                            multiline
                                            rows={3}
                                            label="Template Description"
                                            value={templateMetadata.description}
                                            onChange={(e) => setTemplateMetadata(prev => ({ ...prev, description: e.target.value }))}
                                            sx={{ mb: 2 }}
                                        />
                                        
                                        <FormControl fullWidth sx={{ mb: 2 }}>
                                            <InputLabel>Category</InputLabel>
                                            <Select
                                                value={templateMetadata.category}
                                                onChange={(e) => setTemplateMetadata(prev => ({ ...prev, category: e.target.value }))}
                                                label="Category"
                                                MenuProps={{ disableScrollLock: true }}
                                            >
                                                <MenuItem value="Weight Loss">Weight Loss</MenuItem>
                                                <MenuItem value="Weight Gain">Weight Gain</MenuItem>
                                                <MenuItem value="Maintenance">Maintenance</MenuItem>
                                                <MenuItem value="Athletic">Athletic</MenuItem>
                                                <MenuItem value="Medical">Medical</MenuItem>
                                                <MenuItem value="General">General</MenuItem>
                                            </Select>
                                        </FormControl>
                                        
                                        <TextField
                                            fullWidth
                                            type="number"
                                            label="Duration (weeks)"
                                            value={planData.duration}
                                            onChange={(e) => handlePlanChange('duration', clampNumber(e.target.value, 1))}
                                            onKeyDown={preventInvalidNumberKeys}
                                            inputProps={{ min: 1, step: 1 }}
                                            sx={{ mb: 2 }}
                                        />

                                        <FormControl fullWidth sx={{ mb: 2 }}>
                                            <InputLabel>Plan Type</InputLabel>
                                            <Select
                                                value={planData.planType || 'weekly'}
                                                onChange={(e) => handlePlanChange('planType', e.target.value)}
                                                label="Plan Type"
                                                MenuProps={{ disableScrollLock: true }}
                                            >
                                                <MenuItem value="weekly">Weekly (per day)</MenuItem>
                                                <MenuItem value="general">General (same every day)</MenuItem>
                                            </Select>
                                        </FormControl>
                                        
                                        <TextField
                                            fullWidth
                                            label="Tags (comma separated)"
                                            value={templateMetadata.tags.join(', ')}
                                            onChange={(e) => setTemplateMetadata(prev => ({ 
                                                ...prev, 
                                                tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                                            }))}
                                            helperText="Enter tags separated by commas"
                                        />
                                    </>
                                ) : (
                                    <>
                                        <TextField
                                            fullWidth
                                            label="Plan Title"
                                            value={planData.title}
                                            onChange={(e) => handlePlanChange('title', e.target.value)}
                                            sx={{ mb: 2 }}
                                        />
                                        
                                        <TextField
                                            fullWidth
                                            multiline
                                            rows={3}
                                            label="Description"
                                            value={planData.description}
                                            onChange={(e) => handlePlanChange('description', e.target.value)}
                                            sx={{ mb: 2 }}
                                        />
                                        
                                        <TextField
                                            fullWidth
                                            type="number"
                                            label="Duration (weeks)"
                                            value={planData.duration}
                                            onChange={(e) => handlePlanChange('duration', clampNumber(e.target.value, 1))}
                                            onKeyDown={preventInvalidNumberKeys}
                                            inputProps={{ min: 1, step: 1 }}
                                            sx={{ mb: 2 }}
                                        />

                                        <FormControl fullWidth sx={{ mb: 2 }}>
                                            <InputLabel>Plan Type</InputLabel>
                                            <Select
                                                value={planData.planType || 'weekly'}
                                                onChange={(e) => handlePlanChange('planType', e.target.value)}
                                                label="Plan Type"
                                                MenuProps={{ disableScrollLock: true }}
                                            >
                                                <MenuItem value="weekly">Weekly (per day)</MenuItem>
                                                <MenuItem value="general">General (same every day)</MenuItem>
                                            </Select>
                                        </FormControl>

                                        <FormControl fullWidth>
                                            <InputLabel>Status</InputLabel>
                                            <Select
                                                value={planData.status}
                                                onChange={(e) => handlePlanChange('status', e.target.value)}
                                                label="Status"
                                                MenuProps={{ disableScrollLock: true }}
                                            >
                                                <MenuItem value="draft">Draft</MenuItem>
                                                <MenuItem value="active">Active</MenuItem>
                                                <MenuItem value="completed">Completed</MenuItem>
                                                <MenuItem value="paused">Paused</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Goals */}
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Goals & Targets
                                </Typography>
                                
                                <Grid container spacing={{ xs: 1, sm: 2 }}>
                                    <Grid item xs={12} sm={6} md={2.4}>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            label="Target Weight (kg)"
                                            value={planData.goals.targetWeight}
                                            onChange={(e) => handlePlanChange('goals.targetWeight', clampNumber(e.target.value, 0))}
                                            onKeyDown={preventInvalidNumberKeys}
                                            inputProps={{ min: 0, step: 'any' }}
                                            size="small"
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={2.4}>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            label="Target Calories"
                                            value={planData.goals.targetCalories}
                                            onChange={(e) => handlePlanChange('goals.targetCalories', clampNumber(e.target.value, 0))}
                                            onKeyDown={preventInvalidNumberKeys}
                                            inputProps={{ min: 0, step: 1 }}
                                            size="small"
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={2.4}>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            label="Target Protein (g)"
                                            value={planData.goals.targetProtein}
                                            onChange={(e) => handlePlanChange('goals.targetProtein', clampNumber(e.target.value, 0))}
                                            onKeyDown={preventInvalidNumberKeys}
                                            inputProps={{ min: 0, step: 'any' }}
                                            size="small"
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={2.4}>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            label="Target Carbs (g)"
                                            value={planData.goals.targetCarbs}
                                            onChange={(e) => handlePlanChange('goals.targetCarbs', clampNumber(e.target.value, 0))}
                                            onKeyDown={preventInvalidNumberKeys}
                                            inputProps={{ min: 0, step: 'any' }}
                                            size="small"
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={2.4}>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            label="Target Fats (g)"
                                            value={planData.goals.targetFats}
                                            onChange={(e) => handlePlanChange('goals.targetFats', clampNumber(e.target.value, 0))}
                                            onKeyDown={preventInvalidNumberKeys}
                                            inputProps={{ min: 0, step: 'any' }}
                                            size="small"
                                        />
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Meal Plan Details */}
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                {planData.planType === 'weekly' ? (
                                    <>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                            <Typography variant="h6">
                                                Weekly Meal Plan
                                            </Typography>
                                            <Tooltip title="Copy a day's meals to other days">
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    startIcon={<ContentCopyIcon />}
                                                    onClick={() => setCopyDayDialogOpen(true)}
                                                >
                                                    Copy Day
                                                </Button>
                                            </Tooltip>
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
                                                    minWidth: { xs: 80, sm: 100 },
                                                    fontWeight: 600
                                                }
                                            }}
                                        >
                                            {DAYS_OF_WEEK.map((day, index) => (
                                                <Tab 
                                                    key={day} 
                                                    label={isMobile ? DAY_LABELS[day].substring(0, 3) : DAY_LABELS[day]}
                                                    sx={{
                                                        color: planData.weeklyPlan[day]?.breakfast || 
                                                               planData.weeklyPlan[day]?.lunch || 
                                                               planData.weeklyPlan[day]?.dinner || 
                                                               planData.weeklyPlan[day]?.snack 
                                                            ? 'success.main' : 'inherit'
                                                    }}
                                                />
                                            ))}
                                        </Tabs>

                                        {/* Current Day's Meals */}
                                        <Box>
                                            <Typography variant="h6" color="primary" gutterBottom>
                                                {DAY_LABELS[currentDay]}
                                            </Typography>

                                            <Grid container spacing={2}>
                                                {MEAL_TYPES.map((mealType) => {
                                                    const mealVisual = getMealVisualByType(mealType);
                                                    const MealIcon = mealVisual?.icon;
                                                    return (
                                                    <Grid item xs={12} md={6} key={mealType}>
                                                        <Paper 
                                                            variant="outlined" 
                                                            sx={{ 
                                                                p: 2,
                                                                borderColor: mealType === 'breakfast' ? 'warning.main' :
                                                                            mealType === 'lunch' ? 'success.main' :
                                                                            mealType === 'dinner' ? 'primary.main' : 'secondary.main',
                                                                borderWidth: 2
                                                            }}
                                                        >
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                                {MealIcon && <MealIcon sx={{ color: mealVisual.color }} />}
                                                                <Typography variant="subtitle1" fontWeight={600}>
                                                                    {mealVisual?.label || mealType}
                                                                </Typography>
                                                            </Box>
                                                            <TextField
                                                                fullWidth
                                                                multiline
                                                                rows={4}
                                                                placeholder={`Enter ${(mealVisual?.label || mealType).toLowerCase()} details...`}
                                                                value={planData.weeklyPlan[currentDay]?.[mealType] || ''}
                                                                onChange={(e) => handleMealChange(currentDay, mealType, e.target.value)}
                                                                variant="outlined"
                                                                sx={{ 
                                                                    '& .MuiOutlinedInput-root': {
                                                                        backgroundColor: theme.palette.mode === 'dark' 
                                                                            ? 'rgba(255,255,255,0.05)' 
                                                                            : 'rgba(0,0,0,0.02)'
                                                                    }
                                                                }}
                                                            />
                                                        </Paper>
                                                    </Grid>
                                                    );
                                                })}
                                            </Grid>
                                        </Box>
                                    </>
                                ) : (
                                    <>
                                        <Typography variant="h6" gutterBottom>
                                            General Meal Plan (same every day)
                                        </Typography>
                                        <Grid container spacing={2}>
                                            {MEAL_TYPES.map((mealType) => {
                                                const mealVisual = getMealVisualByType(mealType);
                                                const MealIcon = mealVisual?.icon;
                                                return (
                                                <Grid item xs={12} md={6} key={mealType}>
                                                    <Paper 
                                                        variant="outlined" 
                                                        sx={{ 
                                                            p: 2,
                                                            borderColor: mealType === 'breakfast' ? 'warning.main' :
                                                                        mealType === 'lunch' ? 'success.main' :
                                                                        mealType === 'dinner' ? 'primary.main' : 'secondary.main',
                                                            borderWidth: 2
                                                        }}
                                                    >
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                            {MealIcon && <MealIcon sx={{ color: mealVisual.color }} />}
                                                            <Typography variant="subtitle1" fontWeight={600}>
                                                                {mealVisual?.label || mealType}
                                                            </Typography>
                                                        </Box>
                                                        <TextField
                                                            fullWidth
                                                            multiline
                                                            rows={4}
                                                            placeholder={`Enter ${(mealVisual?.label || mealType).toLowerCase()} details...`}
                                                            value={planData.generalPlan?.[mealType] || ''}
                                                            onChange={(e) => handleGeneralMealChange(mealType, e.target.value)}
                                                            variant="outlined"
                                                            sx={{ 
                                                                '& .MuiOutlinedInput-root': {
                                                                    backgroundColor: theme.palette.mode === 'dark' 
                                                                        ? 'rgba(255,255,255,0.05)' 
                                                                        : 'rgba(0,0,0,0.02)'
                                                                }
                                                            }}
                                                        />
                                                    </Paper>
                                                </Grid>
                                                );
                                            })}
                                        </Grid>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Fruits */}
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Fruits
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Select fruits and set quantity per day.
                                </Typography>

                                <Grid container spacing={2} sx={{ mb: 2 }}>
                                    <Grid item xs={12} sm={6} md={6}>
                                        <FormControl fullWidth size="small" sx={{ minWidth: { sm: 260 } }}>
                                            <InputLabel id="fruit-select-label" shrink>
                                                Fruit
                                            </InputLabel>
                                            <Select
                                                labelId="fruit-select-label"
                                                value={newFruitInput.name}
                                                label="Fruit"
                                                displayEmpty
                                                renderValue={(selected) => selected || 'Select a fruit'}
                                                onChange={(e) => setNewFruitInput((prev) => ({ ...prev, name: e.target.value }))}
                                                sx={{
                                                    '& .MuiSelect-select': {
                                                        color: newFruitInput.name ? 'text.primary' : 'text.secondary'
                                                    }
                                                }}
                                            >
                                                {FRUIT_OPTIONS.map((fruitOption) => (
                                                    <MenuItem key={fruitOption} value={fruitOption}>
                                                        {fruitOption}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} sm={3} md={3}>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            size="small"
                                            label="Quantity"
                                            value={newFruitInput.quantity}
                                            onChange={(e) => setNewFruitInput((prev) => ({ ...prev, quantity: e.target.value }))}
                                            onKeyDown={preventInvalidNumberKeys}
                                            inputProps={{ min: 1, step: 'any' }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={3} md={2}>
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            onClick={addFruit}
                                            disabled={!newFruitInput.name || !newFruitInput.quantity}
                                            sx={{ height: '100%' }}
                                        >
                                            Add
                                        </Button>
                                    </Grid>
                                </Grid>

                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    {planData.fruits?.length > 0 ? (
                                        planData.fruits.map((fruit, index) => (
                                            <Chip
                                                key={`${fruit.name}-${index}`}
                                                label={`${fruit.name}: ${fruit.quantity}`}
                                                onDelete={() => removeFruit(index)}
                                                color="primary"
                                                variant="outlined"
                                            />
                                        ))
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">
                                            No fruits selected yet.
                                        </Typography>
                                    )}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Recommendations */}
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    General Recommendations
                                </Typography>
                                
                                <Grid container spacing={{ xs: 2, sm: 3 }}>
                                    {/* Avoid */}
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Box>
                                            <Typography variant="subtitle1" color="error" gutterBottom>
                                                🚫 Avoid
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                                                {(planData.recommendations.avoid || []).map((item, index) => (
                                                    <Chip
                                                        key={index}
                                                        label={item.length > 30 ? `${item.substring(0, 30)}...` : item}
                                                        onClick={() => openChipDetailDialog(item, 'Avoid Item', 'Avoid')}
                                                        onDelete={() => removeRecommendation('avoid', index)}
                                                        color="error"
                                                        size="small"
                                                        sx={{ cursor: 'pointer' }}
                                                    />
                                                ))}
                                            </Box>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                placeholder="Add item to avoid"
                                                value={newRecommendationInputs.avoid}
                                                onChange={(e) => setNewRecommendationInputs(prev => ({ ...prev, avoid: e.target.value }))}
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter') {
                                                        addRecommendation('avoid', newRecommendationInputs.avoid);
                                                        setNewRecommendationInputs(prev => ({ ...prev, avoid: '' }));
                                                    }
                                                }}
                                                InputProps={{
                                                    endAdornment: (
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => {
                                                                addRecommendation('avoid', newRecommendationInputs.avoid);
                                                                setNewRecommendationInputs(prev => ({ ...prev, avoid: '' }));
                                                            }}
                                                        >
                                                            <AddIcon />
                                                        </IconButton>
                                                    )
                                                }}
                                            />
                                        </Box>
                                    </Grid>

                                    {/* Use Carefully */}
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Box>
                                            <Typography variant="subtitle1" color="warning.main" gutterBottom>
                                                ⚠️ Use Carefully
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                                                {(planData.recommendations.useCarefully || []).map((item, index) => (
                                                    <Chip
                                                        key={index}
                                                        label={item.length > 30 ? `${item.substring(0, 30)}...` : item}
                                                        onClick={() => openChipDetailDialog(item, 'Use Carefully Item', 'Use Carefully')}
                                                        onDelete={() => removeRecommendation('useCarefully', index)}
                                                        color="warning"
                                                        size="small"
                                                        sx={{ cursor: 'pointer' }}
                                                    />
                                                ))}
                                            </Box>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                placeholder="Add item to use carefully"
                                                value={newRecommendationInputs.useCarefully}
                                                onChange={(e) => setNewRecommendationInputs(prev => ({ ...prev, useCarefully: e.target.value }))}
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter') {
                                                        addRecommendation('useCarefully', newRecommendationInputs.useCarefully);
                                                        setNewRecommendationInputs(prev => ({ ...prev, useCarefully: '' }));
                                                    }
                                                }}
                                                InputProps={{
                                                    endAdornment: (
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => {
                                                                addRecommendation('useCarefully', newRecommendationInputs.useCarefully);
                                                                setNewRecommendationInputs(prev => ({ ...prev, useCarefully: '' }));
                                                            }}
                                                        >
                                                            <AddIcon />
                                                        </IconButton>
                                                    )
                                                }}
                                            />
                                        </Box>
                                    </Grid>

                                    {/* Allowed */}
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Box>
                                            <Typography variant="subtitle1" color="success.main" gutterBottom>
                                                ✅ Allowed
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                                                {(planData.recommendations.allowed || []).map((item, index) => (
                                                    <Chip
                                                        key={index}
                                                        label={item.length > 30 ? `${item.substring(0, 30)}...` : item}
                                                        onClick={() => openChipDetailDialog(item, 'Allowed Item', 'Allowed')}
                                                        onDelete={() => removeRecommendation('allowed', index)}
                                                        color="success"
                                                        size="small"
                                                        sx={{ cursor: 'pointer' }}
                                                    />
                                                ))}
                                            </Box>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                placeholder="Add allowed item"
                                                value={newRecommendationInputs.allowed}
                                                onChange={(e) => setNewRecommendationInputs(prev => ({ ...prev, allowed: e.target.value }))}
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter') {
                                                        addRecommendation('allowed', newRecommendationInputs.allowed);
                                                        setNewRecommendationInputs(prev => ({ ...prev, allowed: '' }));
                                                    }
                                                }}
                                                InputProps={{
                                                    endAdornment: (
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => {
                                                                addRecommendation('allowed', newRecommendationInputs.allowed);
                                                                setNewRecommendationInputs(prev => ({ ...prev, allowed: '' }));
                                                            }}
                                                        >
                                                            <AddIcon />
                                                        </IconButton>
                                                    )
                                                }}
                                            />
                                        </Box>
                                    </Grid>

                                    {/* Exercise */}
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Box>
                                            <Typography variant="subtitle1" color="info.main" gutterBottom>
                                                💪 Exercise
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                                                {(planData.recommendations.exercise || []).map((item, index) => (
                                                    <Chip
                                                        key={index}
                                                        label={item.length > 30 ? `${item.substring(0, 30)}...` : item}
                                                        onClick={() => openChipDetailDialog(item, 'Exercise Recommendation', 'Exercise')}
                                                        onDelete={() => removeRecommendation('exercise', index)}
                                                        color="info"
                                                        size="small"
                                                        sx={{ cursor: 'pointer' }}
                                                    />
                                                ))}
                                            </Box>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                placeholder="Add exercise recommendation"
                                                value={newRecommendationInputs.exercise}
                                                onChange={(e) => setNewRecommendationInputs(prev => ({ ...prev, exercise: e.target.value }))}
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter') {
                                                        addRecommendation('exercise', newRecommendationInputs.exercise);
                                                        setNewRecommendationInputs(prev => ({ ...prev, exercise: '' }));
                                                    }
                                                }}
                                                InputProps={{
                                                    endAdornment: (
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => {
                                                                addRecommendation('exercise', newRecommendationInputs.exercise);
                                                                setNewRecommendationInputs(prev => ({ ...prev, exercise: '' }));
                                                            }}
                                                        >
                                                            <AddIcon />
                                                        </IconButton>
                                                    )
                                                }}
                                            />
                                        </Box>
                                    </Grid>

                                    {/* Notes */}
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            multiline
                                            rows={3}
                                            label="Additional Notes"
                                            placeholder="Add any additional notes or recommendations..."
                                            value={planData.recommendations.notes || ''}
                                            onChange={(e) => setPlanData(prev => ({
                                                ...prev,
                                                recommendations: {
                                                    ...prev.recommendations,
                                                    notes: e.target.value
                                                }
                                            }))}
                                        />
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Warnings */}
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                                    ⚠️ Important Warnings
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Critical alerts and warnings that users must be aware of regarding their nutrition plan.
                                </Typography>
                                
                                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                                    {planData.warnings.map((warning, index) => (
                                        <Chip
                                            key={index}
                                            label={warning.length > 40 ? `${warning.substring(0, 40)}...` : warning}
                                            onClick={() => openChipDetailDialog(warning, 'Important Warning', 'Warnings')}
                                            onDelete={() => removeWarning(index)}
                                            color="error"
                                            variant="outlined"
                                            sx={{ fontWeight: 'bold', cursor: 'pointer' }}
                                        />
                                    ))}
                                </Box>
                                
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={2}
                                    placeholder="Add important warning or alert..."
                                    value={newWarningInput}
                                    onChange={(e) => setNewWarningInput(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            addWarning(newWarningInput);
                                            setNewWarningInput('');
                                        }
                                    }}
                                    InputProps={{
                                        endAdornment: (
                                            <IconButton
                                                onClick={() => {
                                                    addWarning(newWarningInput);
                                                    setNewWarningInput('');
                                                }}
                                                color="error"
                                                disabled={!newWarningInput.trim()}
                                            >
                                                <AddIcon />
                                            </IconButton>
                                        )
                                    }}
                                />
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Actions */}
                    <Grid item xs={12}>
                        <Box sx={{ 
                            textAlign: 'center', 
                            display: 'flex', 
                            gap: { xs: 1, sm: 2 }, 
                            justifyContent: 'center',
                            flexDirection: { xs: 'column', sm: 'row' },
                            '& .MuiButton-root': {
                                minHeight: { xs: '48px', sm: 'auto' }
                            }
                        }}>
                            {isEditingTemplate ? (
                                <>
                                    <Button
                                        variant="outlined"
                                        size="large"
                                        onClick={() => {
                                            if (window.confirm('Are you sure you want to cancel editing? All unsaved changes will be lost.')) {
                                                resetForm();
                                            }
                                        }}
                                        disabled={loading}
                                    >
                                        Cancel Edit
                                    </Button>
                                    <Button
                                        variant="contained"
                                        size="large"
                                        onClick={updateTemplate}
                                        disabled={loading || !templateMetadata.name}
                                    >
                                        {loading ? 'Updating Template...' : 'Update Template'}
                                    </Button>
                                </>
                            ) : (
                                <>
                                    {import.meta.env.VITE_ENABLE_PLAN_TEMPLATES !== 'false' && (
                                        <Button
                                            variant="outlined"
                                            size="large"
                                            onClick={saveAsTemplate}
                                            disabled={loading || !planData.title}
                                        >
                                            Save as Template
                                        </Button>
                                    )}
                                    <Button
                                        variant="contained"
                                        size="large"
                                        onClick={createPlan}
                                        disabled={loading || !selectedUser || !selectedForm || !planData.title}
                                    >
                                        {loading 
                                            ? (isEditingPlan ? 'Saving Plan...' : 'Creating Plan...') 
                                            : (isEditingPlan ? 'Save Plan' : 'Create Plan')
                                        }
                                    </Button>
                                </>
                            )}
                        </Box>
                    </Grid>
                </Grid>

                {/* Chip Detail Dialog */}
                <Dialog 
                    open={chipDetailDialogOpen} 
                    onClose={() => setChipDetailDialogOpen(false)} 
                    maxWidth="sm" 
                    fullWidth
                    fullScreen={isMobile}
                    TransitionComponent={Transition}
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
                            <Chip label={selectedChipCategory} size="small" color="primary" variant="outlined" />
                        )}
                    </DialogTitle>
                    <DialogContent sx={{ p: 3, mt: 1 }}>
                        <Typography variant="body1" sx={{ lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {selectedChipContent}
                        </Typography>
                    </DialogContent>
                    <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                        <Button onClick={() => setChipDetailDialogOpen(false)} variant="contained" color="primary">
                            Close
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Copy Day Dialog */}
                <Dialog 
                    open={copyDayDialogOpen} 
                    onClose={() => setCopyDayDialogOpen(false)} 
                    maxWidth="sm" 
                    fullWidth
                    TransitionComponent={Transition}
                >
                    <DialogTitle>Copy Day's Meals</DialogTitle>
                    <DialogContent>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Select a source day and target days to copy all meals.
                        </Typography>
                        
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>Copy from</InputLabel>
                            <Select
                                value={copySourceDay}
                                onChange={(e) => setCopySourceDay(e.target.value)}
                                label="Copy from"
                            >
                                {DAYS_OF_WEEK.map(day => (
                                    <MenuItem key={day} value={day}>{DAY_LABELS[day]}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        
                        <FormControl fullWidth>
                            <InputLabel>Copy to</InputLabel>
                            <Select
                                multiple
                                value={copyTargetDays}
                                onChange={(e) => setCopyTargetDays(e.target.value)}
                                label="Copy to"
                                renderValue={(selected) => selected.map(d => DAY_LABELS[d]).join(', ')}
                            >
                                {DAYS_OF_WEEK.filter(d => d !== copySourceDay).map(day => (
                                    <MenuItem key={day} value={day}>{DAY_LABELS[day]}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setCopyDayDialogOpen(false)}>Cancel</Button>
                        <Button 
                            onClick={handleCopyDay} 
                            variant="contained"
                            disabled={!copySourceDay || copyTargetDays.length === 0}
                        >
                            Copy
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Form Details Dialog */}
                <Dialog 
                    open={viewFormDetailsOpen} 
                    onClose={() => setViewFormDetailsOpen(false)}
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
                        <IconButton onClick={() => setViewFormDetailsOpen(false)} size="small">
                             <ContentCopyIcon sx={{ transform: 'rotate(180deg)', opacity: 0 }} /> 
                        </IconButton>
                    </DialogTitle>
                    <DialogContent sx={{ mt: 2 }}>
                        {currentFormData && (
                             <Grid container spacing={3}>
                                {/* Personal Information */}
                                <Grid item xs={12}>
                                    <Card variant="outlined">
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom color="primary">Personal Information</Typography>
                                            <Grid container spacing={2}>
                                                <Grid item xs={12} md={6}>
                                                    <Typography><strong>Name:</strong> {currentFormData.user?.name || currentFormData.name || 'N/A'}</Typography>
                                                    <Typography><strong>Age:</strong> {currentFormData.age}</Typography>
                                                    <Typography><strong>Gender:</strong> {currentFormData.gender}</Typography>
                                                    <Typography><strong>Phone:</strong> {currentFormData.phoneNumber || 'N/A'}</Typography>
                                                    <Typography><strong>Profession:</strong> {currentFormData.profession || 'N/A'}</Typography>
                                                    <Typography><strong>Height:</strong> {currentFormData.height} cm</Typography>
                                                </Grid>
                                                <Grid item xs={12} md={6}>
                                                    <Typography><strong>Is Mother:</strong> {currentFormData.isMother ? 'Yes' : 'No'}</Typography>
                                                    {currentFormData.isMother && <Typography><strong>Cycle:</strong> {currentFormData.menstrualCycle || 'N/A'}</Typography>}
                                                    <Typography><strong>Bowel Movement:</strong> {currentFormData.bowelMovement || 'N/A'}</Typography>
                                                    <Typography><strong>Physical Activity:</strong> {currentFormData.physicalActivity || 'N/A'}</Typography>
                                                    <Typography><strong>Who Cooks:</strong> {currentFormData.whoCooks || 'N/A'}</Typography>
                                                    <Typography><strong>Smoker:</strong> {currentFormData.currentSmoker ? 'Yes' : 'No'}</Typography>
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
                                            <Typography><strong>Operations:</strong> {currentFormData.operations || 'None'}</Typography>
                                            <Typography><strong>Health Conditions:</strong> {currentFormData.healthConditions?.join(', ') || 'None'}</Typography>
                                            <Typography><strong>Family History:</strong> {currentFormData.familyHistory || 'None'}</Typography>
                                            <Divider sx={{ my: 1 }} />
                                            <Typography><strong>Medications:</strong> {currentFormData.takeMedication ? currentFormData.medications?.join(', ') : 'None'}</Typography>
                                            <Typography><strong>Followed Advice:</strong> {currentFormData.followedDietAdvice ? 'Yes' : 'No'}</Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {/* Blood Test */}
                                <Grid item xs={12} md={6}>
                                    <Card variant="outlined" sx={{ height: '100%' }}>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom color="primary">Blood Test</Typography>
                                            {currentFormData.bloodTest ? (
                                                <Grid container spacing={1}>
                                                    {Object.entries(currentFormData.bloodTest).map(([key, val]) => (
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
                                            <Typography><strong>Current Weight:</strong> {currentFormData.currentWeight} kg</Typography>
                                            <Typography><strong>Min/Max:</strong> {currentFormData.minWeight} / {currentFormData.maxWeight} kg</Typography>
                                            <Typography><strong>Desired:</strong> {currentFormData.desiredWeight} kg</Typography>
                                            <Divider sx={{ my: 1 }} />
                                            <Typography><strong>Tried Diet:</strong> {currentFormData.triedDietBefore ? 'Yes' : 'No'}</Typography>
                                            <Typography><strong>Meds for Weight:</strong> {currentFormData.weightLossMedication ? 'Yes' : 'No'}</Typography>
                                            <Typography><strong>History:</strong> {currentFormData.weightChangeSinceBirth}</Typography>
                                            <Typography><strong>Always Overweight:</strong> {currentFormData.alwaysOverweight ? 'Yes' : 'No'}</Typography>
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
                                                    <Typography><strong>Breakfast:</strong> {currentFormData.breakfast}</Typography>
                                                    <Typography><strong>Lunch:</strong> {currentFormData.lunch}</Typography>
                                                    <Typography><strong>Dinner:</strong> {currentFormData.dinner}</Typography>
                                                    <Typography><strong>Water Intake:</strong> {currentFormData.waterIntake ?? 'N/A'} glass(es)/day</Typography>
                                                    <Typography><strong>Breakfast Frequency:</strong> {currentFormData.breakfastFrequency || 'N/A'}</Typography>
                                                    <Typography><strong>Toast/Bread:</strong> {currentFormData.breadServings ?? 'N/A'}</Typography>
                                                    <Typography><strong>Rice Plates:</strong> {currentFormData.ricePlates ?? 'N/A'}</Typography>
                                                </Grid>
                                                <Grid item xs={12} md={6}>
                                                    <Typography><strong>Dislikes:</strong> {currentFormData.dislikedFood}</Typography>
                                                    <Typography><strong>Diet Given:</strong> {currentFormData.dietGiven}</Typography>
                                                    <Typography><strong>Goals:</strong> {currentFormData.goals?.join(', ')}</Typography>
                                                    <Divider sx={{ my: 1 }} />
                                                    <Typography><strong>Eat at Night Every Day:</strong> {currentFormData.eatAtNightDaily == null ? 'N/A' : currentFormData.eatAtNightDaily ? 'Yes' : 'No'}</Typography>
                                                    <Typography><strong>Night Eater:</strong> {currentFormData.nightEater ? 'Yes' : 'No'}</Typography>
                                                    <Typography><strong>Night Feeling:</strong> {currentFormData.nightHungerType || 'N/A'}</Typography>
                                                    <Typography><strong>Coffee:</strong> {currentFormData.coffee ? 'Yes' : 'No'}</Typography>
                                                    <Typography><strong>Sugar:</strong> {currentFormData.sugar} spoon(s)</Typography>
                                                    <Typography><strong>Snack Time:</strong> {currentFormData.snackTime}</Typography>
                                                </Grid>
                                            </Grid>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                 {/* Inbody Images */}
                                {(currentFormData.bodyImage || (currentFormData.inbodyImages && currentFormData.inbodyImages.length > 0)) && (
                                    <Grid item xs={12}>
                                        <Card>
                                            <CardContent>
                                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    📸 Inbody Images ({
                                                        (currentFormData.inbodyImages?.length || 0) + (currentFormData.bodyImage ? 1 : 0)
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
                                                    {currentFormData.bodyImage && (
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
                                                                setSelectedImage(currentFormData.bodyImage);
                                                                setImageDialogOpen(true);
                                                            }}
                                                        >
                                                            <img
                                                                src={currentFormData.bodyImage}
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
                                                    {currentFormData.inbodyImages && currentFormData.inbodyImages.map((imageUrl, index) => (
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
                        <Button onClick={() => setViewFormDetailsOpen(false)}>Close</Button>
                    </DialogActions>
                </Dialog>

                <ImageViewerDialog
                    open={imageDialogOpen}
                    onClose={() => setImageDialogOpen(false)}
                    imageUrl={selectedImage}
                />
            </Box>
        </PageFade>
    );
}
