const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
import { createCachedApiClient } from '../utils/cachedFetch';

// Create cached API client
const api = createCachedApiClient(API_URL + '/api');

// Helper function to get auth token
const getAuthToken = () => {
    return localStorage.getItem('token');
};

// User API calls
export const getUserAnnouncements = async () => {
    return api.get('/announcements', {
        cacheKey: 'user_announcements',
        cacheTTL: 5 * 60 * 1000,
    });
};

export const markAnnouncementAsRead = async (announcementId) => {
    return api.put(`/announcements/${announcementId}/read`);
};

export const getUnreadAnnouncementsCount = async () => {
    return api.get('/announcements/unread/count', {
        cacheKey: 'unread_announcements_count',
        cacheTTL: 1 * 60 * 1000,
    });
};

// Admin API calls
export const getAllAnnouncements = async (page = 1, limit = 10, status = 'all') => {
    const params = new URLSearchParams({ page, limit, status });
    return api.get(`/admin/announcements?${params}`, {
        cacheKey: `admin_announcements_${page}_${limit}_${status}`,
        cacheTTL: 5 * 60 * 1000,
    });
};

export const createAnnouncement = async (announcementData) => {
    return api.post('/admin/announcements', announcementData);
};

export const updateAnnouncement = async (announcementId, announcementData) => {
    return api.put(`/admin/announcements/${announcementId}`, announcementData);
};

export const deleteAnnouncement = async (announcementId) => {
    return api.delete(`/admin/announcements/${announcementId}`);
};

export const getAnnouncementStats = async (announcementId) => {
    return api.get(`/admin/announcements/${announcementId}/stats`, {
        cacheKey: `announcement_stats_${announcementId}`,
        cacheTTL: 5 * 60 * 1000,
    });
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