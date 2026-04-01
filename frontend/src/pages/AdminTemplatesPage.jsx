import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    CardActions,
    Grid,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Pagination,
    IconButton,
    Menu,
    MenuItem as MenuOption,
    Divider,
    Alert,
    CircularProgress,
    Backdrop,
    Slide
} from '@mui/material';
import {
    Add as AddIcon,
    MoreVert as MoreVertIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    FileCopy as DuplicateIcon,
    Visibility as ViewIcon,
    ToggleOff as DeactivateIcon,
    ToggleOn as ActivateIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import PageFade from '../components/PageFade';
import { spacing, borderRadius, transitions, accentColors } from '../styles';
import { glassCard, glassDialog } from '../styles/glassmorphism';
import { containerVariants, itemVariants } from '../styles/animations';
import { useCachedData } from '../hooks/useCachedData';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const categories = ['Weight Loss', 'Weight Gain', 'Maintenance', 'Athletic', 'Medical', 'General'];

export default function AdminTemplatesPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    
    // State
    const [navigationLoading, setNavigationLoading] = useState(false);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [categoryFilter, setCategoryFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('');
    
    // Dialog states
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    
    // Menu state
    const [anchorEl, setAnchorEl] = useState(null);
    const [menuTemplate, setMenuTemplate] = useState(null);
    
    // Form state
    const [templateForm, setTemplateForm] = useState({
        name: '',
        description: '',
        category: '',
        duration: 1,
        tags: ''
    });

    const templatesCacheKey = useMemo(
        () => `admin_templates_p${page}_c${categoryFilter || 'all'}_q${searchQuery || 'all'}_a${activeFilter === '' ? 'all' : activeFilter}`,
        [page, categoryFilter, searchQuery, activeFilter]
    );

    const fetchTemplatesData = useCallback(async () => {
            let url = `${apiBaseUrl}/api/admin/templates?page=${page}&limit=12`;
            
            if (categoryFilter) url += `&category=${categoryFilter}`;
            if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
            if (activeFilter !== '') url += `&active=${activeFilter}`;

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch templates');
            }

            return response.json();
    }, [page, categoryFilter, searchQuery, activeFilter]);

    const {
        data: templatesData,
        isLoading: loading,
        setData: setTemplatesData,
    } = useCachedData(
        templatesCacheKey,
        fetchTemplatesData,
        {
            cacheTTL: 2 * 60 * 1000,
            initialData: { templates: [], totalPages: 1 },
            dependencies: [page, categoryFilter, searchQuery, activeFilter],
            onError: (fetchError) => {
                setError(fetchError.message || 'Failed to fetch templates');
            },
        }
    );

    const templates = templatesData?.templates || [];
    const totalPages = templatesData?.totalPages || 1;

    const doesTemplateMatchFilters = useCallback((template) => {
        if (!template) return false;

        const normalizedSearch = searchQuery.trim().toLowerCase();
        const matchesCategory = !categoryFilter || template.category === categoryFilter;
        const matchesActive = activeFilter === '' || String(Boolean(template.isActive)) === activeFilter;
        const matchesSearch =
            !normalizedSearch ||
            [
                template.name,
                template.description,
                ...(template.tags || []),
            ]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(normalizedSearch));

        return matchesCategory && matchesActive && matchesSearch;
    }, [categoryFilter, activeFilter, searchQuery]);

    const createTemplate = async () => {
        try {
            if (!templateForm.category) {
                setError('Please select a category');
                return;
            }

            const templateData = {
                ...templateForm,
                tags: templateForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
            };

            const response = await fetch(`${apiBaseUrl}/api/admin/templates`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(templateData)
            });

            if (!response.ok) {
                throw new Error('Failed to create template');
            }

            const data = await response.json().catch(() => ({}));
            const createdTemplate = data?.template;

            if (createdTemplate && page === 1 && doesTemplateMatchFilters(createdTemplate)) {
                setTemplatesData((previousData) => {
                    const previousTemplates = previousData?.templates || [];

                    if (previousTemplates.some((template) => template._id === createdTemplate._id)) {
                        return previousData;
                    }

                    return {
                        ...previousData,
                        templates: [createdTemplate, ...previousTemplates].slice(0, 12),
                        totalPages: Math.max(previousData?.totalPages || 1, 1),
                    };
                });
            }

            setCreateDialogOpen(false);
            setTemplateForm({
                name: '',
                description: '',
                category: '',
                duration: 1,
                tags: ''
            });
        } catch (error) {
            console.error('Error creating template:', error);
            setError(error.message);
        }
    };

    const duplicateTemplate = async (templateId) => {
        try {
            const response = await fetch(`${apiBaseUrl}/api/admin/templates/${templateId}/duplicate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({})
            });

            if (!response.ok) {
                throw new Error('Failed to duplicate template');
            }

            const data = await response.json().catch(() => ({}));
            const duplicatedTemplate = data?.template;

            if (duplicatedTemplate && page === 1 && doesTemplateMatchFilters(duplicatedTemplate)) {
                setTemplatesData((previousData) => {
                    const previousTemplates = previousData?.templates || [];

                    if (previousTemplates.some((template) => template._id === duplicatedTemplate._id)) {
                        return previousData;
                    }

                    return {
                        ...previousData,
                        templates: [duplicatedTemplate, ...previousTemplates].slice(0, 12),
                    };
                });
            }
        } catch (error) {
            console.error('Error duplicating template:', error);
            setError(error.message);
        }
    };

    const toggleTemplateStatus = async (templateId) => {
        try {
            const response = await fetch(`${apiBaseUrl}/api/admin/templates/${templateId}/toggle-status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to toggle template status');
            }

            const data = await response.json().catch(() => ({}));
            const updatedTemplate = data?.template;

            setTemplatesData((previousData) => {
                if (!previousData?.templates) return previousData;

                if (!updatedTemplate || !doesTemplateMatchFilters(updatedTemplate)) {
                    return {
                        ...previousData,
                        templates: previousData.templates.filter((template) => template._id !== templateId),
                    };
                }

                return {
                    ...previousData,
                    templates: previousData.templates.map((template) => (
                        template._id === templateId
                            ? { ...template, ...updatedTemplate }
                            : template
                    )),
                };
            });

            setSelectedTemplate((previous) => {
                if (!previous || previous._id !== templateId) return previous;
                if (!updatedTemplate) return previous;
                return { ...previous, ...updatedTemplate };
            });

            setMenuTemplate((previous) => {
                if (!previous || previous._id !== templateId) return previous;
                if (!updatedTemplate) return previous;
                return { ...previous, ...updatedTemplate };
            });
        } catch (error) {
            console.error('Error toggling template status:', error);
            setError(error.message);
        }
    };

    const handleCloseCreateDialog = () => {
        setCreateDialogOpen(false);
        setTemplateForm({
            name: '',
            description: '',
            category: '',
            duration: 1,
            tags: ''
        });
        setError('');
    };

    const deleteTemplate = async (templateId) => {
        if (!window.confirm('Are you sure you want to delete this template?')) {
            return;
        }

        try {
            const response = await fetch(`${apiBaseUrl}/api/admin/templates/${templateId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete template');
            }

            setTemplatesData((previousData) => {
                if (!previousData?.templates) return previousData;

                return {
                    ...previousData,
                    templates: previousData.templates.filter((template) => template._id !== templateId),
                };
            });

            setSelectedTemplate((previous) => (
                previous?._id === templateId ? null : previous
            ));

            setMenuTemplate((previous) => (
                previous?._id === templateId ? null : previous
            ));

            if (viewDialogOpen && selectedTemplate?._id === templateId) {
                setViewDialogOpen(false);
            }
        } catch (error) {
            console.error('Error deleting template:', error);
            setError(error.message);
        }
    };

    const handleMenuOpen = (event, template) => {
        setAnchorEl(event.currentTarget);
        setMenuTemplate(template);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setMenuTemplate(null);
    };

    const handleViewTemplate = (template) => {
        setSelectedTemplate(template);
        setViewDialogOpen(true);
    };

    const handleUseTemplate = async (template) => {
        try {
            setNavigationLoading(true);
            navigate('/admin/plan-builder', {
                state: { templateId: template._id, templateData: template }
            });
        } finally {
            // Reset loading state after a short delay to allow navigation
            setTimeout(() => setNavigationLoading(false), 500);
        }
    };

    const handleEditTemplate = async (template) => {
        try {
            setNavigationLoading(true);
            navigate('/admin/plan-builder', {
                state: { editTemplateId: template._id, templateData: template }
            });
        } finally {
            // Reset loading state after a short delay to allow navigation
            setTimeout(() => setNavigationLoading(false), 500);
        }
    };

    if (loading && templates.length === 0) {
        return (
            <PageFade>
                <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography>Loading templates...</Typography>
                </Box>
            </PageFade>
        );
    }

    return (
        <PageFade>
            <Box sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4" gutterBottom>
                        Plan Templates
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setCreateDialogOpen(true)}
                    >
                        Create Template
                    </Button>
                </Box>

                {/* Filters */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth
                            label="Search templates..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setPage(1);
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <FormControl fullWidth>
                            <InputLabel shrink>Category</InputLabel>
                            <Select
                                value={categoryFilter}
                                onChange={(e) => {
                                    setCategoryFilter(e.target.value);
                                    setPage(1);
                                }}
                                label="Category"
                                displayEmpty
                                notched
                            >
                                <MenuItem value="">
                                    <em>Select Category</em>
                                </MenuItem>
                                {categories.map(category => (
                                    <MenuItem key={category} value={category}>{category}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <FormControl fullWidth>
                            <InputLabel shrink>Status</InputLabel>
                            <Select
                                value={activeFilter}
                                onChange={(e) => {
                                    setActiveFilter(e.target.value);
                                    setPage(1);
                                }}
                                label="Status"
                                displayEmpty
                                notched
                            >
                                <MenuItem value="">
                                    <em>Select Status</em>
                                </MenuItem>
                                <MenuItem value="true">Active</MenuItem>
                                <MenuItem value="false">Inactive</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {/* Templates Grid */}
                <Grid container spacing={3}>
                    {templates.map((template) => (
                        <Grid item xs={12} sm={6} md={4} key={template._id}>
                            <Card 
                                sx={{ 
                                    height: '100%', 
                                    display: 'flex', 
                                    flexDirection: 'column',
                                    opacity: template.isActive ? 1 : 0.7
                                }}
                            >
                                <CardContent sx={{ flexGrow: 1 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                        <Typography variant="h6" component="h2" sx={{ flexGrow: 1 }}>
                                            {template.name}
                                        </Typography>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => handleMenuOpen(e, template)}
                                        >
                                            <MoreVertIcon />
                                        </IconButton>
                                    </Box>
                                    
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        {template.description || 'No description provided'}
                                    </Typography>
                                    
                                    <Box sx={{ mb: 2 }}>
                                        <Chip 
                                            label={template.category} 
                                            size="small" 
                                            color="primary" 
                                            sx={{ mr: 1, mb: 1 }}
                                        />
                                        <Chip 
                                            label={`${template.duration} week${template.duration > 1 ? 's' : ''}`} 
                                            size="small" 
                                            variant="outlined"
                                            sx={{ mr: 1, mb: 1 }}
                                        />
                                        {!template.isActive && (
                                            <Chip 
                                                label="Inactive" 
                                                size="small" 
                                                color="error"
                                                sx={{ mb: 1 }}
                                            />
                                        )}
                                    </Box>
                                    
                                    {template.tags && template.tags.length > 0 && (
                                        <Box sx={{ mb: 2 }}>
                                            {template.tags.map((tag, index) => (
                                                <Chip 
                                                    key={index}
                                                    label={tag} 
                                                    size="small" 
                                                    variant="outlined"
                                                    sx={{ mr: 0.5, mb: 0.5 }}
                                                />
                                            ))}
                                        </Box>
                                    )}
                                    
                                    <Typography variant="caption" color="text.secondary">
                                        Used {template.usageCount} times
                                    </Typography>
                                </CardContent>
                                
                                <CardActions>
                                    <Button 
                                        size="small" 
                                        onClick={() => handleViewTemplate(template)}
                                        startIcon={<ViewIcon />}
                                    >
                                        View
                                    </Button>
                                    {template.isActive && (
                                        <Button 
                                            size="small" 
                                            variant="contained"
                                            onClick={() => handleUseTemplate(template)}
                                        >
                                            Use Template
                                        </Button>
                                    )}
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                {/* Pagination */}
                {totalPages > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                        <Pagination
                            count={totalPages}
                            page={page}
                            onChange={(event, newPage) => setPage(newPage)}
                            color="primary"
                        />
                    </Box>
                )}

                {/* Template Menu */}
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                >
                    <MenuOption onClick={() => {
                        handleViewTemplate(menuTemplate);
                        handleMenuClose();
                    }}>
                        <ViewIcon sx={{ mr: 1 }} fontSize="small" />
                        View Details
                    </MenuOption>
                    <MenuOption onClick={() => {
                        handleEditTemplate(menuTemplate);
                        handleMenuClose();
                    }}>
                        <EditIcon sx={{ mr: 1 }} fontSize="small" />
                        Edit Template
                    </MenuOption>
                    <MenuOption onClick={() => {
                        duplicateTemplate(menuTemplate._id);
                        handleMenuClose();
                    }}>
                        <DuplicateIcon sx={{ mr: 1 }} fontSize="small" />
                        Duplicate
                    </MenuOption>
                    <Divider />
                    <MenuOption onClick={() => {
                        toggleTemplateStatus(menuTemplate._id);
                        handleMenuClose();
                    }}>
                        {menuTemplate?.isActive ? (
                            <>
                                <DeactivateIcon sx={{ mr: 1 }} fontSize="small" />
                                Deactivate
                            </>
                        ) : (
                            <>
                                <ActivateIcon sx={{ mr: 1 }} fontSize="small" />
                                Activate
                            </>
                        )}
                    </MenuOption>
                    <MenuOption 
                        onClick={() => {
                            deleteTemplate(menuTemplate._id);
                            handleMenuClose();
                        }}
                        sx={{ color: 'error.main' }}
                    >
                        <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
                        Delete
                    </MenuOption>
                </Menu>

                {/* Create Template Dialog */}
                <Dialog open={createDialogOpen} onClose={handleCloseCreateDialog} maxWidth="sm" fullWidth TransitionComponent={Transition}>
                    <DialogTitle>Create New Template</DialogTitle>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Template Name"
                                    value={templateForm.name}
                                    onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Description"
                                    value={templateForm.description}
                                    onChange={(e) => setTemplateForm(prev => ({ ...prev, description: e.target.value }))}
                                    multiline
                                    rows={3}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <FormControl fullWidth>
                                    <InputLabel shrink>Category</InputLabel>
                                    <Select
                                        value={templateForm.category}
                                        onChange={(e) => setTemplateForm(prev => ({ ...prev, category: e.target.value }))}
                                        label="Category"
                                        displayEmpty
                                        notched
                                    >
                                        <MenuItem value="">
                                            <em>Select Category</em>
                                        </MenuItem>
                                        {categories.map(category => (
                                            <MenuItem key={category} value={category}>{category}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth
                                    label="Duration (weeks)"
                                    type="number"
                                    value={templateForm.duration}
                                    onChange={(e) => setTemplateForm(prev => ({ 
                                        ...prev, 
                                        duration: e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value, 10) || 1)
                                    }))}
                                    onKeyDown={(e) => {
                                        if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') e.preventDefault();
                                    }}
                                    inputProps={{ min: 1, step: 1 }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Tags (comma separated)"
                                    value={templateForm.tags}
                                    onChange={(e) => setTemplateForm(prev => ({ ...prev, tags: e.target.value }))}
                                    helperText="Enter tags separated by commas (e.g., vegetarian, low-carb, high-protein)"
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseCreateDialog}>Cancel</Button>
                        <Button 
                            onClick={createTemplate} 
                            variant="contained"
                            disabled={!templateForm.name.trim() || !templateForm.category}
                        >
                            Create & Edit
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* View Template Dialog */}
                <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth TransitionComponent={Transition}>
                    <DialogTitle>Template Details</DialogTitle>
                    <DialogContent>
                        {selectedTemplate && (
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography variant="h6">{selectedTemplate.name}</Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        {selectedTemplate.description || 'No description provided'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle2">Category</Typography>
                                    <Typography variant="body2">{selectedTemplate.category}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle2">Duration</Typography>
                                    <Typography variant="body2">{selectedTemplate.duration} week(s)</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle2">Usage Count</Typography>
                                    <Typography variant="body2">{selectedTemplate.usageCount} times</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle2">Status</Typography>
                                    <Chip 
                                        label={selectedTemplate.isActive ? 'Active' : 'Inactive'} 
                                        color={selectedTemplate.isActive ? 'success' : 'error'}
                                        size="small"
                                    />
                                </Grid>
                                {selectedTemplate.tags && selectedTemplate.tags.length > 0 && (
                                    <Grid item xs={12}>
                                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Tags</Typography>
                                        <Box>
                                            {selectedTemplate.tags.map((tag, index) => (
                                                <Chip 
                                                    key={index}
                                                    label={tag} 
                                                    size="small" 
                                                    variant="outlined"
                                                    sx={{ mr: 0.5, mb: 0.5 }}
                                                />
                                            ))}
                                        </Box>
                                    </Grid>
                                )}
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2">Created by</Typography>
                                    <Typography variant="body2">{selectedTemplate.createdBy?.name}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2">Created</Typography>
                                    <Typography variant="body2">
                                        {new Date(selectedTemplate.createdAt).toLocaleDateString()}
                                    </Typography>
                                </Grid>
                            </Grid>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
                        {selectedTemplate?.isActive && (
                            <Button 
                                variant="contained"
                                onClick={() => {
                                    handleUseTemplate(selectedTemplate);
                                    setViewDialogOpen(false);
                                }}
                            >
                                Use Template
                            </Button>
                        )}
                    </DialogActions>
                </Dialog>

                {/* Navigation Loading Backdrop */}
                <Backdrop
                    sx={{ 
                        color: (theme) => theme.palette.primary.main,
                        zIndex: (theme) => theme.zIndex.modal + 1 
                    }}
                    open={navigationLoading}
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