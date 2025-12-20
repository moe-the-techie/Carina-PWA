import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Box, Typography, Container, useTheme } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import LandingButton from '../components/LandingButton.jsx';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

// Floating particles component
const FloatingParticle = ({ delay, duration, size, left, top }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0 }}
    animate={{ 
      opacity: [0, 0.6, 0],
      scale: [0, 1, 0],
      y: [-20, -100],
    }}
    transition={{
      duration: duration,
      delay: delay,
      repeat: Infinity,
      ease: "easeOut"
    }}
    style={{
      position: 'absolute',
      left: `${left}%`,
      top: `${top}%`,
      width: size,
      height: size,
      borderRadius: '50%',
      background: 'linear-gradient(135deg, rgba(145, 235, 78, 0.4), rgba(110, 20, 177, 0.3))',
      filter: 'blur(1px)',
      pointerEvents: 'none',
    }}
  />
);

// Feature card component with glassmorphism
const FeatureCard = ({ icon, title, description, delay }) => {
  const theme = useTheme();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: delay, ease: "easeOut" }}
      whileHover={{ 
        scale: 1.05, 
        y: -5,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.98 }}
      style={{
        background: theme.palette.mode === 'dark' 
          ? 'rgba(255, 255, 255, 0.05)' 
          : 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '20px',
        padding: '24px',
        border: theme.palette.mode === 'dark'
          ? '1px solid rgba(255, 255, 255, 0.1)'
          : '1px solid rgba(255, 255, 255, 0.5)',
        boxShadow: theme.palette.mode === 'dark'
          ? '0 8px 32px rgba(0, 0, 0, 0.3)'
          : '0 8px 32px rgba(145, 235, 78, 0.15)',
        cursor: 'pointer',
        minWidth: '140px',
        textAlign: 'center',
      }}
    >
      <motion.div
        whileHover={{ rotate: 10, scale: 1.1 }}
        transition={{ type: "spring", stiffness: 300 }}
        style={{
          display: 'inline-flex',
          padding: '12px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #91EB4E 0%, #65A436 100%)',
          marginBottom: '12px',
          boxShadow: '0 4px 15px rgba(145, 235, 78, 0.4)',
        }}
      >
        {icon}
      </motion.div>
      <Typography 
        variant="subtitle2" 
        sx={{ 
          fontWeight: 600,
          color: theme.palette.mode === 'dark' ? '#fff' : '#1a1a2e',
          mb: 0.5
        }}
      >
        {title}
      </Typography>
      <Typography 
        variant="caption" 
        sx={{ 
          color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)',
          lineHeight: 1.4
        }}
      >
        {description}
      </Typography>
    </motion.div>
  );
};

