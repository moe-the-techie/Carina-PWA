import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { Box, Typography, Button } from '@mui/material';
import ImageViewerDialog from '../components/ImageViewerDialog';

export default function FormSuccessPage() {
    const navigate = useNavigate();
    const theme = useTheme();
    const [imageDialogOpen, setImageDialogOpen] = useState(false);

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                backgroundColor: theme.palette.background.default,
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
                    cursor: 'pointer',
                    '&:hover': {
                        opacity: 0.8,
                        transition: 'opacity 0.2s'
                    }
                }}
                onClick={() => setImageDialogOpen(true)}
            />

            <Typography variant="h5" gutterBottom sx={{ color: theme.palette.text.primary }}>
                Form Submitted Successfully!
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, color: theme.palette.text.secondary, fontStyle: 'italic' }}>
                Thank you for your submission. We will review your form and get back to you shortly.
            </Typography>
            <Button variant="contained" onClick={() => navigate('/home')} sx={{ width: { xs: '100%', sm: '30%' }, height: '45px' }}>
                Go to Home
            </Button>

            <ImageViewerDialog
                open={imageDialogOpen}
                imageUrl="/form_success_graphic.png"
                onClose={() => setImageDialogOpen(false)}
            />
        </Box>
    );
}