import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getUnreadCount, getAdminUnreadCount } from '../services/chatService';
import { setSharedCacheData } from '../hooks/useCachedData';
import { getCacheData } from '../utils/offlineCache';
import { 
    subscribeToChat, 
    subscribeToAdminChats,
    subscribeToPlans,
    removeMessageHandler,
    requestNotificationPermission,
    isActivelyViewingChat
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

    const activePlansRefreshState = useRef({ inFlight: null, pending: false });
    const homeFormsRefreshState = useRef({ inFlight: null, pending: false });

    const refreshUserActivePlansCache = useCallback(async () => {
        if (!user?._id) return;

        const refreshState = activePlansRefreshState.current;
        if (refreshState.inFlight) {
            refreshState.pending = true;
            return refreshState.inFlight;
        }

        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
        const token = localStorage.getItem('token');

        refreshState.pending = false;
        refreshState.inFlight = (async () => {
            const response = await fetch(`${apiBaseUrl}/api/plans/my`, {
                headers: {
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch plans');
            }

            const data = await response.json();
            const activePlans = (data.plans || []).filter(plan => plan.status === 'active');

            const progressPromises = activePlans.map(plan =>
                fetch(`${apiBaseUrl}/api/plans/${plan._id}/progress/today`, {
                    headers: {
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    }
                }).then(res => res.ok ? res.json() : null).catch(() => null)
            );

            const progressResults = await Promise.all(progressPromises);
            const progressMap = {};
            activePlans.forEach((plan, index) => {
                if (progressResults[index]) {
                    progressMap[plan._id] = progressResults[index].progress;
                }
            });

            setSharedCacheData(
                'active_plans_with_progress',
                { activePlans, progressMap },
                5 * 60 * 1000
            );
        })();

        try {
            await refreshState.inFlight;
        } finally {
            refreshState.inFlight = null;
            if (refreshState.pending) {
                refreshState.pending = false;
                // Run one more refresh to catch any queued updates.
                refreshUserActivePlansCache().catch(() => {});
            }
        }
    }, [user?._id, setSharedCacheData, getCacheData]);

    const refreshCachedViewPlanEntries = useCallback(async (planId) => {
        if (!user?._id || !planId) return;

        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
        const token = localStorage.getItem('token');

        const storageKeys = Object.keys(localStorage);
        const cachedViewKeys = storageKeys
            .filter((storageKey) => (
                storageKey.startsWith('carina_cache_view_plan_') &&
                !storageKey.endsWith('_expiry')
            ))
            .map((storageKey) => storageKey.replace('carina_cache_', ''));

        await Promise.all(cachedViewKeys.map(async (cacheKey) => {
            const match = cacheKey.match(/^view_plan_(.+)$/);
            if (!match) return;

            const formId = match[1];
            if (!formId) return;

            const cached = getCacheData(cacheKey);
            const cachedPlanId = cached?.plan?._id;
            if (!cachedPlanId || String(cachedPlanId) !== String(planId)) {
                return;
            }

            try {
                const response = await fetch(`${apiBaseUrl}/api/forms/my/${formId}/plan`, {
                    headers: {
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setSharedCacheData(cacheKey, { plan: data.plan, noPlan: false }, 10 * 60 * 1000);
                    return;
                }

                if (response.status === 404) {
                    setSharedCacheData(cacheKey, { plan: null, noPlan: true }, 10 * 60 * 1000);
                }
            } catch (error) {
                console.error('Error refreshing cached view plan entry:', error);
            }
        }));
    }, [user?._id, setSharedCacheData]);

    const refreshCachedHomeFormsPages = useCallback(async () => {
        if (!user?._id) return;

        const refreshState = homeFormsRefreshState.current;
        if (refreshState.inFlight) {
            refreshState.pending = true;
            return refreshState.inFlight;
        }

        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
        const token = localStorage.getItem('token');

        // Find any cached HomePage pages we have locally and refresh those keys.
        const storageKeys = Object.keys(localStorage);
        const cachedHomeKeys = storageKeys
            .filter((storageKey) => (
                storageKey.startsWith('carina_cache_home_forms_page_') &&
                !storageKey.endsWith('_expiry')
            ))
            .map((storageKey) => storageKey.replace('carina_cache_', ''));

        if (cachedHomeKeys.length === 0) {
            return;
        }

        refreshState.pending = false;
        refreshState.inFlight = (async () => {
            await Promise.all(cachedHomeKeys.map(async (cacheKey) => {
                const match = cacheKey.match(/^home_forms_page_(\d+)$/);
                if (!match) return;

                const page = Number(match[1]);
                if (!Number.isFinite(page) || page < 1) return;

                const response = await fetch(`${apiBaseUrl}/api/forms/my?page=${page}&limit=10`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    },
                });

                if (!response.ok) {
                    return;
                }

                const data = await response.json();
                const formsWithPlans = data.forms || [];

                const formsWithPlanData = await Promise.all(
                    formsWithPlans.map(async (form) => {
                        try {
                            const planResponse = await fetch(`${apiBaseUrl}/api/forms/my/${form._id}/plan`, {
                                method: 'GET',
                                headers: {
                                    'Content-Type': 'application/json',
                                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                                },
                            });

                            if (planResponse.ok) {
                                const planData = await planResponse.json();
                                return { ...form, plan: planData.plan };
                            }
                        } catch {
                            // Ignore missing plan
                        }
                        return form;
                    })
                );

                setSharedCacheData(
                    cacheKey,
                    { forms: formsWithPlanData, totalPages: data.totalPages || 1 },
                    5 * 60 * 1000
                );
            }));
        })();

        try {
            await refreshState.inFlight;
        } finally {
            refreshState.inFlight = null;
            if (refreshState.pending) {
                refreshState.pending = false;
                refreshCachedHomeFormsPages().catch(() => {});
            }
        }
    }, [user?._id, setSharedCacheData]);

    const fetchUnreadCount = useCallback(async () => {
        if (!user) {
            setUnreadCount(0);
            setLoading(false);
            return;
        }

        const isChatStaff = user.role === 'admin' || user.role === 'chat_admin';

        try {
            const response = isChatStaff 
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

        const isChatStaff = user.role === 'admin' || user.role === 'chat_admin';

        if (isChatStaff) {
            messageHandler = (messageData) => {
                // Only increment unread count if message is from a user AND not viewing that chat
                if (messageData.senderRole === 'user') {
                    const isViewing = isActivelyViewingChat(messageData.chatId);
                    
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
                    const isViewing = isActivelyViewingChat(messageData.chatId);

                    if (!isViewing) {
                        setUnreadCount(prev => prev + 1);
                    }
                }
            };

            subscribeToChat(user._id, messageHandler).catch(error => {
                console.error('Error subscribing to chat:', error);
            });

            // Subscribe to plan notifications
            const planHandler = (planEvent) => {
                // Keep user plan caches in sync with admin updates.
                refreshUserActivePlansCache().catch(err => {
                    console.error('Error refreshing active plans cache:', err);
                });
                refreshCachedHomeFormsPages().catch(err => {
                    console.error('Error refreshing home forms cache:', err);
                });

                refreshCachedViewPlanEntries(planEvent?.planId).catch(err => {
                    console.error('Error refreshing view plan cache:', err);
                });
            };

            subscribeToPlans(user._id, planHandler).catch(error => {
                console.error('Error subscribing to plans:', error);
            });

            return () => {
                removeMessageHandler(`chat:${user._id}:messages`, messageHandler);
                removeMessageHandler(`plans:${user._id}`, planHandler);
            };
        }
    }, [user, refreshUserActivePlansCache, refreshCachedHomeFormsPages, refreshCachedViewPlanEntries]);

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
