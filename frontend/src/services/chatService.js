const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const VOICE_CACHE_KEY_PREFIX = 'voice_msg_';
const VOICE_CACHE_INDEX_KEY = 'voice_cache_index';
const VOICE_CACHE_MAX_SIZE = 50 * 1024 * 1024; // 50MB 
const VOICE_CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

// Helper function to get auth token
const getAuthToken = () => {
    return localStorage.getItem('token');
};

// Get individual message cache key
const getMessageCacheKey = (messageId) => {
    return `${VOICE_CACHE_KEY_PREFIX}${messageId}`;
};

// Get cache index
const getCacheIndex = () => {
    try {
        const index = localStorage.getItem(VOICE_CACHE_INDEX_KEY);
        return index ? JSON.parse(index) : {};
    } catch (error) {
        console.error('Error reading voice cache index:', error);
        return {};
    }
};

// Update cache index
const setCacheIndex = (index) => {
    try {
        localStorage.setItem(VOICE_CACHE_INDEX_KEY, JSON.stringify(index));
    } catch (error) {
        console.error('Error writing voice cache index:', error);
    }
};

// Voice cache management functions
const getVoiceMessage = (messageId) => {
    try {
        const messageKey = getMessageCacheKey(messageId);
        const messageData = localStorage.getItem(messageKey);
        return messageData ? JSON.parse(messageData) : null;
    } catch (error) {
        console.error(`Error reading voice message ${messageId}:`, error);
        return null;
    }
};

// Store individual voice message
const setVoiceMessage = (messageId, data) => {
    try {
        const messageKey = getMessageCacheKey(messageId);
        localStorage.setItem(messageKey, JSON.stringify(data));
        
        // Update index
        const index = getCacheIndex();
        index[messageId] = {
            timestamp: data.timestamp,
            mimeType: data.mimeType,
            size: data.audioData ? data.audioData.length : 0
        };
        setCacheIndex(index);
        
        return true;
    } catch (error) {
        console.error(`Error storing voice message ${messageId}:`, error);
        return false;
    }
};

const removeVoiceMessage = (messageId) => {
    try {
        const messageKey = getMessageCacheKey(messageId);
        localStorage.removeItem(messageKey);
        
        const index = getCacheIndex();
        delete index[messageId];
        setCacheIndex(index);
        
        return true;
    } catch (error) {
        console.error(`Error removing voice message ${messageId}:`, error);
        return false;
    }
};

const isMessageCached = (messageId) => {
    try {
        const messageKey = getMessageCacheKey(messageId);
        return localStorage.getItem(messageKey) !== null;
    } catch (error) {
        console.error('Error checking cache:', error);
        return false;
    }
};

const getCacheMetadata = () => {
    try {
        const index = getCacheIndex();
        const count = Object.keys(index).length;
        
        // Calculate total size from index
        let totalSize = 0;
        for (const meta of Object.values(index)) {
            totalSize += meta.size || 0;
        }
        
        return {
            count,
            size: totalSize,
            metadata: index
        };
    } catch (error) {
        console.error('Error reading cache metadata:', error);
        return { count: 0, size: 0, metadata: {} };
    }
};

const clearExpiredVoiceCache = () => {
    try {
        const { metadata, count } = getCacheMetadata();
        if (count === 0) return;
        
        const now = Date.now();
        let removedCount = 0;
        
        // Remove expired entries one by one
        for (const [messageId, meta] of Object.entries(metadata)) {
            if (!meta.timestamp || (now - meta.timestamp) >= VOICE_CACHE_EXPIRY) {
                if (removeVoiceMessage(messageId)) {
                    removedCount++;
                }
            }
        }
        
        if (removedCount > 0) {
            console.log(`️Removed ${removedCount} expired voice messages from cache`);
        }
    } catch (error) {
        console.error('Error clearing expired voice cache:', error);
    }
};

const getCacheSize = () => {
    try {
        const { size } = getCacheMetadata();
        return size;
    } catch (error) {
        console.error('Error calculating cache size:', error);
        return 0;
    }
};

const manageCacheSize = () => {
    try {
        const currentSize = getCacheSize();
        if (currentSize <= VOICE_CACHE_MAX_SIZE) return;
        
        const { metadata } = getCacheMetadata();
        
        // Sort entries by timestamp
        const sortedEntries = Object.entries(metadata).sort((a, b) => 
            (a[1].timestamp || 0) - (b[1].timestamp || 0)
        );
        
        // Calculate how much space we need to free
        const targetSize = VOICE_CACHE_MAX_SIZE * 0.8; 
        let sizeToRemove = currentSize - targetSize;
        let removedCount = 0;
        
        // Remove oldest entries one by one
        for (const [messageId, meta] of sortedEntries) {
            if (sizeToRemove <= 0) break;
            
            if (removeVoiceMessage(messageId)) {
                sizeToRemove -= (meta.size || 0);
                removedCount++;
            }
        }
        
        if (removedCount > 0) {
            console.log(`Removed ${removedCount} old voice messages to manage cache size`);
        }
    } catch (error) {
        console.error('Error managing cache size:', error);
    }
};