export default function LandingPage() {
  const theme = useTheme();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 20 - 10,
        y: (e.clientY / window.innerHeight) * 20 - 10,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const features = [
    { icon: <RestaurantIcon sx={{ color: '#fff', fontSize: 28 }} />, title: 'Meal Plans', description: 'Personalized' },
    { icon: <FitnessCenterIcon sx={{ color: '#fff', fontSize: 28 }} />, title: 'Fitness', description: 'Track progress' },
    { icon: <MonitorHeartIcon sx={{ color: '#fff', fontSize: 28 }} />, title: 'Health', description: 'Monitor vitals' },
    { icon: <TrendingUpIcon sx={{ color: '#fff', fontSize: 28 }} />, title: 'Goals', description: 'Achieve more' },
  ];

  const particles = Array.from({ length: 15 }, (_, i) => ({
    delay: i * 0.5,
    duration: 3 + Math.random() * 2,
    size: 6 + Math.random() * 10,
    left: Math.random() * 100,
    top: 50 + Math.random() * 40,
  }));

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)'
          : 'linear-gradient(135deg, #f8fffe 0%, #f0fff4 50%, #f5f0ff 100%)',
      }}
    >
      {/* Animated gradient orbs */}
      <motion.div
        animate={{
          x: mousePosition.x,
          y: mousePosition.y,
        }}
        transition={{ type: "spring", stiffness: 50, damping: 30 }}
        style={{
          position: 'absolute',
          top: '-20%',
          right: '-10%',
          width: '60vw',
          height: '60vw',
          maxWidth: '600px',
          maxHeight: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(145, 235, 78, 0.3) 0%, rgba(145, 235, 78, 0) 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />
      <motion.div
        animate={{
          x: -mousePosition.x * 0.5,
          y: -mousePosition.y * 0.5,
        }}
        transition={{ type: "spring", stiffness: 50, damping: 30 }}
        style={{
          position: 'absolute',
          bottom: '-10%',
          left: '-10%',
          width: '50vw',
          height: '50vw',
          maxWidth: '500px',
          maxHeight: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(110, 20, 177, 0.25) 0%, rgba(110, 20, 177, 0) 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />

      {/* Floating particles */}
      {particles.map((particle, index) => (
        <FloatingParticle key={index} {...particle} />
      ))}

      {/* Main content */}
      <Container 
        maxWidth="sm" 
        sx={{ 
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          zIndex: 10,
          py: 4,
        }}
      >
        {/* Logo with animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: -30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ 
            duration: 0.8, 
            ease: "easeOut",
            type: "spring",
            stiffness: 100
          }}
        >
          <motion.div
            animate={{ 
              y: [0, -8, 0],
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Box
              sx={{
                position: 'relative',
                mb: 4,
              }}
            >
              {/* Glow effect behind logo */}
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '180px',
                  height: '180px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(145, 235, 78, 0.4) 0%, transparent 70%)',
                  filter: 'blur(20px)',
                }}
              />
              <Box
                component="img"
                src="/logo.PNG"
                alt="Carina Logo"
                sx={{
                  width: 140,
                  height: 140,
                  position: 'relative',
                  filter: 'drop-shadow(0 10px 30px rgba(145, 235, 78, 0.3))',
                }}
              />
            </Box>
          </motion.div>
        </motion.div>

        {/* Welcome text with staggered animation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          style={{ textAlign: 'center', marginBottom: '16px' }}
        >
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, #fff 0%, #91EB4E 50%, #A7EF71 100%)'
                : 'linear-gradient(135deg, #1a1a2e 0%, #6E14B1 50%, #91EB4E 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1,
              letterSpacing: '-0.02em',
            }}
          >
            Welcome to Carina
          </Typography>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
        >
          <Typography
            variant="h6"
            sx={{
              color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
              fontWeight: 400,
              mb: 4,
              textAlign: 'center',
              maxWidth: '320px',
              lineHeight: 1.6,
            }}
          >
            Your personalized nutrition journey starts here
          </Typography>
        </motion.div>

        {/* Feature cards grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 2,
            mb: 5,
            width: '100%',
            maxWidth: '360px',
          }}
        >
          {features.map((feature, index) => (
            <FeatureCard 
              key={index} 
              {...feature} 
              delay={0.6 + index * 0.1}
            />
          ))}
        </Box>

        {/* CTA Buttons with glassmorphism container */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1 }}
          style={{ width: '100%', maxWidth: '360px' }}
        >
          <Box
            sx={{
              background: theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.03)'
                : 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: '28px',
              padding: '24px',
              border: theme.palette.mode === 'dark'
                ? '1px solid rgba(255, 255, 255, 0.08)'
                : '1px solid rgba(255, 255, 255, 0.8)',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 20px 60px rgba(0, 0, 0, 0.4)'
                : '0 20px 60px rgba(145, 235, 78, 0.15), 0 0 0 1px rgba(255,255,255,0.5) inset',
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Link to="/login" style={{ textDecoration: 'none', width: '100%' }}>
                <LandingButton variant="primary">
                  Get Started
                </LandingButton>
              </Link>
              <Link to="/register" style={{ textDecoration: 'none', width: '100%' }}>
                <LandingButton variant="secondary">
                  Create Account
                </LandingButton>
              </Link>
            </Box>
          </Box>
        </motion.div>

        {/* Footer text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
              mt: 4,
              textAlign: 'center',
            }}
          >
            Start your transformation today ✨
          </Typography>
        </motion.div>
      </Container>
    </Box>
  );
}
