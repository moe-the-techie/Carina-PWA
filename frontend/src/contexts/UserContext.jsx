import React, { createContext, useContext, useCallback } from 'react';
import { useCachedData } from '../hooks/useCachedData';

const UserContext = createContext();

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const useUserProfile = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUserProfile must be used within UserProvider');
    }
    return context;
};

export const UserProvider = ({ children, enabled = true }) => {
    const fetchProfile = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token found');

        const response = await fetch(`${apiBaseUrl}/api/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                // Token invalid
                throw new Error('Unauthorized');
            }
            throw new Error('Failed to fetch profile');
        }

        return response.json();
    }, []);

    const { 
        data: userProfile, 
        isLoading, 
        error, 
        refetch, 
        setData: setUserProfile,
        invalidate: invalidateUserProfile
    } = useCachedData('user_profile_full', fetchProfile, {
        enabled: enabled,
        refetchOnMount: true,
        // We use a small staleTime so if they navigate quickly back and forth it doesn't spam, 
        // but generally we want to check for updates often or rely on explicit updates.
        staleTime: 60 * 1000, 
        cacheTTL: 24 * 60 * 60 * 1000 // 24 hours
    });

    const value = {
        userProfile,
        isLoading,
        error,
        refetchUserProfile: refetch,
        setUserProfile,
        invalidateUserProfile
    };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
};
