import React from 'react';
import { Link } from 'react-router-dom';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';

// TODO: Make the styled button a separate component and make sure it uses theme elements
// TODO: create theme element to use for all components moving forward

const StyledButton = styled(Button)(() => ({
  backgroundColor: '#91eb4e',
  color: '#000',
  padding: '12px 16px',
  borderRadius: '0.375rem',
  fontWeight: '600',
  transition: 'background-color 0.2s',
  width: '100%',

  '&:hover': {
    backgroundColor: '#65a30d',
  },
}));

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-6 text-center overflow-hidden relative h-full w-full bg-grey-50">
      <img src="/logo.PNG" alt="App Logo" className="w-50 h-50 mb-8 relative z-10" />

      <h1 className="text-3xl font-semibold text-gray-800 mb-4 relative z-10">
        Welcome!
      </h1>
      <p className="text-lg text-gray-600 mb-10 relative z-10">
        Your Nutrition Journey Begins Here.
      </p>

      <div className="flex flex-col gap-4 w-full max-w-md relative z-10">
        <Link to="/login" className="w-full">
          <StyledButton variant="contained">
            Login
          </StyledButton>
        </Link>
        <Link to="/register" className="w-full">
          <StyledButton variant="contained">Sign Up</StyledButton>
        </Link>
      </div>
    </div>
  );
}
