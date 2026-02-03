import Ably from 'ably';

let ablyClient = null;
let ablyRealtime = null;

// Initialize Ably REST client
export const getAblyClient = () => {
    if (!ablyClient) {
        const apiKey = process.env.ABLY_API_KEY;
        
        if (!apiKey) {
            console.warn('ABLY_API_KEY not set in environment variables');
            return null;
        }

        ablyClient = new Ably.Rest({
            key: apiKey,
            authUrl: process.env.ABLY_AUTH_URL,
        });
    }
    
    return ablyClient;
};

// Initialize Ably Realtime client (for push admin operations)
export const getAblyRealtime = () => {
    if (!ablyRealtime) {
        const apiKey = process.env.ABLY_API_KEY;
        
        if (!apiKey) {
            console.warn('ABLY_API_KEY not set in environment variables');
            return null;
        }

        ablyRealtime = new Ably.Realtime({
            key: apiKey,
        });
    }
    
    return ablyRealtime;
};

// Publish a message to a channel
export const publishMessage = async (channelName, eventName, data) => {
    try {
        const client = getAblyClient();
        if (!client) {
            console.warn('Ably client not initialized, skipping message publish');
            return;
        }

        const channel = client.channels.get(channelName);
        await channel.publish(eventName, data);
        console.log(`Published message to channel: ${channelName}, event: ${eventName}`);
    } catch (error) {
        console.error('Error publishing message to Ably:', error);
    }
};

// Generate Ably token for a specific user
export const generateAblyToken = async (userId) => {
    try {
        const client = getAblyClient();
        if (!client) {
            throw new Error('Ably client not initialized');
        }

        const tokenParams = {
            clientId: userId.toString(),
            capability: {
                [`chat:${userId}`]: ['subscribe', 'presence'],
                [`chat:${userId}:messages`]: ['subscribe'],
                [`user:${userId}:announcements`]: ['subscribe'],
                [`plans:${userId}`]: ['subscribe'],
                'announcements': ['subscribe'],
                // Push notification capabilities
                [`pushenabled:user:${userId}:*`]: ['subscribe', 'push-subscribe'],
                'pushenabled:*': ['push-subscribe'],
            },
            ttl: 3600000, // 1 hour
        };

        const tokenRequest = await client.auth.createTokenRequest(tokenParams);
        return tokenRequest;
    } catch (error) {
        console.error('Error generating Ably token:', error);
        throw error;
    }
};

// Generate Ably token for admin users
export const generateAdminAblyToken = async (userId) => {
    try {
        const client = getAblyClient();
        if (!client) {
            throw new Error('Ably client not initialized');
        }

        const tokenParams = {
            clientId: `admin:${userId.toString()}`,
            capability: {
                'chat:*': ['subscribe', 'presence'],
                'chat:*:messages': ['subscribe'],
                'admin:chats': ['subscribe'],
                'announcements': ['subscribe', 'publish'],
                'user:*:announcements': ['publish'],
                // Push notification capabilities for admin
                'pushenabled:*': ['subscribe', 'publish', 'push-subscribe', 'push-admin'],
            },
            ttl: 3600000, // 1 hour
        };

        const tokenRequest = await client.auth.createTokenRequest(tokenParams);
        return tokenRequest;
    } catch (error) {
        console.error('Error generating admin Ably token:', error);
        throw error;
    }
};

/**
 * Send a push notification directly to a user by clientId
 * @param {string} clientId - The user's clientId (userId)
 * @param {object} notification - The notification payload { title, body, data }
 */
export const sendPushNotification = async (clientId, notification) => {
    try {
        const client = getAblyClient();
        if (!client) {
            console.warn('Ably client not initialized, skipping push notification');
            return { success: false, reason: 'client_not_initialized' };
        }

        const recipient = {
            clientId: clientId.toString()
        };

        const pushData = {
            notification: {
                title: notification.title || 'New Notification',
                body: notification.body || '',
                icon: notification.icon || '/icons/manifest-icon-192.maskable.png',
            },
            data: notification.data || {}
        };

        await client.push.admin.publish(recipient, pushData);
        console.log(`Push notification sent to clientId: ${clientId}`);
        return { success: true };
    } catch (error) {
        console.error('Error sending push notification:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send a push notification to a specific device by deviceId
 * @param {string} deviceId - The device's unique identifier
 * @param {object} notification - The notification payload { title, body, data }
 */
export const sendPushToDevice = async (deviceId, notification) => {
    try {
        const client = getAblyClient();
        if (!client) {
            console.warn('Ably client not initialized, skipping push notification');
            return { success: false, reason: 'client_not_initialized' };
        }

        const recipient = {
            deviceId: deviceId
        };

        const pushData = {
            notification: {
                title: notification.title || 'New Notification',
                body: notification.body || '',
                icon: notification.icon || '/icons/manifest-icon-192.maskable.png',
            },
            data: notification.data || {}
        };

        await client.push.admin.publish(recipient, pushData);
        console.log(`Push notification sent to deviceId: ${deviceId}`);
        return { success: true };
    } catch (error) {
        console.error('Error sending push notification to device:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Publish a push notification via a channel
 * Devices subscribed to this channel will receive the push notification
 * @param {string} channelName - The channel name (should start with 'pushenabled:')
 * @param {object} notification - The notification payload
 */
export const publishPushToChannel = async (channelName, notification) => {
    try {
        const client = getAblyClient();
        if (!client) {
            console.warn('Ably client not initialized, skipping push to channel');
            return { success: false, reason: 'client_not_initialized' };
        }

        // Ensure channel name starts with pushenabled:
        const pushChannelName = channelName.startsWith('pushenabled:') 
            ? channelName 
            : `pushenabled:${channelName}`;

        const channel = client.channels.get(pushChannelName);
        
        // Publish message with push notification extras
        await channel.publish({
            name: notification.eventName || 'push-notification',
            data: notification.data || {},
            extras: {
                push: {
                    notification: {
                        title: notification.title || 'New Notification',
                        body: notification.body || '',
                        icon: notification.icon || '/icons/manifest-icon-192.maskable.png',
                    },
                    data: notification.customData || {}
                }
            }
        });

        console.log(`Push notification published to channel: ${pushChannelName}`);
        return { success: true };
    } catch (error) {
        console.error('Error publishing push to channel:', error);
        return { success: false, error: error.message };
    }
};

export default {
    getAblyClient,
    getAblyRealtime,
    publishMessage,
    generateAblyToken,
    generateAdminAblyToken,
    sendPushNotification,
    sendPushToDevice,
    publishPushToChannel,
};
