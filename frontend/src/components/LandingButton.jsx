import React from 'react';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';

const StyledButton = styled(Button)(({ theme }) => ({
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    padding: '12px 16px',
    transition: 'background-color 0.3s',
    width: '100%',
  
    '&:hover': {
      backgroundColor: theme.palette.primary.darker,
    },
  }));
  

export default function LandingButton ({ children, onClick, type }) {
    return (
        <StyledButton variant='contained' onClick={onClick} type={type}>
            {children}
        </StyledButton>
    )
}
