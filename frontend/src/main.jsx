import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import './index.css'
import './responsive.css'
import App from './App.jsx'
import { ThemeContextProvider } from './contexts/ThemeContext.jsx';
import { registerSW } from 'virtual:pwa-register';

// Register service worker using Vite PWA plugin
const updateSW = registerSW({
  onRegistered(registration) {
    console.log('[PWA] Service worker registered:', registration?.scope);
    
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('[PWA] Notification permission:', permission);
      });
    }
  },
  onRegisterError(error) {
    console.error('[PWA] SW registration failed:', error);
  },
  onNeedRefresh() {
    console.log('[PWA] New content available, refresh needed');
    // Auto-update without prompting
    updateSW(true);
  },
  onOfflineReady() {
    console.log('[PWA] App ready to work offline');
  }
});

// Listen for SW messages to write to localStorage
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', event => {
    const { type, key, value, subscription } = event.data;
    if (type === 'SET_LOCALSTORAGE') {
      localStorage.setItem(key, value);
      console.log('[PWA] Stored in localStorage:', key, value);
    } else if (type === 'PUSH_SUBSCRIPTION_CHANGED') {
      // Handle push subscription renewal
      console.log('[PWA] Push subscription changed, will re-register on next login');
      // The ablyPushService will handle re-registration
    }
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeContextProvider>
      <App />
    </ThemeContextProvider>
  </StrictMode>,
)
