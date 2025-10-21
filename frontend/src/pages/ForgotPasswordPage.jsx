import React, { useState, useEffect } from 'react';
import { TextField } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import LandingButton from '../components/LandingButton.jsx';
import PageFade from '../components/PageFade';
import LoadingBackdrop from '../components/LoadingBackdrop';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [backendError, setBackendError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();

  // Countdown timer effect
  useEffect(() => {
    if (remainingSeconds > 0) {
      const timer = setTimeout(() => {
        setRemainingSeconds(remainingSeconds - 1);
      }, 1000);
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
            
            // Handle rate limiting
            if (response.status === 429 && data.remainingSeconds) {
              setRemainingSeconds(data.remainingSeconds);
              setCanResend(false);
            }
          } else {
            setBackendError(`Request failed: ${response.status}`);
          }
          return;
        }

        // Success
        setSuccessMessage(data.message || 'Password reset email sent successfully!');
        setEmailSent(true);
        setCanResend(false);
        setRemainingSeconds(120); // 2 minutes in seconds
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
          
          // Handle rate limiting
          if (response.status === 429 && data.remainingSeconds) {
            setRemainingSeconds(data.remainingSeconds);
            setCanResend(false);
          }
        } else {
          setBackendError(`Request failed: ${response.status}`);
        }
        return;
      }

      // Success
      setSuccessMessage(data.message || 'Password reset email resent successfully!');
      setCanResend(false);
      setRemainingSeconds(120); // 2 minutes in seconds
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

  return (
    <PageFade>
      <LoadingBackdrop open={submitting} />
      <div className="min-h-screen flex flex-col justify-center items-center px-6 text-center">
        <img src="/logo.PNG" alt="App Logo" className="w-40 h-40 mb-8" />
        <h1 className="text-3xl font-semibold text-gray-800 mb-4">Forgot Password</h1>
        <p className="text-gray-600 mb-8 max-w-md">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
          <div className="flex flex-col justify-center items-center gap-4">
            <TextField
              label="Email"
              fullWidth
              variant="outlined"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={!!formErrors.email}
              helperText={formErrors.email}
              disabled={!canResend && emailSent}
            />
          </div>

          <div className="min-h-8">
            {backendError && (
              <p className="text-red-600 text-base font-light py-1 inline-block">
                {backendError}
              </p>
            )}
            {successMessage && (
              <p className="text-green-600 text-base font-light py-1 inline-block">
                {successMessage}
              </p>
            )}
          </div>

          {emailSent && !canResend && remainingSeconds > 0 && (
            <div className="mb-4">
              <p className="text-gray-600 text-sm">
                You can resend the email in {formatTime(remainingSeconds)}
              </p>
            </div>
          )}

          {emailSent && canResend && (
            <div className="mb-4">
              <button
                type="button"
                onClick={handleResend}
                disabled={submitting}
                className="w-full py-2 px-4 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
              >
                {submitting ? 'Sending...' : 'Resend Password Reset Email'}
              </button>
            </div>
          )}

          {(!emailSent || canResend) && (
            <div className="mt-10">
              <LandingButton type="submit" disabled={!canResend && emailSent}>
                {emailSent ? 'Resend Email' : 'Send Reset Link'}
              </LandingButton>
            </div>
          )}

          <div className="text-gray-600 text-base mt-4">
            Remember your password?{' '}
            <Link to="/login" className="text-lime-400 font-semibold hover:underline">
              Log In
            </Link>
          </div>

          <div className="text-gray-600 text-base">
            Don't have an account?{' '}
            <Link to="/register" className="text-lime-400 font-semibold hover:underline">
              Sign Up
            </Link>
          </div>
        </form>
      </div>
    </PageFade>
  );
}
