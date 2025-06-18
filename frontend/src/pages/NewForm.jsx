import React, { useState } from 'react';
import PageFade from '../components/PageFade.jsx';
import { TextField, Button, MenuItem, Typography, Box } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LoadingBackdrop from '../components/LoadingBackdrop';
import FormCheckBox from '../components/FormCheckBox';
import FormGroup from '@mui/material/FormGroup';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function NewForm () {
    const theme = useTheme();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        currentWeight: '',
        allergies: [],
        currentSmoker: false,
        healthConditions: [],
        medications: [],
        minWeight: '',
        maxWeight: '',
        desiredWeight: '',
        obesityHistory: false,
        hydrated: true,
        breakfast: '',
        nightEater: false,
        coffee: false,
        sugar: '',
        snackTime: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const [backendError, setBackendError] = useState('');

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.currentWeight || isNaN(formData.currentWeight)) {
            newErrors.currentWeight = 'Current weight is required and must be a number.';
        }

        if (!formData.minWeight || isNaN(formData.minWeight)) {
            newErrors.minWeight = 'Minimum weight is required and must be a number.';
        }

        if (!formData.maxWeight || isNaN(formData.maxWeight)) {
            newErrors.maxWeight = 'Maximum weight is required and must be a number.';
        }

        if (!formData.desiredWeight || isNaN(formData.desiredWeight)) {
            newErrors.desiredWeight = 'Desired weight is required and must be a number.';
        }

        if (!['Always', 'Sometimes', 'Never'].includes(formData.breakfast)) {
            newErrors.breakfast = 'Breakfast field must be Always, Sometimes, or Never.';
        }

        if (!['Before Lunch', 'After Lunch'].includes(formData.snackTime)) {
            newErrors.snackTime = 'Snack time must be Before Lunch or After Lunch.';
        }

        if (formData.sugar === '' || isNaN(formData.sugar) || formData.sugar < 0) {
            newErrors.sugar = 'Sugar must be a non-negative number.';
        }

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

        try {
            setSubmitting(true);

            const response = await fetch(`${apiBaseUrl}/api/forms`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(formData),
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

            // TODO: navigate to plans page or show success message

        } catch (error) {
            console.error('Network error:', error);
            setBackendError('Network error: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <PageFade>
            <Box sx={{ position: 'relative', p: 2 }}>
                <Button onClick={() => navigate(-1)} sx={{ position: 'absolute', top: 12, left: 8, minWidth: 0, padding: 1 }}>
                    <ArrowBackIcon sx={{ fontSize: 42 }} />
                </Button>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Typography variant="h4" sx={{ mt: 1, mb: 2 }}>New Form</Typography>

                    <Typography variant="body1" sx={{ mb: 2, fontStyle: 'italic' }}>
                        Fill the following fields
                    </Typography>

                    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>

                            {/* Section 1 - Weight data */}
                            <Box sx={{ backgroundColor: theme.palette.background.container, p: 2, borderRadius: 3, width: { xs: '100%', md: '50%' } }}>
                                <Typography variant="h5" sx={{ textAlign: 'left', mb: 2 }}>Weight data</Typography>
                                <TextField fullWidth name="currentWeight" label="Current Weight" value={formData.currentWeight} onChange={handleChange} error={!!formErrors.currentWeight} helperText={formErrors.currentWeight} variant="standard" sx={{ mb: 2 }} />
                                <TextField fullWidth name="minWeight" label="Min Weight" value={formData.minWeight} onChange={handleChange} error={!!formErrors.minWeight} helperText={formErrors.minWeight} variant="standard" sx={{ mb: 2 }} />
                                <TextField fullWidth name="maxWeight" label="Max Weight" value={formData.maxWeight} onChange={handleChange} error={!!formErrors.maxWeight} helperText={formErrors.maxWeight} variant="standard" sx={{ mb: 2 }} />
                                <TextField fullWidth name="desiredWeight" label="Desired Weight" value={formData.desiredWeight} onChange={handleChange} error={!!formErrors.desiredWeight} helperText={formErrors.desiredWeight} variant="standard" sx={{ mb: 2 }} />
                            </Box>

                            {/* Section 2 - Meal Recall */}
                            <Box sx={{ backgroundColor: theme.palette.background.container, p: 2, borderRadius: 3, width: { xs: '100%', md: '50%' } }}>
                                <Typography variant="h5" sx={{ textAlign: 'left', mb: 2 }}>Meal Recall</Typography>
                                <TextField select fullWidth name="breakfast" label="Breakfast" value={formData.breakfast} onChange={handleChange} error={!!formErrors.breakfast} helperText={formErrors.breakfast} variant="standard" sx={{ mb: 2 }}>
                                    <MenuItem value="Always">Always</MenuItem>
                                    <MenuItem value="Sometimes">Sometimes</MenuItem>
                                    <MenuItem value="Never">Never</MenuItem>
                                </TextField>
                                <TextField select fullWidth name="snackTime" label="Snack Time" value={formData.snackTime} onChange={handleChange} error={!!formErrors.snackTime} helperText={formErrors.snackTime} variant="standard" sx={{ mb: 2 }}>
                                    <MenuItem value="Before Lunch">Before Lunch</MenuItem>
                                    <MenuItem value="After Lunch">After Lunch</MenuItem>
                                </TextField>
                                <TextField fullWidth name="sugar" label="Sugar (teaspoons per day)" value={formData.sugar} onChange={handleChange} error={!!formErrors.sugar} helperText={formErrors.sugar} variant="standard" sx={{ mb: 2 }} />
                            </Box>

                            {/* Section 3 - Check all that apply */}
                            <Box sx={{ backgroundColor: theme.palette.background.container, p: 2, pb: 0, borderRadius: 3, width: { xs: '100%', md: '50%' } }}>
                                <Typography variant="h5" sx={{ textAlign: 'left', mb: 2 }}>Check all that apply</Typography>
                                <FormGroup sx={{ ml: 1 }}>
                                    <FormCheckBox checked={formData.currentSmoker} onChange={handleChange} name="currentSmoker" label="I currently Smoke." />
                                    <FormCheckBox checked={formData.obesityHistory} onChange={handleChange} name="obesityHistory" label="I have a history of Obesity." />
                                    <FormCheckBox checked={formData.hydrated} onChange={handleChange} name="hydrated" label="I am staying Hydrated." />
                                    <FormCheckBox checked={formData.nightEater} onChange={handleChange} name="nightEater" label="I eat at night often." />
                                    <FormCheckBox checked={formData.coffee} onChange={handleChange} name="coffee" label="I drink coffee daily." />
                                </FormGroup>
                                {backendError && <Typography color="error" sx={{ mt: 1 }}>{backendError}</Typography>}
                            </Box>

                            <Button type="submit" variant="contained" sx={{ mt: 1, width: '100%' }}>Submit</Button>
                        </Box>
                    </form>
                </Box>
            </Box>
            <LoadingBackdrop open={submitting} />
        </PageFade>
    );
}
