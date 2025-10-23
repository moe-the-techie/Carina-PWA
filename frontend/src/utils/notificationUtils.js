/**
 * Notification utilities for the PWA
 * Handles notification permissions, display, and user preferences
 */

// Check if notifications are supported
export const isNotificationSupported = () => {
    return 'Notification' in window;
};

// Check if service worker is supported
export const isServiceWorkerSupported = () => {
    return 'serviceWorker' in navigator;
};

// Get current notification permission status
export const getNotificationPermission = () => {
    if (!isNotificationSupported()) {
        return 'unsupported';
    }
    return Notification.permission;
};

// Request notification permission
export const requestNotificationPermission = async () => {
    if (!isNotificationSupported()) {
        console.log('Notifications not supported');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission === 'denied') {
        console.log('Notification permission denied');
        return false;
    }

    try {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    } catch (error) {
        console.error('Error requesting notification permission:', error);
        return false;
    }
};

// Show a notification
export const showNotification = async (title, options = {}) => {
    if (!isNotificationSupported()) {
        console.log('Notifications not supported');
        return;
    }

    // Ensure we have permission
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
        console.log('No notification permission');
        return;
    }

    const defaultOptions = {
        icon: '/icons/manifest-icon-192.maskable.png',
        badge: '/icons/manifest-icon-192.maskable.png',
        vibrate: [200, 100, 200],
        renotify: true,
        requireInteraction: false,
    };

    const finalOptions = { ...defaultOptions, ...options };

    try {
        // Try to use service worker notification first (works even when app is closed)
        if (isServiceWorkerSupported() && navigator.serviceWorker.controller) {
            const registration = await navigator.serviceWorker.ready;
            await registration.showNotification(title, finalOptions);
        } else {
            // Fallback to browser notification (only works when app is open)
            new Notification(title, finalOptions);
        }
    } catch (error) {
        console.error('Error showing notification:', error);
    }
};

// Check if user has enabled notifications in settings
export const areNotificationsEnabled = () => {
    try {
        const settings = JSON.parse(localStorage.getItem('notificationSettings') || '{}');
        return settings.enabled !== false; // Default to true
    } catch (error) {
        return true;
    }
};

// Save notification settings
export const saveNotificationSettings = (enabled) => {
    try {
        const settings = { enabled, updatedAt: new Date().toISOString() };
        localStorage.setItem('notificationSettings', JSON.stringify(settings));
        return true;
    } catch (error) {
        console.error('Error saving notification settings:', error);
        return false;
    }
};

// Check if we should show notification based on app visibility
export const shouldShowNotification = () => {
    // Always show notifications if enabled in settings
    if (!areNotificationsEnabled()) {
        return false;
    }

    // Check if document is hidden (app in background or tab not active)
    if (typeof document !== 'undefined' && document.hidden) {
        return true;
    }

    // Check if window is not focused
    if (typeof document !== 'undefined' && !document.hasFocus()) {
        return true;
    }

    // Show notification even if app is visible (user preference)
    return true;
};

// Register for push notifications (if backend supports it)
export const subscribeToPushNotifications = async () => {
    if (!isServiceWorkerSupported()) {
        console.log('Service Worker not supported');
        return null;
    }

    try {
        const registration = await navigator.serviceWorker.ready;
        
        // Check if already subscribed
        let subscription = await registration.pushManager.getSubscription();
        
        if (!subscription) {
            // Subscribe to push notifications
            // Note: You'll need a VAPID public key from your backend
            // subscription = await registration.pushManager.subscribe({
            //     userVisibleOnly: true,
            //     applicationServerKey: 'YOUR_VAPID_PUBLIC_KEY'
            // });
            
            console.log('Push notifications require VAPID keys - implement in backend');
        }
        
        return subscription;
    } catch (error) {
        console.error('Error subscribing to push notifications:', error);
        return null;
    }
};

// Unsubscribe from push notifications
export const unsubscribeFromPushNotifications = async () => {
    if (!isServiceWorkerSupported()) {
        return false;
    }

    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        
        if (subscription) {
            await subscription.unsubscribe();
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Error unsubscribing from push notifications:', error);
        return false;
    }
};

export default {
    isNotificationSupported,
    isServiceWorkerSupported,
    getNotificationPermission,
    requestNotificationPermission,
    showNotification,
    areNotificationsEnabled,
    saveNotificationSettings,
    shouldShowNotification,
    subscribeToPushNotifications,
    unsubscribeFromPushNotifications,
};
