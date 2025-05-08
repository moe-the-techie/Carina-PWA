import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import LandingPage from './pages/LandingPage'
import SignUpPage from './pages/SignUpPage';
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loading, setLoading] = useState(true);
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
            })
                .then(response => {
                    if (response.ok) {
                        return response.json();
                    }
                    throw new Error('Invalid token');
                })
                .then(() => { // Removed the unused 'data' parameter
                    setIsLoggedIn(true);
                })
                .catch(error => {
                    console.error('Token validation failed:', error);
                    localStorage.removeItem('token');
                    setIsLoggedIn(false);
                })
                .finally(() => setLoading(false));
        } else {
            setIsLoggedIn(false);
            setLoading(false);
        }
    }, [update]);

    const handleLogin = () => {
      setUpdate(prev => prev + 1); //  Update the state variable
   };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <Router>
            <Routes>
                <Route path="/" element={isLoggedIn ? <Navigate to="/home" replace /> : <LandingPage />} />
                <Route path="/login" element={isLoggedIn ? <Navigate to="/home" replace /> : <LoginPage onLogin={handleLogin} />} />
                <Route path="/register" element={isLoggedIn ? <Navigate to="/home" replace /> : <SignUpPage onLogin={handleLogin} />} />
                <Route path="/home" element={isLoggedIn ? <HomePage onLogin={handleLogin} /> : <Navigate to="/" replace/>} />
            </Routes>
        </Router>
    );
}

export default App;