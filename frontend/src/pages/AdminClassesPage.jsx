import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Grid,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    IconButton,
    Chip,
    Alert,
    Snackbar,
    useTheme,
    useMediaQuery,
    Stack,
    Divider
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Circle as CircleIcon
} from '@mui/icons-material';
import PageFade from '../components/PageFade';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function AdminClassesPage() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [editingClass, setEditingClass] = useState(null);
    const [classToDelete, setClassToDelete] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [viewingClass, setViewingClass] = useState(null);
    
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        color: '#1976d2',
        icon: '',
        order: 0,
        isActive: true
    });

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${apiBaseUrl}/api/admin/classes`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch classes');
            }

            const data = await response.json();
            setClasses(data.classes);
        } catch (error) {
            console.error('Error fetching classes:', error);
            setError(error.message);
            setSnackbar({ open: true, message: 'Failed to fetch classes', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (classToEdit = null) => {
        if (classToEdit) {
            setEditingClass(classToEdit);
            setFormData({
                name: classToEdit.name,
                description: classToEdit.description || '',
                color: classToEdit.color || '#1976d2',
                icon: classToEdit.icon || '',
                order: classToEdit.order || 0,
                isActive: classToEdit.isActive !== false
            });
        } else {
            setEditingClass(null);
            setFormData({
                name: '',
                description: '',
                color: '#1976d2',
                icon: '',
                order: 0,
                isActive: true
            });
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingClass(null);
        setFormData({
            name: '',
            description: '',
            color: '#1976d2',
            icon: '',
            order: 0,
            isActive: true
        });
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            setSnackbar({ open: true, message: 'Class name is required', severity: 'error' });
            return;
        }

        try {
            const url = editingClass
                ? `${apiBaseUrl}/api/admin/classes/${editingClass._id}`
                : `${apiBaseUrl}/api/admin/classes`;

            const response = await fetch(url, {
                method: editingClass ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to save class');
            }

            const data = await response.json();
            setSnackbar({ 
                open: true, 
                message: editingClass ? 'Class updated successfully' : 'Class created successfully', 
                severity: 'success' 
            });
            
            handleCloseDialog();
            fetchClasses();
        } catch (error) {
            console.error('Error saving class:', error);
            setSnackbar({ open: true, message: error.message, severity: 'error' });
        }
    };

    const handleDeleteClick = (userClass) => {
        setClassToDelete(userClass);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!classToDelete) return;

        try {
            const response = await fetch(`${apiBaseUrl}/api/admin/classes/${classToDelete._id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete class');
            }

            setSnackbar({ open: true, message: 'Class deleted successfully', severity: 'success' });
            setDeleteDialogOpen(false);
            setClassToDelete(null);
            fetchClasses();
        } catch (error) {
            console.error('Error deleting class:', error);
            setSnackbar({ open: true, message: error.message, severity: 'error' });
        }
    };

    return (
        <PageFade>
            <Box sx={{ p: { xs: 2, md: 3 } }}>
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    mb: 3,
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: 2
                }}>
                    <Typography variant="h4" component="h1">
                        User Classes
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenDialog()}
                        fullWidth={isMobile}
                    >
                        Create New Class
                    </Button>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Grid container spacing={2}>
                    {classes.map((userClass) => (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={userClass._id}>
                            <Card 
                                sx={{ 
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    opacity: userClass.isActive ? 1 : 0.6,
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: 4
                                    }
                                }}
                                onClick={() => {
                                    setViewingClass(userClass);
                                    setViewDialogOpen(true);
                                }}
                            >
                                <CardContent sx={{ flexGrow: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <CircleIcon 
                                            sx={{ 
                                                color: userClass.color, 
                                                fontSize: 40,
                                                mr: 1
                                            }} 
                                        />
                                        <Box sx={{ flexGrow: 1 }}>
                                            <Typography variant="h6" component="h2">
                                                {userClass.name}
                                            </Typography>
                                            <Chip 
                                                label={userClass.isActive ? 'Active' : 'Inactive'}
                                                size="small"
                                                color={userClass.isActive ? 'success' : 'default'}
                                                sx={{ mt: 0.5 }}
                                            />
                                        </Box>
                                    </Box>
                                    
                                    {userClass.description && (
                                        <Typography 
                                            variant="body2" 
                                            color="text.secondary"
                                            sx={{ 
                                                mb: 2,
                                                wordBreak: 'break-word',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical'
                                            }}
                                        >
                                            {userClass.description}
                                        </Typography>
                                    )}

                                    <Stack spacing={0.5}>
                                        <Typography variant="caption" color="text.secondary">
                                            Order: {userClass.order}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Created: {new Date(userClass.createdAt).toLocaleDateString()}
                                        </Typography>
                                    </Stack>
                                </CardContent>

                                <Divider />

                                <Box sx={{ p: 1, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                    <IconButton 
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenDialog(userClass);
                                        }}
                                        color="primary"
                                    >
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton 
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteClick(userClass);
                                        }}
                                        color="error"
                                    >
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                {!loading && classes.length === 0 && (
                    <Box sx={{ textAlign: 'center', mt: 4 }}>
                        <Typography variant="h6" color="text.secondary">
                            No user classes found
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Create your first user class to organize users
                        </Typography>
                    </Box>
                )}

                {/* Create/Edit Dialog */}
                <Dialog 
                    open={dialogOpen} 
                    onClose={handleCloseDialog}
                    maxWidth="sm"
                    fullWidth
                    fullScreen={isMobile}
                >
                    <DialogTitle>
                        {editingClass ? 'Edit User Class' : 'Create New User Class'}
                    </DialogTitle>
                    <DialogContent>
                        <Stack spacing={2} sx={{ mt: 1 }}>
                            <TextField
                                label="Class Name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                fullWidth
                                required
                            />
                            
                            <TextField
                                label="Description"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                fullWidth
                                multiline
                                rows={3}
                            />

                            <Box>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    Color
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                    <input
                                        type="color"
                                        name="color"
                                        value={formData.color}
                                        onChange={handleInputChange}
                                        style={{ 
                                            width: '60px', 
                                            height: '40px', 
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer'
                                        }}
                                    />
                                    <TextField
                                        name="color"
                                        value={formData.color}
                                        onChange={handleInputChange}
                                        size="small"
                                        sx={{ flexGrow: 1 }}
                                    />
                                </Box>
                            </Box>

                            <TextField
                                label="Order"
                                name="order"
                                type="number"
                                value={formData.order}
                                onChange={handleInputChange}
                                fullWidth
                                helperText="Lower numbers appear first"
                            />

                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <input
                                    type="checkbox"
                                    name="isActive"
                                    checked={formData.isActive}
                                    onChange={handleInputChange}
                                    id="isActive"
                                />
                                <label htmlFor="isActive" style={{ marginLeft: 8, cursor: 'pointer' }}>
                                    Active
                                </label>
                            </Box>
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Cancel</Button>
                        <Button onClick={handleSubmit} variant="contained">
                            {editingClass ? 'Update' : 'Create'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* View Class Details Dialog */}
                <Dialog
                    open={viewDialogOpen}
                    onClose={() => setViewDialogOpen(false)}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <CircleIcon sx={{ color: viewingClass?.color, fontSize: 32 }} />
                            <Box sx={{ flexGrow: 1 }}>
                                {viewingClass?.name}
                                <Box>
                                    <Chip 
                                        label={viewingClass?.isActive ? 'Active' : 'Inactive'}
                                        size="small"
                                        color={viewingClass?.isActive ? 'success' : 'default'}
                                        sx={{ mt: 0.5 }}
                                    />
                                </Box>
                            </Box>
                        </Box>
                    </DialogTitle>
                    <DialogContent>
                        <Stack spacing={2}>
                            {viewingClass?.description && (
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        Description
                                    </Typography>
                                    <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
                                        {viewingClass.description}
                                    </Typography>
                                </Box>
                            )}
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Color
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box
                                        sx={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: 1,
                                            backgroundColor: viewingClass?.color,
                                            border: '1px solid',
                                            borderColor: 'divider'
                                        }}
                                    />
                                    <Typography variant="body1">{viewingClass?.color}</Typography>
                                </Box>
                            </Box>
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Order
                                </Typography>
                                <Typography variant="body1">{viewingClass?.order}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Created
                                </Typography>
                                <Typography variant="body1">
                                    {viewingClass?.createdAt && new Date(viewingClass.createdAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </Typography>
                            </Box>
                            {viewingClass?.updatedAt && viewingClass?.createdAt !== viewingClass?.updatedAt && (
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        Last Updated
                                    </Typography>
                                    <Typography variant="body1">
                                        {new Date(viewingClass.updatedAt).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </Typography>
                                </Box>
                            )}
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
                        <Button 
                            onClick={() => {
                                setViewDialogOpen(false);
                                handleOpenDialog(viewingClass);
                            }}
                            variant="outlined"
                            startIcon={<EditIcon />}
                        >
                            Edit
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog
                    open={deleteDialogOpen}
                    onClose={() => setDeleteDialogOpen(false)}
                >
                    <DialogTitle>Delete User Class</DialogTitle>
                    <DialogContent>
                        <Typography>
                            Are you sure you want to delete the class "{classToDelete?.name}"?
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            This will unassign the class from all users who currently have it.
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleDeleteConfirm} color="error" variant="contained">
                            Delete
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Snackbar */}
                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={6000}
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
            </Box>
        </PageFade>
    );
}
