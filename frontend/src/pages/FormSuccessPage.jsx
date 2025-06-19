import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { Box, Typography, Button } from '@mui/material';

export default function FormSuccessPage() {
    const navigate = useNavigate();
    const theme = useTheme();

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                backgroundColor: '#f0f0f0',
                textAlign: 'center',
                padding: 3,
            }}
        >
            <Box
                component="img"
                src="/form_success_graphic.png"
                alt="Success"
                sx={{
                    width: '200px',
                    height: 'auto',
                    mb: 4,
                }}
            />

            <Typography variant="h5" gutterBottom>
                Form Submitted Successfully!
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, color: theme.palette.contrastText.secondary, fontStyle: 'italic' }}>
                Thank you for your submission. We will review your form and get back to you shortly.
            </Typography>
            <Button variant="contained" onClick={() => navigate('/home')} sx={{ width: { xs: '100%', sm: '30%' }, height: '45px' }}>
                Go to Home
            </Button>
        </Box>
    );
}