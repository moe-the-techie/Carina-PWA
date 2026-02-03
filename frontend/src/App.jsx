import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, data } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import LandingPage from './pages/LandingPage'
import SignUpPage from './pages/SignUpPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import AddFormPage from './pages/NewFormPage';
import ViewPlanPage from './pages/ViewPlanPage';
import FormSuccessPage from './pages/FormSuccessPage';
import PaymentPage from './pages/PaymentPage';
import PaymentResultPage from './pages/PaymentResultPage';
import ActivePlansPage from './pages/ActivePlansPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminLayout from './components/AdminLayout';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminClassesPage from './pages/AdminClassesPage';
import AdminFormsPage from './pages/AdminFormsPage';
import AdminTemplatesPage from './pages/AdminTemplatesPage';
import AdminPlanBuilderPage from './pages/AdminPlanBuilderPage';
import AdminChatsPage from './pages/AdminChatsPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import AdminAnnouncementsPage from './pages/AdminAnnouncementsPage';
import AdminPaymentsPage from './pages/AdminPaymentsPage';
import AdminActivePlansPage from './pages/AdminActivePlansPage';
import AuthenticatedLayout from './components/AuthenticatedLayout';
import ScrollToTop from './components/ScrollToTop';
import SettingsPage from './pages/SettingsPage';
import ChatPage from './pages/ChatPage';
import OfflineIndicator from './components/OfflineIndicator';
import { disconnectAbly } from './services/ablyService';
import { cleanupPushNotifications } from './services/ablyPushService';
import { UnreadCountProvider } from './contexts/UnreadCountContext';
import { AnnouncementNotificationProvider } from './contexts/AnnouncementNotificationContext';
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const isFeatureEnabled = (featureName) => {
    return import.meta.env[featureName] !== 'false';
};

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(() => {
        return localStorage.getItem('token') ? true : false;
    });
    const [isAdmin, setIsAdmin] = useState(false);
    const [update, setUpdate] = useState(0); // State variable to trigger re-render
    const [userId, setUserId] = useState(null);
    const [user, setUser] = useState(null);

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
                    setUserId(data.userId || null);
                    setUser({ _id: data.userId, role: data.isAdmin ? 'admin' : 'user' });
                })
                .catch(error => {
                    console.error('Token validation failed:', error);
                    localStorage.removeItem('token');
                    setIsLoggedIn(false);
                    setIsAdmin(false);
                    setUser(null);
                })
        } else {
            setIsLoggedIn(false);
            setIsAdmin(false);
            setUser(null);
        }
    }, [update]);

    const handleLogin = () => {
      setUpdate(prev => prev + 1); //  Update the state variable
   };

   const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setIsAdmin(false);
    setUserId(null);
    setUser(null);
    disconnectAbly();
    cleanupPushNotifications().catch(console.error);
   }

   // TODO: to fix the flashing issue, change / to be a loading animation and add /landing for the landing page when loading is done

    return (
        <Router>
            <UnreadCountProvider user={user}>
                <AnnouncementNotificationProvider user={user}>
                    <OfflineIndicator />
                    <ScrollToTop />
                    <Routes>
                <Route path="/" element={isLoggedIn ? (isAdmin ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/home" replace />) : <LandingPage />} />
                <Route path="/login" element={isLoggedIn ? (isAdmin ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/home" replace />) : <LoginPage onLogin={handleLogin} />} />
                <Route path="/register" element={isLoggedIn ? (isAdmin ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/home" replace />) : <SignUpPage onLogin={handleLogin} />} />
                <Route path="/forgot-password" element={isLoggedIn ? (isAdmin ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/home" replace />) : <ForgotPasswordPage />} />
                <Route path="/home" element={isLoggedIn && !isAdmin ? <AuthenticatedLayout><HomePage onLogin={handleLogin} /></AuthenticatedLayout> : <Navigate to="/" replace/>} />
                <Route path="/active-plans" element={isLoggedIn && !isAdmin ? <AuthenticatedLayout><ActivePlansPage /></AuthenticatedLayout> : <Navigate to="/" replace/>} />
                <Route path="/settings" element={isLoggedIn ? <AuthenticatedLayout><SettingsPage onLogout={handleLogout} /></AuthenticatedLayout> : <Navigate to="/" replace/>} />
                <Route path="/chat" element={isLoggedIn ? <AuthenticatedLayout><ChatPage /></AuthenticatedLayout> : <Navigate to="/" replace/>} />
                <Route path="/announcements" element={isLoggedIn && isFeatureEnabled('VITE_ENABLE_ANNOUNCEMENTS') ? <AuthenticatedLayout><AnnouncementsPage user={user} /></AuthenticatedLayout> : <Navigate to="/" replace/>} />
                <Route path="/new-form" element={isLoggedIn ? <AddFormPage /> : <Navigate to="/" replace/>} />
                <Route path="/form-success" element={isLoggedIn ? <FormSuccessPage /> : <Navigate to="/" replace/>} />
                <Route path="/view-plan/:id" element={isLoggedIn ? <ViewPlanPage /> : <Navigate to="/" replace/>} />
                <Route path="/payment" element={isLoggedIn ? <PaymentPage /> : <Navigate to="/" replace/>} />
                <Route path="/payment/success" element={<PaymentResultPage />} />
                <Route path="/payment/failed" element={<PaymentResultPage />} />
                <Route path="/payment/pending" element={<PaymentResultPage />} />
                
                {/* Admin*/}
                <Route path="/admin/dashboard" element={isLoggedIn && isAdmin ? <AdminLayout onLogout={handleLogout}><AdminDashboardPage /></AdminLayout> : <Navigate to="/" replace/>} />
                <Route path="/admin/users" element={isLoggedIn && isAdmin ? <AdminLayout onLogout={handleLogout}><AdminUsersPage /></AdminLayout> : <Navigate to="/" replace/>} />
                <Route path="/admin/classes" element={isLoggedIn && isAdmin && isFeatureEnabled('VITE_ENABLE_USER_CLASSES') ? <AdminLayout onLogout={handleLogout}><AdminClassesPage /></AdminLayout> : <Navigate to="/" replace/>} />
                <Route path="/admin/forms" element={isLoggedIn && isAdmin ? <AdminLayout onLogout={handleLogout}><AdminFormsPage /></AdminLayout> : <Navigate to="/" replace/>} />
                <Route path="/admin/templates" element={isLoggedIn && isAdmin && isFeatureEnabled('VITE_ENABLE_PLAN_TEMPLATES') ? <AdminLayout onLogout={handleLogout}><AdminTemplatesPage /></AdminLayout> : <Navigate to="/" replace/>} />
                <Route path="/admin/plan-builder" element={isLoggedIn && isAdmin ? <AdminLayout onLogout={handleLogout}><AdminPlanBuilderPage /></AdminLayout> : <Navigate to="/" replace/>} />
                <Route path="/admin/chats" element={isLoggedIn && isAdmin ? <AdminLayout onLogout={handleLogout}><AdminChatsPage /></AdminLayout> : <Navigate to="/" replace/>} />
                <Route path="/admin/announcements" element={isLoggedIn && isAdmin && isFeatureEnabled('VITE_ENABLE_ANNOUNCEMENTS') ? <AdminLayout onLogout={handleLogout}><AdminAnnouncementsPage /></AdminLayout> : <Navigate to="/" replace/>} />
                <Route path="/admin/payments" element={isLoggedIn && isAdmin ? <AdminLayout onLogout={handleLogout}><AdminPaymentsPage /></AdminLayout> : <Navigate to="/" replace/>} />
                <Route path="/admin/active-plans" element={isLoggedIn && isAdmin ? <AdminLayout onLogout={handleLogout}><AdminActivePlansPage /></AdminLayout> : <Navigate to="/" replace/>} />
                </Routes>
                </AnnouncementNotificationProvider>
            </UnreadCountProvider>
        </Router>
    );
}

export default App;