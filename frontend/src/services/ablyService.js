import * as Ably from 'ably';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

let ablyClient = null;
let activeSubscriptions = new Map();
let messageHandlers = new Map(); // Store multiple handlers per channel
let currentlyViewingChat = null; 

// Helper function to get auth token
const getAuthToken = () => {
    return localStorage.getItem('token');
};

export const setCurrentlyViewingChat = (chatId) => {
    currentlyViewingChat = chatId;
    console.log('Currently viewing chat:', chatId);
};

export const clearCurrentlyViewingChat = () => {
    currentlyViewingChat = null;
    console.log('Cleared currently viewing chat');
};

export const getCurrentlyViewingChat = () => {
    return currentlyViewingChat;
};

// Request notification permission
export const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
        console.log('This browser does not support notifications');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    return false;
};

// Show notification via service worker or browser
const showNotification = async (title, options) => {
    try {
        if (!('Notification' in window)) {
            return;
        }

        // Request permission if not already granted
        if (Notification.permission !== 'granted') {
            const granted = await requestNotificationPermission();
            if (!granted) {
                console.log('Notification permission not granted');
                return;
            }
        }

        // Try to use service worker notification first
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            const registration = await navigator.serviceWorker.ready;
            await registration.showNotification(title, options);
        } else {
            // Fallback to browser notification
            new Notification(title, options);
        }
    } catch (error) {
        console.error('Error showing notification:', error);
    }
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

        // Initialize handlers array for this channel if not exists
        if (!messageHandlers.has(channelName)) {
            messageHandlers.set(channelName, []);
        }

        // Add the handler to the list (if provided)
        if (onMessage && !messageHandlers.get(channelName).includes(onMessage)) {
            messageHandlers.get(channelName).push(onMessage);
        }

        // If already subscribed, just add the handler and return
        if (activeSubscriptions.has(channelName)) {
            console.log(`Already subscribed to ${channelName}, added new handler`);
            return activeSubscriptions.get(channelName);
        }

        const channel = client.channels.get(channelName);

        // Subscribe to new messages
        channel.subscribe('new-message', async (message) => {
            console.log('Received new message:', message.data);
            
            const messageData = message.data;
            
            const shouldShowNotification = !currentlyViewingChat || currentlyViewingChat !== messageData.chatId;
            
            if (shouldShowNotification) {
                const notificationTitle = messageData.senderRole === 'admin' 
                    ? 'Message from Support' 
                    : 'New Message';
                
                const notificationOptions = {
                    body: messageData.content || 'You have a new message',
                    icon: '/icons/manifest-icon-192.maskable.png',
                    badge: '/icons/manifest-icon-192.maskable.png',
                    tag: `chat-${messageData.chatId || 'message'}`,
                    renotify: true,
                    requireInteraction: false,
                    vibrate: [200, 100, 200],
                    data: {
                        url: '/chat',
                        messageData: messageData,
                        chatId: messageData.chatId
                    }
                };

                await showNotification(notificationTitle, notificationOptions);
            } else {
                console.log('Suppressing notification - user is viewing this chat');
            }

            // Call all registered handlers for this channel
            const handlers = messageHandlers.get(channelName) || [];
            handlers.forEach(handler => {
                try {
                    handler(message.data);
                } catch (error) {
                    console.error('Error in message handler:', error);
                }
            });
        });
        channel.subscribe('messages-read', (message) => {
            console.log('Received read receipt:', message.data);
            
            const handlers = messageHandlers.get(channelName) || [];
            handlers.forEach(handler => {
                try {
                    handler(message.data, 'messages-read');
                } catch (error) {
                    console.error('Error in read receipt handler:', error);
                }
            });
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

        // Initialize handlers array for this channel if not exists
        if (!messageHandlers.has(channelName)) {
            messageHandlers.set(channelName, []);
        }

        // Add the handler to the list (if provided)
        if (onMessage && !messageHandlers.get(channelName).includes(onMessage)) {
            messageHandlers.get(channelName).push(onMessage);
        }

        // If already subscribed, just add the handler and return
        if (activeSubscriptions.has(channelName)) {
            console.log(`Already subscribed to ${channelName}, added new handler`);
            return activeSubscriptions.get(channelName);
        }

        const channel = client.channels.get(channelName);

        // Subscribe to new messages
        channel.subscribe('new-message', async (message) => {
            console.log('Admin received new message:', message.data);
            
            const messageData = message.data;
            
            const shouldShowNotification = !currentlyViewingChat || currentlyViewingChat !== messageData.chatId;
            
            if (shouldShowNotification) {
                const notificationTitle = messageData.senderRole === 'user' 
                    ? 'New User Message' 
                    : 'New Message';
                
                const notificationOptions = {
                    body: messageData.content || 'You have a new message',
                    icon: '/icons/manifest-icon-192.maskable.png',
                    badge: '/icons/manifest-icon-192.maskable.png',
                    tag: `admin-chat-${messageData.chatId || 'message'}`,
                    renotify: true,
                    requireInteraction: false,
                    vibrate: [200, 100, 200],
                    data: {
                        url: `/admin/chats`,
                        messageData: messageData,
                        chatId: messageData.chatId
                    }
                };

                await showNotification(notificationTitle, notificationOptions);
            } else {
                console.log('Suppressing notification - admin is viewing this chat');
            }
            
            // Call all registered handlers for this channel
            const handlers = messageHandlers.get(channelName) || [];
            handlers.forEach(handler => {
                try {
                    handler(message.data);
                } catch (error) {
                    console.error('Error in message handler:', error);
                }
            });
        });
        channel.subscribe('messages-read', (message) => {
            console.log('Admin received read receipt:', message.data);
            
            const handlers = messageHandlers.get(channelName) || [];
            handlers.forEach(handler => {
                try {
                    handler(message.data, 'messages-read');
                } catch (error) {
                    console.error('Error in read receipt handler:', error);
                }
            });
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
            messageHandlers.delete(channelName);
            console.log(`Unsubscribed from ${channelName}`);
        }
    } catch (error) {
        console.error('Error unsubscribing from channel:', error);
    }
};

// Remove a specific message handler from a channel
export const removeMessageHandler = (channelName, handler) => {
    try {
        if (messageHandlers.has(channelName)) {
            const handlers = messageHandlers.get(channelName);
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
                console.log(`Removed handler from ${channelName}`);
            }
        }
    } catch (error) {
        console.error('Error removing message handler:', error);
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
            messageHandlers.clear();

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
    removeMessageHandler,
    disconnectAbly,
    getConnectionState,
    isConnected,
    reconnect,
    requestNotificationPermission,
};
