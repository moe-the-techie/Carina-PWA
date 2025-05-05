import React from 'react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100 px-4 text-center">
      <img src="/logo.PNG" alt="App Logo" className="w-40 h-40 mb-6" />

      <h1 className="text-2xl font-semibold text-gray-800 mb-2">
        Welcome to Carina!
      </h1>
      <p className="text-gray-600 mb-8">
        Your health companion — always within reach.
      </p>

      <div className="flex space-x-4">
        <Link to="/login">
          <button className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition">
            Login
          </button>
        </Link>
        <Link to="/signup">
          <button className="bg-gray-300 text-gray-800 px-6 py-2 rounded-full hover:bg-gray-400 transition">
            Sign Up
          </button>
        </Link>
      </div>
    </div>
  );
};
