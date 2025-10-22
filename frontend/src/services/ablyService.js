import * as Ably from 'ably';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

let ablyClient = null;
let activeSubscriptions = new Map();

// Helper function to get auth token
const getAuthToken = () => {
    return localStorage.getItem('token');
};

const initializeAbly = async () => {
    if (ablyClient) {
        return ablyClient;
    }

    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('No authentication token available');
        }

        ablyClient = new Ably.Realtime({
            authUrl: `${API_URL}/api/chat/ably/auth`,
            authHeaders: {
                'Authorization': `Bearer ${token}`
            },
            authMethod: 'GET',
            recover: (lastConnectionDetails, cb) => {
                if (lastConnectionDetails) {
                    cb(true);
                } else {
                    cb(false);
                }
            },
            disconnectedRetryTimeout: 15000,
            suspendedRetryTimeout: 30000,
            transports: ['web_socket', 'xhr_streaming', 'xhr_polling'],
        });

        ablyClient.connection.on('connected', () => {
            console.log('Ably connected');
        });

        ablyClient.connection.on('disconnected', () => {
            console.log('Ably disconnected');
        });

        ablyClient.connection.on('suspended', () => {
            console.log('Ably connection suspended');
        });

        ablyClient.connection.on('failed', (error) => {
            console.error('Ably connection failed:', error);
        });

        return ablyClient;
    } catch (error) {
        console.error('Error initializing Ably:', error);
        throw error;
    }
};

export const subscribeToChat = async (userId, onMessage) => {
    try {
        const client = await initializeAbly();
        const channelName = `chat:${userId}:messages`;

        if (activeSubscriptions.has(channelName)) {
            console.log(`Already subscribed to ${channelName}`);
            return activeSubscriptions.get(channelName);
        }

        const channel = client.channels.get(channelName);

        channel.subscribe('new-message', (message) => {
            console.log('Received new message:', message.data);
            if (onMessage) {
                onMessage(message.data);
            }
        });

        activeSubscriptions.set(channelName, channel);
        console.log(`Subscribed to ${channelName}`);

        return channel;
    } catch (error) {
        console.error('Error subscribing to chat:', error);
        throw error;
    }
};

// Subscribe to admin chat updates (for admin users only)
export const subscribeToAdminChats = async (onMessage) => {
    try {
        const client = await initializeAbly();
        const channelName = 'admin:chats';

        if (activeSubscriptions.has(channelName)) {
            console.log(`Already subscribed to ${channelName}`);
            return activeSubscriptions.get(channelName);
        }

        const channel = client.channels.get(channelName);

        channel.subscribe('new-message', (message) => {
            console.log('Admin received new message:', message.data);
            if (onMessage) {
                onMessage(message.data);
            }
        });

        activeSubscriptions.set(channelName, channel);
        console.log(`Subscribed to ${channelName}`);

        return channel;
    } catch (error) {
        console.error('Error subscribing to admin chats:', error);
        throw error;
    }
};

// Unsubscribe from a channel
export const unsubscribeFromChannel = (channelName) => {
    try {
        if (activeSubscriptions.has(channelName)) {
            const channel = activeSubscriptions.get(channelName);
            channel.unsubscribe();
            activeSubscriptions.delete(channelName);
            console.log(`Unsubscribed from ${channelName}`);
        }
    } catch (error) {
        console.error('Error unsubscribing from channel:', error);
    }
};

// Disconnect Ably client
export const disconnectAbly = () => {
    try {
        if (ablyClient) {
            activeSubscriptions.forEach((channel, channelName) => {
                channel.unsubscribe();
                console.log(`Unsubscribed from ${channelName}`);
            });
            activeSubscriptions.clear();

            ablyClient.close();
            ablyClient = null;
            console.log('Ably disconnected and cleaned up');
        }
    } catch (error) {
        console.error('Error disconnecting Ably:', error);
    }
};

// Get connection state
export const getConnectionState = () => {
    if (!ablyClient) {
        return 'disconnected';
    }
    return ablyClient.connection.state;
};

// Check if connected
export const isConnected = () => {
    return ablyClient && ablyClient.connection.state === 'connected';
};

// Reconnect if disconnected
export const reconnect = async () => {
    try {
        if (ablyClient) {
            disconnectAbly();
        }
        await initializeAbly();
    } catch (error) {
        console.error('Error reconnecting Ably:', error);
        throw error;
    }
};

export default {
    subscribeToChat,
    subscribeToAdminChats,
    unsubscribeFromChannel,
    disconnectAbly,
    getConnectionState,
    isConnected,
    reconnect,
};
