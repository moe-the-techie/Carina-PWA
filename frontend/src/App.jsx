import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import LandingPage from './pages/LandingPage'
import SignUpPage from './pages/SignUpPage';
import AuthenticatedLayout from './components/AuthenticatedLayout';
import SettingsPage from './pages/SettingsPage';
import ChatPage from './pages/ChatPage';
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true); // State variable to track loading status
    const [update, setUpdate] = useState(0); // State variable to trigger re-render

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetch(`${apiBaseUrl}/api/auth/validateToken`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            }).then(response => {
                if (response.ok) {
                    console.log('isloading: ', isLoading);
                    return response.json();
                }
                throw new Error('Invalid token');
            }).then(() => setIsLoggedIn(true))
              .catch(error => {
                console.error('Token validation failed:', error);
                localStorage.removeItem('token');
                setIsLoggedIn(false);
            }).finally( () => setIsLoading(false));
        } else {
            setIsLoggedIn(false);
        }
    }, [isLoading, update]);

    const handleLogin = () => {
      setUpdate(prev => prev + 1); //  Update the state variable
   };

    if (isLoading) return <div>Loading...</div>; // TODO: Show loading screen here instead

    return (
        <Router>
            <Routes>
                <Route path="/" element={isLoggedIn ? <Navigate to="/home" replace /> : <LandingPage />} />
                <Route path="/login" element={isLoggedIn ? <Navigate to="/home" replace /> : <LoginPage onLogin={handleLogin} />} />
                <Route path="/register" element={isLoggedIn ? <Navigate to="/home" replace /> : <SignUpPage onLogin={handleLogin} />} />
                <Route path="/home" element={isLoggedIn ? <AuthenticatedLayout><HomePage onLogin={handleLogin} /></AuthenticatedLayout> : <Navigate to="/" replace/>} />
                <Route path="/settings" element={isLoggedIn ? <AuthenticatedLayout><SettingsPage onLogin={handleLogin} /></AuthenticatedLayout> : <Navigate to="/" replace/>} />
                <Route path="/chat" element={isLoggedIn ? <AuthenticatedLayout><ChatPage /></AuthenticatedLayout> : <Navigate to="/" replace/>} />
            </Routes>
        </Router>
    );
}

export default App;