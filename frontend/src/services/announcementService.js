const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Helper function to get auth token
const getAuthToken = () => {
    return localStorage.getItem('token');
};

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
    const token = getAuthToken();
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
        },
    };

    const response = await fetch(`${API_URL}/api${endpoint}`, {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Request failed');
    }

    return response.json();
};

// User API calls
export const getUserAnnouncements = async () => {
    return apiRequest('/announcements');
};

export const markAnnouncementAsRead = async (announcementId) => {
    return apiRequest(`/announcements/${announcementId}/read`, {
        method: 'PUT',
    });
};

export const getUnreadAnnouncementsCount = async () => {
    return apiRequest('/announcements/unread/count');
};

// Admin API calls
export const getAllAnnouncements = async (page = 1, limit = 10, status = 'all') => {
    const params = new URLSearchParams({ page, limit, status });
    return apiRequest(`/admin/announcements?${params}`);
};

export const createAnnouncement = async (announcementData) => {
    return apiRequest('/admin/announcements', {
        method: 'POST',
        body: JSON.stringify(announcementData),
    });
};

export const updateAnnouncement = async (announcementId, announcementData) => {
    return apiRequest(`/admin/announcements/${announcementId}`, {
        method: 'PUT',
        body: JSON.stringify(announcementData),
    });
};

export const deleteAnnouncement = async (announcementId) => {
    return apiRequest(`/admin/announcements/${announcementId}`, {
        method: 'DELETE',
    });
};

export const getAnnouncementStats = async (announcementId) => {
    return apiRequest(`/admin/announcements/${announcementId}/stats`);
};

export default {
    getUserAnnouncements,
    markAnnouncementAsRead,
    getUnreadAnnouncementsCount,
    getAllAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    getAnnouncementStats,
};