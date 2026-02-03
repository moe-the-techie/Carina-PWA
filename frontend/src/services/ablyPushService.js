/**
 * Ably Push Notifications Service
 * Handles Web Push activation and subscription for receiving notifications
 * when the app is closed or in the background.
 */

import * as Ably from 'ably';
import Push from 'ably/push';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

let pushClient = null;
let isActivated = false;

// Helper function to get auth token
const getAuthToken = () => {
    return localStorage.getItem('token');
};

// Get the service worker registration
const getServiceWorkerRegistration = async () => {
    if (!('serviceWorker' in navigator)) {
        throw new Error('Service workers are not supported');
    }
    
    const registration = await navigator.serviceWorker.ready;
    return registration;
};

/**
 * Initialize Ably client with Push plugin
 */
export const initializeAblyPush = async () => {
    if (pushClient) {
        return pushClient;
    }

    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('No authentication token available');
        }

        // Get the already registered service worker
        const swRegistration = await getServiceWorkerRegistration();

        // Monkey patch navigator.serviceWorker.register in dev mode to handle module workers
        // Ably tries to re-register the SW but doesn't pass { type: 'module' } which is required in Vite dev
        if (import.meta.env.DEV && 'serviceWorker' in navigator) {
            const originalRegister = navigator.serviceWorker.register;
            navigator.serviceWorker.register = function(scriptURL, options) {
                // If the URL matches our active SW, force module type
                if (scriptURL === swRegistration.active?.scriptURL || (typeof scriptURL === 'string' && scriptURL.includes('dev-sw.js'))) {
                    console.log('[AblyPush] Intercepted Ably SW registration, forcing type: module');
                    return originalRegister.call(this, scriptURL, { ...options, type: 'module' });
                }
                return originalRegister.apply(this, arguments);
            };
        }
        
        // Initialize Ably Realtime with Push plugin
        // Use the existing service worker registration instead of specifying a URL
        pushClient = new Ably.Realtime({
            authUrl: `${API_URL}/api/chat/ably/auth`,
            authHeaders: {
                'Authorization': `Bearer ${token}`
            },
            authMethod: 'GET',
            plugins: { Push },
            pushServiceWorkerUrl: swRegistration.active?.scriptURL || '/sw.js',
            disconnectedRetryTimeout: 15000,
            suspendedRetryTimeout: 30000,
        });

        return new Promise((resolve, reject) => {
            pushClient.connection.on('connected', () => {
                console.log('[AblyPush] Connected');
                resolve(pushClient);
            });

            pushClient.connection.on('failed', (error) => {
                console.error('[AblyPush] Connection failed:', error);
                reject(error);
            });

            // Set a timeout for connection
            setTimeout(() => {
                if (pushClient.connection.state !== 'connected') {
                    reject(new Error('Connection timeout'));
                }
            }, 15000);
        });
    } catch (error) {
        console.error('[AblyPush] Error initializing:', error);
        throw error;
    }
};

let activationInProgress = false;

/**
 * Activate push notifications for the browser
 * This registers the device with Ably for push notifications
 */
export const activatePush = async () => {
    // Prevent duplicate activation attempts
    if (isActivated) {
        console.log('[AblyPush] Already activated');
        return { success: true, deviceId: localStorage.getItem('ably-device-id') };
    }
    
    if (activationInProgress) {
        console.log('[AblyPush] Activation already in progress, waiting...');
        // Wait a bit and check again
        await new Promise(resolve => setTimeout(resolve, 2000));
        if (isActivated) {
            return { success: true, deviceId: localStorage.getItem('ably-device-id') };
        }
        return { success: false, reason: 'activation_in_progress' };
    }

    activationInProgress = true;
    
    try {
        // Check if push notifications are supported
        if (!('PushManager' in window)) {
            console.warn('[AblyPush] Push notifications not supported');
            activationInProgress = false;
            return { success: false, reason: 'not_supported' };
        }

        // Request notification permission
        if (Notification.permission === 'denied') {
            console.warn('[AblyPush] Notification permission denied');
            activationInProgress = false;
            return { success: false, reason: 'permission_denied' };
        }

        if (Notification.permission !== 'granted') {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                activationInProgress = false;
                return { success: false, reason: 'permission_not_granted' };
            }
        }

        // Ensure service worker is ready
        await getServiceWorkerRegistration();

        // Initialize Ably with Push plugin
        const client = await initializeAblyPush();

        // Activate push notifications
        console.log('[AblyPush] Activating push...');
        await client.push.activate();
        
        isActivated = true;
        activationInProgress = false;
        console.log('[AblyPush] Push activated successfully');

        // Store device ID for reference
        const deviceId = localStorage.getItem('ably-device-id');
        if (deviceId) {
            console.log('[AblyPush] Device ID:', deviceId);
        }

        return { success: true, deviceId };
    } catch (error) {
        activationInProgress = false;
        console.error('[AblyPush] Activation error:', error);
        return { success: false, reason: error.message };
    }
};

/**
 * Subscribe the device to a push channel
 * @param {string} channelName - The channel name to subscribe to (e.g., 'pushenabled:user-123')
 */
