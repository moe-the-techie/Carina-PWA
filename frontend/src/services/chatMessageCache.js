const CHAT_CACHE_PREFIX = 'chat_messages_v1:';
const CHAT_CACHE_INDEX_KEY = 'chat_messages_v1:index';
const MAX_CACHED_CHATS = 40;
const MAX_MESSAGES_PER_CHAT = 120;

const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';

const toChatId = (chatId) => {
    if (chatId === undefined || chatId === null) return null;
    return String(chatId).trim();
};

const getChatCacheKey = (chatId) => `${CHAT_CACHE_PREFIX}${toChatId(chatId)}`;

const readIndex = () => {
    if (!isBrowser) return {};
    try {
        const raw = localStorage.getItem(CHAT_CACHE_INDEX_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch (error) {
        console.error('Error reading chat cache index:', error);
        return {};
    }
};

const writeIndex = (index) => {
    if (!isBrowser) return;
    try {
        localStorage.setItem(CHAT_CACHE_INDEX_KEY, JSON.stringify(index));
    } catch (error) {
        console.error('Error writing chat cache index:', error);
    }
};

const touchChatInIndex = (chatId, updatedAt) => {
    const index = readIndex();
    index[chatId] = { updatedAt };

    const entries = Object.entries(index).sort((a, b) => (b[1]?.updatedAt || 0) - (a[1]?.updatedAt || 0));
    const entriesToKeep = entries.slice(0, MAX_CACHED_CHATS);
    const nextIndex = Object.fromEntries(entriesToKeep);

    const evicted = entries.slice(MAX_CACHED_CHATS);
    evicted.forEach(([evictedChatId]) => {
        localStorage.removeItem(getChatCacheKey(evictedChatId));
    });

    writeIndex(nextIndex);
};

const readChatCache = (chatId) => {
    if (!isBrowser) {
        return { messages: [], hasMore: true, updatedAt: 0, lastServerSyncAt: 0 };
    }

    const normalizedChatId = toChatId(chatId);
    if (!normalizedChatId) {
        return { messages: [], hasMore: true, updatedAt: 0, lastServerSyncAt: 0 };
    }

    try {
        const raw = localStorage.getItem(getChatCacheKey(normalizedChatId));
        if (!raw) {
            return { messages: [], hasMore: true, updatedAt: 0, lastServerSyncAt: 0 };
        }

        const parsed = JSON.parse(raw);
        return {
            messages: Array.isArray(parsed.messages) ? parsed.messages : [],
            hasMore: parsed.hasMore !== false,
            updatedAt: Number(parsed.updatedAt) || 0,
            lastServerSyncAt: Number(parsed.lastServerSyncAt) || 0
        };
    } catch (error) {
        console.error('Error reading chat cache:', error);
        return { messages: [], hasMore: true, updatedAt: 0, lastServerSyncAt: 0 };
    }
};

const writeChatCache = (chatId, payload) => {
    if (!isBrowser) return;

    const normalizedChatId = toChatId(chatId);
    if (!normalizedChatId) return;

    const safeMessages = Array.isArray(payload.messages)
        ? payload.messages.slice(-MAX_MESSAGES_PER_CHAT)
        : [];

    const normalizedPayload = {
        messages: safeMessages,
        hasMore: payload.hasMore !== false,
        updatedAt: payload.updatedAt || Date.now(),
        lastServerSyncAt: payload.lastServerSyncAt || 0
    };

    try {
        localStorage.setItem(getChatCacheKey(normalizedChatId), JSON.stringify(normalizedPayload));
        touchChatInIndex(normalizedChatId, normalizedPayload.updatedAt);
    } catch (error) {
        console.error('Error writing chat cache:', error);
    }
};

export const getCachedChatState = (chatId) => {
    const cache = readChatCache(chatId);
    return {
        messages: cache.messages,
        hasMore: cache.hasMore,
        updatedAt: cache.updatedAt,
        lastServerSyncAt: cache.lastServerSyncAt,
        hasMessages: cache.messages.length > 0
    };
};

export const cacheChatSnapshot = (chatId, messages, options = {}) => {
    const current = readChatCache(chatId);
    const now = Date.now();

    writeChatCache(chatId, {
        messages,
        hasMore: options.hasMore !== undefined ? options.hasMore : current.hasMore,
        updatedAt: now,
        lastServerSyncAt: options.serverSynced ? now : current.lastServerSyncAt
    });
};

export const appendMessageToChatCache = (chatId, message, options = {}) => {
    if (!message || !message._id) return;

    const current = readChatCache(chatId);
    const exists = current.messages.some((m) => m._id === message._id);
    const nextMessages = exists ? current.messages : [...current.messages, message];
    const now = Date.now();

    writeChatCache(chatId, {
        messages: nextMessages,
        hasMore: current.hasMore,
        updatedAt: now,
        lastServerSyncAt: options.serverSynced ? now : current.lastServerSyncAt
    });
};

export const shouldFetchMessagesFromServer = (chatId, options = {}) => {
    const {
        forceSync = false,
        maxServerSyncAgeMs = 2 * 60 * 1000,
        online = typeof navigator !== 'undefined' ? navigator.onLine : true
    } = options;

    if (forceSync) return true;

    const cache = readChatCache(chatId);
    if (!cache.messages.length) return true;
    if (!cache.lastServerSyncAt) return true;

    if (!online) return false;

    return (Date.now() - cache.lastServerSyncAt) > maxServerSyncAgeMs;
};
