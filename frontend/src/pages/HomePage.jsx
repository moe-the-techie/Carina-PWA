import React from 'react';
import { useNavigate } from 'react-router-dom';
import LandingButton from '../components/LandingButton.jsx';
import PageFade from '../components/PageFade';

export default function HomePage({ onLogin }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    onLogin();
    navigate('/');
  };

  return (
    <PageFade>
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <h1 className="text-3xl font-semibold text-blue-600 mb-4">
          Welcome to the Home Page! This page is still under development.
        </h1>
        <p className="text-gray-700 mb-6">You are now logged in!</p>
        <LandingButton onClick={handleLogout}>Logout</LandingButton>
      </div>
    </div>
    </PageFade>
  );
}
