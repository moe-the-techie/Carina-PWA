import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, data } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import LandingPage from './pages/LandingPage'
import SignUpPage from './pages/SignUpPage';
import AddFormPage from './pages/NewFormPage';
import ViewPlanPage from './pages/ViewPlanPage';
import FormSuccessPage from './pages/FormSuccessPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminLayout from './components/AdminLayout';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminFormsPage from './pages/AdminFormsPage';
import AuthenticatedLayout from './components/AuthenticatedLayout';
import ScrollToTop from './components/ScrollToTop';
import SettingsPage from './pages/SettingsPage';
import ChatPage from './pages/ChatPage';
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(() => {
        return localStorage.getItem('token') ? true : false;
    });
    const [isAdmin, setIsAdmin] = useState(false);
    const [update, setUpdate] = useState(0); // State variable to trigger re-render

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

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
                .then((data) => {
                    setIsLoggedIn(true);
                    setIsAdmin(data.isAdmin || false);
                })
                .catch(error => {
                    console.error('Token validation failed:', error);
                    localStorage.removeItem('token');
                    setIsLoggedIn(false);
                    setIsAdmin(false);
                })
        } else {
            setIsLoggedIn(false);
            setIsAdmin(false);
        }
    }, [update]);

    const handleLogin = () => {
      setUpdate(prev => prev + 1); //  Update the state variable
   };

   const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
   }

   // TODO: to fix the flashing issue, change / to be a loading animation and add /landing for the landing page when loading is done

    return (
        <Router>
            <ScrollToTop />
            <Routes>
                <Route path="/" element={isLoggedIn ? (isAdmin ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/home" replace />) : <LandingPage />} />
                <Route path="/login" element={isLoggedIn ? (isAdmin ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/home" replace />) : <LoginPage onLogin={handleLogin} />} />
                <Route path="/register" element={isLoggedIn ? (isAdmin ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/home" replace />) : <SignUpPage onLogin={handleLogin} />} />
                <Route path="/home" element={isLoggedIn && !isAdmin ? <AuthenticatedLayout><HomePage onLogin={handleLogin} /></AuthenticatedLayout> : <Navigate to="/" replace/>} />
                <Route path="/settings" element={isLoggedIn ? <AuthenticatedLayout><SettingsPage onLogout={handleLogout} /></AuthenticatedLayout> : <Navigate to="/" replace/>} />
                <Route path="/chat" element={isLoggedIn ? <AuthenticatedLayout><ChatPage /></AuthenticatedLayout> : <Navigate to="/" replace/>} />
                <Route path="/new-form" element={isLoggedIn ? <AddFormPage /> : <Navigate to="/" replace/>} />
                <Route path="/form-success" element={isLoggedIn ? <FormSuccessPage /> : <Navigate to="/" replace/>} />
                <Route path="/view-plan/:id" element={isLoggedIn ? <ViewPlanPage /> : <Navigate to="/" replace/>} />
                
                {/* Admin*/}
                <Route path="/admin/dashboard" element={isLoggedIn && isAdmin ? <AdminLayout onLogout={handleLogout}><AdminDashboardPage /></AdminLayout> : <Navigate to="/" replace/>} />
                <Route path="/admin/users" element={isLoggedIn && isAdmin ? <AdminLayout onLogout={handleLogout}><AdminUsersPage /></AdminLayout> : <Navigate to="/" replace/>} />
                <Route path="/admin/forms" element={isLoggedIn && isAdmin ? <AdminLayout onLogout={handleLogout}><AdminFormsPage /></AdminLayout> : <Navigate to="/" replace/>} />
            </Routes>
        </Router>
    );
}

export default App;