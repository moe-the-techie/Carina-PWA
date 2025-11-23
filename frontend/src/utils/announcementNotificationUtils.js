/**
 * Push notification utilities for announcements
 * Handles different types of push notifications and their configurations
 */

// Priority-based notification configurations
const NOTIFICATION_CONFIGS = {
    low: {
        requireInteraction: false,
        vibrate: [200],
        silent: false,
        timeout: 4000
    },
    normal: {
        requireInteraction: false,
        vibrate: [200, 100, 200],
        silent: false,
        timeout: 6000
    },
    high: {
        requireInteraction: false,
        vibrate: [200, 100, 200, 100, 200],
        silent: false,
        timeout: 8000
    },
    urgent: {
        requireInteraction: true,
        vibrate: [300, 100, 300, 100, 300],
        silent: false,
        timeout: 0 // Don't auto-dismiss
    }
};

// Get notification configuration based on priority
export const getNotificationConfig = (priority = 'normal') => {
    return NOTIFICATION_CONFIGS[priority] || NOTIFICATION_CONFIGS.normal;
};

// Create announcement notification data
export const createAnnouncementNotification = (announcement) => {
    const config = getNotificationConfig(announcement.priority);
    
    return {
        title: `New Announcement: ${announcement.title}`,
        body: announcement.message.substring(0, 120) + (announcement.message.length > 120 ? '...' : ''),
        icon: '/icons/manifest-icon-192.maskable.png',
        badge: '/icons/manifest-icon-192.maskable.png',
        tag: `announcement-${announcement._id}`,
        renotify: true,
        requireInteraction: config.requireInteraction,
        vibrate: config.vibrate,
        silent: config.silent,
        actions: [
            {
                action: 'view',
                title: 'View',
                icon: '/icons/manifest-icon-192.maskable.png'
            },
            {
                action: 'dismiss',
                title: 'Dismiss'
            }
        ],
        data: {
            url: '/announcements',
            announcementId: announcement._id,
            priority: announcement.priority,
            type: 'announcement',
            timestamp: Date.now()
        }
    };
};

// Show push notification via service worker
export const showAnnouncementPushNotification = async (announcement) => {
    try {
        if (!('serviceWorker' in navigator)) {
            console.log('Service Worker not supported');
            return false;
        }

        const registration = await navigator.serviceWorker.ready;
        const notificationData = createAnnouncementNotification(announcement);
        
        await registration.showNotification(notificationData.title, notificationData);
        
        // Auto-dismiss non-urgent notifications
        if (announcement.priority !== 'urgent') {
            const config = getNotificationConfig(announcement.priority);
            if (config.timeout > 0) {
                setTimeout(() => {
                    registration.getNotifications({ tag: notificationData.tag })
                        .then(notifications => {
                            notifications.forEach(notification => notification.close());
                        });
                }, config.timeout);
            }
        }
        
        return true;
    } catch (error) {
        console.error('Error showing announcement push notification:', error);
        return false;
    }
};

// Show browser notification (fallback)
export const showAnnouncementBrowserNotification = async (announcement) => {
    try {
        if (!('Notification' in window)) {
            console.log('Browser notifications not supported');
            return false;
        }

        if (Notification.permission !== 'granted') {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                return false;
            }
        }

        const config = getNotificationConfig(announcement.priority);
        const notificationData = createAnnouncementNotification(announcement);
        
        const notification = new Notification(notificationData.title, {
            body: notificationData.body,
            icon: notificationData.icon,
            badge: notificationData.badge,
            tag: notificationData.tag,
            renotify: notificationData.renotify,
            requireInteraction: notificationData.requireInteraction,
            vibrate: notificationData.vibrate,
            silent: notificationData.silent,
            data: notificationData.data
        });

        // Handle notification click
        notification.onclick = function(event) {
            event.preventDefault();
            window.focus();
            
            // Navigate to announcements page
            if (window.location.pathname !== '/announcements') {
                window.location.href = '/announcements';
            }
            
            this.close();
        };

        // Auto-dismiss non-urgent notifications
        if (announcement.priority !== 'urgent' && config.timeout > 0) {
            setTimeout(() => {
                notification.close();
            }, config.timeout);
        }
        
        return true;
    } catch (error) {
        console.error('Error showing browser notification:', error);
        return false;
    }
};

// Smart notification function (tries push first, fallback to browser)
export const showSmartAnnouncementNotification = async (announcement) => {
    const pushSuccess = await showAnnouncementPushNotification(announcement);
    
    if (!pushSuccess) {
        return await showAnnouncementBrowserNotification(announcement);
    }
    
    return pushSuccess;
};

// Check if notifications are enabled and supported
export const canShowNotifications = () => {
    if (!('Notification' in window)) {
        return { supported: false, enabled: false, reason: 'not_supported' };
    }
    
    if (Notification.permission === 'denied') {
        return { supported: true, enabled: false, reason: 'permission_denied' };
    }
    
    if (Notification.permission === 'default') {
        return { supported: true, enabled: false, reason: 'permission_not_requested' };
    }
    
    return { supported: true, enabled: true, reason: 'granted' };
};

// Request notification permissions
export const requestAnnouncementNotificationPermission = async () => {
    if (!('Notification' in window)) {
        return false;
    }
    
    if (Notification.permission === 'granted') {
        return true;
    }
    
    if (Notification.permission === 'denied') {
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

export default {
    getNotificationConfig,
    createAnnouncementNotification,
    showAnnouncementPushNotification,
    showAnnouncementBrowserNotification,
    showSmartAnnouncementNotification,
    canShowNotifications,
    requestAnnouncementNotificationPermission
};