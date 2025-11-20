import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getUnreadCount, getAdminUnreadCount } from '../services/chatService';
import { 
    subscribeToChat, 
    subscribeToAdminChats, 
    removeMessageHandler,
    requestNotificationPermission 
} from '../services/ablyService';

const UnreadCountContext = createContext();

export const useUnreadCount = () => {
    const context = useContext(UnreadCountContext);
    if (!context) {
        throw new Error('useUnreadCount must be used within UnreadCountProvider');
    }
    return context;
};

export const UnreadCountProvider = ({ children, user }) => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchUnreadCount = useCallback(async () => {
        if (!user) {
            setUnreadCount(0);
            setLoading(false);
            return;
        }

        try {
            const response = user.role === 'admin' 
                ? await getAdminUnreadCount()
                : await getUnreadCount();
            setUnreadCount(response.unreadCount || 0);
        } catch (error) {
            console.error('Error fetching unread count:', error);
            setUnreadCount(0);
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Fetch initial unread count and request notification permission
    useEffect(() => {
        if (user) {
            requestNotificationPermission();
        }
        fetchUnreadCount();
    }, [fetchUnreadCount, user]);

    // Subscribe to real-time updates for unread count
    // Notifications are handled by ablyService based on currentlyViewingChat
    useEffect(() => {
        if (!user) return;

        let messageHandler;

        if (user.role === 'admin') {
            messageHandler = (messageData) => {
                // Only increment unread count if message is from a user
                if (messageData.senderRole === 'user') {
                    setUnreadCount(prev => prev + 1);
                }
            };

            subscribeToAdminChats(messageHandler).catch(error => {
                console.error('Error subscribing to admin chats:', error);
            });

            return () => {
                removeMessageHandler('admin:chats', messageHandler);
            };
        } else {
            // Regular user: Subscribe to their own chat
            messageHandler = (messageData) => {
                // Only increment unread count if message is from admin
                if (messageData.senderRole === 'admin') {
                    setUnreadCount(prev => prev + 1);
                }
            };

            subscribeToChat(user._id, messageHandler).catch(error => {
                console.error('Error subscribing to chat:', error);
            });

            return () => {
                removeMessageHandler(`chat:${user._id}:messages`, messageHandler);
            };
        }
    }, [user]);

    const resetUnreadCount = useCallback(() => {
        setUnreadCount(0);
    }, []);

    const decrementUnreadCount = useCallback((amount = 1) => {
        setUnreadCount(prev => Math.max(0, prev - amount));
    }, []);

    return (
        <UnreadCountContext.Provider value={{ 
            unreadCount, 
            loading, 
            fetchUnreadCount, 
            resetUnreadCount,
            decrementUnreadCount 
        }}>
            {children}
        </UnreadCountContext.Provider>
    );
};
