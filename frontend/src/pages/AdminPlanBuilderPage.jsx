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
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Divider
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
import PageFade from '../components/PageFade';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function AdminPlanBuilderPage() {
    const theme = useTheme();
    const location = useLocation();
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState('');
    const [userForms, setUserForms] = useState([]);
    const [selectedForm, setSelectedForm] = useState('');
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
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
    
    // Plan data
    const [planData, setPlanData] = useState({
        title: '',
        description: '',
        duration: 1,
        goals: {
            targetWeight: '',
            targetCalories: '',
            targetProtein: '',
            targetCarbs: '',
            targetFats: ''
        },
        weeklyPlans: []
    });

    // Dialog state
    const [mealDialogOpen, setMealDialogOpen] = useState(false);
    const [currentDayIndex, setCurrentDayIndex] = useState(0);
    const [currentMealType, setCurrentMealType] = useState('');
    const [currentSnackIndex, setCurrentSnackIndex] = useState(-1); // For editing snacks
    const [mealDialogMode, setMealDialogMode] = useState('add'); // 'add', 'edit', 'view'
    const [mealData, setMealData] = useState({
        name: '',
        description: '',
        calories: '',
        nutrients: {
            protein: '',
            carbs: '',
            fats: '',
            fiber: ''
        },
        ingredients: [''],
        instructions: ['']
    });

    useEffect(() => {
        fetchUsers();
        fetchTemplates();
    }, []);

    useEffect(() => {
        // Handle incoming state from AdminFormsPage or AdminTemplatesPage
        if (location.state) {
            const { selectedUser: userId, selectedForm: formId, formData, templateId, templateData, editTemplateId } = location.state;
            
            // Handle form-based plan creation/editing
            if (userId && formId) {
                setSelectedUser(userId);
                setSelectedForm(formId);
                
                // Check if there's an existing plan for this form
                loadExistingPlan(formId, formData);
                
                // Pre-populate plan data based on form
                if (formData) {
                    setPlanData(prev => ({
                        ...prev,
                        title: `Nutrition Plan for ${formData.user.name}`,
                        description: `Personalized nutrition plan based on submitted form`,
                        goals: {
                            targetWeight: formData.desiredWeight || '',
                            targetCalories: '',
                            targetProtein: '',
                            targetCarbs: '',
                            targetFats: ''
                        }
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
                    goals: templateData.defaultGoals || {
                        targetWeight: '',
                        targetCalories: '',
                        targetProtein: '',
                        targetCarbs: '',
                        targetFats: ''
                    },
                    weeklyPlans: templateData.weeklyTemplate || []
                }));
                
                // Mark that we're using a template
                setError(`Using template: ${templateData.name}`);
                setTimeout(() => setError(''), 3000);
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
                    goals: templateData.defaultGoals || {
                        targetWeight: '',
                        targetCalories: '',
                        targetProtein: '',
                        targetCarbs: '',
                        targetFats: ''
                    },
                    weeklyPlans: templateData.weeklyTemplate || []
                }));
                
                setError(`Editing template: ${templateData.name}`);
                setTimeout(() => setError(''), 3000);
            }
        }
    }, [location.state]);

    useEffect(() => {
        if (selectedUser) {
            fetchUserForms();
        }
    }, [selectedUser]);

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
                
                // Load existing plan data
                setPlanData({
                    title: existingPlan.title,
                    description: existingPlan.description,
                    duration: existingPlan.duration,
                    goals: existingPlan.goals || {
                        targetWeight: '',
                        targetCalories: '',
                        targetProtein: '',
                        targetCarbs: '',
                        targetFats: ''
                    },
                    weeklyPlans: existingPlan.weeklyPlans || []
                });
                
                setError(`Editing existing plan: ${existingPlan.title}`);
                setTimeout(() => setError(''), 3000);
            } else if (response.status === 404) {
                // No existing plan - this is normal for new plans
                setIsEditingPlan(false);
                setEditingPlanId(null);
                console.log('No existing plan found, creating new one');
            } else {
                throw new Error('Failed to load existing plan');
            }
        } catch (error) {
            console.error('Error loading existing plan:', error);
            // Don't show error for 404s as they're expected for new plans
            if (!error.message.includes('404')) {
                setError(error.message);
            }
        }
    };

    const fetchUsers = async () => {
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
        }
    };

    const fetchUserForms = async () => {
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
                goals: template.defaultGoals || {
                    targetWeight: '',
                    targetCalories: '',
                    targetProtein: '',
                    targetCarbs: '',
                    targetFats: ''
                },
                weeklyPlans: template.weeklyTemplate || []
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

            setError(`Template "${template.name}" loaded successfully!`);
            setTimeout(() => setError(''), 3000);
        } catch (error) {
            console.error('Error loading template:', error);
            setError(error.message);
        }
    };

    const initializePlan = () => {
        const weeklyPlans = [];
        for (let day = 1; day <= 7; day++) {
            weeklyPlans.push({
                day,
                breakfast: null,
                lunch: null,
                dinner: null,
                snacks: [],
                notes: ''
            });
        }
        setPlanData(prev => ({ ...prev, weeklyPlans }));
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

    const openMealDialog = (dayIndex, mealType, mode = 'add', existingMeal = null, snackIndex = -1) => {
        setCurrentDayIndex(dayIndex);
        setCurrentMealType(mealType);
        setCurrentSnackIndex(snackIndex);
        setMealDialogMode(mode);
        
        if (mode === 'view' || mode === 'edit') {
            // Load existing meal data
            setMealData({
                name: existingMeal.name || '',
                description: existingMeal.description || '',
                calories: existingMeal.calories || '',
                nutrients: {
                    protein: existingMeal.nutrients?.protein || '',
                    carbs: existingMeal.nutrients?.carbs || '',
                    fats: existingMeal.nutrients?.fats || '',
                    fiber: existingMeal.nutrients?.fiber || ''
                },
                ingredients: existingMeal.ingredients || [''],
                instructions: existingMeal.instructions || ['']
            });
        } else {
            // Reset for new meal
            setMealData({
                name: '',
                description: '',
                calories: '',
                nutrients: {
                    protein: '',
                    carbs: '',
                    fats: '',
                    fiber: ''
                },
                ingredients: [''],
                instructions: ['']
            });
        }
        setMealDialogOpen(true);
    };

    const editMeal = (dayIndex, mealType, meal, snackIndex = -1) => {
        openMealDialog(dayIndex, mealType, 'edit', meal, snackIndex);
    };

    const saveMeal = () => {
        const meal = {
            ...mealData,
            calories: parseInt(mealData.calories) || 0,
            nutrients: {
                protein: parseFloat(mealData.nutrients.protein) || 0,
                carbs: parseFloat(mealData.nutrients.carbs) || 0,
                fats: parseFloat(mealData.nutrients.fats) || 0,
                fiber: parseFloat(mealData.nutrients.fiber) || 0
            },
            ingredients: mealData.ingredients.filter(ing => ing.trim() !== ''),
            instructions: mealData.instructions.filter(inst => inst.trim() !== '')
        };

        setPlanData(prev => {
            const newWeeklyPlans = [...prev.weeklyPlans];
            
            if (mealDialogMode === 'add') {
                // Adding new meal
                if (currentMealType === 'snack') {
                    newWeeklyPlans[currentDayIndex].snacks.push(meal);
                } else {
                    newWeeklyPlans[currentDayIndex][currentMealType] = meal;
                }
            } else if (mealDialogMode === 'edit') {
                // Editing existing meal
                if (currentMealType === 'snack') {
                    // Use the stored snack index to replace the correct snack
                    if (currentSnackIndex >= 0 && currentSnackIndex < newWeeklyPlans[currentDayIndex].snacks.length) {
                        newWeeklyPlans[currentDayIndex].snacks[currentSnackIndex] = meal;
                    }
                } else {
                    newWeeklyPlans[currentDayIndex][currentMealType] = meal;
                }
            }
            
            return { ...prev, weeklyPlans: newWeeklyPlans };
        });

        setMealDialogOpen(false);
    };

    const addListItem = (listType) => {
        setMealData(prev => ({
            ...prev,
            [listType]: [...prev[listType], '']
        }));
    };

    const updateListItem = (listType, index, value) => {
        setMealData(prev => ({
            ...prev,
            [listType]: prev[listType].map((item, i) => i === index ? value : item)
        }));
    };

    const removeListItem = (listType, index) => {
        setMealData(prev => ({
            ...prev,
            [listType]: prev[listType].filter((_, i) => i !== index)
        }));
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
                    weeklyTemplate: planData.weeklyPlans,
                    defaultGoals: planData.goals
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

        // Validation
        if (!templateMetadata.name.trim()) {
            setError('Template name is required');
            return;
        }

        if (!planData.duration || planData.duration < 1) {
            setError('Duration must be at least 1 week');
            return;
        }

        if (!planData.weeklyPlans || planData.weeklyPlans.length === 0) {
            setError('Please add at least one day to the weekly plan');
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
                    weeklyTemplate: planData.weeklyPlans,
                    defaultGoals: planData.goals,
                    tags: templateMetadata.tags.filter(tag => tag.trim() !== '')
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update template');
            }

            alert('Template updated successfully!');
            
            // Reset editing mode
            setIsEditingTemplate(false);
            setEditingTemplateId(null);
            setTemplateMetadata({
                name: '',
                description: '',
                category: 'General',
                tags: []
            });
            
            // Reset plan data
            setPlanData({
                title: '',
                description: '',
                duration: 1,
                goals: {
                    targetWeight: '',
                    targetCalories: '',
                    targetProtein: '',
                    targetCarbs: '',
                    targetFats: ''
                },
                weeklyPlans: []
            });
            
            // Clear location state
            window.history.replaceState({}, document.title);
        } catch (error) {
            console.error('Error updating template:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
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
                ? { ...planData } // For updates, only send plan data
                : { // For new plans, include user and form IDs
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
            console.log(`Plan ${isEditingPlan ? 'updated' : 'created'}:`, data);
            
            const wasEditing = isEditingPlan;
            
            // Reset form
            setPlanData({
                title: '',
                description: '',
                duration: 1,
                goals: {
                    targetWeight: '',
                    targetCalories: '',
                    targetProtein: '',
                    targetCarbs: '',
                    targetFats: ''
                },
                weeklyPlans: []
            });
            setSelectedUser('');
            setSelectedForm('');
            setUserForms([]);
            setIsEditingPlan(false);
            setEditingPlanId(null);
            
            alert(`Plan ${wasEditing ? 'updated' : 'created'} successfully! The form has been marked as reviewed.`);
            
            // Clear location state to prevent re-population
            window.history.replaceState({}, document.title);
        } catch (error) {
            console.error('Error creating plan:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const getDayName = (dayNumber) => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[dayNumber - 1];
    };

    // Calculate total calories for a day
    const calculateDayCalories = (day) => {
        let total = 0;
        if (day.breakfast) total += day.breakfast.calories || 0;
        if (day.lunch) total += day.lunch.calories || 0;
        if (day.dinner) total += day.dinner.calories || 0;
        if (day.snacks) {
            day.snacks.forEach(snack => total += snack.calories || 0);
        }
        return total;
    };

    // Calculate weekly total and average calories
    const calculateWeeklyStats = () => {
        if (!planData.weeklyPlans || planData.weeklyPlans.length === 0) {
            return { total: 0, average: 0 };
        }
        
        const totalCalories = planData.weeklyPlans.reduce((sum, day) => {
            return sum + calculateDayCalories(day);
        }, 0);
        
        const averageCalories = Math.round(totalCalories / planData.weeklyPlans.length);
        
        return { total: totalCalories, average: averageCalories };
    };

    return (
        <PageFade>
            <Box sx={{ p: 3 }}>
                <Typography variant="h4" gutterBottom>
                    {isEditingTemplate ? `Edit Template: ${templateMetadata.name}` : 'Plan Builder'}
                </Typography>

                {isEditingTemplate && (
                    <Typography variant="body1" color="primary" sx={{ mb: 2 }}>
                        You are editing a template. Changes will be saved to the template, not create a new plan.
                    </Typography>
                )}

                {error && (
                    <Typography color="error" sx={{ mb: 2 }}>
                        Error: {error}
                    </Typography>
                )}

                <Grid container spacing={3}>
                    {/* User and Form Selection - Only show when not editing template */}
                    {!isEditingTemplate && (
                        <Grid item xs={12} md={4}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Select User & Form
                                    </Typography>
                                    
                                    <FormControl fullWidth sx={{ mb: 2 }}>
                                        <InputLabel>Select User</InputLabel>
                                        <Select
                                            value={selectedUser}
                                            onChange={(e) => setSelectedUser(e.target.value)}
                                            label="Select User"
                                        >
                                            {users.map((user) => (
                                                <MenuItem key={user._id} value={user._id}>
                                                    {user.name} ({user.email})
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <FormControl fullWidth sx={{ mb: 2 }}>
                                        <InputLabel>Select Form</InputLabel>
                                        <Select
                                            value={selectedForm}
                                            onChange={(e) => setSelectedForm(e.target.value)}
                                            label="Select Form"
                                            disabled={!selectedUser}
                                        >
                                            {userForms.map((form) => (
                                                <MenuItem key={form._id} value={form._id}>
                                                    Form from {new Date(form.createdAt).toLocaleDateString()} 
                                                    (Weight: {form.currentWeight}kg → {form.desiredWeight}kg)
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </CardContent>
                            </Card>
                        </Grid>
                    )}

                    {/* Template Selection - Only show when not editing template */}
                    {!isEditingTemplate && (
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
                                    Templates provide pre-built meal plans that you can customize for specific users.
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
                                            onChange={(e) => handlePlanChange('duration', parseInt(e.target.value))}
                                            sx={{ mb: 2 }}
                                        />
                                        
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
                                            onChange={(e) => handlePlanChange('duration', parseInt(e.target.value))}
                                        />
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
                                
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6} md={2.4}>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            label="Target Weight (kg)"
                                            value={planData.goals.targetWeight}
                                            onChange={(e) => handlePlanChange('goals.targetWeight', e.target.value)}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={2.4}>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            label="Target Calories"
                                            value={planData.goals.targetCalories}
                                            onChange={(e) => handlePlanChange('goals.targetCalories', e.target.value)}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={2.4}>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            label="Target Protein (g)"
                                            value={planData.goals.targetProtein}
                                            onChange={(e) => handlePlanChange('goals.targetProtein', e.target.value)}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={2.4}>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            label="Target Carbs (g)"
                                            value={planData.goals.targetCarbs}
                                            onChange={(e) => handlePlanChange('goals.targetCarbs', e.target.value)}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={2.4}>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            label="Target Fats (g)"
                                            value={planData.goals.targetFats}
                                            onChange={(e) => handlePlanChange('goals.targetFats', e.target.value)}
                                        />
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Weekly Plan */}
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h6">
                                        Weekly Meal Plan
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        {planData.weeklyPlans.length > 0 && (
                                            <>
                                                <Chip 
                                                    label={`Weekly Total: ${calculateWeeklyStats().total} kcal`}
                                                    color="secondary"
                                                    size="small"
                                                />
                                                <Chip 
                                                    label={`Daily Avg: ${calculateWeeklyStats().average} kcal`}
                                                    color="primary"
                                                    size="small"
                                                />
                                            </>
                                        )}
                                        {planData.weeklyPlans.length === 0 && (
                                            <Button variant="contained" onClick={initializePlan}>
                                                Initialize 7-Day Plan
                                            </Button>
                                        )}
                                    </Box>
                                </Box>

                                {planData.weeklyPlans.map((day, dayIndex) => {
                                    const dayCalories = calculateDayCalories(day);
                                    return (
                                        <Accordion key={dayIndex}>
                                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mr: 2 }}>
                                                    <Typography variant="h6">
                                                        Day {day.day} - {getDayName(day.day)}
                                                    </Typography>
                                                    <Chip 
                                                        label={`${dayCalories} kcal`}
                                                        color="primary"
                                                        size="small"
                                                    />
                                                </Box>
                                            </AccordionSummary>
                                        <AccordionDetails>
                                            <Grid container spacing={2}>
                                                {/* Breakfast */}
                                                <Grid item xs={12} sm={6} md={3}>
                                                    <Typography variant="subtitle2" gutterBottom>Breakfast</Typography>
                                                    {day.breakfast ? (
                                                        <Chip 
                                                            label={day.breakfast.name} 
                                                            onClick={() => editMeal(dayIndex, 'breakfast', day.breakfast)}
                                                            onDelete={() => {
                                                                const newPlans = [...planData.weeklyPlans];
                                                                newPlans[dayIndex].breakfast = null;
                                                                setPlanData(prev => ({ ...prev, weeklyPlans: newPlans }));
                                                            }}
                                                            sx={{ cursor: 'pointer' }}
                                                        />
                                                    ) : (
                                                        <Button 
                                                            startIcon={<AddIcon />}
                                                            onClick={() => openMealDialog(dayIndex, 'breakfast')}
                                                        >
                                                            Add Breakfast
                                                        </Button>
                                                    )}
                                                </Grid>

                                                {/* Lunch */}
                                                <Grid item xs={12} sm={6} md={3}>
                                                    <Typography variant="subtitle2" gutterBottom>Lunch</Typography>
                                                    {day.lunch ? (
                                                        <Chip 
                                                            label={day.lunch.name} 
                                                            onClick={() => editMeal(dayIndex, 'lunch', day.lunch)}
                                                            onDelete={() => {
                                                                const newPlans = [...planData.weeklyPlans];
                                                                newPlans[dayIndex].lunch = null;
                                                                setPlanData(prev => ({ ...prev, weeklyPlans: newPlans }));
                                                            }}
                                                            sx={{ cursor: 'pointer' }}
                                                        />
                                                    ) : (
                                                        <Button 
                                                            startIcon={<AddIcon />}
                                                            onClick={() => openMealDialog(dayIndex, 'lunch')}
                                                        >
                                                            Add Lunch
                                                        </Button>
                                                    )}
                                                </Grid>

                                                {/* Dinner */}
                                                <Grid item xs={12} sm={6} md={3}>
                                                    <Typography variant="subtitle2" gutterBottom>Dinner</Typography>
                                                    {day.dinner ? (
                                                        <Chip 
                                                            label={day.dinner.name} 
                                                            onClick={() => editMeal(dayIndex, 'dinner', day.dinner)}
                                                            onDelete={() => {
                                                                const newPlans = [...planData.weeklyPlans];
                                                                newPlans[dayIndex].dinner = null;
                                                                setPlanData(prev => ({ ...prev, weeklyPlans: newPlans }));
                                                            }}
                                                            sx={{ cursor: 'pointer' }}
                                                        />
                                                    ) : (
                                                        <Button 
                                                            startIcon={<AddIcon />}
                                                            onClick={() => openMealDialog(dayIndex, 'dinner')}
                                                        >
                                                            Add Dinner
                                                        </Button>
                                                    )}
                                                </Grid>

                                                {/* Snacks */}
                                                <Grid item xs={12} sm={6} md={3}>
                                                    <Typography variant="subtitle2" gutterBottom>Snacks</Typography>
                                                    {day.snacks.map((snack, snackIndex) => (
                                                        <Chip 
                                                            key={snackIndex}
                                                            label={snack.name} 
                                                            size="small"
                                                            onClick={() => editMeal(dayIndex, 'snack', snack, snackIndex)}
                                                            sx={{ mr: 1, mb: 1, cursor: 'pointer' }}
                                                            onDelete={() => {
                                                                const newPlans = [...planData.weeklyPlans];
                                                                newPlans[dayIndex].snacks.splice(snackIndex, 1);
                                                                setPlanData(prev => ({ ...prev, weeklyPlans: newPlans }));
                                                            }}
                                                        />
                                                    ))}
                                                    <br />
                                                    <Button 
                                                        size="small"
                                                        startIcon={<AddIcon />}
                                                        onClick={() => openMealDialog(dayIndex, 'snack')}
                                                    >
                                                        Add Snack
                                                    </Button>
                                                </Grid>

                                                {/* Notes */}
                                                <Grid item xs={12}>
                                                    <TextField
                                                        fullWidth
                                                        multiline
                                                        rows={2}
                                                        label="Daily Notes"
                                                        value={day.notes}
                                                        onChange={(e) => {
                                                            const newPlans = [...planData.weeklyPlans];
                                                            newPlans[dayIndex].notes = e.target.value;
                                                            setPlanData(prev => ({ ...prev, weeklyPlans: newPlans }));
                                                        }}
                                                    />
                                                </Grid>
                                            </Grid>
                                        </AccordionDetails>
                                    </Accordion>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Actions */}
                    <Grid item xs={12}>
                        <Box sx={{ textAlign: 'center', display: 'flex', gap: 2, justifyContent: 'center' }}>
                            {isEditingTemplate ? (
                                <>
                                    <Button
                                        variant="outlined"
                                        size="large"
                                        onClick={() => {
                                            if (window.confirm('Are you sure you want to cancel editing? All unsaved changes will be lost.')) {
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
                                                    duration: 1,
                                                    goals: {
                                                        targetWeight: '',
                                                        targetCalories: '',
                                                        targetProtein: '',
                                                        targetCarbs: '',
                                                        targetFats: ''
                                                    },
                                                    weeklyPlans: []
                                                });
                                                window.history.replaceState({}, document.title);
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
                                    <Button
                                        variant="outlined"
                                        size="large"
                                        onClick={saveAsTemplate}
                                        disabled={loading || !planData.title || planData.weeklyPlans.length === 0}
                                    >
                                        Save as Template
                                    </Button>
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

                {/* Meal Dialog */}
                <Dialog open={mealDialogOpen} onClose={() => setMealDialogOpen(false)} maxWidth="md" fullWidth>
                    <DialogTitle>
                        {mealDialogMode === 'edit' ? 'Edit' : 'Add'} {currentMealType}
                    </DialogTitle>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Meal Name"
                                    value={mealData.name}
                                    onChange={(e) => setMealData(prev => ({ ...prev, name: e.target.value }))}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Calories"
                                    value={mealData.calories}
                                    onChange={(e) => setMealData(prev => ({ ...prev, calories: e.target.value }))}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={2}
                                    label="Description"
                                    value={mealData.description}
                                    onChange={(e) => setMealData(prev => ({ ...prev, description: e.target.value }))}
                                />
                            </Grid>
                            
                            {/* Nutrients */}
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" gutterBottom>Nutrients</Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={3}>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            label="Protein (g)"
                                            value={mealData.nutrients.protein}
                                            onChange={(e) => setMealData(prev => ({
                                                ...prev,
                                                nutrients: { ...prev.nutrients, protein: e.target.value }
                                            }))}
                                        />
                                    </Grid>
                                    <Grid item xs={3}>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            label="Carbs (g)"
                                            value={mealData.nutrients.carbs}
                                            onChange={(e) => setMealData(prev => ({
                                                ...prev,
                                                nutrients: { ...prev.nutrients, carbs: e.target.value }
                                            }))}
                                        />
                                    </Grid>
                                    <Grid item xs={3}>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            label="Fats (g)"
                                            value={mealData.nutrients.fats}
                                            onChange={(e) => setMealData(prev => ({
                                                ...prev,
                                                nutrients: { ...prev.nutrients, fats: e.target.value }
                                            }))}
                                        />
                                    </Grid>
                                    <Grid item xs={3}>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            label="Fiber (g)"
                                            value={mealData.nutrients.fiber}
                                            onChange={(e) => setMealData(prev => ({
                                                ...prev,
                                                nutrients: { ...prev.nutrients, fiber: e.target.value }
                                            }))}
                                        />
                                    </Grid>
                                </Grid>
                            </Grid>

                            {/* Ingredients */}
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Ingredients
                                    <Button size="small" onClick={() => addListItem('ingredients')} sx={{ ml: 1 }}>
                                        Add Ingredient
                                    </Button>
                                </Typography>
                                {mealData.ingredients.map((ingredient, index) => (
                                    <Box key={index} sx={{ display: 'flex', mb: 1 }}>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            value={ingredient}
                                            onChange={(e) => updateListItem('ingredients', index, e.target.value)}
                                            placeholder="Enter ingredient"
                                        />
                                        <IconButton onClick={() => removeListItem('ingredients', index)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </Box>
                                ))}
                            </Grid>

                            {/* Instructions */}
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Instructions
                                    <Button size="small" onClick={() => addListItem('instructions')} sx={{ ml: 1 }}>
                                        Add Step
                                    </Button>
                                </Typography>
                                {mealData.instructions.map((instruction, index) => (
                                    <Box key={index} sx={{ display: 'flex', mb: 1 }}>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            value={instruction}
                                            onChange={(e) => updateListItem('instructions', index, e.target.value)}
                                            placeholder={`Step ${index + 1}`}
                                        />
                                        <IconButton onClick={() => removeListItem('instructions', index)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </Box>
                                ))}
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setMealDialogOpen(false)}>Cancel</Button>
                        <Button onClick={saveMeal} variant="contained" disabled={!mealData.name}>
                            {mealDialogMode === 'edit' ? 'Update Meal' : 'Add Meal'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </PageFade>
    );
}
