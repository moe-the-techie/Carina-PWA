import React from 'react';
import { useLocation } from 'react-router-dom';
import { Box, Typography, Paper, Divider, useTheme } from '@mui/material';
import PageFade from '../components/PageFade';

// TODO: add the plan details above form

export default function ViewPlanPage () {
    const theme = useTheme();
    const location = useLocation();
    const form = location.state?.form;

    if (!form) {
        return (
            <Box p={3}>
                <Typography color="error" align="center">
                    No form data provided. Please navigate here from the homepage.
                </Typography>
            </Box>
        );
    }

    return (
        <PageFade>
            <Box
            sx={{
                width: '100%',
                maxWidth: 600,
                mx: 'auto',
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
            }}
            >
            <Typography variant="h4" gutterBottom>
                Form Details
            </Typography>

            <Paper elevation={2} sx={{ p: 2, backgroundColor: theme.palette.background.container }}>
                <Typography variant="h6" gutterBottom>Weight Data</Typography>
                <Typography>Current Weight: {form.currentWeight} kg</Typography>
                <Typography>Min Weight: {form.minWeight} kg</Typography>
                <Typography>Max Weight: {form.maxWeight} kg</Typography>
                <Typography>Desired Weight: {form.desiredWeight} kg</Typography>
            </Paper>

            <Paper elevation={2} sx={{ p: 2, backgroundColor: theme.palette.background.container }}>
                <Typography variant="h6" gutterBottom>Meal Recall</Typography>
                <Typography>Breakfast: {form.breakfast}</Typography>
                <Typography>Snack Time: {form.snackTime}</Typography>
                <Typography>Sugar: {form.sugar} tsp/day</Typography>
            </Paper>

            <Paper elevation={2} sx={{ p: 2, backgroundColor: theme.palette.background.container }}>
                <Typography variant="h6" gutterBottom>Medical History</Typography>
                <Typography>Allergies: {form.allergies?.join(', ') || 'None'}</Typography>
                <Typography>Health Conditions: {form.healthConditions?.join(', ') || 'None'}</Typography>
                <Typography>Medications: {form.medications?.join(', ') || 'None'}</Typography>
            </Paper>

            <Paper elevation={2} sx={{ p: 2, backgroundColor: theme.palette.background.container }}>
                <Typography variant="h6" gutterBottom>Lifestyle</Typography>
                <Typography>Smoker: {form.currentSmoker ? 'Yes' : 'No'}</Typography>
                <Typography>Obesity History: {form.obesityHistory ? 'Yes' : 'No'}</Typography>
                <Typography>Hydrated: {form.hydrated ? 'Yes' : 'No'}</Typography>
                <Typography>Night Eater: {form.nightEater ? 'Yes' : 'No'}</Typography>
                <Typography>Coffee Drinker: {form.coffee ? 'Yes' : 'No'}</Typography>
            </Paper>

            <Divider />

            <Typography variant="caption" align="center">
                Submitted on: {new Date(form.createdAt).toLocaleString()}
            </Typography>
            </Box>
        </PageFade>
    );
};