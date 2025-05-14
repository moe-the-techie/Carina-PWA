import React from 'react';
import { useNavigate } from 'react-router-dom';
import LandingButton from '../components/LandingButton.jsx';
import PageFade from '../components/PageFade';

export default function SettingsPage({ onLogin }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    onLogin();
    navigate('/');
  };

  return (
    <PageFade>
    <div className="h-[90vh] flex flex-col items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <h1 className="text-3xl font-semibold text-blue-600 mb-4">
          Settings Page. (Under Construction)
        </h1>
        <p className="text-gray-700 mb-6">You are currently logged in!</p>
        <LandingButton onClick={handleLogout}>Logout</LandingButton>
      </div>
    </div>
    </PageFade>
  );
}