// Convert ArrayBuffer to base64 for storage
const arrayBufferToBase64 = (buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
};

// Convert base64 to ArrayBuffer
const base64ToArrayBuffer = (base64) => {
    const binary = atob(base64);
    const buffer = new ArrayBuffer(binary.length);
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return buffer;
};

// Get cached voice message or fetch from server
export const getCachedVoiceMessage = async (messageId) => {
    try {
        if (!isMessageCached(messageId)) {
            return await fetchAndCacheVoiceMessage(messageId);
        }
        
        // Clear expired cache entries first 
        clearExpiredVoiceCache();
        
        const cachedData = getVoiceMessage(messageId);
        
        // Check if we have valid cached data
        if (cachedData && cachedData.audioData && cachedData.timestamp) {
            const now = Date.now();
            if ((now - cachedData.timestamp) < VOICE_CACHE_EXPIRY) {
                // Return cached audio blob
                const arrayBuffer = base64ToArrayBuffer(cachedData.audioData);
                const blob = new Blob([arrayBuffer], { type: cachedData.mimeType || 'audio/webm' });
                console.log(`Voice message loaded from cache: ${messageId}`);
                return {
                    url: URL.createObjectURL(blob),
                    fromCache: true
                };
            }
        }
        
        // Fetch from server if not in cache or expired
        return await fetchAndCacheVoiceMessage(messageId);
        
    } catch (error) {
        console.error('Error getting voice message:', error);
        throw error;
    }
};

const fetchAndCacheVoiceMessage = async (messageId) => {
    console.log(`Fetching voice message from server: ${messageId}`);
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/api/chat/voice/${messageId}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    
    if (!response.ok) {
        throw new Error('Failed to fetch voice audio');
    }
    
    const audioBlob = await response.blob();
    const arrayBuffer = await audioBlob.arrayBuffer();
    
    // Cache
    try {
        const audioData = arrayBufferToBase64(arrayBuffer);
        const messageData = {
            audioData,
            mimeType: audioBlob.type,
            timestamp: Date.now()
        };
        
        if (setVoiceMessage(messageId, messageData)) {
            manageCacheSize(); // Ensure we don't exceed cache size limit
            console.log(`Voice message cached: ${messageId}`);
        } else {
            console.warn(`Failed to cache voice message: ${messageId}`);
        }
    } catch (cacheError) {
        console.warn('Failed to cache voice message:', cacheError);
    }
    
    return {
        url: URL.createObjectURL(audioBlob),
        fromCache: false
    };
};

// Clear voice cache
export const clearVoiceCache = () => {
    try {
        const index = getCacheIndex();
        let removedCount = 0;
        
        for (const messageId of Object.keys(index)) {
            const messageKey = getMessageCacheKey(messageId);
            localStorage.removeItem(messageKey);
            removedCount++;
        }
        
        // Remove the index
        localStorage.removeItem(VOICE_CACHE_INDEX_KEY);
        
        console.log(`️Cleared ${removedCount} voice messages from cache`);
    } catch (error) {
        console.error('Error clearing voice cache:', error);
    }
};

// Get voice cache statistics
export const getVoiceCacheStats = () => {
    try {
        const { count, size } = getCacheMetadata();
        
        return {
            count,
            size: Math.round(size / 1024),
            maxSize: Math.round(VOICE_CACHE_MAX_SIZE / 1024 / 1024),
            expiry: VOICE_CACHE_EXPIRY / (24 * 60 * 60 * 1000)
        };
    } catch (error) {
        console.error('Error getting cache stats:', error);
        return { count: 0, size: 0, maxSize: 0, expiry: 0 };
    }
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
export const sendMessage = async (chatId, content, messageType = 'text', imageUrl = null, imageDeleteUrl = null, voiceUrl = null, voiceDeleteUrl = null, voiceDuration = null) => {
    return apiRequest('/chat/messages', {
        method: 'POST',
        body: JSON.stringify({ 
            chatId, 
            content, 
            messageType, 
            imageUrl, 
            imageDeleteUrl,
            voiceUrl,
            voiceDeleteUrl,
            voiceDuration
        }),
    });
};

// Upload image
export const uploadImage = async (imageFile) => {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await fetch(`${API_URL}/api/chat/upload-image`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload image');
    }

    return response.json();
};

// Upload voice message
export const uploadVoice = async (voiceBlob) => {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('voice', voiceBlob, 'voice-message.webm');

    const response = await fetch(`${API_URL}/api/chat/upload-voice`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload voice message');
    }

    return response.json();
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
