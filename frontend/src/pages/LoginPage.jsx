import React, { useState } from 'react';
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
          // handle backend error
          if (data && data.error) {
            setBackendError(data.error);
          } else {
            setBackendError(`Login failed: ${response.status}`);
          }
          return;
        }

        // Successful login
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

      // Clear form only if no backend/network error
      setEmail('');
      setPassword('');
    }
  };

  return (
    <PageFade>
    <LoadingBackdrop open={submitting} />
    <div className="min-h-screen flex flex-col justify-center items-center px-6 text-center">
      <img src="/logo.PNG" alt="App Logo" className="w-40 h-40 mb-8" />

      <h1 className="text-3xl font-semibold text-gray-800 mb-8">
        Login
      </h1>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-6"
      >
        <div className="space-y-2">
          <label htmlFor="email" className="block text-left text-gray-700 text-sm font-bold mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`
              w-full px-4 py-3 rounded-md border
              ${formErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}
              focus:outline-none transition duration-200
            `}
          />
          {formErrors.email && (
            <p className="text-red-500 text-sm text-left">{formErrors.email}</p>
          )}
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="block text-left text-gray-700 text-sm font-bold mb-1">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'} // Toggle between password and text
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`
                w-full px-4 py-3 rounded-md border
                ${formErrors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}
                focus:outline-none transition duration-200
              `}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)} // Toggle showPassword state
              className="absolute inset-y-0 right-0 px-3 py-2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? 'Hide' : 'Show'} {/* Button text depending on showPassword state */}
            </button>
          </div>
          {formErrors.password && (
            <p className="text-red-500 text-sm text-left">{formErrors.password}</p>
          )}
        </div>
        <div className="h-5">
          {backendError && (
            <p className="text-red-600 text-base font-light py-1 inline-block">
              {backendError}
            </p>
          )}
        </div>
        <div className="mt-10">
          <LandingButton type="submit">
            Log In
          </LandingButton>
        </div>
        <div className="text-gray-600 text-base">
          Don't have an account?{' '}
          <Link to="/register" className={`text-lime-400 font-semibold hover:underline`}>
            Sign Up
          </Link>
        </div>
      </form>
    </div>
    </PageFade>
  );
}
