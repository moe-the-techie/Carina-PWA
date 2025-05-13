import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import LandingButton from '../components/LandingButton.jsx';
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function SignUpPage({ onLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [backendError, setBackendError] = useState('');
  const [showPassword, setShowPassword] = useState(false); // State for password visibility
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false); // State for password confirmation visibility
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    let errors = {};

    if (!name.trim()) {
      errors.name = 'Name is required';
    } else if (name.includes('"') || name.includes("'") || name.includes(';') || name.includes('`')) {
      errors.name = 'Name cannot contain special characters like ", \', ;, or `';
    }

    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      errors.email = 'Invalid email format';
    } else if (email.includes('"') || email.includes("'") || email.includes(';') || email.includes('`')) {
      errors.email = 'Email cannot contain special characters like ", \', ;, or `';
    }

    if (!password.trim()) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (password.includes('"') || password.includes("'") || password.includes(';') || password.includes('`')) {
      errors.password = 'Password cannot contain special characters like ", \', ;, or `';
    }

    if (!passwordConfirmation.trim()) {
      errors.passwordConfirmation = 'Password confirmation is required';
    } else if (password !== passwordConfirmation) {
      errors.passwordConfirmation = 'Passwords do not match';
    }

    setFormErrors(errors);
    setBackendError('');

    if (Object.keys(errors).length === 0) {
      try {
        const response = await fetch(`${apiBaseUrl}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, passwordConfirmation, name }),
        });

        const data = await response.json();

        if (!response.ok) {
          // handle backend error
          if (data && data.error) {
            setBackendError(data.error);
          } else {
            setBackendError(`Registration failed: ${response.status}`);
          }
          return;
        }

        // Successful registration
        if (data.token) {
          localStorage.setItem('token', data.token);
          onLogin();
          navigate('/');
        } else {
          setBackendError('Registration succeeded but token is missing.');
        }

      } catch (error) {
        console.error('Network error:', error);
        setBackendError('Network error: ' + error.message);
      }

      // Clear form only if no backend/network error
      setEmail('');
      setPassword('');
      setPasswordConfirmation('');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 px-6 text-center">
      <img src="/logo.PNG" alt="App Logo" className="w-50 h-50 mb-8" />
      
      <h1 className="text-3xl font-semibold text-gray-800 mb-8">
        Create an Account
      </h1>
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
        <div className="space-y-2">
          <label htmlFor="name" className="block text-left text-gray-700 text-sm font-bold mb-1">
            Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`w-full px-4 py-3 rounded-md border ${formErrors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} focus:outline-none transition duration-200`}
          />
          {formErrors.name && <p className="text-red-500 text-sm text-left">{formErrors.name}</p>}
        </div>
        <div className="space-y-2">
          <label htmlFor="email" className="block text-left text-gray-700 text-sm font-bold mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full px-4 py-3 rounded-md border ${formErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} focus:outline-none transition duration-200`}
          />
          {formErrors.email && <p className="text-red-500 text-sm text-left">{formErrors.email}</p>}
        </div>
        <div className="space-y-1">
          <label htmlFor="password" className="block text-left text-gray-700 text-sm font-bold mb-1">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'} // Toggle between password and text
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-4 py-3 rounded-md border ${formErrors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} focus:outline-none transition duration-200`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)} // Toggle showPassword state
              className="absolute inset-y-0 right-0 px-3 py-2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? 'Hide' : 'Show'} {/* Button text depending on showPassword state */}
            </button>
          </div>
          {formErrors.password && <p className="text-red-500 text-sm text-left">{formErrors.password}</p>}
        </div>
        <div className="space-y-2">
          <label htmlFor="passwordConfirmation" className="block text-left text-gray-700 text-sm font-bold mb-1">
            Confirm Password
          </label>
          <div className="relative">
            <input
              type={showPasswordConfirmation ? 'text' : 'password'} // Toggle between password and text
              id="passwordConfirmation"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              className={`w-full px-4 py-3 rounded-md border ${formErrors.passwordConfirmation ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} focus:outline-none transition duration-200`}
            />
            <button
              type="button"
              onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)} // Toggle showPasswordConfirmation state
              className="absolute inset-y-0 right-0 px-3 py-2 text-gray-500 hover:text-gray-700"
            >
              {showPasswordConfirmation ? 'Hide' : 'Show'} {/* Button text depending on showPasswordConfirmation state */}
            </button>
          </div>
          {formErrors.passwordConfirmation && <p className="text-red-500 text-sm text-left">{formErrors.passwordConfirmation}</p>}
        </div>
        <div className="h-5">
          {backendError && (
            <p className="text-red-600 text-base font-light py-1 inline-block">
              {backendError}
            </p>
          )}
        </div>
        <div className="mt-10">
          <LandingButton type="submit">Sign Up</LandingButton>
        </div>
        <div className="text-gray-600 text-base">
          Already Registered?{' '}
          <Link to="/login" className="text-lime-400 font-semibold hover:underline">
            Log In
          </Link>
        </div>
      </form>
    </div>
  );
}
