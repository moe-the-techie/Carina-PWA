import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getUnreadAnnouncementsCount } from '../services/announcementService';
import { subscribeToAnnouncements } from '../services/ablyService';
import { showSmartAnnouncementNotification, requestAnnouncementNotificationPermission } from '../utils/announcementNotificationUtils';

const AnnouncementNotificationContext = createContext();

export const useAnnouncementNotifications = () => {
    const context = useContext(AnnouncementNotificationContext);
    if (!context) {
        throw new Error('useAnnouncementNotifications must be used within AnnouncementNotificationProvider');
    }
    return context;
};

export const AnnouncementNotificationProvider = ({ children, user }) => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [latestAnnouncement, setLatestAnnouncement] = useState(null);

    const fetchUnreadCount = useCallback(async () => {
        if (!user || user.role === 'admin') {
            setUnreadCount(0);
            setLoading(false);
            return;
        }

        try {
            const response = await getUnreadAnnouncementsCount();
            setUnreadCount(response.unreadCount || 0);
        } catch (error) {
            console.error('Error fetching unread announcements count:', error);
            setUnreadCount(0);
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Update unread count when a new announcement is received
    const handleNewAnnouncement = useCallback((announcementData) => {
        console.log('New announcement received in context:', announcementData);
        
        // Update unread count
        setUnreadCount(prev => prev + 1);
        
        // Store latest announcement for potential display
        setLatestAnnouncement(announcementData);
        
        // Show smart notification (push or browser fallback)
        showSmartAnnouncementNotification(announcementData);
    }, []);

    // Mark announcement as read (decrease count)
    const markAnnouncementAsRead = useCallback(() => {
        setUnreadCount(prev => Math.max(0, prev - 1));
    }, []);

    // Subscribe to real-time updates when user is available
    useEffect(() => {
        if (!user || user.role === 'admin') return;

        let unsubscribe;

        const setupSubscription = async () => {
            try {
                await subscribeToAnnouncements(user._id, handleNewAnnouncement);
            } catch (error) {
                console.error('Error setting up announcement subscription:', error);
            }
        };

        setupSubscription();

        return unsubscribe;
    }, [user, handleNewAnnouncement]);

    // Fetch initial unread count
    useEffect(() => {
        fetchUnreadCount();
    }, [fetchUnreadCount]);

    // Request notification permissions on mount
    useEffect(() => {
        requestAnnouncementNotificationPermission();
    }, []);

    const value = {
        unreadCount,
        loading,
        latestAnnouncement,
        markAnnouncementAsRead,
        fetchUnreadCount
    };

    return (
        <AnnouncementNotificationContext.Provider value={value}>
            {children}
        </AnnouncementNotificationContext.Provider>
    );
};

export default AnnouncementNotificationProvider;