export const subscribeToPushChannel = async (channelName) => {
    try {
        if (!pushClient || !isActivated) {
            console.warn('[AblyPush] Push not activated, activating first...');
            const result = await activatePush();
            if (!result.success) {
                throw new Error(`Failed to activate push: ${result.reason}`);
            }
        }

        const channel = pushClient.channels.get(channelName);
        await channel.push.subscribeDevice();
        
        console.log(`[AblyPush] Subscribed device to channel: ${channelName}`);
        return { success: true };
    } catch (error) {
        console.error(`[AblyPush] Error subscribing to ${channelName}:`, error);
        return { success: false, error: error.message };
    }
};

/**
 * Subscribe using clientId (subscribes all user's devices)
 * @param {string} channelName - The channel name to subscribe to
 */
export const subscribeToPushChannelByClient = async (channelName) => {
    try {
        if (!pushClient || !isActivated) {
            console.warn('[AblyPush] Push not activated, activating first...');
            const result = await activatePush();
            if (!result.success) {
                throw new Error(`Failed to activate push: ${result.reason}`);
            }
        }

        const channel = pushClient.channels.get(channelName);
        await channel.push.subscribeClient();
        
        console.log(`[AblyPush] Subscribed client to channel: ${channelName}`);
        return { success: true };
    } catch (error) {
        console.error(`[AblyPush] Error subscribing client to ${channelName}:`, error);
        return { success: false, error: error.message };
    }
};

/**
 * Unsubscribe the device from a push channel
 * @param {string} channelName - The channel name to unsubscribe from
 */
export const unsubscribeFromPushChannel = async (channelName) => {
    try {
        if (!pushClient) {
            return { success: false, reason: 'not_initialized' };
        }

        const channel = pushClient.channels.get(channelName);
        await channel.push.unsubscribeDevice();
        
        console.log(`[AblyPush] Unsubscribed device from channel: ${channelName}`);
        return { success: true };
    } catch (error) {
        console.error(`[AblyPush] Error unsubscribing from ${channelName}:`, error);
        return { success: false, error: error.message };
    }
};

/**
 * Deactivate push notifications for this device
 */
export const deactivatePush = async () => {
    try {
        if (pushClient && isActivated) {
            await pushClient.push.deactivate();
            isActivated = false;
            console.log('[AblyPush] Push deactivated');
        }
        return { success: true };
    } catch (error) {
        console.error('[AblyPush] Error deactivating push:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Setup push notifications for a user
 * This should be called after user login
 * @param {string} userId - The user's ID
 * @param {boolean} isAdmin - Whether the user is an admin
 */
export const setupUserPushNotifications = async (userId, isAdmin = false) => {
    try {
        console.log('[AblyPush] Setting up push notifications for user:', userId);
        
        // Activate push first
        const activationResult = await activatePush();
        if (!activationResult.success) {
            console.warn('[AblyPush] Could not activate push:', activationResult.reason);
            return activationResult;
        }

        // Subscribe to user-specific push channels using pushenabled: prefix
        // The pushenabled: prefix tells Ably this channel should receive push notifications
        const channels = [
            `pushenabled:user:${userId}:notifications`,
            `pushenabled:user:${userId}:announcements`,
            `pushenabled:user:${userId}:messages`,
        ];

        if (isAdmin) {
            channels.push('pushenabled:admin:notifications');
        }

        // Subscribe to all channels
        const results = await Promise.allSettled(
            channels.map(channel => subscribeToPushChannelByClient(channel))
        );

        const subscribed = results.filter(r => r.status === 'fulfilled' && r.value.success);
        console.log(`[AblyPush] Subscribed to ${subscribed.length}/${channels.length} channels`);

        // Register device with backend for direct push
        try {
            await registerDeviceWithBackend(userId);
        } catch (error) {
            console.warn('[AblyPush] Could not register device with backend:', error);
        }

        return { success: true, subscribedChannels: subscribed.length };
    } catch (error) {
        console.error('[AblyPush] Error setting up push notifications:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Register the device with the backend for direct push notifications
 * @param {string} userId - The user's ID
 */
const registerDeviceWithBackend = async (userId) => {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('No auth token');
        }

        // Get the device ID from Ably
        const deviceId = localStorage.getItem('ably-device-id');
        if (!deviceId) {
            console.warn('[AblyPush] No device ID found');
            return;
        }

        const response = await fetch(`${API_URL}/api/push/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                deviceId,
                platform: 'web',
                userAgent: navigator.userAgent
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to register device: ${response.status}`);
        }

        console.log('[AblyPush] Device registered with backend');
    } catch (error) {
        console.error('[AblyPush] Error registering device:', error);
        throw error;
    }
};

/**
 * Cleanup push notifications (call on logout)
 */
export const cleanupPushNotifications = async () => {
    try {
        await deactivatePush();
        
        if (pushClient) {
            pushClient.close();
            pushClient = null;
        }
        
        isActivated = false;
        console.log('[AblyPush] Cleaned up push notifications');
    } catch (error) {
        console.error('[AblyPush] Error cleaning up:', error);
    }
};

/**
 * Check if push notifications are currently active
 */
export const isPushActive = () => {
    return isActivated && pushClient !== null;
};

/**
 * Get the push client instance
 */
export const getPushClient = () => pushClient;

export default {
    initializeAblyPush,
    activatePush,
    deactivatePush,
    subscribeToPushChannel,
    subscribeToPushChannelByClient,
    unsubscribeFromPushChannel,
    setupUserPushNotifications,
    cleanupPushNotifications,
    isPushActive,
    getPushClient
};
