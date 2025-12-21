import React, { useState } from 'react';
import {
  Box,
  TextField,
  Typography,
  InputAdornment,
  IconButton,
  Button,
  Alert,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { Link, useNavigate } from 'react-router-dom';
import LandingButton from '../components/LandingButton.jsx';
import PageFade from '../components/PageFade';
import LoadingBackdrop from '../components/LoadingBackdrop';
import { glassCard, glassInput } from '../styles';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function LoginPage({ onLogin }) {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [backendError, setBackendError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showResendButton, setShowResendButton] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    let errors = {};

    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      errors.email = 'Invalid email format';
    } else if (email.includes('"') || email.includes("'") || email.includes(';') || email.includes('`')) {
      errors.email = 'Email cannot contain special characters like ", \', ;, or `';
    }

    if (!password.trim()) {
      errors.password = 'Password is required';
    } else if (password.includes('"') || password.includes("'") || password.includes(';') || password.includes('`')) {
      errors.password = 'Password cannot contain special characters like ", \', ;, or `';
    }

    setFormErrors(errors);
    setBackendError('');
    setShowResendButton(false);
    setResendSuccess('');

    if (Object.keys(errors).length === 0) {
      try {
        setSubmitting(true);
        const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          if (data && data.error) {
            setBackendError(data.error);
            if (data.email_verified === false && data.canResendVerification) {
              setShowResendButton(true);
            }
          } else {
            setBackendError(`Login failed: ${response.status}`);
          }
          return;
        }

        if (data.token) {
          localStorage.setItem('token', data.token);
          onLogin();
          navigate('/');
        } else {
          setBackendError('Login succeeded but token is missing.');
        }
      } catch (error) {
        console.error('Network error:', error);
        setBackendError('Network error: ' + error.message);
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleResendVerification = async () => {
    try {
      setResendingEmail(true);
      setBackendError('');
      setResendSuccess('');

      const response = await fetch(`${apiBaseUrl}/api/auth/resend-verification-with-auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data && data.error) {
          setBackendError(data.error);
          if (data.emailVerified) {
            setShowResendButton(false);
          }
        } else {
          setBackendError(`Failed to resend verification email: ${response.status}`);
        }
        return;
      }

      setResendSuccess(data.message || 'Verification email sent successfully!');
      setShowResendButton(false);
      setBackendError('');
    } catch (error) {
      console.error('Resend verification error:', error);
      setBackendError('Network error: ' + error.message);
    } finally {
      setResendingEmail(false);
    }
  };

  // Shared input styles
  const inputStyles = glassInput(theme);

  return (
    <PageFade>
      <LoadingBackdrop open={submitting} />
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          px: 3,
          py: 4,
          textAlign: 'center',
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, #121212 0%, #1a1a2e 100%)'
            : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        }}
      >
        <Box
          component="img"
          src="/logo.PNG"
          alt="App Logo"
          sx={{
            width: 160,
            height: 160,
            mb: 4,
            borderRadius: 4,
          }}
        />

        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            mb: 4,
            color: theme.palette.text.primary,
          }}
        >
          Login
        </Typography>

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            width: '100%',
            maxWidth: 400,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <TextField
            label="Email"
            fullWidth
            variant="outlined"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={!!formErrors.email}
            helperText={formErrors.email}
            sx={inputStyles}
          />

          <TextField
            label="Password"
            fullWidth
            variant="outlined"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={!!formErrors.password}
            helperText={formErrors.password}
            sx={inputStyles}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Box sx={{ minHeight: 48 }}>
            {backendError && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {backendError}
              </Alert>
            )}
            {resendSuccess && (
              <Alert severity="success" sx={{ borderRadius: 2 }}>
                {resendSuccess}
              </Alert>
            )}
          </Box>

          {showResendButton && (
            <Button
              variant="contained"
              onClick={handleResendVerification}
              disabled={resendingEmail}
              sx={{
                py: 1.5,
                background: theme.palette.warning.main,
                color: '#fff',
                fontWeight: 600,
                borderRadius: 2,
                textTransform: 'none',
                '&:hover': {
                  background: theme.palette.warning.dark,
                },
              }}
            >
              {resendingEmail ? 'Sending...' : 'Resend Verification Email'}
            </Button>
          )}

          <Box sx={{ mt: 4 }}>
            <LandingButton type="submit">Log In</LandingButton>
          </Box>

          <Typography sx={{ color: theme.palette.text.secondary }}>
            <Link
              to="/forgot-password"
              style={{
                color: theme.palette.primary.main,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Forgot Password?
            </Link>
          </Typography>

          <Typography sx={{ color: theme.palette.text.secondary }}>
            Don't have an account?{' '}
            <Link
              to="/register"
              style={{
                color: theme.palette.primary.main,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Sign Up
            </Link>
          </Typography>
        </Box>
      </Box>
    </PageFade>
  );
}
