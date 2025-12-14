import React, { useState, useEffect } from 'react';
import PageFade from '../components/PageFade.jsx';
import { TextField, Button, MenuItem, Typography, Box, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBackIos';
import LoadingBackdrop from '../components/LoadingBackdrop.jsx';
import FormCheckBox from '../components/FormCheckBox.jsx';
import FormGroup from '@mui/material/FormGroup';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const MAX_GOALS = 5;
const MAX_GOAL_LENGTH = 200;

export default function NewFormPage () {
    const theme = useTheme();
    const navigate = useNavigate();
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

    return (
        <PageFade>
            { /* Sticky Header */ }
            <Box
                sx={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    backgroundColor: theme.palette.primary.main,
                    px: 2,
                    py: 1,
                    borderBottomLeftRadius: scrolledDown ? 40 : 0,
                    borderBottomRightRadius: scrolledDown ? 40 : 0,
                    transition: 'border-radius 0.4s ease',
                }}
            >
                <Button onClick={() => navigate(-1)} sx={{ position: 'absolute', top: 8, left: 10, minWidth: 0, padding: 1 }}>
                    <ArrowBackIcon sx={{ fontSize: { xs: 28, sm: 32, md: 36 }, color: theme.palette.mode === 'light' ? 'black' : theme.palette.text.primary }} />
                </Button>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Typography variant="h5" sx={{ mt: 1, mb: 1, color: theme.palette.mode === 'light' ? 'black' : theme.palette.text.primary }}>
                        New Form
                    </Typography>
                </Box>
            </Box>

            <Box sx={{ p: 2 }}>
                <Typography variant="body1" sx={{ mb: 2, fontStyle: 'italic', textAlign: 'center', color: theme.palette.contrastText.secondary }}>
                    Please fill out the form below with accurate information. This will help us provide you with the best possible plan.
                </Typography>

                <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>

                        {/* Section 1 - Medical History */}
                        <Box sx={{ backgroundColor: theme.palette.background.container, p: 2, borderRadius: 3, width: { xs: '100%', md: '50%' } }}>
                            <Typography variant="h5" sx={{ textAlign: 'left', mb: 2 }}>Medical History</Typography>
                            {['allergies', 'healthConditions', 'medications'].map((field) => (
                                <Box key={field} sx={{ mb: 2 }}>
                                    {formData[field].map((item, index) => (
                                        <TextField
                                            key={index}
                                            fullWidth
                                            variant="standard"
                                            label={`${field == 'allergies' ? 'Allergy' : field === 'healthConditions' ? 'Health Condition' : 'Medication'} (Leave blank if none)`}
                                            value={item}
                                            onChange={(e) => handleListChange(field, index, e.target.value)}
                                            error={!!formErrors[`${field}_${index}`]}
                                            helperText={formErrors[`${field}_${index}`] || ''}
                                            sx={{ mb: 1 }}
                                        />
                                    ))}
                                    <Button onClick={() => addListItem(field)} sx={{ mt: 1 }} variant="outlined" fullWidth>
                                        Add {field == 'allergies' ? 'Allergy' : field === 'healthConditions' ? 'Health Condition' : 'Medication'}
                                    </Button>
                                </Box>
                            ))}
                        </Box>

                        {/* Section 1.5 - Goals */}
                        <Box sx={{ backgroundColor: theme.palette.background.container, p: 2, borderRadius: 3, width: { xs: '100%', md: '50%' } }}>
                            <Typography variant="h5" sx={{ textAlign: 'left', mb: 2 }}>Your Goals</Typography>
                            <Typography variant="body2" sx={{ mb: 2, color: theme.palette.contrastText.secondary }}>
                                What are your health and fitness goals? (e.g., lose weight, build muscle, improve energy)
                            </Typography>
                            <Typography variant="caption" sx={{ mb: 2, display: 'block', color: theme.palette.contrastText.secondary }}>
                                Maximum {MAX_GOALS} goals, {MAX_GOAL_LENGTH} characters each
                            </Typography>
                            {formData.goals.map((goal, index) => (
                                <TextField
                                    key={index}
                                    fullWidth
                                    variant="standard"
                                    label={`Goal ${index + 1} (Leave blank if none)`}
                                    value={goal}
                                    onChange={(e) => handleListChange('goals', index, e.target.value)}
                                    error={!!formErrors[`goals_${index}`]}
                                    helperText={formErrors[`goals_${index}`] || `${goal.length}/${MAX_GOAL_LENGTH} characters`}
                                    inputProps={{ maxLength: MAX_GOAL_LENGTH }}
                                    sx={{ mb: 1 }}
                                />
                            ))}
                            {formData.goals[formData.goals.length - 1]?.trim() !== '' && formData.goals.length < MAX_GOALS && (
                                <Button onClick={() => addListItem('goals')} sx={{ mt: 1 }} variant="outlined" fullWidth>
                                    Add Goal ({formData.goals.length}/{MAX_GOALS})
                                </Button>
                            )}
                        </Box>

                        {/* Section 2 - Weight data */}
                        <Box sx={{ backgroundColor: theme.palette.background.container, p: 2, borderRadius: 3, width: { xs: '100%', md: '50%' } }}>
                            <Typography variant="h5" sx={{ textAlign: 'left', mb: 2 }}>Weight data</Typography>
                            <TextField fullWidth type="number" name="currentWeight" label="Current Weight (kg)" value={formData.currentWeight} onChange={handleChange} error={!!formErrors.currentWeight} helperText={formErrors.currentWeight} variant="standard" sx={{ mb: 2 }} />
                            <TextField fullWidth type="number" name="minWeight" label="Min Weight (kg)" value={formData.minWeight} onChange={handleChange} error={!!formErrors.minWeight} helperText={formErrors.minWeight} variant="standard" sx={{ mb: 2 }} />
                            <TextField fullWidth type="number" name="maxWeight" label="Max Weight (kg)" value={formData.maxWeight} onChange={handleChange} error={!!formErrors.maxWeight} helperText={formErrors.maxWeight} variant="standard" sx={{ mb: 2 }} />
                            <TextField fullWidth type="number" name="desiredWeight" label="Desired Weight (kg)" value={formData.desiredWeight} onChange={handleChange} error={!!formErrors.desiredWeight} helperText={formErrors.desiredWeight} variant="standard" sx={{ mb: 2 }} />
                        </Box>

                        {/* Section 3 - Meal Recall */}
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
                            <TextField fullWidth type="number" name="sugar" label="Sugar (teaspoons per day)" value={formData.sugar} onChange={handleChange} error={!!formErrors.sugar} helperText={formErrors.sugar} variant="standard" sx={{ mb: 2 }} />
                        </Box>

                        {/* Section 4 - Check all that apply */}
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

                        <Button type="submit" variant="contained" sx={{ width: { xs: '100%', md: '10%' }, minHeight: '50px' }}>Submit</Button>
                    </Box>
                </form>
            </Box>
            <LoadingBackdrop open={submitting} />
        </PageFade>
    );
}
