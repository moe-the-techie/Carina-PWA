const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Helper function to get auth token
const getAuthToken = () => {
    return localStorage.getItem('token');
};

// Helper function for API requests
const apiRequest = async (endpoint, options = {}) => {
    const token = getAuthToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/api${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Request failed');
    }

    return response.json();
};

// Get or create chat for current user
export const getOrCreateChat = async () => {
    return apiRequest('/chat');
};

// Send a message
export const sendMessage = async (chatId, content) => {
    return apiRequest('/chat/messages', {
        method: 'POST',
        body: JSON.stringify({ chatId, content }),
    });
};

// Get messages for a chat
export const getMessages = async (chatId, before = null, limit = 50) => {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (before) {
        params.append('before', before);
    }
    return apiRequest(`/chat/${chatId}/messages?${params.toString()}`);
};

// Mark messages as read
export const markMessagesAsRead = async (chatId) => {
    return apiRequest(`/chat/${chatId}/read`, {
        method: 'PUT',
    });
};

// Update FCM token
export const updateFCMToken = async (fcmToken) => {
    return apiRequest('/chat/fcm-token', {
        method: 'POST',
        body: JSON.stringify({ fcmToken }),
    });
};

// Admin: Get all chats
export const getAllChats = async (skip = 0, limit = 50) => {
    const params = new URLSearchParams({ 
        skip: skip.toString(), 
        limit: limit.toString() 
    });
    return apiRequest(`/admin/chats?${params.toString()}`);
};

// Admin: Get chat by ID
export const getChatById = async (chatId) => {
    return apiRequest(`/admin/chat/${chatId}`);
};

// Admin: Get chat by user ID
export const getChatByUserId = async (userId) => {
    return apiRequest(`/admin/chat/user/${userId}`);
};

// Admin: Get or create chat by user ID (for initiating chats with users)
export const getOrCreateChatByUserId = async (userId) => {
    if (!userId || userId === 'null' || userId === 'undefined') {
        throw new Error('Invalid user ID provided');
    }
    
    return apiRequest(`/admin/chat/user/${userId}`, {
        method: 'POST',
    });
};

// Get unread count for current user
export const getUnreadCount = async () => {
    return apiRequest('/chat/unread/count');
};

// Admin: Get total unread count
export const getAdminUnreadCount = async () => {
    return apiRequest('/admin/chats/unread/count');
};

// Admin: Delete a chat
export const deleteChat = async (chatId) => {
    return apiRequest(`/admin/chat/${chatId}`, {
        method: 'DELETE',
    });
};
