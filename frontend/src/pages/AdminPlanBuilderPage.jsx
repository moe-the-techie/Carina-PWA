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
    Divider,
    useMediaQuery,
    Slide,
    Skeleton
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
import PageFade from '../components/PageFade';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

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
        status: 'draft',
        duration: 1,
        goals: {
            targetWeight: '',
            targetCalories: '',
            targetProtein: '',
            targetCarbs: '',
            targetFats: ''
        },
        recommendations: {
            avoid: [],
            useCarefully: [],
            eatDaily: [],
            breakfast: [
                { category: 'Proteins', items: [] },
                { category: 'Carbohydrates', items: [] },
                { category: 'Fruits', items: [] },
                { category: 'Vegetables', items: [] },
                { category: 'Dairy', items: [] },
                { category: 'Healthy Fats', items: [] },
                { category: 'Beverages', items: [] }
            ],
            lunch: [
                { category: 'Proteins', items: [] },
                { category: 'Carbohydrates', items: [] },
                { category: 'Fruits', items: [] },
                { category: 'Vegetables', items: [] },
                { category: 'Dairy', items: [] },
                { category: 'Healthy Fats', items: [] },
                { category: 'Beverages', items: [] }
            ],
            dinner: [
                { category: 'Proteins', items: [] },
                { category: 'Carbohydrates', items: [] },
                { category: 'Fruits', items: [] },
                { category: 'Vegetables', items: [] },
                { category: 'Dairy', items: [] },
                { category: 'Healthy Fats', items: [] },
                { category: 'Beverages', items: [] }
            ],
            exercise: []
        },
        warnings: []
    });

    // Dialog state
    
    // Chip detail dialog state
    const [chipDetailDialogOpen, setChipDetailDialogOpen] = useState(false);
    const [selectedChipContent, setSelectedChipContent] = useState('');
    const [selectedChipTitle, setSelectedChipTitle] = useState('');
    const [selectedChipCategory, setSelectedChipCategory] = useState('');

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
                        goals: {
                            targetWeight: formData.desiredWeight || '',
                            targetCalories: '',
                            targetProtein: '',
                            targetCarbs: '',
                            targetFats: ''
                        },
                        recommendations: {
                            avoid: [],
                            useCarefully: [],
                            eatDaily: [],
                            breakfast: [
                                { category: 'Proteins', items: [] },
                                { category: 'Carbohydrates', items: [] },
                                { category: 'Fruits', items: [] },
                                { category: 'Vegetables', items: [] },
                                { category: 'Dairy', items: [] },
                                { category: 'Healthy Fats', items: [] },
                                { category: 'Beverages', items: [] }
                            ],
                            lunch: [
                                { category: 'Proteins', items: [] },
                                { category: 'Carbohydrates', items: [] },
                                { category: 'Fruits', items: [] },
                                { category: 'Vegetables', items: [] },
                                { category: 'Dairy', items: [] },
                                { category: 'Healthy Fats', items: [] },
                                { category: 'Beverages', items: [] }
                            ],
                            dinner: [
                                { category: 'Proteins', items: [] },
                                { category: 'Carbohydrates', items: [] },
                                { category: 'Fruits', items: [] },
                                { category: 'Vegetables', items: [] },
                                { category: 'Dairy', items: [] },
                                { category: 'Healthy Fats', items: [] },
                                { category: 'Beverages', items: [] }
                            ],
                            exercise: []
                        },
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
                    goals: templateData.defaultGoals || {
                        targetWeight: '',
                        targetCalories: '',
                        targetProtein: '',
                        targetCarbs: '',
                        targetFats: ''
                    },
                    recommendations: (() => {
                        const defaultRecommendations = templateData.defaultRecommendations || {};
                        return {
                            avoid: defaultRecommendations.avoid || [],
                            useCarefully: defaultRecommendations.useCarefully || [],
                            eatDaily: defaultRecommendations.eatDaily || [],
                            breakfast: defaultRecommendations.breakfast || [
                                { category: 'Proteins', items: [] },
                                { category: 'Carbohydrates', items: [] },
                                { category: 'Fruits', items: [] },
                                { category: 'Vegetables', items: [] },
                                { category: 'Dairy', items: [] },
                                { category: 'Healthy Fats', items: [] },
                                { category: 'Beverages', items: [] }
                            ],
                            lunch: defaultRecommendations.lunch || [
                                { category: 'Proteins', items: [] },
                                { category: 'Carbohydrates', items: [] },
                                { category: 'Fruits', items: [] },
                                { category: 'Vegetables', items: [] },
                                { category: 'Dairy', items: [] },
                                { category: 'Healthy Fats', items: [] },
                                { category: 'Beverages', items: [] }
                            ],
                            dinner: defaultRecommendations.dinner || [
                                { category: 'Proteins', items: [] },
                                { category: 'Carbohydrates', items: [] },
                                { category: 'Fruits', items: [] },
                                { category: 'Vegetables', items: [] },
                                { category: 'Dairy', items: [] },
                                { category: 'Healthy Fats', items: [] },
                                { category: 'Beverages', items: [] }
                            ],
                            exercise: defaultRecommendations.exercise || []
                        };
                    })(),
                    warnings: templateData.defaultWarnings || []
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
                    recommendations: (() => {
                        const defaultRecommendations = templateData.defaultRecommendations || {};
                        return {
                            avoid: defaultRecommendations.avoid || [],
                            useCarefully: defaultRecommendations.useCarefully || [],
                            eatDaily: defaultRecommendations.eatDaily || [],
                            breakfast: defaultRecommendations.breakfast || [
                                { category: 'Proteins', items: [] },
                                { category: 'Carbohydrates', items: [] },
                                { category: 'Fruits', items: [] },
                                { category: 'Vegetables', items: [] },
                                { category: 'Dairy', items: [] },
                                { category: 'Healthy Fats', items: [] },
                                { category: 'Beverages', items: [] }
                            ],
                            lunch: defaultRecommendations.lunch || [
                                { category: 'Proteins', items: [] },
                                { category: 'Carbohydrates', items: [] },
                                { category: 'Fruits', items: [] },
                                { category: 'Vegetables', items: [] },
                                { category: 'Dairy', items: [] },
                                { category: 'Healthy Fats', items: [] },
                                { category: 'Beverages', items: [] }
                            ],
                            dinner: defaultRecommendations.dinner || [
                                { category: 'Proteins', items: [] },
                                { category: 'Carbohydrates', items: [] },
                                { category: 'Fruits', items: [] },
                                { category: 'Vegetables', items: [] },
                                { category: 'Dairy', items: [] },
                                { category: 'Healthy Fats', items: [] },
                                { category: 'Beverages', items: [] }
                            ],
                            exercise: defaultRecommendations.exercise || []
                        };
                    })(),
                    warnings: templateData.defaultWarnings || []
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
                
                const recommendations = existingPlan.recommendations || {};
                setPlanData({
                    title: existingPlan.title,
                    description: existingPlan.description,
                    status: existingPlan.status || 'draft',
                    duration: existingPlan.duration,
                    goals: existingPlan.goals || {
                        targetWeight: '',
                        targetCalories: '',
                        targetProtein: '',
                        targetCarbs: '',
                        targetFats: ''
                    },
                    recommendations: {
                        avoid: recommendations.avoid || [],
                        useCarefully: recommendations.useCarefully || [],
                        eatDaily: recommendations.eatDaily || [],
                        breakfast: recommendations.breakfast || [
                            { category: 'Proteins', items: [] },
                            { category: 'Carbohydrates', items: [] },
                            { category: 'Fruits', items: [] },
                            { category: 'Vegetables', items: [] },
                            { category: 'Dairy', items: [] },
                            { category: 'Healthy Fats', items: [] },
                            { category: 'Beverages', items: [] }
                        ],
                        lunch: recommendations.lunch || [
                            { category: 'Proteins', items: [] },
                            { category: 'Carbohydrates', items: [] },
                            { category: 'Fruits', items: [] },
                            { category: 'Vegetables', items: [] },
                            { category: 'Dairy', items: [] },
                            { category: 'Healthy Fats', items: [] },
                            { category: 'Beverages', items: [] }
                        ],
                        dinner: recommendations.dinner || [
                            { category: 'Proteins', items: [] },
                            { category: 'Carbohydrates', items: [] },
                            { category: 'Fruits', items: [] },
                            { category: 'Vegetables', items: [] },
                            { category: 'Dairy', items: [] },
                            { category: 'Healthy Fats', items: [] },
                            { category: 'Beverages', items: [] }
                        ],
                        exercise: recommendations.exercise || []
                    },
                    warnings: existingPlan.warnings || []
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
                goals: template.defaultGoals || {
                    targetWeight: '',
                    targetCalories: '',
                    targetProtein: '',
                    targetCarbs: '',
                    targetFats: ''
                },
                recommendations: (() => {
                    const templateRecommendations = template.defaultRecommendations || {};
                    return {
                        avoid: templateRecommendations.avoid || [],
                        useCarefully: templateRecommendations.useCarefully || [],
                        eatDaily: templateRecommendations.eatDaily || [],
                        breakfast: templateRecommendations.breakfast || [
                            { category: 'Proteins', items: [] },
                            { category: 'Carbohydrates', items: [] },
                            { category: 'Fruits', items: [] },
                            { category: 'Vegetables', items: [] },
                            { category: 'Dairy', items: [] },
                            { category: 'Healthy Fats', items: [] },
                            { category: 'Beverages', items: [] }
                        ],
                        lunch: templateRecommendations.lunch || [
                            { category: 'Proteins', items: [] },
                            { category: 'Carbohydrates', items: [] },
                            { category: 'Fruits', items: [] },
                            { category: 'Vegetables', items: [] },
                            { category: 'Dairy', items: [] },
                            { category: 'Healthy Fats', items: [] },
                            { category: 'Beverages', items: [] }
                        ],
                        dinner: templateRecommendations.dinner || [
                            { category: 'Proteins', items: [] },
                            { category: 'Carbohydrates', items: [] },
                            { category: 'Fruits', items: [] },
                            { category: 'Vegetables', items: [] },
                            { category: 'Dairy', items: [] },
                            { category: 'Healthy Fats', items: [] },
                            { category: 'Beverages', items: [] }
                        ],
                        exercise: templateRecommendations.exercise || []
                    };
                })(),
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

            setError(`Template "${template.name}" loaded successfully!`);
            setTimeout(() => setError(''), 3000);
        } catch (error) {
            console.error('Error loading template:', error);
            setError(error.message);
        }
    };



    // Helper functions for managing recommendations
    const addRecommendation = (category, value) => {
        if (value.trim()) {
            setPlanData(prev => ({
                ...prev,
                recommendations: {
                    ...prev.recommendations,
                    [category]: [...prev.recommendations[category], value.trim()]
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

    const [newRecommendationInputs, setNewRecommendationInputs] = useState({
        avoid: '',
        useCarefully: '',
        eatDaily: '',
        exercise: ''
    });

    // Meal category food inputs
    const [newMealFoodInputs, setNewMealFoodInputs] = useState({
        breakfast: {},
        lunch: {},
        dinner: {}
    });

    // Helper functions for managing warnings
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

    const [newWarningInput, setNewWarningInput] = useState('');

    // Helper functions for managing meal food categories
    const addMealFood = (mealType, category, value) => {
        if (value.trim()) {
            setPlanData(prev => ({
                ...prev,
                recommendations: {
                    ...prev.recommendations,
                    [mealType]: prev.recommendations[mealType].map(cat => 
                        cat.category === category
                            ? { ...cat, items: [...cat.items, value.trim()] }
                            : cat
                    )
                }
            }));
        }
    };

    const removeMealFood = (mealType, category, itemIndex) => {
        setPlanData(prev => ({
            ...prev,
            recommendations: {
                ...prev.recommendations,
                [mealType]: prev.recommendations[mealType].map(cat => 
                    cat.category === category
                        ? { ...cat, items: cat.items.filter((_, i) => i !== itemIndex) }
                        : cat
                )
            }
        }));
    };

    const handleMealFoodInputChange = (mealType, category, value) => {
        setNewMealFoodInputs(prev => ({
            ...prev,
            [mealType]: {
                ...prev[mealType],
                [category]: value
            }
        }));
    };

    const handleMealFoodSubmit = (mealType, category) => {
        const value = newMealFoodInputs[mealType]?.[category] || '';
        if (value.trim()) {
            addMealFood(mealType, category, value);
            setNewMealFoodInputs(prev => ({
                ...prev,
                [mealType]: {
                    ...prev[mealType],
                    [category]: ''
                }
            }));
        }
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
                    defaultGoals: planData.goals,
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

        // Validation
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
                    defaultGoals: planData.goals,
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
                status: 'draft',
                duration: 1,
                goals: {
                    targetWeight: '',
                    targetCalories: '',
                    targetProtein: '',
                    targetCarbs: '',
                    targetFats: ''
                },
                recommendations: {
                    avoid: [],
                    useCarefully: [],
                    eatDaily: [],
                    breakfast: [
                        { category: 'Proteins', items: [] },
                        { category: 'Carbohydrates', items: [] },
                        { category: 'Fruits', items: [] },
                        { category: 'Dairy', items: [] },
                        { category: 'Healthy Fats', items: [] },
                        { category: 'Beverages', items: [] }
                    ],
                    lunch: [
                        { category: 'Proteins', items: [] },
                        { category: 'Carbohydrates', items: [] },
                        { category: 'Vegetables', items: [] },
                        { category: 'Healthy Fats', items: [] },
                        { category: 'Dairy', items: [] },
                        { category: 'Beverages', items: [] }
                    ],
                    dinner: [
                        { category: 'Proteins', items: [] },
                        { category: 'Carbohydrates', items: [] },
                        { category: 'Vegetables', items: [] },
                        { category: 'Healthy Fats', items: [] },
                        { category: 'Dairy', items: [] },
                        { category: 'Beverages', items: [] }
                    ],
                    exercise: []
                },
                warnings: []
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
                status: 'draft',
                duration: 1,
                goals: {
                    targetWeight: '',
                    targetCalories: '',
                    targetProtein: '',
                    targetCarbs: '',
                    targetFats: ''
                },
                recommendations: {
                    avoid: [],
                    useCarefully: [],
                    eatDaily: [],
                    breakfast: [
                        { category: 'Proteins', items: [] },
                        { category: 'Carbohydrates', items: [] },
                        { category: 'Fruits', items: [] },
                        { category: 'Dairy', items: [] },
                        { category: 'Healthy Fats', items: [] },
                        { category: 'Beverages', items: [] }
                    ],
                    lunch: [
                        { category: 'Proteins', items: [] },
                        { category: 'Carbohydrates', items: [] },
                        { category: 'Vegetables', items: [] },
                        { category: 'Healthy Fats', items: [] },
                        { category: 'Dairy', items: [] },
                        { category: 'Beverages', items: [] }
                    ],
                    dinner: [
                        { category: 'Proteins', items: [] },
                        { category: 'Carbohydrates', items: [] },
                        { category: 'Vegetables', items: [] },
                        { category: 'Healthy Fats', items: [] },
                        { category: 'Dairy', items: [] },
                        { category: 'Beverages', items: [] }
                    ],
                    exercise: []
                },
                warnings: []
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





    return (
        <PageFade>
            <Box sx={{ 
                p: { xs: 1, sm: 2, md: 3 },
                maxWidth: '100%',
                overflow: 'hidden'
            }}>
                <Typography 
                    variant={"h4"}
                    sx={{ 
                        fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
                        textAlign: { xs: 'center', sm: 'left' }
                    }}
                    gutterBottom
                >
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
                                    <Typography variant="h6" gutterBottom>
                                        Form Details
                                    </Typography>
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

                                        <Typography variant="subtitle2" color="primary">Medications</Typography>
                                        <Typography variant="body2" paragraph>
                                            {currentFormData.medications && currentFormData.medications.length > 0 
                                                ? currentFormData.medications.join(', ') 
                                                : 'None'}
                                        </Typography>

                                        <Typography variant="subtitle2" color="primary">Goals</Typography>
                                        <Typography variant="body2" paragraph>
                                            {currentFormData.goals && currentFormData.goals.length > 0 
                                                ? currentFormData.goals.join(', ') 
                                                : 'None'}
                                        </Typography>
                                        
                                        <Typography variant="subtitle2" color="primary">Smoker</Typography>
                                        <Typography variant="body2" paragraph>
                                            {currentFormData.currentSmoker ? 'Yes' : 'No'}
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    )}

                    {/* Template Selection - Only show when not editing template and templates are enabled */}
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
                                            sx={{ mb: 2 }}
                                        />

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
                                            onChange={(e) => handlePlanChange('goals.targetWeight', e.target.value)}
                                            size="small"
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={2.4}>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            label="Target Calories"
                                            value={planData.goals.targetCalories}
                                            onChange={(e) => handlePlanChange('goals.targetCalories', e.target.value)}
                                            size="small"
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={2.4}>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            label="Target Protein (g)"
                                            value={planData.goals.targetProtein}
                                            onChange={(e) => handlePlanChange('goals.targetProtein', e.target.value)}
                                            size="small"
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={2.4}>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            label="Target Carbs (g)"
                                            value={planData.goals.targetCarbs}
                                            onChange={(e) => handlePlanChange('goals.targetCarbs', e.target.value)}
                                            size="small"
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={2.4}>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            label="Target Fats (g)"
                                            value={planData.goals.targetFats}
                                            onChange={(e) => handlePlanChange('goals.targetFats', e.target.value)}
                                            size="small"
                                        />
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Recommendations */}
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Dietary Recommendations
                                </Typography>
                                
                                <Grid container spacing={{ xs: 2, sm: 3 }}>
                                    {/* Avoid */}
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Box>
                                            <Typography variant="subtitle1" color="error" gutterBottom>
                                                Avoid
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                                                {planData.recommendations.avoid.map((item, index) => (
                                                    <Chip
                                                        key={index}
                                                        label={item.length > 30 ? `${item.substring(0, 30)}...` : item}
                                                        onClick={() => openChipDetailDialog(item, 'Avoid Item', 'Avoid')}
                                                        onDelete={(e) => {
                                                            e.stopPropagation();
                                                            removeRecommendation('avoid', index);
                                                        }}
                                                        color="error"
                                                        size="small"
                                                        sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'error.dark' } }}
                                                    />
                                                ))}
                                            </Box>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                placeholder="Add item to avoid"
                                                value={newRecommendationInputs.avoid}
                                                onChange={(e) => setNewRecommendationInputs(prev => ({
                                                    ...prev,
                                                    avoid: e.target.value
                                                }))}
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
                                                Use Carefully
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                                                {planData.recommendations.useCarefully.map((item, index) => (
                                                    <Chip
                                                        key={index}
                                                        label={item.length > 30 ? `${item.substring(0, 30)}...` : item}
                                                        onClick={() => openChipDetailDialog(item, 'Use Carefully Item', 'Use Carefully')}
                                                        onDelete={(e) => {
                                                            e.stopPropagation();
                                                            removeRecommendation('useCarefully', index);
                                                        }}
                                                        color="warning"
                                                        size="small"
                                                        sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'warning.dark' } }}
                                                    />
                                                ))}
                                            </Box>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                placeholder="Add item to use carefully"
                                                value={newRecommendationInputs.useCarefully}
                                                onChange={(e) => setNewRecommendationInputs(prev => ({
                                                    ...prev,
                                                    useCarefully: e.target.value
                                                }))}
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

                                    {/* Eat Daily */}
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Box>
                                            <Typography variant="subtitle1" color="success.main" gutterBottom>
                                                Eat Daily
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                                                {planData.recommendations.eatDaily.map((item, index) => (
                                                    <Chip
                                                        key={index}
                                                        label={item.length > 30 ? `${item.substring(0, 30)}...` : item}
                                                        onClick={() => openChipDetailDialog(item, 'Eat Daily Item', 'Eat Daily')}
                                                        onDelete={(e) => {
                                                            e.stopPropagation();
                                                            removeRecommendation('eatDaily', index);
                                                        }}
                                                        color="success"
                                                        size="small"
                                                        sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'success.dark' } }}
                                                    />
                                                ))}
                                            </Box>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                placeholder="Add item to eat daily"
                                                value={newRecommendationInputs.eatDaily}
                                                onChange={(e) => setNewRecommendationInputs(prev => ({
                                                    ...prev,
                                                    eatDaily: e.target.value
                                                }))}
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter') {
                                                        addRecommendation('eatDaily', newRecommendationInputs.eatDaily);
                                                        setNewRecommendationInputs(prev => ({ ...prev, eatDaily: '' }));
                                                    }
                                                }}
                                                InputProps={{
                                                    endAdornment: (
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => {
                                                                addRecommendation('eatDaily', newRecommendationInputs.eatDaily);
                                                                setNewRecommendationInputs(prev => ({ ...prev, eatDaily: '' }));
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
                                                Exercise
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                                                {planData.recommendations.exercise.map((item, index) => (
                                                    <Chip
                                                        key={index}
                                                        label={item.length > 30 ? `${item.substring(0, 30)}...` : item}
                                                        onClick={() => openChipDetailDialog(item, 'Exercise Recommendation', 'Exercise')}
                                                        onDelete={(e) => {
                                                            e.stopPropagation();
                                                            removeRecommendation('exercise', index);
                                                        }}
                                                        color="info"
                                                        size="small"
                                                        sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'info.dark' } }}
                                                    />
                                                ))}
                                            </Box>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                placeholder="Add exercise recommendation"
                                                value={newRecommendationInputs.exercise}
                                                onChange={(e) => setNewRecommendationInputs(prev => ({
                                                    ...prev,
                                                    exercise: e.target.value
                                                }))}
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
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Meal-Specific Food Recommendations */}
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Meal-Specific Food Recommendations
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                    Add food options organized by categories for each meal type that users can choose from.
                                </Typography>
                                
                                {/* Breakfast Categories */}
                                <Box sx={{ mb: 4 }}>
                                    <Typography variant="h6" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        Breakfast Food Categories
                                    </Typography>
                                    <Grid container spacing={{ xs: 1, sm: 2 }}>
                                        {(planData.recommendations.breakfast || []).filter(categoryData => 
                                            categoryData && typeof categoryData === 'object' && categoryData.category
                                        ).map((categoryData, categoryIndex) => (
                                            <Grid item xs={12} sm={6} md={4} key={categoryIndex}>
                                                <Box sx={{ p: 2, border: 1, borderColor: 'primary.light', borderRadius: 2 }}>
                                                    <Typography variant="subtitle2" color="primary" gutterBottom>
                                                        {categoryData.category}
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', gap: 0.5, mb: 1, flexWrap: 'wrap', minHeight: 32 }}>
                                                        {(categoryData.items || []).filter(item => 
                                                            typeof item === 'string'
                                                        ).map((item, itemIndex) => (
                                                            <Chip
                                                                key={itemIndex}
                                                                label={item.length > 30 ? `${item.substring(0, 30)}...` : item}
                                                                onClick={() => openChipDetailDialog(item, `${categoryData.category} Item`, `Breakfast - ${categoryData.category}`)}
                                                                onDelete={(e) => {
                                                                    e.stopPropagation();
                                                                    removeMealFood('breakfast', categoryData.category, itemIndex);
                                                                }}
                                                                color="primary"
                                                                size="small"
                                                                sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'primary.dark' } }}
                                                            />
                                                        ))}
                                                    </Box>
                                                    <TextField
                                                        fullWidth
                                                        size="small"
                                                        placeholder={categoryData.category === 'Fruits' || categoryData.category === 'Vegetables' ? `Add ${categoryData.category.toLowerCase()} with quantity` : `Add ${categoryData.category.toLowerCase()}`}
                                                        value={newMealFoodInputs.breakfast?.[categoryData.category] || ''}
                                                        onChange={(e) => handleMealFoodInputChange('breakfast', categoryData.category, e.target.value)}
                                                        onKeyPress={(e) => {
                                                            if (e.key === 'Enter') {
                                                                handleMealFoodSubmit('breakfast', categoryData.category);
                                                            }
                                                        }}
                                                        InputProps={{
                                                            endAdornment: (
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => handleMealFoodSubmit('breakfast', categoryData.category)}
                                                                >
                                                                    <AddIcon />
                                                                </IconButton>
                                                            )
                                                        }}
                                                    />
                                                </Box>
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Box>

                                {/* Lunch Categories */}
                                <Box sx={{ mb: 4 }}>
                                    <Typography variant="h6" color="secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        Lunch Food Categories
                                    </Typography>
                                    <Grid container spacing={{ xs: 1, sm: 2 }}>
                                        {(planData.recommendations.lunch || []).filter(categoryData => 
                                            categoryData && typeof categoryData === 'object' && categoryData.category
                                        ).map((categoryData, categoryIndex) => (
                                            <Grid item xs={12} sm={6} md={4} key={categoryIndex}>
                                                <Box sx={{ p: 2, border: 1, borderColor: 'secondary.light', borderRadius: 2 }}>
                                                    <Typography variant="subtitle2" color="secondary" gutterBottom>
                                                        {categoryData.category}
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', gap: 0.5, mb: 1, flexWrap: 'wrap', minHeight: 32 }}>
                                                        {(categoryData.items || []).filter(item => 
                                                            typeof item === 'string'
                                                        ).map((item, itemIndex) => (
                                                            <Chip
                                                                key={itemIndex}
                                                                label={item.length > 30 ? `${item.substring(0, 30)}...` : item}
                                                                onClick={() => openChipDetailDialog(item, `${categoryData.category} Item`, `Lunch - ${categoryData.category}`)}
                                                                onDelete={(e) => {
                                                                    e.stopPropagation();
                                                                    removeMealFood('lunch', categoryData.category, itemIndex);
                                                                }}
                                                                color="secondary"
                                                                size="small"
                                                                sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'secondary.dark' } }}
                                                            />
                                                        ))}
                                                    </Box>
                                                    <TextField
                                                        fullWidth
                                                        size="small"
                                                        placeholder={categoryData.category === 'Fruits' || categoryData.category === 'Vegetables' ? `Add ${categoryData.category.toLowerCase()} with quantity` : `Add ${categoryData.category.toLowerCase()}`}
                                                        value={newMealFoodInputs.lunch?.[categoryData.category] || ''}
                                                        onChange={(e) => handleMealFoodInputChange('lunch', categoryData.category, e.target.value)}
                                                        onKeyPress={(e) => {
                                                            if (e.key === 'Enter') {
                                                                handleMealFoodSubmit('lunch', categoryData.category);
                                                            }
                                                        }}
                                                        InputProps={{
                                                            endAdornment: (
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => handleMealFoodSubmit('lunch', categoryData.category)}
                                                                >
                                                                    <AddIcon />
                                                                </IconButton>
                                                            )
                                                        }}
                                                    />
                                                </Box>
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Box>

                                {/* Dinner Categories */}
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="h6" color="success.main" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        Dinner Food Categories
                                    </Typography>
                                    <Grid container spacing={{ xs: 1, sm: 2 }}>
                                        {(planData.recommendations.dinner || []).filter(categoryData => 
                                            categoryData && typeof categoryData === 'object' && categoryData.category
                                        ).map((categoryData, categoryIndex) => (
                                            <Grid item xs={12} sm={6} md={4} key={categoryIndex}>
                                                <Box sx={{ p: 2, border: 1, borderColor: 'success.light', borderRadius: 2 }}>
                                                    <Typography variant="subtitle2" color="success.main" gutterBottom>
                                                        {categoryData.category}
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', gap: 0.5, mb: 1, flexWrap: 'wrap', minHeight: 32 }}>
                                                        {(categoryData.items || []).filter(item => 
                                                            typeof item === 'string'
                                                        ).map((item, itemIndex) => (
                                                            <Chip
                                                                key={itemIndex}
                                                                label={item.length > 30 ? `${item.substring(0, 30)}...` : item}
                                                                onClick={() => openChipDetailDialog(item, `${categoryData.category} Item`, `Dinner - ${categoryData.category}`)}
                                                                onDelete={(e) => {
                                                                    e.stopPropagation();
                                                                    removeMealFood('dinner', categoryData.category, itemIndex);
                                                                }}
                                                                color="success"
                                                                size="small"
                                                                sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'success.dark' } }}
                                                            />
                                                        ))}
                                                    </Box>
                                                    <TextField
                                                        fullWidth
                                                        size="small"
                                                        placeholder={categoryData.category === 'Fruits' || categoryData.category === 'Vegetables' ? `Add ${categoryData.category.toLowerCase()} with quantity` : `Add ${categoryData.category.toLowerCase()}`}
                                                        value={newMealFoodInputs.dinner?.[categoryData.category] || ''}
                                                        onChange={(e) => handleMealFoodInputChange('dinner', categoryData.category, e.target.value)}
                                                        onKeyPress={(e) => {
                                                            if (e.key === 'Enter') {
                                                                handleMealFoodSubmit('dinner', categoryData.category);
                                                            }
                                                        }}
                                                        InputProps={{
                                                            endAdornment: (
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => handleMealFoodSubmit('dinner', categoryData.category)}
                                                                >
                                                                    <AddIcon />
                                                                </IconButton>
                                                            )
                                                        }}
                                                    />
                                                </Box>
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Warnings */}
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                                   ️Important Warnings
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
                                            onDelete={(e) => {
                                                e.stopPropagation();
                                                removeWarning(index);
                                            }}
                                            color="error"
                                            variant="outlined"
                                            sx={{ 
                                                fontWeight: 'bold',
                                                cursor: 'pointer',
                                                '&:hover': { backgroundColor: 'error.light' },
                                                '& .MuiChip-label': {
                                                    fontWeight: 'bold'
                                                }
                                            }}
                                        />
                                    ))}
                                </Box>
                                
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={2}
                                    placeholder="Add important warning or alert (e.g., 'Consult doctor before following this plan if you have diabetes')"
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
                                                    goals: {
                                                        targetWeight: '',
                                                        targetCalories: '',
                                                        targetProtein: '',
                                                        targetCarbs: '',
                                                        targetFats: ''
                                                    }
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
            </Box>
        </PageFade>
    );
}
