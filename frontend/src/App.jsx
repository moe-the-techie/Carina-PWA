import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, data } from 'react-router-dom';
import { CircularProgress, Box, Skeleton } from '@mui/material';

// Eagerly load critical path components (landing, login)
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';

// Lazy load all other pages for code splitting
const SignUpPage = lazy(() => import('./pages/SignUpPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const AddFormPage = lazy(() => import('./pages/NewFormPage'));
const ViewPlanPage = lazy(() => import('./pages/ViewPlanPage'));
const FormSuccessPage = lazy(() => import('./pages/FormSuccessPage'));
const PaymentPage = lazy(() => import('./pages/PaymentPage'));
const PaymentResultPage = lazy(() => import('./pages/PaymentResultPage'));
const ActivePlansPage = lazy(() => import('./pages/ActivePlansPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const AnnouncementsPage = lazy(() => import('./pages/AnnouncementsPage'));

// Admin pages - lazy loaded since they're only accessed by admins
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'));
const AdminClassesPage = lazy(() => import('./pages/AdminClassesPage'));
const AdminFormsPage = lazy(() => import('./pages/AdminFormsPage'));
const AdminTemplatesPage = lazy(() => import('./pages/AdminTemplatesPage'));
const AdminPlanBuilderPage = lazy(() => import('./pages/AdminPlanBuilderPage'));
const AdminChatsPage = lazy(() => import('./pages/AdminChatsPage'));
const AdminAnnouncementsPage = lazy(() => import('./pages/AdminAnnouncementsPage'));
const AdminPaymentsPage = lazy(() => import('./pages/AdminPaymentsPage'));
const AdminActivePlansPage = lazy(() => import('./pages/AdminActivePlansPage'));

// Eagerly load layout components (used on every authenticated route)
import AdminLayout from './components/AdminLayout';
import AuthenticatedLayout from './components/AuthenticatedLayout';
import ScrollToTop from './components/ScrollToTop';
import OfflineIndicator from './components/OfflineIndicator';
import { clearAllCache } from './utils/offlineCache';
import { disconnectAbly } from './services/ablyService';
import { UnreadCountProvider } from './contexts/UnreadCountContext';
import { AnnouncementNotificationProvider } from './contexts/AnnouncementNotificationContext';
import { UserProvider } from './contexts/UserContext';
import { NavigationProvider } from './contexts/NavigationContext';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Loading fallback component - skeleton layout for smoother transitions
// This shows a skeleton that matches the general page structure
const PageLoader = () => (
    <Box 
        sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: 2,
            p: { xs: 2, md: 3 },
            minHeight: '50vh',
            width: '100%',
            maxWidth: '100%',
            overflow: 'hidden',
        }}
    >
        {/* Header skeleton */}
        <Skeleton 
            variant="text" 
            width="40%" 
            height={40} 
            sx={{ mb: 1 }}
        />
        {/* Content skeleton */}
        <Skeleton 
            variant="rounded" 
            width="100%" 
            height={120} 
            sx={{ borderRadius: 2 }}
        />
        <Skeleton 
            variant="rounded" 
            width="100%" 
            height={120} 
            sx={{ borderRadius: 2 }}
        />
        <Skeleton 
            variant="rounded" 
            width="100%" 
            height={80} 
            sx={{ borderRadius: 2 }}
        />
    </Box>
);

// Suspense wrapper for lazy-loaded routes
const LazyRoute = ({ children }) => (
    <Suspense fallback={<PageLoader />}>
        {children}
    </Suspense>
);

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

   const handleLogout = async () => {
    localStorage.removeItem('token');
    
    // Clear application cache
    clearAllCache();
    
    // Clear Service Worker caches (API, Runtime, and Images)
    if ('caches' in window) {
      try {
        const keys = await caches.keys();
        await Promise.all(
          keys.map(key => {
            if (key.includes('api-cache') || key.includes('runtime') || key.includes('image-cache')) {
              return caches.delete(key);
            }
            return Promise.resolve();
          })
        );
      } catch (e) {
        console.error('Error clearing caches:', e);
      }
    }

    setIsLoggedIn(false);
    setIsAdmin(false);
    setUserId(null);
    setUser(null);
    disconnectAbly();
   }

   // TODO: to fix the flashing issue, change / to be a loading animation and add /landing for the landing page when loading is done
    return (
        <Router>
            <NavigationProvider>
            <UserProvider enabled={isLoggedIn}>
                <UnreadCountProvider user={user}>
                    <AnnouncementNotificationProvider user={user}>
                        <OfflineIndicator />
                        <ScrollToTop />
                    <Routes>
                <Route path="/" element={isLoggedIn ? (isAdmin ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/home" replace />) : <LandingPage />} />
                <Route path="/login" element={isLoggedIn ? (isAdmin ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/home" replace />) : <LoginPage onLogin={handleLogin} />} />
                <Route path="/register" element={isLoggedIn ? (isAdmin ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/home" replace />) : <LazyRoute><SignUpPage onLogin={handleLogin} /></LazyRoute>} />
                <Route path="/forgot-password" element={isLoggedIn ? (isAdmin ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/home" replace />) : <LazyRoute><ForgotPasswordPage /></LazyRoute>} />
                <Route path="/home" element={isLoggedIn && !isAdmin ? <AuthenticatedLayout><LazyRoute><HomePage onLogin={handleLogin} /></LazyRoute></AuthenticatedLayout> : <Navigate to="/" replace/>} />
                <Route path="/active-plans" element={isLoggedIn && !isAdmin ? <AuthenticatedLayout><LazyRoute><ActivePlansPage /></LazyRoute></AuthenticatedLayout> : <Navigate to="/" replace/>} />
                <Route path="/settings" element={isLoggedIn ? <AuthenticatedLayout><LazyRoute><SettingsPage onLogout={handleLogout} /></LazyRoute></AuthenticatedLayout> : <Navigate to="/" replace/>} />
                <Route path="/chat" element={isLoggedIn ? <AuthenticatedLayout><LazyRoute><ChatPage /></LazyRoute></AuthenticatedLayout> : <Navigate to="/" replace/>} />
                <Route path="/announcements" element={isLoggedIn && isFeatureEnabled('VITE_ENABLE_ANNOUNCEMENTS') ? <AuthenticatedLayout><LazyRoute><AnnouncementsPage user={user} /></LazyRoute></AuthenticatedLayout> : <Navigate to="/" replace/>} />
                <Route path="/new-form" element={isLoggedIn ? <LazyRoute><AddFormPage /></LazyRoute> : <Navigate to="/" replace/>} />
                <Route path="/form-success" element={isLoggedIn ? <LazyRoute><FormSuccessPage /></LazyRoute> : <Navigate to="/" replace/>} />
                <Route path="/view-plan/:id" element={isLoggedIn ? <LazyRoute><ViewPlanPage /></LazyRoute> : <Navigate to="/" replace/>} />
                <Route path="/payment" element={isLoggedIn ? <LazyRoute><PaymentPage /></LazyRoute> : <Navigate to="/" replace/>} />
                <Route path="/payment/success" element={<LazyRoute><PaymentResultPage /></LazyRoute>} />
                <Route path="/payment/failed" element={<LazyRoute><PaymentResultPage /></LazyRoute>} />
                <Route path="/payment/pending" element={<LazyRoute><PaymentResultPage /></LazyRoute>} />
                
                {/* Admin*/}
                <Route path="/admin/dashboard" element={isLoggedIn && isAdmin ? <AdminLayout onLogout={handleLogout}><LazyRoute><AdminDashboardPage /></LazyRoute></AdminLayout> : <Navigate to="/" replace/>} />
                <Route path="/admin/users" element={isLoggedIn && isAdmin ? <AdminLayout onLogout={handleLogout}><LazyRoute><AdminUsersPage /></LazyRoute></AdminLayout> : <Navigate to="/" replace/>} />
                <Route path="/admin/classes" element={isLoggedIn && isAdmin && isFeatureEnabled('VITE_ENABLE_USER_CLASSES') ? <AdminLayout onLogout={handleLogout}><LazyRoute><AdminClassesPage /></LazyRoute></AdminLayout> : <Navigate to="/" replace/>} />
                <Route path="/admin/forms" element={isLoggedIn && isAdmin ? <AdminLayout onLogout={handleLogout}><LazyRoute><AdminFormsPage /></LazyRoute></AdminLayout> : <Navigate to="/" replace/>} />
                <Route path="/admin/templates" element={isLoggedIn && isAdmin && isFeatureEnabled('VITE_ENABLE_PLAN_TEMPLATES') ? <AdminLayout onLogout={handleLogout}><LazyRoute><AdminTemplatesPage /></LazyRoute></AdminLayout> : <Navigate to="/" replace/>} />
                <Route path="/admin/plan-builder" element={isLoggedIn && isAdmin ? <AdminLayout onLogout={handleLogout}><LazyRoute><AdminPlanBuilderPage /></LazyRoute></AdminLayout> : <Navigate to="/" replace/>} />
                <Route path="/admin/chats" element={isLoggedIn && isAdmin ? <AdminLayout onLogout={handleLogout}><LazyRoute><AdminChatsPage /></LazyRoute></AdminLayout> : <Navigate to="/" replace/>} />
                <Route path="/admin/announcements" element={isLoggedIn && isAdmin && isFeatureEnabled('VITE_ENABLE_ANNOUNCEMENTS') ? <AdminLayout onLogout={handleLogout}><LazyRoute><AdminAnnouncementsPage /></LazyRoute></AdminLayout> : <Navigate to="/" replace/>} />
                <Route path="/admin/payments" element={isLoggedIn && isAdmin ? <AdminLayout onLogout={handleLogout}><LazyRoute><AdminPaymentsPage /></LazyRoute></AdminLayout> : <Navigate to="/" replace/>} />
                <Route path="/admin/active-plans" element={isLoggedIn && isAdmin ? <AdminLayout onLogout={handleLogout}><LazyRoute><AdminActivePlansPage /></LazyRoute></AdminLayout> : <Navigate to="/" replace/>} />
                </Routes>
                </AnnouncementNotificationProvider>
            </UnreadCountProvider>
            </UserProvider>
            </NavigationProvider>
        </Router>    );
}

export default App;