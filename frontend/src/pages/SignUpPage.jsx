import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function SignUpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    let errors = {};

    if (!name.trim()) {
      errors.name = 'Name is required';
    }
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      errors.email = 'Invalid email format';
    }
    if (!password.trim()) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    if (!passwordConfirmation.trim()) {
      errors.passwordConfirmation = 'Password confirmation is required';
    } else if (password !== passwordConfirmation) {
      errors.passwordConfirmation = 'Passwords do not match';
    }

    setFormErrors(errors);

    if (Object.keys(errors).length === 0) {
      // Handle login logic here (e.g., send data to an API)
      console.log('Form submitted successfully!', { name, email, password });
      // Reset form fields
      setName('');
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
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-4"
      >
        <div className="space-y-2">
          <label htmlFor="name" className="block text-left text-gray-700 text-sm font-bold mb-1">
            Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`
              w-full px-4 py-3 rounded-md border
              ${formErrors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}
              focus:outline-none transition duration-200
            `}
          />
          {formErrors.name && (
            <p className="text-red-500 text-sm text-left">{formErrors.name}</p>
          )}
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
        <div className="space-y-1">
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
          {formErrors.password && (
            <p className="text-red-500 text-sm text-left">{formErrors.password}</p>
          )}
        </div>
        <div className="space-y-2">
          <label htmlFor="passwordConfirmation" className="block text-left text-gray-700 text-sm font-bold mb-1">
            Confirm Password
          </label>
          <input
            type="password"
            id="passwordConfirmation"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            className={`
              w-full px-4 py-3 rounded-md border
              ${formErrors.passwordConfirmation ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}
              focus:outline-none transition duration-200
            `}
          />
          {formErrors.passwordConfirmation && (
            <p className="text-red-500 text-sm text-left">{formErrors.passwordConfirmation}</p>
          )}
        </div>
        <div className="mt-10">
        <button
          type="submit"
          className={`
            w-full bg-lime-400 text-gray-800 py-3 rounded-md
            hover:bg-lime-500 transition duration-200 font-semibold
            shadow-md
          `}
        >
          Sign Up
        </button>
        </div>
        <div className="text-gray-600 text-base">
          Already Registered?{' '}
          <Link to="/login" className={`text-lime-400 font-semibold hover:underline`}>
            Log In
          </Link>
        </div>
      </form>
    </div>
  );
};
