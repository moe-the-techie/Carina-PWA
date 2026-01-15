import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import {
    Box,
    Typography,
    Button,
    Paper,
    CircularProgress,
    Alert,
    Chip,
    Divider,
    useMediaQuery
} from '@mui/material';
import { motion } from 'framer-motion';
import PaymentIcon from '@mui/icons-material/Payment';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SecurityIcon from '@mui/icons-material/Security';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PageFade from '../components/PageFade';
import LoadingBackdrop from '../components/LoadingBackdrop';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function PaymentPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const pixelContainerRef = useRef(null);
    const pixelInitializedRef = useRef(false);

    const [loading, setLoading] = useState(true);
    const [creatingIntention, setCreatingIntention] = useState(false);
    const [error, setError] = useState('');
    const [paymentData, setPaymentData] = useState(null);
    const [creditsInfo, setCreditsInfo] = useState(null);
    const [pixelLoaded, setPixelLoaded] = useState(false);

    // Fetch credits info on mount
    useEffect(() => {
        fetchCreditsInfo();
    }, []);

    const fetchCreditsInfo = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await fetch(`${apiBaseUrl}/api/payments/credits`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch credits info');
            }

            const data = await response.json();
            setCreditsInfo(data);
        } catch (err) {
            console.error('Error fetching credits:', err);
            setError('Failed to load payment information');
        } finally {
            setLoading(false);
        }
    };

    const createPaymentIntention = async () => {
        try {
            setCreatingIntention(true);
            setError('');

            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await fetch(`${apiBaseUrl}/api/payments/create-intention`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create payment');
            }

            setPaymentData(data.payment);
            
            // Load Paymob Pixel SDK
            await loadPixelSDK(data.payment);

        } catch (err) {
            console.error('Payment creation error:', err);
            setError(err.message || 'Failed to initialize payment');
        } finally {
            setCreatingIntention(false);
        }
    };

    const loadPixelSDK = async (payment) => {
        if (pixelInitializedRef.current) return;

        try {
            // Load Pixel CSS
            if (!document.querySelector('link[href*="paymob-pixel"]')) {
                const styleLink = document.createElement('link');
                styleLink.rel = 'stylesheet';
                styleLink.href = 'https://cdn.jsdelivr.net/npm/paymob-pixel@latest/styles.css';
                document.head.appendChild(styleLink);

                const mainCss = document.createElement('link');
                mainCss.rel = 'stylesheet';
                mainCss.href = 'https://cdn.jsdelivr.net/npm/paymob-pixel@latest/main.css';
                document.head.appendChild(mainCss);
            }

            // Load Pixel JS
            if (!document.querySelector('script[src*="paymob-pixel"]')) {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/paymob-pixel@latest/main.js';
                script.type = 'module';
                script.onload = () => initializePixel(payment);
                document.body.appendChild(script);
            } else {
                initializePixel(payment);
            }

        } catch (err) {
            console.error('Error loading Pixel SDK:', err);
            setError('Failed to load payment form');
        }
    };

    const initializePixel = (payment) => {
        if (pixelInitializedRef.current) return;
        
        // Wait for Pixel to be available
        const checkPixel = setInterval(() => {
            if (window.Pixel) {
                clearInterval(checkPixel);
                
                try {
                    new window.Pixel({
                        publicKey: payment.publicKey,
                        clientSecret: payment.clientSecret,
                        elementId: 'paymob-checkout',
                        paymentMethods: ['card'],
                        showSaveCard: false,
                        customStyle: {
                            Font_Family: theme.typography.fontFamily,
                            Color_Container: theme.palette.mode === 'dark' ? '#1e1e2d' : '#ffffff',
                            Color_Primary: theme.palette.primary.main,
                            Color_Border_Input_Fields: theme.palette.mode === 'dark' ? '#3d3d5c' : '#e0e0e0',
                            Color_Input_Fields: theme.palette.mode === 'dark' ? '#2d2d3d' : '#ffffff',
                            Text_Color_For_Label: theme.palette.text.primary,
                            Text_Color_For_Input_Fields: theme.palette.text.primary,
                            Text_Color_For_Payment_Button: '#ffffff',
                            Radius_Border: '12',
                            Width_of_Container: '100%'
                        },
                        beforePaymentComplete: async (paymentMethod) => {
                            console.log('Before payment complete:', paymentMethod);
                            return true;
                        },
                        afterPaymentComplete: async (response) => {
                            console.log('Payment response:', response);
                            if (response.success) {
                                navigate('/payment/success?payment_id=' + payment.id);
                            } else {
                                setError('Payment failed. Please try again.');
                            }
                        }
                    });
                    
                    pixelInitializedRef.current = true;
                    setPixelLoaded(true);
                } catch (err) {
                    console.error('Pixel initialization error:', err);
                    setError('Failed to initialize payment form');
                }
            }
        }, 100);

        // Timeout after 10 seconds
        setTimeout(() => {
            clearInterval(checkPixel);
            if (!pixelInitializedRef.current) {
                setError('Payment form loading timeout. Please refresh the page.');
            }
        }, 10000);
    };

    // Glassmorphism card style
    const glassCardStyle = {
        background: theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.05)'
            : 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: 4,
        border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
        boxShadow: theme.palette.mode === 'dark'
            ? '0 8px 32px rgba(0, 0, 0, 0.3)'
            : '0 8px 32px rgba(0, 0, 0, 0.08)',
    };

    if (loading) {
        return <LoadingBackdrop open={true} />;
    }

    return (
        <PageFade>
            <Box
                sx={{
                    minHeight: '100vh',
                    background: theme.palette.mode === 'dark'
                        ? `linear-gradient(135deg, ${theme.palette.background.default} 0%, #1a1a2e 50%, #16213e 100%)`
                        : `linear-gradient(135deg, #f5f7fa 0%, #e3f2fd 50%, #bbdefb 100%)`,
                    py: 4,
                    px: 2
                }}
            >
                <Box sx={{ maxWidth: 600, mx: 'auto' }}>
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Button
                            startIcon={<ArrowBackIcon />}
                            onClick={() => navigate(-1)}
                            sx={{ mb: 2 }}
                        >
                            Back
                        </Button>

                        <Typography
                            variant="h4"
                            sx={{
                                fontWeight: 700,
                                mb: 1,
                                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}
                        >
                            Purchase Form Credits
                        </Typography>
                        <Typography color="text.secondary" sx={{ mb: 4 }}>
                            Get credits to submit your health assessment forms
                        </Typography>
                    </motion.div>

                    {/* Current Credits */}
                    {creditsInfo && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                        >
                            <Paper sx={{ ...glassCardStyle, p: 3, mb: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Typography variant="body1" color="text.secondary">
                                        Current Credits
                                    </Typography>
                                    <Chip
                                        label={`${creditsInfo.formCredits} forms`}
                                        color={creditsInfo.formCredits > 0 ? 'success' : 'warning'}
                                        size="medium"
                                    />
                                </Box>
                            </Paper>
                        </motion.div>
                    )}

                    {/* Package Details */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <Paper sx={{ ...glassCardStyle, p: 3, mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <ShoppingCartIcon color="primary" sx={{ mr: 1 }} />
                                <Typography variant="h6" fontWeight={600}>
                                    Form Credits Package
                                </Typography>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography>Form Submissions</Typography>
                                    <Typography fontWeight={600}>
                                        {creditsInfo?.formsPerPackage || 4} forms
                                    </Typography>
                                </Box>

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography>Price</Typography>
                                    <Typography variant="h5" fontWeight={700} color="primary">
                                        {creditsInfo?.pricePerPackage || 200} {creditsInfo?.currency || 'EGP'}
                                    </Typography>
                                </Box>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            {/* Features */}
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {[
                                    'Personalized health assessment',
                                    'Expert nutritionist review',
                                    'Custom diet plan creation',
                                    'Secure payment processing'
                                ].map((feature, index) => (
                                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CheckCircleIcon color="success" fontSize="small" />
                                        <Typography variant="body2" color="text.secondary">
                                            {feature}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Paper>
                    </motion.div>

                    {/* Error Alert */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                        >
                            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                                {error}
                            </Alert>
                        </motion.div>
                    )}

                    {/* Payment Section */}
                    {!paymentData ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                        >
                            <Button
                                variant="contained"
                                size="large"
                                fullWidth
                                onClick={createPaymentIntention}
                                disabled={creatingIntention}
                                startIcon={creatingIntention ? <CircularProgress size={20} color="inherit" /> : <PaymentIcon />}
                                sx={{
                                    py: 2,
                                    borderRadius: 3,
                                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                                    boxShadow: `0 10px 30px ${theme.palette.primary.main}40`,
                                    textTransform: 'none',
                                    fontSize: '1.1rem',
                                    fontWeight: 600,
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: `0 15px 40px ${theme.palette.primary.main}50`,
                                    }
                                }}
                            >
                                {creatingIntention ? 'Preparing Payment...' : 'Proceed to Payment'}
                            </Button>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Paper sx={{ ...glassCardStyle, p: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                    <PaymentIcon color="primary" sx={{ mr: 1 }} />
                                    <Typography variant="h6" fontWeight={600}>
                                        Enter Payment Details
                                    </Typography>
                                </Box>

                                {/* Paymob Pixel Container */}
                                <Box
                                    id="paymob-checkout"
                                    ref={pixelContainerRef}
                                    sx={{
                                        minHeight: 300,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    {!pixelLoaded && (
                                        <Box sx={{ textAlign: 'center' }}>
                                            <CircularProgress size={40} />
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                                                Loading payment form...
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            </Paper>
                        </motion.div>
                    )}

                    {/* Security Note */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 3, gap: 1 }}>
                            <SecurityIcon fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                                Secured by Paymob. Your payment information is encrypted.
                            </Typography>
                        </Box>
                    </motion.div>
                </Box>
            </Box>
        </PageFade>
    );
}
