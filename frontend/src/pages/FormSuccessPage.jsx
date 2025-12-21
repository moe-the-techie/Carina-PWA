import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { Box, Typography, Button, keyframes } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import HomeIcon from '@mui/icons-material/Home';
import PageFade from '../components/PageFade';
import { spacing, borderRadius, transitions, gradients } from '../styles';
import { fadeVariants, scaleVariants } from '../styles/animations';

// Keyframes for pulse animation
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

export default function FormSuccessPage() {
    const navigate = useNavigate();
    const theme = useTheme();
    const [showConfetti, setShowConfetti] = useState(true);

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
        const timer = setTimeout(() => setShowConfetti(false), 3000);
        return () => clearTimeout(timer);
    }, []);

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

                {/* Animated Background Circles */}
                <Box sx={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                    {[...Array(3)].map((_, i) => (
                        <Box
                            key={i}
                            sx={{
                                position: 'absolute',
                                width: 300 + i * 150,
                                height: 300 + i * 150,
                                borderRadius: '50%',
                                background: `radial-gradient(circle, ${theme.palette.primary.main}15, transparent)`,
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                animation: `${pulse} ${4 + i}s ease-in-out infinite`,
                                animationDelay: `${i * 0.5}s`,
                            }}
                        />
                    ))}
                </Box>

                {/* Main Content Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 50 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ 
                        duration: 0.6,
                        ease: [0.16, 1, 0.3, 1],
                    }}
                >
                    <Box
                        sx={{
                            position: 'relative',
                            maxWidth: 500,
                            width: '100%',
                            p: { xs: 4, sm: 6 },
                            textAlign: 'center',
                            borderRadius: 4,
                            background: theme.palette.mode === 'dark'
                                ? 'rgba(255, 255, 255, 0.05)'
                                : 'rgba(255, 255, 255, 0.85)',
                            backdropFilter: 'blur(20px)',
                            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.9)'}`,
                            boxShadow: theme.palette.mode === 'dark'
                                ? '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255,255,255,0.1)'
                                : '0 25px 50px -12px rgba(0, 0, 0, 0.12), inset 0 1px 1px rgba(255,255,255,0.9)',
                        }}
                    >
                        {/* Success Icon */}
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{
                                type: "spring",
                                stiffness: 200,
                                damping: 15,
                                delay: 0.2,
                            }}
                        >
                            <Box
                                sx={{
                                    width: 100,
                                    height: 100,
                                    borderRadius: '50%',
                                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.darker || theme.palette.primary.dark})`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mx: 'auto',
                                    mb: 4,
                                    boxShadow: `0 10px 40px ${theme.palette.primary.main}50`,
                                    animation: `${float} 3s ease-in-out infinite`,
                                }}
                            >
                                <CheckCircleOutlineIcon 
                                    sx={{ 
                                        fontSize: 60, 
                                        color: 'white',
                                    }} 
                                />
                            </Box>
                        </motion.div>

                        {/* Title */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.5 }}
                        >
                            <Typography
                                variant="h4"
                                sx={{
                                    fontWeight: 700,
                                    mb: 2,
                                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                    backgroundClip: 'text',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                }}
                            >
                                Form Submitted Successfully!
                            </Typography>
                        </motion.div>

                        {/* Description */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.5 }}
                        >
                            <Typography
                                variant="body1"
                                sx={{
                                    color: theme.palette.text.secondary,
                                    mb: 2,
                                    lineHeight: 1.7,
                                }}
                            >
                                Thank you for completing your nutrition assessment form. Our expert team is now reviewing your information.
                            </Typography>
                        </motion.div>

                        {/* Info Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6, duration: 0.5 }}
                        >
                            <Box
                                sx={{
                                    p: 3,
                                    borderRadius: 3,
                                    background: theme.palette.mode === 'dark'
                                        ? 'rgba(145, 235, 78, 0.1)'
                                        : 'rgba(145, 235, 78, 0.15)',
                                    border: `1px solid ${theme.palette.primary.main}30`,
                                    mb: 4,
                                }}
                            >
                                <Typography
                                    variant="body2"
                                    sx={{
                                        color: theme.palette.mode === 'dark' 
                                            ? theme.palette.primary.light 
                                            : theme.palette.primary.darker,
                                        fontWeight: 500,
                                    }}
                                >
                                    📋 Your personalized nutrition plan will be ready soon. You'll be notified once it's available.
                                </Typography>
                            </Box>
                        </motion.div>

                        {/* Action Buttons */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7, duration: 0.5 }}
                        >
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Button
                                    variant="contained"
                                    size="large"
                                    onClick={() => navigate('/home')}
                                    endIcon={<ArrowForwardIcon />}
                                    sx={{
                                        py: 1.5,
                                        px: 4,
                                        borderRadius: 3,
                                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.darker || theme.palette.primary.dark})`,
                                        boxShadow: `0 10px 30px ${theme.palette.primary.main}40`,
                                        textTransform: 'none',
                                        fontSize: '1.1rem',
                                        fontWeight: 600,
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            transform: 'translateY(-2px)',
                                            boxShadow: `0 15px 40px ${theme.palette.primary.main}50`,
                                        },
                                    }}
                                >
                                    Go to Home
                                </Button>
                                
                                <Button
                                    variant="outlined"
                                    size="large"
                                    onClick={() => navigate('/home')}
                                    startIcon={<HomeIcon />}
                                    sx={{
                                        py: 1.5,
                                        px: 4,
                                        borderRadius: 3,
                                        borderWidth: 2,
                                        textTransform: 'none',
                                        fontSize: '1rem',
                                        fontWeight: 500,
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            borderWidth: 2,
                                            transform: 'translateY(-2px)',
                                        },
                                    }}
                                >
                                    Return to Dashboard
                                </Button>
                            </Box>
                        </motion.div>
                    </Box>
                </motion.div>

                {/* Bottom Decorative Element */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 0.5 }}
                    style={{
                        position: 'absolute',
                        bottom: 30,
                    }}
                >
                    <Typography
                        variant="caption"
                        sx={{
                            color: theme.palette.text.secondary,
                            opacity: 0.7,
                        }}
                    >
                        Carina Nutrition • Your Health Journey Starts Here
                    </Typography>
                </motion.div>
            </Box>
        </PageFade>
    );
}