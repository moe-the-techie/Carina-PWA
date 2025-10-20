import React, { useState } from 'react';
import {
  TextField,
  InputAdornment,
  IconButton,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { Link, useNavigate } from 'react-router-dom';
import LandingButton from '../components/LandingButton.jsx';
import PageFade from '../components/PageFade';
import LoadingBackdrop from '../components/LoadingBackdrop';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function LoginPage({ onLogin }) {
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
            
            // Show resend button if email is not verified
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
          
          // If email is already verified, hide the resend button
          if (data.emailVerified) {
            setShowResendButton(false);
          }
        } else {
          setBackendError(`Failed to resend verification email: ${response.status}`);
        }
        return;
      }

      // Success
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

  return (
    <PageFade>
      <LoadingBackdrop open={submitting} />
      <div className="min-h-screen flex flex-col justify-center items-center px-6 text-center">
        <img src="/logo.PNG" alt="App Logo" className="w-40 h-40 mb-8" />
        <h1 className="text-3xl font-semibold text-gray-800 mb-8">Login</h1>

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

          </div>

          <div className="min-h-8">
            {backendError && (
              <p className="text-red-600 text-base font-light py-1 inline-block">
                {backendError}
              </p>
            )}
            {resendSuccess && (
              <p className="text-green-600 text-base font-light py-1 inline-block">
                {resendSuccess}
              </p>
            )}
          </div>

          {showResendButton && (
            <div className="mb-4">
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resendingEmail}
                className="w-full py-2 px-4 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
              >
                {resendingEmail ? 'Sending...' : 'Resend Verification Email'}
              </button>
            </div>
          )}

          <div className="mt-10">
            <LandingButton type="submit">Log In</LandingButton>
          </div>

          <div className="text-gray-600 text-base">
            <Link to="/forgot-password" className="text-lime-400 font-semibold hover:underline">
              Forgot Password?
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
