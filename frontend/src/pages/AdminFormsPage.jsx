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
    Divider
} from '@mui/material';
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
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {forms.map((form) => (
                                <TableRow key={form._id}>
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
                                        <Chip 
                                            label={form.reviewed ? 'Reviewed' : 'Pending'} 
                                            color={form.reviewed ? 'success' : 'warning'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {new Date(form.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            size="small"
                                            onClick={() => openFormDetails(form)}
                                            sx={{ mr: 1 }}
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
                                                    sx={{ mr: 1 }}
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
                                            <Chip 
                                                label="Plan Sent" 
                                                color="success" 
                                                size="small" 
                                            />
                                        )}
                                    </TableCell>
                                </TableRow>
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
                                    <Card>
                                        <CardContent>
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
                                    </Card>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Card>
                                        <CardContent>
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
                                    <Card>
                                        <CardContent>
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
                                    <Card>
                                        <CardContent>
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
                            </Grid>
                        )}
                    </DialogContent>
                    <DialogActions>
                        {selectedForm && !selectedForm.reviewed && (
                            <>
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
                            </>
                        )}
                        <Button onClick={() => setFormDetailsOpen(false)}>Close</Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </PageFade>
    );
}
