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
    Skeleton
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import FeedbackIcon from '@mui/icons-material/Feedback';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useTheme } from '@mui/material/styles';
import PageFade from '../components/PageFade';
import LoadingBackdrop from '../components/LoadingBackdrop';
import ImageViewerDialog from '../components/ImageViewerDialog';
import FormActionsDialog from '../components/FormActionsDialog';

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

    const markFormAsReviewed = async (formId) => {
        try {
            const response = await fetch(`${apiBaseUrl}/api/admin/forms/${formId}/reviewed`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to mark form as reviewed');
            }

            // Refresh forms list
            fetchForms();
            if (selectedForm && selectedForm._id === formId) {
                setFormDetailsOpen(false);
            }
        } catch (error) {
            console.error('Error marking form as reviewed:', error);
            setError(error.message);
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

    if (loading && forms.length === 0) {
        return (
            <PageFade>
                <Box sx={{ 
                    p: 3, 
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '60vh',
                    gap: 2
                }}>
                    <Box sx={{ width: '100%' }}>
                        <Skeleton variant="text" width="40%" height={48} sx={{ mb: 3 }} />
                        
                        {/* Filter Skeleton */}
                        <Skeleton variant="rounded" width={200} height={56} sx={{ mb: 3 }} />
                        
                        {/* Table Skeleton */}
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        {[1, 2, 3, 4, 5, 6].map((col) => (
                                            <TableCell key={col}>
                                                <Skeleton variant="text" width="80%" />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map((row) => (
                                        <TableRow key={row}>
                                            {[1, 2, 3, 4, 5, 6].map((col) => (
                                                <TableCell key={col}>
                                                    <Skeleton variant="text" width="90%" />
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                </Box>
            </PageFade>
        );
    }

    return (
        <PageFade>
            <Box sx={{ p: 3 }}>
                <Typography variant="h4" gutterBottom>
                    Form Management
                </Typography>

                {/* Filter */}
                <Box sx={{ mb: 3 }}>
                    <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel>Filter by Status</InputLabel>
                        <Select
                            value={reviewedFilter}
                            onChange={handleFilterChange}
                            label="Filter by Status"
                        >
                            <MenuItem value="">All Forms</MenuItem>
                            <MenuItem value="false">Pending Review</MenuItem>
                            <MenuItem value="true">Reviewed</MenuItem>
                        </Select>
                    </FormControl>
                </Box>

                {error && (
                    <Typography color="error" sx={{ mb: 2 }}>
                        Error: {error}
                    </Typography>
                )}

                {/* Forms Table/Cards */}
                {isMobile ? (
                    // Mobile Card View
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {forms.map((form) => (
                            <Card key={form._id}>
                                <CardContent>
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="h6" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {form.user?.name || 'Unknown User'}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {form.user?.email}
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                                            <Chip 
                                                label={form.reviewed ? 'Reviewed' : 'Pending'} 
                                                color={form.reviewed ? 'success' : 'warning'}
                                                size="small"
                                            />
                                            {form.reviewed && form.planSent && (
                                                <Chip 
                                                    label="Plan Sent" 
                                                    color="success" 
                                                    size="small" 
                                                />
                                            )}
                                        </Box>
                                    </Box>
                                    <Divider sx={{ my: 1.5 }} />
                                    <Grid container spacing={1}>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="text.secondary">Current Weight</Typography>
                                            <Typography variant="body1" fontWeight="medium">{form.currentWeight}kg</Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="text.secondary">Desired Weight</Typography>
                                            <Typography variant="body1" fontWeight="medium">{form.desiredWeight}kg</Typography>
                                        </Grid>
                                        {!isSmallMobile && (
                                            <Grid item xs={12}>
                                                <Typography variant="caption" color="text.secondary">Date Submitted</Typography>
                                                <Typography variant="body2">{new Date(form.createdAt).toLocaleDateString()}</Typography>
                                            </Grid>
                                        )}
                                    </Grid>
                                    <Box sx={{ mt: 2 }}>
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            color="primary"
                                            onClick={() => handleOpenActionsDialog(form)}
                                        >
                                            Actions
                                        </Button>
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}
                    </Box>
                ) : (
                    // Desktop Table View
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>User</TableCell>
                                    <TableCell>Current Weight</TableCell>
                                    <TableCell>Desired Weight</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Date Submitted</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {forms.map((form) => (
                                    <React.Fragment key={form._id}>
                                        <TableRow>
                                            <TableCell>
                                                <Box>
                                                    <Typography variant="body2" fontWeight="bold">
                                                        {form.user?.name || 'Unknown User'}
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        {form.user?.email}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>{form.currentWeight}kg</TableCell>
                                            <TableCell>{form.desiredWeight}kg</TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                    <Chip 
                                                        label={form.reviewed ? 'Reviewed' : 'Pending'} 
                                                        color={form.reviewed ? 'success' : 'warning'}
                                                        size="small"
                                                    />
                                                    {form.reviewed && form.planSent && (
                                                        <Chip 
                                                            label="Plan Sent" 
                                                            color="success" 
                                                            size="small" 
                                                        />
                                                    )}
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                {new Date(form.createdAt).toLocaleDateString()}
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell colSpan={5} sx={{ py: 1, borderBottom: '2px solid', borderBottomColor: 'divider' }}>
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    color="primary"
                                                    onClick={() => handleOpenActionsDialog(form)}
                                                >
                                                    Actions
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    </React.Fragment>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                {/* Pagination */}
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Pagination
                        count={totalPages}
                        page={page}
                        onChange={handlePageChange}
                        color="primary"
                    />
                </Box>

                {/* Form Actions Dialog */}
                <FormActionsDialog
                    open={actionsDialogOpen}
                    onClose={() => setActionsDialogOpen(false)}
                    form={selectedFormForActions}
                    onViewDetails={openFormDetails}
                    onSendPlan={sendPlan}
                    onMarkReviewed={markFormAsReviewed}
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
                >
                    <DialogTitle>Form Details</DialogTitle>
                    <DialogContent>
                        {selectedForm && (
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                        <CardContent sx={{ flexGrow: 1 }}>
                                            <Typography variant="h6" gutterBottom>
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
                                                    sx={{ mr: 1 }}
                                                >
                                                    {planLoading ? 'Loading...' : 'Send Plan'}
                                                </Button>
                                                <Button 
                                                    variant="contained" 
                                                    color="success"
                                                    onClick={() => markFormAsReviewed(selectedForm._id)}
                                                >
                                                    Mark as Reviewed
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
                            <Box sx={{ 
                                display: 'flex', 
                                flexDirection: 'column',
                                alignItems: 'center', 
                                justifyContent: 'center',
                                minHeight: { xs: '200px', sm: '300px' },
                                gap: 2,
                                p: 2
                            }}>
                                <CircularProgress size={{ xs: 40, sm: 60 }} />
                                <Typography variant="h6" color="text.secondary" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' }, textAlign: 'center' }}>
                                    Loading plan details...
                                </Typography>
                            </Box>
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

                                {/* Weekly Plans */}
                                {selectedPlan.weeklyPlans && selectedPlan.weeklyPlans.length > 0 && (
                                    <Grid item xs={12}>
                                        <Card>
                                            <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
                                                <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                                                    Weekly Meal Plans
                                                </Typography>
                                                {selectedPlan.weeklyPlans.map((day, index) => (
                                                    <Box key={index} sx={{ mb: { xs: 2, sm: 3 } }}>
                                                        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: { xs: 1, sm: 2 }, color: 'primary.main', fontSize: { xs: '1rem', sm: '1.1rem' } }}>
                                                            Day {day.day}
                                                        </Typography>
                                                        <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mt: { xs: 0.5, sm: 1 } }}>
                                                            {/* Breakfast */}
                                                            {day.breakfast && (
                                                                <Grid item xs={12} sm={6} md={3}>
                                                                    <Paper elevation={2} sx={{ p: { xs: 1.5, sm: 2 }, height: '100%', borderLeft: 3, borderColor: 'primary.main' }}>
                                                                        <Box sx={{ mb: 1.5 }}>
                                                                            <Chip label="Breakfast" color="primary" size="small" sx={{ mb: 1, fontWeight: 'bold' }} />
                                                                            <Typography variant="body1" fontWeight="bold" sx={{ fontSize: { xs: '0.95rem', sm: '1rem' } }}>
                                                                                {day.breakfast.name}
                                                                            </Typography>
                                                                            {day.breakfast.description && (
                                                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, lineHeight: 1.4 }}>
                                                                                    {day.breakfast.description}
                                                                                </Typography>
                                                                            )}
                                                                        </Box>
                                                                        
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, p: 1, backgroundColor: 'success.light', borderRadius: 1 }}>
                                                                            <Typography variant="body2" fontWeight="bold" color="success.dark">
                                                                                {day.breakfast.calories} cal
                                                                            </Typography>
                                                                        </Box>
                                                                        
                                                                        {day.breakfast.nutrients && (day.breakfast.nutrients.protein > 0 || day.breakfast.nutrients.carbs > 0 || day.breakfast.nutrients.fats > 0 || day.breakfast.nutrients.fiber > 0) && (
                                                                            <Box sx={{ mb: 1.5 }}>
                                                                                <Typography variant="caption" fontWeight="bold" display="block" sx={{ mb: 0.5, color: 'text.secondary' }}>
                                                                                    Nutrients:
                                                                                </Typography>
                                                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                                                    {day.breakfast.nutrients.protein > 0 && (
                                                                                        <Chip label={`P: ${day.breakfast.nutrients.protein}g`} size="small" variant="outlined" />
                                                                                    )}
                                                                                    {day.breakfast.nutrients.carbs > 0 && (
                                                                                        <Chip label={`C: ${day.breakfast.nutrients.carbs}g`} size="small" variant="outlined" />
                                                                                    )}
                                                                                    {day.breakfast.nutrients.fats > 0 && (
                                                                                        <Chip label={`F: ${day.breakfast.nutrients.fats}g`} size="small" variant="outlined" />
                                                                                    )}
                                                                                    {day.breakfast.nutrients.fiber > 0 && (
                                                                                        <Chip label={`Fiber: ${day.breakfast.nutrients.fiber}g`} size="small" variant="outlined" />
                                                                                    )}
                                                                                </Box>
                                                                            </Box>
                                                                        )}
                                                                        
                                                                        {day.breakfast.ingredients && day.breakfast.ingredients.length > 0 && (
                                                                            <Accordion sx={{ mt: 1, boxShadow: 0, '&:before': { display: 'none' } }}>
                                                                                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 'auto', p: 0.5, '& .MuiAccordionSummary-content': { margin: '8px 0' } }}>
                                                                                    <Typography variant="caption" fontWeight="bold" sx={{ fontSize: '0.75rem' }}>
                                                                                        Ingredients ({day.breakfast.ingredients.length})
                                                                                    </Typography>
                                                                                </AccordionSummary>
                                                                                <AccordionDetails sx={{ p: 1, pt: 0 }}>
                                                                                    {day.breakfast.ingredients.map((ing, idx) => (
                                                                                        <Typography key={idx} variant="caption" display="block" sx={{ mb: 0.3, pl: 1 }}>
                                                                                            • {ing}
                                                                                        </Typography>
                                                                                    ))}
                                                                                </AccordionDetails>
                                                                            </Accordion>
                                                                        )}
                                                                        
                                                                        {day.breakfast.instructions && day.breakfast.instructions.length > 0 && (
                                                                            <Accordion sx={{ mt: 0.5, boxShadow: 0, '&:before': { display: 'none' } }}>
                                                                                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 'auto', p: 0.5, '& .MuiAccordionSummary-content': { margin: '8px 0' } }}>
                                                                                    <Typography variant="caption" fontWeight="bold" sx={{ fontSize: '0.75rem' }}>
                                                                                        Instructions ({day.breakfast.instructions.length})
                                                                                    </Typography>
                                                                                </AccordionSummary>
                                                                                <AccordionDetails sx={{ p: 1, pt: 0 }}>
                                                                                    {day.breakfast.instructions.map((inst, idx) => (
                                                                                        <Typography key={idx} variant="caption" display="block" sx={{ mb: 0.5, lineHeight: 1.4 }}>
                                                                                            {idx + 1}. {inst}
                                                                                        </Typography>
                                                                                    ))}
                                                                                </AccordionDetails>
                                                                            </Accordion>
                                                                        )}
                                                                    </Paper>
                                                                </Grid>
                                                            )}
                                                            
                                                            {/* Lunch */}
                                                            {day.lunch && (
                                                                <Grid item xs={12} sm={6} md={3}>
                                                                    <Paper elevation={2} sx={{ p: { xs: 1.5, sm: 2 }, height: '100%', borderLeft: 3, borderColor: 'warning.main' }}>
                                                                        <Box sx={{ mb: 1.5 }}>
                                                                            <Chip label="Lunch" color="warning" size="small" sx={{ mb: 1, fontWeight: 'bold' }} />
                                                                            <Typography variant="body1" fontWeight="bold" sx={{ fontSize: { xs: '0.95rem', sm: '1rem' } }}>
                                                                                {day.lunch.name}
                                                                            </Typography>
                                                                            {day.lunch.description && (
                                                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, lineHeight: 1.4 }}>
                                                                                    {day.lunch.description}
                                                                                </Typography>
                                                                            )}
                                                                        </Box>
                                                                        
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, p: 1, backgroundColor: 'success.light', borderRadius: 1 }}>
                                                                            <Typography variant="body2" fontWeight="bold" color="success.dark">
                                                                                {day.lunch.calories} cal
                                                                            </Typography>
                                                                        </Box>
                                                                        
                                                                        {day.lunch.nutrients && (day.lunch.nutrients.protein > 0 || day.lunch.nutrients.carbs > 0 || day.lunch.nutrients.fats > 0 || day.lunch.nutrients.fiber > 0) && (
                                                                            <Box sx={{ mb: 1.5 }}>
                                                                                <Typography variant="caption" fontWeight="bold" display="block" sx={{ mb: 0.5, color: 'text.secondary' }}>
                                                                                    Nutrients:
                                                                                </Typography>
                                                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                                                    {day.lunch.nutrients.protein > 0 && (
                                                                                        <Chip label={`P: ${day.lunch.nutrients.protein}g`} size="small" variant="outlined" />
                                                                                    )}
                                                                                    {day.lunch.nutrients.carbs > 0 && (
                                                                                        <Chip label={`C: ${day.lunch.nutrients.carbs}g`} size="small" variant="outlined" />
                                                                                    )}
                                                                                    {day.lunch.nutrients.fats > 0 && (
                                                                                        <Chip label={`F: ${day.lunch.nutrients.fats}g`} size="small" variant="outlined" />
                                                                                    )}
                                                                                    {day.lunch.nutrients.fiber > 0 && (
                                                                                        <Chip label={`Fiber: ${day.lunch.nutrients.fiber}g`} size="small" variant="outlined" />
                                                                                    )}
                                                                                </Box>
                                                                            </Box>
                                                                        )}
                                                                        
                                                                        {day.lunch.ingredients && day.lunch.ingredients.length > 0 && (
                                                                            <Accordion sx={{ mt: 1, boxShadow: 0, '&:before': { display: 'none' } }}>
                                                                                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 'auto', p: 0.5, '& .MuiAccordionSummary-content': { margin: '8px 0' } }}>
                                                                                    <Typography variant="caption" fontWeight="bold" sx={{ fontSize: '0.75rem' }}>
                                                                                        Ingredients ({day.lunch.ingredients.length})
                                                                                    </Typography>
                                                                                </AccordionSummary>
                                                                                <AccordionDetails sx={{ p: 1, pt: 0 }}>
                                                                                    {day.lunch.ingredients.map((ing, idx) => (
                                                                                        <Typography key={idx} variant="caption" display="block" sx={{ mb: 0.3, pl: 1 }}>
                                                                                            • {ing}
                                                                                        </Typography>
                                                                                    ))}
                                                                                </AccordionDetails>
                                                                            </Accordion>
                                                                        )}
                                                                        
                                                                        {day.lunch.instructions && day.lunch.instructions.length > 0 && (
                                                                            <Accordion sx={{ mt: 0.5, boxShadow: 0, '&:before': { display: 'none' } }}>
                                                                                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 'auto', p: 0.5, '& .MuiAccordionSummary-content': { margin: '8px 0' } }}>
                                                                                    <Typography variant="caption" fontWeight="bold" sx={{ fontSize: '0.75rem' }}>
                                                                                        Instructions ({day.lunch.instructions.length})
                                                                                    </Typography>
                                                                                </AccordionSummary>
                                                                                <AccordionDetails sx={{ p: 1, pt: 0 }}>
                                                                                    {day.lunch.instructions.map((inst, idx) => (
                                                                                        <Typography key={idx} variant="caption" display="block" sx={{ mb: 0.5, lineHeight: 1.4 }}>
                                                                                            {idx + 1}. {inst}
                                                                                        </Typography>
                                                                                    ))}
                                                                                </AccordionDetails>
                                                                            </Accordion>
                                                                        )}
                                                                    </Paper>
                                                                </Grid>
                                                            )}
                                                            
                                                            {/* Dinner */}
                                                            {day.dinner && (
                                                                <Grid item xs={12} sm={6} md={3}>
                                                                    <Paper elevation={2} sx={{ p: { xs: 1.5, sm: 2 }, height: '100%', borderLeft: 3, borderColor: 'secondary.main' }}>
                                                                        <Box sx={{ mb: 1.5 }}>
                                                                            <Chip label="Dinner" color="secondary" size="small" sx={{ mb: 1, fontWeight: 'bold' }} />
                                                                            <Typography variant="body1" fontWeight="bold" sx={{ fontSize: { xs: '0.95rem', sm: '1rem' } }}>
                                                                                {day.dinner.name}
                                                                            </Typography>
                                                                            {day.dinner.description && (
                                                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, lineHeight: 1.4 }}>
                                                                                    {day.dinner.description}
                                                                                </Typography>
                                                                            )}
                                                                        </Box>
                                                                        
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, p: 1, backgroundColor: 'success.light', borderRadius: 1 }}>
                                                                            <Typography variant="body2" fontWeight="bold" color="success.dark">
                                                                                {day.dinner.calories} cal
                                                                            </Typography>
                                                                        </Box>
                                                                        
                                                                        {day.dinner.nutrients && (day.dinner.nutrients.protein > 0 || day.dinner.nutrients.carbs > 0 || day.dinner.nutrients.fats > 0 || day.dinner.nutrients.fiber > 0) && (
                                                                            <Box sx={{ mb: 1.5 }}>
                                                                                <Typography variant="caption" fontWeight="bold" display="block" sx={{ mb: 0.5, color: 'text.secondary' }}>
                                                                                    Nutrients:
                                                                                </Typography>
                                                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                                                    {day.dinner.nutrients.protein > 0 && (
                                                                                        <Chip label={`P: ${day.dinner.nutrients.protein}g`} size="small" variant="outlined" />
                                                                                    )}
                                                                                    {day.dinner.nutrients.carbs > 0 && (
                                                                                        <Chip label={`C: ${day.dinner.nutrients.carbs}g`} size="small" variant="outlined" />
                                                                                    )}
                                                                                    {day.dinner.nutrients.fats > 0 && (
                                                                                        <Chip label={`F: ${day.dinner.nutrients.fats}g`} size="small" variant="outlined" />
                                                                                    )}
                                                                                    {day.dinner.nutrients.fiber > 0 && (
                                                                                        <Chip label={`Fiber: ${day.dinner.nutrients.fiber}g`} size="small" variant="outlined" />
                                                                                    )}
                                                                                </Box>
                                                                            </Box>
                                                                        )}
                                                                        
                                                                        {day.dinner.ingredients && day.dinner.ingredients.length > 0 && (
                                                                            <Accordion sx={{ mt: 1, boxShadow: 0, '&:before': { display: 'none' } }}>
                                                                                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 'auto', p: 0.5, '& .MuiAccordionSummary-content': { margin: '8px 0' } }}>
                                                                                    <Typography variant="caption" fontWeight="bold" sx={{ fontSize: '0.75rem' }}>
                                                                                        Ingredients ({day.dinner.ingredients.length})
                                                                                    </Typography>
                                                                                </AccordionSummary>
                                                                                <AccordionDetails sx={{ p: 1, pt: 0 }}>
                                                                                    {day.dinner.ingredients.map((ing, idx) => (
                                                                                        <Typography key={idx} variant="caption" display="block" sx={{ mb: 0.3, pl: 1 }}>
                                                                                            • {ing}
                                                                                        </Typography>
                                                                                    ))}
                                                                                </AccordionDetails>
                                                                            </Accordion>
                                                                        )}
                                                                        
                                                                        {day.dinner.instructions && day.dinner.instructions.length > 0 && (
                                                                            <Accordion sx={{ mt: 0.5, boxShadow: 0, '&:before': { display: 'none' } }}>
                                                                                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 'auto', p: 0.5, '& .MuiAccordionSummary-content': { margin: '8px 0' } }}>
                                                                                    <Typography variant="caption" fontWeight="bold" sx={{ fontSize: '0.75rem' }}>
                                                                                        Instructions ({day.dinner.instructions.length})
                                                                                    </Typography>
                                                                                </AccordionSummary>
                                                                                <AccordionDetails sx={{ p: 1, pt: 0 }}>
                                                                                    {day.dinner.instructions.map((inst, idx) => (
                                                                                        <Typography key={idx} variant="caption" display="block" sx={{ mb: 0.5, lineHeight: 1.4 }}>
                                                                                            {idx + 1}. {inst}
                                                                                        </Typography>
                                                                                    ))}
                                                                                </AccordionDetails>
                                                                            </Accordion>
                                                                        )}
                                                                    </Paper>
                                                                </Grid>
                                                            )}
                                                            
                                                            {/* Snacks */}
                                                            {day.snacks && day.snacks.length > 0 && (
                                                                <Grid item xs={12} sm={6} md={3}>
                                                                    <Paper elevation={2} sx={{ p: { xs: 1.5, sm: 2 }, height: '100%', borderLeft: 3, borderColor: 'info.main' }}>
                                                                        <Chip label={`Snacks (${day.snacks.length})`} color="info" size="small" sx={{ mb: 1.5, fontWeight: 'bold' }} />
                                                                        {day.snacks.map((snack, snackIndex) => (
                                                                            <Box key={snackIndex} sx={{ mb: snackIndex < day.snacks.length - 1 ? 2 : 0 }}>
                                                                                <Typography variant="body2" fontWeight="bold" sx={{ fontSize: { xs: '0.875rem', sm: '0.95rem' } }}>
                                                                                    {snack.name}
                                                                                </Typography>
                                                                                {snack.description && (
                                                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, lineHeight: 1.4 }}>
                                                                                        {snack.description}
                                                                                    </Typography>
                                                                                )}
                                                                                
                                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, mb: 0.5, p: 0.5, backgroundColor: 'success.light', borderRadius: 1 }}>
                                                                                    <Typography variant="caption" fontWeight="bold" color="success.dark">
                                                                                        {snack.calories} cal
                                                                                    </Typography>
                                                                                </Box>
                                                                                
                                                                                {snack.nutrients && (snack.nutrients.protein > 0 || snack.nutrients.carbs > 0 || snack.nutrients.fats > 0 || snack.nutrients.fiber > 0) && (
                                                                                    <Box sx={{ mt: 0.5, mb: 1 }}>
                                                                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.3 }}>
                                                                                            {snack.nutrients.protein > 0 && (
                                                                                                <Chip label={`P: ${snack.nutrients.protein}g`} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                                                                                            )}
                                                                                            {snack.nutrients.carbs > 0 && (
                                                                                                <Chip label={`C: ${snack.nutrients.carbs}g`} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                                                                                            )}
                                                                                            {snack.nutrients.fats > 0 && (
                                                                                                <Chip label={`F: ${snack.nutrients.fats}g`} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                                                                                            )}
                                                                                            {snack.nutrients.fiber > 0 && (
                                                                                                <Chip label={`Fiber: ${snack.nutrients.fiber}g`} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                                                                                            )}
                                                                                        </Box>
                                                                                    </Box>
                                                                                )}
                                                                                
                                                                                {snack.ingredients && snack.ingredients.length > 0 && (
                                                                                    <Accordion sx={{ mt: 0.5, boxShadow: 0, '&:before': { display: 'none' } }}>
                                                                                        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 'auto', p: 0.5, '& .MuiAccordionSummary-content': { margin: '8px 0' } }}>
                                                                                            <Typography variant="caption" fontWeight="bold" sx={{ fontSize: '0.7rem' }}>
                                                                                                Ingredients ({snack.ingredients.length})
                                                                                            </Typography>
                                                                                        </AccordionSummary>
                                                                                        <AccordionDetails sx={{ p: 0.5, pt: 0 }}>
                                                                                            {snack.ingredients.map((ing, idx) => (
                                                                                                <Typography key={idx} variant="caption" display="block" sx={{ mb: 0.3, pl: 0.5, fontSize: '0.7rem' }}>
                                                                                                    • {ing}
                                                                                                </Typography>
                                                                                            ))}
                                                                                        </AccordionDetails>
                                                                                    </Accordion>
                                                                                )}
                                                                                
                                                                                {snack.instructions && snack.instructions.length > 0 && (
                                                                                    <Accordion sx={{ mt: 0.5, boxShadow: 0, '&:before': { display: 'none' } }}>
                                                                                        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 'auto', p: 0.5, '& .MuiAccordionSummary-content': { margin: '8px 0' } }}>
                                                                                            <Typography variant="caption" fontWeight="bold" sx={{ fontSize: '0.7rem' }}>
                                                                                                Instructions ({snack.instructions.length})
                                                                                            </Typography>
                                                                                        </AccordionSummary>
                                                                                        <AccordionDetails sx={{ p: 0.5, pt: 0 }}>
                                                                                            {snack.instructions.map((inst, idx) => (
                                                                                                <Typography key={idx} variant="caption" display="block" sx={{ mb: 0.3, lineHeight: 1.3, fontSize: '0.7rem' }}>
                                                                                                    {idx + 1}. {inst}
                                                                                                </Typography>
                                                                                            ))}
                                                                                        </AccordionDetails>
                                                                                    </Accordion>
                                                                                )}
                                                                                
                                                                                {snackIndex < day.snacks.length - 1 && <Divider sx={{ my: 1.5 }} />}
                                                                            </Box>
                                                                        ))}
                                                                    </Paper>
                                                                </Grid>
                                                            )}
                                                        </Grid>
                                                        {day.totalCalories && (
                                                            <Typography variant="body2" sx={{ mt: { xs: 1.5, sm: 2 }, fontWeight: 'bold', color: 'primary.main', fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                                                                Total Daily Calories: {day.totalCalories}
                                                            </Typography>
                                                        )}
                                                        {day.notes && (
                                                            <Paper elevation={0} sx={{ mt: { xs: 1.5, sm: 2 }, p: { xs: 1, sm: 1.5 }, backgroundColor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50' }}>
                                                                <Typography variant="body2" fontWeight="bold" color="info.main" sx={{ fontSize: { xs: '0.875rem', sm: '0.875rem' } }}>
                                                                    Notes:
                                                                </Typography>
                                                                <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic', fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                                                                    {day.notes}
                                                                </Typography>
                                                            </Paper>
                                                        )}
                                                        {index < selectedPlan.weeklyPlans.length - 1 && <Divider sx={{ my: { xs: 2, sm: 3 } }} />}
                                                    </Box>
                                                ))}
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                )}
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
