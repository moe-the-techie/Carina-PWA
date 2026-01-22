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

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js', { type: import.meta.env.DEV ? 'module' : 'classic' })
    .then(reg => {
      console.log('[PWA] Service worker registered:', reg.scope);
      
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          console.log('[PWA] Notification permission:', permission);
        });
      }
    })
    .catch(err => console.error('[PWA] SW registration failed:', err));

  // Listen for SW messages to write to localStorage
  navigator.serviceWorker.addEventListener('message', event => {
    const { type, key, value } = event.data;
    if (type === 'SET_LOCALSTORAGE') {
      localStorage.setItem(key, value);
      console.log('[PWA] Stored in localStorage:', key, value);
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
