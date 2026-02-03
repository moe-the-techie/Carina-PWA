import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getUnreadCount, getAdminUnreadCount } from '../services/chatService';
import { 
    subscribeToChat, 
    subscribeToAdminChats,
    subscribeToPlans,
    removeMessageHandler,
    requestNotificationPermission,
    getCurrentlyViewingChat
} from '../services/ablyService';
import { setupUserPushNotifications, cleanupPushNotifications } from '../services/ablyPushService';

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
            
            // Setup Ably Push Notifications for background/closed app notifications
            setupUserPushNotifications(user._id, user.role === 'admin')
                .then(result => {
                    if (result.success) {
                        console.log('[Push] Push notifications activated successfully');
                    } else {
                        console.warn('[Push] Could not activate push notifications:', result.reason || result.error);
                    }
                })
                .catch(error => {
                    console.warn('[Push] Error setting up push notifications:', error);
                });
        }
        fetchUnreadCount();
        
        // Cleanup push notifications when user logs out
        return () => {
            if (!user) {
                cleanupPushNotifications().catch(console.error);
            }
        };
    }, [fetchUnreadCount, user]);

    // Subscribe to real-time updates for unread count
    // Notifications are handled by ablyService based on currentlyViewingChat
    useEffect(() => {
        if (!user) return;

        let messageHandler;

        if (user.role === 'admin') {
            messageHandler = (messageData) => {
                // Only increment unread count if message is from a user AND not viewing that chat
                if (messageData.senderRole === 'user') {
                    const viewingChatId = getCurrentlyViewingChat();
                    const isViewing = viewingChatId && messageData.chatId && 
                        String(viewingChatId).trim() === String(messageData.chatId).trim();
                    
                    if (!isViewing) {
                        setUnreadCount(prev => prev + 1);
                    }
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
                // Only increment unread count if message is from admin AND not viewing the chat
                if (messageData.senderRole === 'admin') {
                    const viewingChatId = getCurrentlyViewingChat();
                    const isViewing = viewingChatId && messageData.chatId && 
                        String(viewingChatId).trim() === String(messageData.chatId).trim();

                    if (!isViewing) {
                        setUnreadCount(prev => prev + 1);
                    }
                }
            };

            subscribeToChat(user._id, messageHandler).catch(error => {
                console.error('Error subscribing to chat:', error);
            });

            // Subscribe to plan notifications
            subscribeToPlans(user._id).catch(error => {
                console.error('Error subscribing to plans:', error);
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
