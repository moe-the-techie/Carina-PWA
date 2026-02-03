import React from 'react';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';

const PrimaryButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(135deg, #91EB4E 0%, #65A436 100%)',
  color: '#1a1a2e',
  padding: '16px 32px',
  borderRadius: '16px',
  fontSize: '1rem',
  fontWeight: 700,
  textTransform: 'none',
  width: '100%',
  position: 'relative',
  overflow: 'hidden',
  boxShadow: '0 4px 20px rgba(145, 235, 78, 0.4), 0 0 0 0 rgba(145, 235, 78, 0.4)',
  transition: 'all var(--transition-normal, 0.3s) cubic-bezier(0.4, 0, 0.2, 1)',
  
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
    transition: 'left 0.5s ease',
  },

  '&:hover': {
    background: 'linear-gradient(135deg, #A7EF71 0%, #91EB4E 100%)',
    boxShadow: '0 8px 30px rgba(145, 235, 78, 0.5), 0 0 0 3px rgba(145, 235, 78, 0.2)',
    transform: 'translateY(-2px)',
    
    '&::before': {
      left: '100%',
    },
  },

  '&:active': {
    transform: 'translateY(0)',
    boxShadow: '0 2px 10px rgba(145, 235, 78, 0.4)',
  },
}));

const SecondaryButton = styled(Button)(({ theme }) => ({
  background: theme.palette.mode === 'dark' 
    ? 'rgba(255, 255, 255, 0.05)' 
    : 'rgba(255, 255, 255, 0.8)',
  color: theme.palette.mode === 'dark' ? '#fff' : '#6E14B1',
  padding: '16px 32px',
  borderRadius: '16px',
  fontSize: '1rem',
  fontWeight: 600,
  textTransform: 'none',
  width: '100%',
  border: theme.palette.mode === 'dark'
    ? '2px solid rgba(255, 255, 255, 0.15)'
    : '2px solid rgba(110, 20, 177, 0.2)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',

  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(135deg, rgba(110, 20, 177, 0.1), rgba(145, 235, 78, 0.1))',
    opacity: 0,
    transition: 'opacity 0.3s ease',
  },

  '&:hover': {
    borderColor: theme.palette.mode === 'dark'
      ? 'rgba(145, 235, 78, 0.5)'
      : '#6E14B1',
    background: theme.palette.mode === 'dark' 
      ? 'rgba(255, 255, 255, 0.1)' 
      : 'rgba(255, 255, 255, 1)',
    boxShadow: theme.palette.mode === 'dark'
      ? '0 8px 30px rgba(110, 20, 177, 0.3)'
      : '0 8px 30px rgba(110, 20, 177, 0.15)',
    transform: 'translateY(-2px)',
    
    '&::before': {
      opacity: 1,
    },
  },

  '&:active': {
    transform: 'translateY(0)',
  },
}));

const MotionWrapper = motion.div;

export default function LandingButton({ children, onClick, type, variant = 'primary' }) {
  const ButtonComponent = variant === 'primary' ? PrimaryButton : SecondaryButton;
  
  return (
    <MotionWrapper
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      style={{ width: '100%' }}
    >
      <ButtonComponent 
        variant="contained" 
        onClick={onClick} 
        type={type} 
        disableElevation
      >
        {children}
      </ButtonComponent>
    </MotionWrapper>
  );
}
