import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [backendError, setBackendError] = useState('');
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
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (password.includes('"') || password.includes("'") || password.includes(';') || password.includes('`')) {
      errors.password = 'Password cannot contain special characters like ", \', ;, or `';
    }

    setFormErrors(errors);

    if (Object.keys(errors).length === 0) {
      try {
        const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        const res = await response.json();

        if (res.status() !== 200) {
          // Handle HTTP errors (e.g., 400, 404, 500)
          const errorData = await response.json(); 
          if (errorData && errorData.error) {
            setBackendError(errorData.error); // Set the backend error message
          } else {
             setBackendError(`Login failed: ${response.status}`);
          }
          return; // Stop processing here
        }
        
        console.log('Login successful!', res);
        localStorage.setItem('token', res.token);
        onLogin();
        navigate('/');
      } catch (error) {
        // Handle network errors or errors in the fetch process itself
        console.error('Error:', error);
        setBackendError('An unexpected error occurred. Please try again later.');
      }

      setEmail('');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 px-6 text-center">
      <img src="/logo.PNG" alt="App Logo" className="w-50 h-50 mb-8" />

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
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`
              w-full px-4 py-3 rounded-md border
              ${formErrors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}
              focus:outline-none transition duration-200
            `}
          />
        </div>
        {backendError && (
          <p className="text-red-500 text-sm text-left">{backendError}</p>
        )}
        <div className="mt-20">
        <button
          type="submit"
          className={`
            w-full bg-lime-400 text-gray-800 py-3 rounded-md
            hover:bg-lime-500 transition duration-200 font-semibold
            shadow-md
          `}
        >
          Log In
        </button>
        </div>
        <div className="text-gray-600 text-base">
          Don't have an account?{' '}
          <Link to="/register" className={`text-lime-400 font-semibold hover:underline`}>
            Sign Up
          </Link>
        </div>
      </form>
    </div>
  );
};
