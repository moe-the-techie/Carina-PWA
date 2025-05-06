import React from 'react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center bg-gray-50 items-center px-6 text-center relative overflow-hidden">
      <img src="/logo.PNG" alt="App Logo" className="w-50 h-50 mb-8 relative z-10" />

      <h1 className="text-3xl font-semibold text-gray-800 mb-4 relative z-10">
        Welcome!
      </h1>
      <p className="text-lg text-gray-600 mb-10 relative z-10">
        Your Nutrition Journey Begins Here.
      </p>

      <div className="flex flex-col gap-4 w-full max-w-md relative z-10">
        <Link to="/login" className="w-full">
          <button
            className={`
              w-full bg-lime-400 text-black py-3 rounded-md
              hover:bg-opacity-90 transition duration-200 font-semibold
            `}
          >
            Login
          </button>
        </Link>
        <Link to="/signup" className="w-full">
          <button
            className={`
              w-full bg-lime-400 text-black py-3 rounded-md
              hover:bg-opacity-80 transition duration-200 font-semibold
            `}
          >
            Sign Up
          </button>
        </Link>
      </div>
    </div>
  );
}
