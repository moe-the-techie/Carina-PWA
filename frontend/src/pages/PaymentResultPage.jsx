import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { Box, Typography, Button, Paper, CircularProgress, keyframes } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import HomeIcon from '@mui/icons-material/Home';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import PageFade from '../components/PageFade';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Keyframes for animations
const pulse = keyframes`
    0%, 100% { transform: scale(1); opacity: 0.8; }
    50% { transform: scale(1.05); opacity: 1; }
`;

const float = keyframes`
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
`;

// Confetti particle component
const Particle = ({ delay, x, color }) => (
    <motion.div
        initial={{ y: -20, x: x, opacity: 1, scale: 1 }}
        animate={{
            y: 400,
            x: x + (Math.random() - 0.5) * 100,
            opacity: 0,
            rotate: Math.random() * 360,
            scale: 0.5
        }}
        transition={{
            duration: 2.5 + Math.random(),
            delay: delay,
            ease: "easeOut"
        }}
        style={{
            position: 'absolute',
            width: 10 + Math.random() * 10,
            height: 10 + Math.random() * 10,
            backgroundColor: color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            top: 0,
        }}
    />
);

export default function PaymentResultPage() {
    const navigate = useNavigate();
    const theme = useTheme();
    const [searchParams] = useSearchParams();
    const [showConfetti, setShowConfetti] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState(null);
    const [loading, setLoading] = useState(true);

    // Determine the result type from URL
    const isSuccess = window.location.pathname.includes('/success');
    const isPending = window.location.pathname.includes('/pending');
    const isFailed = window.location.pathname.includes('/failed');
    const paymentId = searchParams.get('payment_id');
    const errorParam = searchParams.get('error');

    const confettiColors = [
        theme.palette.primary.main,
        theme.palette.secondary.main,
        '#FFD700',
        '#FF6B6B',
        '#4ECDC4',
        '#A78BFA',
    ];

    const particles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 500),
        delay: Math.random() * 0.5,
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)]
    }));

    useEffect(() => {
        if (paymentId) {
            fetchPaymentStatus();
        } else {
            setLoading(false);
            if (isSuccess) {
                setShowConfetti(true);
            }
        }
    }, [paymentId]);

    useEffect(() => {
        if (showConfetti) {
            const timer = setTimeout(() => setShowConfetti(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [showConfetti]);

    const fetchPaymentStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }

            const response = await fetch(`${apiBaseUrl}/api/payments/${paymentId}/status`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setPaymentStatus(data);
                if (data.status === 'paid') {
                    setShowConfetti(true);
                }
            }
        } catch (err) {
            console.error('Error fetching payment status:', err);
        } finally {
            setLoading(false);
        }
    };

    const getResultConfig = () => {
        if (isSuccess || paymentStatus?.status === 'paid') {
            return {
                icon: CheckCircleOutlineIcon,
                color: 'success',
                title: 'Payment Successful!',
                subtitle: 'Your form credits have been added to your account.',
                gradient: `linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)`,
                showCredits: true
            };
        } else if (isPending || paymentStatus?.status === 'pending') {
            return {
                icon: HourglassEmptyIcon,
                color: 'warning',
                title: 'Payment Pending',
                subtitle: 'Your payment is being processed. Please wait a moment.',
                gradient: `linear-gradient(135deg, #ff9800 0%, #f57c00 100%)`,
                showCredits: false
            };
        } else {
            return {
                icon: ErrorOutlineIcon,
                color: 'error',
                title: 'Payment Failed',
                subtitle: errorParam === 'invalid_signature' 
                    ? 'Payment verification failed. Please try again.'
                    : 'Something went wrong with your payment. Please try again.',
                gradient: `linear-gradient(135deg, #f44336 0%, #c62828 100%)`,
                showCredits: false
            };
        }
    };

    const config = getResultConfig();
    const IconComponent = config.icon;

    if (loading) {
        return (
            <PageFade>
                <Box
                    sx={{
                        minHeight: '100vh',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: theme.palette.mode === 'dark'
                            ? theme.palette.background.default
                            : '#f5f7fa'
                    }}
                >
                    <CircularProgress size={60} />
                </Box>
            </PageFade>
        );
    }

    return (
        <PageFade>
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    background: theme.palette.mode === 'dark'
                        ? `linear-gradient(135deg, ${theme.palette.background.default} 0%, #1a1a2e 50%, #16213e 100%)`
                        : `linear-gradient(135deg, #f5f7fa 0%, #e8f5e9 50%, #c8e6c9 100%)`,
                    px: 2,
                }}
            >
                {/* Confetti */}
                <AnimatePresence>
                    {showConfetti && (
                        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, pointerEvents: 'none', zIndex: 10 }}>
                            {particles.map((particle) => (
                                <Particle
                                    key={particle.id}
                                    x={particle.x}
                                    delay={particle.delay}
                                    color={particle.color}
                                />
                            ))}
                        </Box>
                    )}
                </AnimatePresence>

                {/* Background Gradient Blob */}
                <Box
                    sx={{
                        position: 'absolute',
                        width: '150%',
                        height: '150%',
                        background: config.gradient,
                        opacity: 0.05,
                        borderRadius: '50%',
                        filter: 'blur(100px)',
                        animation: `${pulse} 4s ease-in-out infinite`,
                    }}
                />

                {/* Main Content */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    style={{ zIndex: 1, textAlign: 'center', maxWidth: 500 }}
                >
                    {/* Icon */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    >
                        <Box
                            sx={{
                                width: 120,
                                height: 120,
                                borderRadius: '50%',
                                background: config.gradient,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mx: 'auto',
                                mb: 4,
                                boxShadow: `0 20px 60px ${theme.palette[config.color].main}40`,
                                animation: `${float} 3s ease-in-out infinite`,
                            }}
                        >
                            <IconComponent sx={{ fontSize: 60, color: 'white' }} />
                        </Box>
                    </motion.div>

                    {/* Title */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <Typography
                            variant="h3"
                            sx={{
                                fontWeight: 800,
                                mb: 2,
                                background: config.gradient,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}
                        >
                            {config.title}
                        </Typography>
                    </motion.div>

                    {/* Subtitle */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <Typography
                            variant="h6"
                            color="text.secondary"
                            sx={{ mb: 4, fontWeight: 400, lineHeight: 1.6 }}
                        >
                            {config.subtitle}
                        </Typography>
                    </motion.div>

                    {/* Payment Details */}
                    {config.showCredits && paymentStatus && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                        >
                            <Paper
                                sx={{
                                    p: 3,
                                    mb: 4,
                                    background: theme.palette.mode === 'dark'
                                        ? 'rgba(255, 255, 255, 0.05)'
                                        : 'rgba(255, 255, 255, 0.9)',
                                    backdropFilter: 'blur(20px)',
                                    borderRadius: 3,
                                    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
                                }}
                            >
                                <Typography variant="body1" color="text.secondary" gutterBottom>
                                    Credits Added
                                </Typography>
                                <Typography variant="h4" fontWeight={700} color="success.main">
                                    +{paymentStatus.formCredits} Forms
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    Amount: {paymentStatus.amount} {paymentStatus.currency}
                                </Typography>
                            </Paper>
                        </motion.div>
                    )}

                    {/* Action Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                    >
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {(isSuccess || paymentStatus?.status === 'paid') && (
                                <Button
                                    variant="contained"
                                    size="large"
                                    startIcon={<AddIcon />}
                                    onClick={() => navigate('/new-form')}
                                    sx={{
                                        py: 1.5,
                                        borderRadius: 3,
                                        background: config.gradient,
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        boxShadow: `0 10px 30px ${theme.palette.success.main}40`,
                                    }}
                                >
                                    Submit a New Form
                                </Button>
                            )}

                            {isFailed && (
                                <Button
                                    variant="contained"
                                    size="large"
                                    startIcon={<RefreshIcon />}
                                    onClick={() => navigate('/payment')}
                                    sx={{
                                        py: 1.5,
                                        borderRadius: 3,
                                        textTransform: 'none',
                                        fontWeight: 600,
                                    }}
                                >
                                    Try Again
                                </Button>
                            )}

                            {isPending && (
                                <Button
                                    variant="contained"
                                    size="large"
                                    startIcon={<RefreshIcon />}
                                    onClick={() => window.location.reload()}
                                    sx={{
                                        py: 1.5,
                                        borderRadius: 3,
                                        textTransform: 'none',
                                        fontWeight: 600,
                                    }}
                                >
                                    Check Status
                                </Button>
                            )}

                            <Button
                                variant="outlined"
                                size="large"
                                startIcon={<HomeIcon />}
                                onClick={() => navigate('/home')}
                                sx={{
                                    py: 1.5,
                                    borderRadius: 3,
                                    textTransform: 'none',
                                    fontWeight: 600,
                                }}
                            >
                                Go to Home
                            </Button>
                        </Box>
                    </motion.div>
                </motion.div>
            </Box>
        </PageFade>
    );
}
