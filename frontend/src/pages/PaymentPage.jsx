import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import {
    Box,
    Typography,
    Button,
    Paper,
    CircularProgress,
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
import PageErrorIndicator from '../components/PageErrorIndicator';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function PaymentPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [loading, setLoading] = useState(true);
    const [creatingPayment, setCreatingPayment] = useState(false);
    const [error, setError] = useState('');
    const [creditsInfo, setCreditsInfo] = useState(null);
    const [paymentsEnabled, setPaymentsEnabled] = useState(true);

    const packageLabel = creditsInfo?.packageType === 'follow_up'
        ? 'Follow-up Package'
        : 'First-time Package';

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
            
            // Check if payments are enabled
            const enabled = data.paymentsEnabled !== false && import.meta.env.VITE_ENABLE_PAYMENTS !== 'false';
            setPaymentsEnabled(enabled);
            
            if (!enabled) {
                setError('Payments are currently disabled');
                setTimeout(() => navigate('/home'), 2000);
            }
        } catch (err) {
            console.error('Error fetching credits:', err);
            setError('Failed to load payment information');
        } finally {
            setLoading(false);
        }
    };

    const createPayment = async () => {
        try {
            setCreatingPayment(true);
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

            // Redirect to Fawaterk checkout page
            if (data.checkoutUrl) {
                window.location.href = data.checkoutUrl;
            } else {
                throw new Error('No checkout URL received');
            }

        } catch (err) {
            console.error('Payment creation error:', err);
            setError(err.message || 'Failed to initialize payment');
            setCreatingPayment(false);
        }
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
                            onClick={() => {
                                if (location.state?.fromNewForm) {
                                    navigate('/');
                                } else {
                                    navigate(-1);
                                }
                            }}
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
                            Get credits to submit your health assessment forms ({packageLabel})
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
                                    {packageLabel}
                                </Typography>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography>Form Submissions</Typography>
                                    <Typography fontWeight={600}>
                                        {creditsInfo?.formsPerPackage || import.meta.env.VITE_PAYMENT_FORMS_PER_PACKAGE || 4} forms
                                    </Typography>
                                </Box>

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography>Price</Typography>
                                    <Typography variant="h5" fontWeight={700} color="primary">
                                        {creditsInfo?.pricePerPackage || import.meta.env.VITE_PAYMENT_PACKAGE_PRICE || 200} {creditsInfo?.currency || import.meta.env.VITE_PAYMENT_CURRENCY || 'EGP'}
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
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <PageErrorIndicator error={error} onClose={() => setError('')} />
                    </motion.div>

                    {/* Payment Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        <Button
                            variant="contained"
                            size="large"
                            fullWidth
                            onClick={createPayment}
                            disabled={creatingPayment}
                            startIcon={creatingPayment ? <CircularProgress size={20} color="inherit" /> : <PaymentIcon />}
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
                            {creatingPayment ? 'Redirecting to Payment...' : 'Proceed to Payment'}
                        </Button>
                    </motion.div>

                    {/* Security Note */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 3, gap: 1 }}>
                            <SecurityIcon fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                                Secured by Fawaterk. Your payment information is encrypted.
                            </Typography>
                        </Box>
                    </motion.div>
                </Box>
            </Box>
        </PageFade>
    );
}
