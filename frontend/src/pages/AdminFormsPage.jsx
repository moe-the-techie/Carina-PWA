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
    IconButton,
    Tooltip
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import { useTheme } from '@mui/material/styles';
import PageFade from '../components/PageFade';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function AdminFormsPage() {
    const theme = useTheme();
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

    const sendPlan = (form) => {
        // Navigate to plan builder with form data
        navigate('/admin/plan-builder', { 
            state: { 
                selectedUser: form.user._id,
                selectedForm: form._id,
                formData: form
            }
        });
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

    if (loading && forms.length === 0) {
        return (
            <PageFade>
                <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography>Loading forms...</Typography>
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

                {/* Forms Table */}
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
                                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                                                {form.user?._id && (
                                                    <Tooltip title="Message User">
                                                        <IconButton 
                                                            size="small" 
                                                            color="primary"
                                                            onClick={() => handleMessageUser(form.user._id)}
                                                        >
                                                            <ChatIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                <Button
                                                    size="small"
                                                    onClick={() => openFormDetails(form)}
                                                >
                                                    View Details
                                                </Button>
                                                {!form.reviewed && (
                                                    <>
                                                        <Button
                                                            size="small"
                                                            variant="contained"
                                                            color="primary"
                                                            onClick={() => sendPlan(form)}
                                                        >
                                                            Send Plan
                                                        </Button>
                                                        <Button
                                                            size="small"
                                                            variant="contained"
                                                            color="success"
                                                            onClick={() => markFormAsReviewed(form._id)}
                                                        >
                                                            Mark Reviewed
                                                        </Button>
                                                    </>
                                                )}
                                                {form.reviewed && form.planSent && (
                                                    <>
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            color="primary"
                                                            onClick={() => viewPlan(form)}
                                                            disabled={planLoading}
                                                        >
                                                            {planLoading ? 'Loading...' : 'View Plan'}
                                                        </Button>
                                                        <Button
                                                            size="small"
                                                            variant="contained"
                                                            color="secondary"
                                                            onClick={() => sendPlan(form)}
                                                        >
                                                            Edit Plan
                                                        </Button>
                                                    </>
                                                )}
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                </React.Fragment>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Pagination */}
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Pagination
                        count={totalPages}
                        page={page}
                        onChange={handlePageChange}
                        color="primary"
                    />
                </Box>

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
                                                    onClick={() => {
                                                        sendPlan(selectedForm);
                                                        setFormDetailsOpen(false);
                                                    }}
                                                    sx={{ mr: 1 }}
                                                >
                                                    Send Plan
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
                    onClose={() => setPlanDetailsOpen(false)}
                    maxWidth="lg"
                    fullWidth
                >
                    <DialogTitle>Plan Details</DialogTitle>
                    <DialogContent>
                        {selectedPlan && (
                            <Grid container spacing={3}>
                                {/* Plan Overview */}
                                <Grid item xs={12}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>
                                                Plan Overview
                                            </Typography>
                                            <Typography><strong>Title:</strong> {selectedPlan.title}</Typography>
                                            <Typography><strong>Description:</strong> {selectedPlan.description || 'No description'}</Typography>
                                            <Typography><strong>Duration:</strong> {selectedPlan.duration} week(s)</Typography>
                                            <Typography><strong>Status:</strong> 
                                                <Chip 
                                                    label={selectedPlan.status} 
                                                    color={selectedPlan.status === 'active' ? 'success' : 'default'}
                                                    size="small"
                                                    sx={{ ml: 1 }}
                                                />
                                            </Typography>
                                            <Typography><strong>Created by:</strong> {selectedPlan.createdBy?.name}</Typography>
                                            <Typography><strong>Created:</strong> {new Date(selectedPlan.createdAt).toLocaleDateString()}</Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {/* Goals */}
                                <Grid item xs={12} md={6}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>
                                                Goals
                                            </Typography>
                                            <Typography><strong>Target Weight:</strong> {selectedPlan.goals?.targetWeight || 'Not set'}kg</Typography>
                                            <Typography><strong>Target Calories:</strong> {selectedPlan.goals?.targetCalories || 'Not set'}</Typography>
                                            <Typography><strong>Target Protein:</strong> {selectedPlan.goals?.targetProtein || 'Not set'}g</Typography>
                                            <Typography><strong>Target Carbs:</strong> {selectedPlan.goals?.targetCarbs || 'Not set'}g</Typography>
                                            <Typography><strong>Target Fats:</strong> {selectedPlan.goals?.targetFats || 'Not set'}g</Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {/* Recommendations */}
                                <Grid item xs={12} md={6}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>
                                                Dietary Recommendations
                                            </Typography>
                                            
                                            <Box sx={{ mb: 2 }}>
                                                <Typography variant="subtitle2" color="error.main" gutterBottom>
                                                    Foods to Avoid:
                                                </Typography>
                                                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                                                    {selectedPlan.recommendations?.avoid?.length > 0 ? (
                                                        selectedPlan.recommendations.avoid.map((item, index) => (
                                                            <Chip key={index} label={item} color="error" size="small" />
                                                        ))
                                                    ) : (
                                                        <Typography variant="body2" color="text.secondary">None specified</Typography>
                                                    )}
                                                </Box>
                                            </Box>

                                            <Box sx={{ mb: 2 }}>
                                                <Typography variant="subtitle2" color="warning.main" gutterBottom>
                                                    Use Carefully:
                                                </Typography>
                                                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                                                    {selectedPlan.recommendations?.useCarefully?.length > 0 ? (
                                                        selectedPlan.recommendations.useCarefully.map((item, index) => (
                                                            <Chip key={index} label={item} color="warning" size="small" />
                                                        ))
                                                    ) : (
                                                        <Typography variant="body2" color="text.secondary">None specified</Typography>
                                                    )}
                                                </Box>
                                            </Box>

                                            <Box sx={{ mb: 2 }}>
                                                <Typography variant="subtitle2" color="success.main" gutterBottom>
                                                    Recommended Daily:
                                                </Typography>
                                                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                                                    {selectedPlan.recommendations?.eatDaily?.length > 0 ? (
                                                        selectedPlan.recommendations.eatDaily.map((item, index) => (
                                                            <Chip key={index} label={item} color="success" size="small" />
                                                        ))
                                                    ) : (
                                                        <Typography variant="body2" color="text.secondary">None specified</Typography>
                                                    )}
                                                </Box>
                                            </Box>

                                            <Box sx={{ mb: 1 }}>
                                                <Typography variant="subtitle2" color="info.main" gutterBottom>
                                                    Exercise Recommendations:
                                                </Typography>
                                                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                                    {selectedPlan.recommendations?.exercise?.length > 0 ? (
                                                        selectedPlan.recommendations.exercise.map((item, index) => (
                                                            <Chip key={index} label={item} color="info" size="small" />
                                                        ))
                                                    ) : (
                                                        <Typography variant="body2" color="text.secondary">None specified</Typography>
                                                    )}
                                                </Box>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {/* Warnings */}
                                {selectedPlan.warnings && selectedPlan.warnings.length > 0 && (
                                    <Grid item xs={12}>
                                        <Card>
                                            <CardContent>
                                                <Typography variant="h6" gutterBottom sx={{ color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    ⚠️ Important Warnings
                                                </Typography>
                                                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                                    {selectedPlan.warnings.map((warning, index) => (
                                                        <Chip 
                                                            key={index} 
                                                            label={warning} 
                                                            color="error" 
                                                            variant="outlined"
                                                            sx={{ 
                                                                fontWeight: 'bold',
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
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>
                                                User Information
                                            </Typography>
                                            <Typography><strong>Name:</strong> {selectedPlan.user?.name}</Typography>
                                            <Typography><strong>Email:</strong> {selectedPlan.user?.email}</Typography>
                                            <Typography><strong>Current Weight:</strong> {selectedPlan.form?.currentWeight}kg</Typography>
                                            <Typography><strong>Desired Weight:</strong> {selectedPlan.form?.desiredWeight}kg</Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {/* Weekly Plans */}
                                {selectedPlan.weeklyPlans && selectedPlan.weeklyPlans.length > 0 && (
                                    <Grid item xs={12}>
                                        <Card>
                                            <CardContent>
                                                <Typography variant="h6" gutterBottom>
                                                    Weekly Meal Plans
                                                </Typography>
                                                {selectedPlan.weeklyPlans.map((day, index) => (
                                                    <Box key={index} sx={{ mb: 2 }}>
                                                        <Typography variant="subtitle1" fontWeight="bold">
                                                            Day {day.day}
                                                        </Typography>
                                                        <Grid container spacing={2} sx={{ mt: 1 }}>
                                                            {day.breakfast && (
                                                                <Grid item xs={12} sm={6} md={3}>
                                                                    <Paper sx={{ p: 2 }}>
                                                                        <Typography variant="subtitle2" color="primary">Breakfast</Typography>
                                                                        <Typography variant="body2">{day.breakfast.name}</Typography>
                                                                        <Typography variant="caption">{day.breakfast.calories} cal</Typography>
                                                                    </Paper>
                                                                </Grid>
                                                            )}
                                                            {day.lunch && (
                                                                <Grid item xs={12} sm={6} md={3}>
                                                                    <Paper sx={{ p: 2 }}>
                                                                        <Typography variant="subtitle2" color="primary">Lunch</Typography>
                                                                        <Typography variant="body2">{day.lunch.name}</Typography>
                                                                        <Typography variant="caption">{day.lunch.calories} cal</Typography>
                                                                    </Paper>
                                                                </Grid>
                                                            )}
                                                            {day.dinner && (
                                                                <Grid item xs={12} sm={6} md={3}>
                                                                    <Paper sx={{ p: 2 }}>
                                                                        <Typography variant="subtitle2" color="primary">Dinner</Typography>
                                                                        <Typography variant="body2">{day.dinner.name}</Typography>
                                                                        <Typography variant="caption">{day.dinner.calories} cal</Typography>
                                                                    </Paper>
                                                                </Grid>
                                                            )}
                                                            {day.snacks && day.snacks.length > 0 && (
                                                                <Grid item xs={12} sm={6} md={3}>
                                                                    <Paper sx={{ p: 2 }}>
                                                                        <Typography variant="subtitle2" color="primary">Snacks</Typography>
                                                                        {day.snacks.map((snack, snackIndex) => (
                                                                            <Box key={snackIndex}>
                                                                                <Typography variant="body2">{snack.name}</Typography>
                                                                                <Typography variant="caption">{snack.calories} cal</Typography>
                                                                            </Box>
                                                                        ))}
                                                                    </Paper>
                                                                </Grid>
                                                            )}
                                                        </Grid>
                                                        {day.totalCalories && (
                                                            <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
                                                                Total Daily Calories: {day.totalCalories}
                                                            </Typography>
                                                        )}
                                                        {day.notes && (
                                                            <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                                                                Notes: {day.notes}
                                                            </Typography>
                                                        )}
                                                        <Divider sx={{ my: 2 }} />
                                                    </Box>
                                                ))}
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                )}
                            </Grid>
                        )}
                    </DialogContent>
                    <DialogActions>
                        {selectedPlan && (
                            <Button 
                                variant="contained" 
                                color="primary"
                                onClick={() => {
                                    // Find the form associated with this plan
                                    const associatedForm = forms.find(form => form._id === selectedPlan.form._id || form._id === selectedPlan.form);
                                    if (associatedForm) {
                                        sendPlan(associatedForm);
                                        setPlanDetailsOpen(false);
                                    }
                                }}
                                sx={{ mr: 1 }}
                            >
                                Edit Plan
                            </Button>
                        )}
                        <Button onClick={() => setPlanDetailsOpen(false)}>Close</Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </PageFade>
    );
}
