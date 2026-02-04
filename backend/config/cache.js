/**
 * Simple in-memory cache with TTL support
 * For production, consider Redis for distributed caching
 */

class MemoryCache {
    constructor() {
        this.cache = new Map();
        this.timers = new Map();
    }

    /**
     * Get a value from cache
     * @param {string} key - Cache key
     * @returns {any} Cached value or undefined
     */
    get(key) {
        const item = this.cache.get(key);
        if (!item) return undefined;
        
        if (item.expiry && Date.now() > item.expiry) {
            this.delete(key);
            return undefined;
        }
        
        return item.value;
    }

    /**
     * Set a value in cache with optional TTL
     * @param {string} key - Cache key
     * @param {any} value - Value to cache
     * @param {number} ttlSeconds - Time to live in seconds (default: 60)
     */
    set(key, value, ttlSeconds = 60) {
        // Clear existing timer if any
        if (this.timers.has(key)) {
            clearTimeout(this.timers.get(key));
        }

        const expiry = ttlSeconds > 0 ? Date.now() + (ttlSeconds * 1000) : null;
        this.cache.set(key, { value, expiry });

        // Set auto-cleanup timer
        if (ttlSeconds > 0) {
            const timer = setTimeout(() => {
                this.delete(key);
            }, ttlSeconds * 1000);
            this.timers.set(key, timer);
        }
    }

    /**
     * Delete a key from cache
     * @param {string} key - Cache key
     */
    delete(key) {
        this.cache.delete(key);
        if (this.timers.has(key)) {
            clearTimeout(this.timers.get(key));
            this.timers.delete(key);
        }
    }

    /**
     * Delete all keys matching a pattern
     * @param {string} pattern - Pattern to match (supports * wildcard)
     */
    deletePattern(pattern) {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                this.delete(key);
            }
        }
    }

    /**
     * Clear entire cache
     */
    clear() {
        for (const timer of this.timers.values()) {
            clearTimeout(timer);
        }
        this.cache.clear();
        this.timers.clear();
    }

    /**
     * Get cache statistics
     */
    stats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }

    /**
     * Get or set pattern - fetch from cache or execute getter and cache result
     * @param {string} key - Cache key
     * @param {Function} getter - Async function to get value if not cached
     * @param {number} ttlSeconds - TTL in seconds
     */
    async getOrSet(key, getter, ttlSeconds = 60) {
        const cached = this.get(key);
        if (cached !== undefined) {
            return cached;
        }

        const value = await getter();
        this.set(key, value, ttlSeconds);
        return value;
    }
}

// Singleton instance
const cache = new MemoryCache();

// Cache key generators for consistency
export const CacheKeys = {
    dashboardStats: () => 'dashboard:stats',
    userById: (id) => `user:${id}`,
    userClasses: () => 'userClasses:all',
    plansForUser: (userId) => `plans:user:${userId}`,
    formsForUser: (userId) => `forms:user:${userId}`,
    chatUnreadAdmin: () => 'chat:unread:admin',
};

// TTL constants (in seconds)
export const CacheTTL = {
    SHORT: 30,           // 30 seconds - for frequently changing data
    MEDIUM: 120,         // 2 minutes - for moderately changing data  
    LONG: 300,           // 5 minutes - for slowly changing data
    DASHBOARD: 60,       // 1 minute - dashboard stats
    USER_CLASSES: 600,   // 10 minutes - user classes rarely change
};

export default cache;
