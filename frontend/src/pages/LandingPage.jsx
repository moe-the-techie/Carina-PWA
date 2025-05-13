import React from 'react';
import { Link } from 'react-router-dom';
import LandingButton from '../components/LandingButton.jsx';
import PageFade from '../components/PageFade';

export default function LandingPage() {
  return (
    <PageFade>
    <div className="min-h-screen flex flex-col justify-center items-center px-6 text-center overflow-hidden relative h-full w-full bg-grey-50">
      <img src="/logo.PNG" alt="App Logo" className="w-50 h-50 mb-8 relative z-10" />

      <h1 className="text-3xl font-semibold text-gray-800 mb-4 relative z-10">
        Welcome!
      </h1>
      <p className="text-lg text-gray-600 mb-10 relative z-10">
        Your Nutrition Journey Begins Here.
      </p>

      <div className="flex flex-col gap-4 w-full max-w-md relative z-10">
        <Link to="/login" className="w-full">
          <LandingButton>Login</LandingButton>
        </Link>
        <Link to="/register" className="w-full">
          <LandingButton>Sign Up</LandingButton>
        </Link>
      </div>
    </div>
    </PageFade>
  );
}
