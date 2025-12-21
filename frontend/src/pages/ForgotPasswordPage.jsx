import React, { useState, useEffect } from 'react';
import { Box, TextField, Typography, Button, Alert } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Link, useNavigate } from 'react-router-dom';
import LandingButton from '../components/LandingButton.jsx';
import PageFade from '../components/PageFade';
import LoadingBackdrop from '../components/LoadingBackdrop';
import { glassInput } from '../styles';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function ForgotPasswordPage() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [backendError, setBackendError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (remainingSeconds > 0) {
      const timer = setTimeout(() => setRemainingSeconds(remainingSeconds - 1), 1000);
      return () => clearTimeout(timer);
    } else if (remainingSeconds === 0 && !canResend && emailSent) {
      setCanResend(true);
    }
  }, [remainingSeconds, canResend, emailSent]);

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

    setFormErrors(errors);
    setBackendError('');
    setSuccessMessage('');

    if (Object.keys(errors).length === 0) {
      try {
        setSubmitting(true);
        const response = await fetch(`${apiBaseUrl}/api/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (!response.ok) {
          if (data && data.error) {
            setBackendError(data.error);
            if (response.status === 429 && data.remainingSeconds) {
              setRemainingSeconds(data.remainingSeconds);
              setCanResend(false);
            }
          } else {
            setBackendError(`Request failed: ${response.status}`);
          }
          return;
        }

        setSuccessMessage(data.message || 'Password reset email sent successfully!');
        setEmailSent(true);
        setCanResend(false);
        setRemainingSeconds(120);
        setBackendError('');
      } catch (error) {
        console.error('Network error:', error);
        setBackendError('Network error: ' + error.message);
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    try {
      setSubmitting(true);
      setBackendError('');
      setSuccessMessage('');

      const response = await fetch(`${apiBaseUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data && data.error) {
          setBackendError(data.error);
          if (response.status === 429 && data.remainingSeconds) {
            setRemainingSeconds(data.remainingSeconds);
            setCanResend(false);
          }
        } else {
          setBackendError(`Request failed: ${response.status}`);
        }
        return;
      }

      setSuccessMessage(data.message || 'Password reset email resent successfully!');
      setCanResend(false);
      setRemainingSeconds(120);
      setBackendError('');
    } catch (error) {
      console.error('Network error:', error);
      setBackendError('Network error: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
        <Box component="img" src="/logo.PNG" alt="App Logo" sx={{ width: 160, height: 160, mb: 4, borderRadius: 4 }} />

        <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, color: theme.palette.text.primary }}>
          Forgot Password
        </Typography>

        <Typography sx={{ color: theme.palette.text.secondary, mb: 4, maxWidth: 400 }}>
          Enter your email address and we'll send you a link to reset your password.
        </Typography>

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 2 }}
        >
          <TextField
            label="Email" fullWidth variant="outlined" value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={!!formErrors.email} helperText={formErrors.email}
            disabled={!canResend && emailSent}
            sx={inputStyles}
          />

          <Box sx={{ minHeight: 48 }}>
            {backendError && <Alert severity="error" sx={{ borderRadius: 2 }}>{backendError}</Alert>}
            {successMessage && <Alert severity="success" sx={{ borderRadius: 2 }}>{successMessage}</Alert>}
          </Box>

          {emailSent && !canResend && remainingSeconds > 0 && (
            <Typography sx={{ color: theme.palette.text.secondary, fontSize: '0.875rem' }}>
              You can resend the email in {formatTime(remainingSeconds)}
            </Typography>
          )}

          {emailSent && canResend && (
            <Button
              variant="contained"
              onClick={handleResend}
              disabled={submitting}
              sx={{
                py: 1.5,
                background: theme.palette.warning.main,
                color: '#fff',
                fontWeight: 600,
                borderRadius: 2,
                textTransform: 'none',
                '&:hover': { background: theme.palette.warning.dark },
              }}
            >
              {submitting ? 'Sending...' : 'Resend Password Reset Email'}
            </Button>
          )}

          {(!emailSent || canResend) && (
            <Box sx={{ mt: 4 }}>
              <LandingButton type="submit" disabled={!canResend && emailSent}>
                {emailSent ? 'Resend Email' : 'Send Reset Link'}
              </LandingButton>
            </Box>
          )}

          <Typography sx={{ color: theme.palette.text.secondary, mt: 2 }}>
            Remember your password?{' '}
            <Link to="/login" style={{ color: theme.palette.primary.main, fontWeight: 600, textDecoration: 'none' }}>
              Log In
            </Link>
          </Typography>

          <Typography sx={{ color: theme.palette.text.secondary }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: theme.palette.primary.main, fontWeight: 600, textDecoration: 'none' }}>
              Sign Up
            </Link>
          </Typography>
        </Box>
      </Box>
    </PageFade>
  );
}
