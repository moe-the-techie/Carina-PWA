/**
 * Offline Cache Manager for Carina PWA
 * Manages local storage caching for offline data access
 * Note: This cache system coexists with voice message cache (voice_msg_*)
 */

const CACHE_PREFIX = 'carina_cache_';
const CACHE_EXPIRY_KEY = '_expiry';
const DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const VOICE_CACHE_PREFIX = 'voice_msg_'; // Voice message cache prefix (from chatService)

export const setCacheData = (key, data, ttl = DEFAULT_TTL) => {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const expiryKey = `${cacheKey}${CACHE_EXPIRY_KEY}`;
    const expiryTime = Date.now() + ttl;
    
    localStorage.setItem(cacheKey, JSON.stringify(data));
    localStorage.setItem(expiryKey, expiryTime.toString());
    
    return true;
  } catch (error) {
    console.error('Error setting cache data:', error);
    
    // If quota exceeded, try to clear old cache
    if (error.name === 'QuotaExceededError') {
      clearExpiredCache();
      // Retry once
      try {
        const cacheKey = `${CACHE_PREFIX}${key}`;
        localStorage.setItem(cacheKey, JSON.stringify(data));
        return true;
      } catch (retryError) {
        console.error('Retry failed:', retryError);
        return false;
      }
    }
    return false;
  }
};

export const getCacheData = (key) => {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const expiryKey = `${cacheKey}${CACHE_EXPIRY_KEY}`;
    
    const expiryTime = localStorage.getItem(expiryKey);
    
    // Check if expired
    if (expiryTime && Date.now() > parseInt(expiryTime)) {
      removeCacheData(key);
      return null;
    }
    
    const data = localStorage.getItem(cacheKey);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting cache data:', error);
    return null;
  }
};

export const removeCacheData = (key) => {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const expiryKey = `${cacheKey}${CACHE_EXPIRY_KEY}`;
    
    localStorage.removeItem(cacheKey);
    localStorage.removeItem(expiryKey);
    
    return true;
  } catch (error) {
    console.error('Error removing cache data:', error);
    return false;
  }
};

export const clearExpiredCache = () => {
  try {
    const keys = Object.keys(localStorage);
    const now = Date.now();
    let clearedCount = 0;
    
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX) && key.endsWith(CACHE_EXPIRY_KEY)) {
        const expiryTime = localStorage.getItem(key);
        if (expiryTime && now > parseInt(expiryTime)) {
          const dataKey = key.replace(CACHE_EXPIRY_KEY, '');
          localStorage.removeItem(dataKey);
          localStorage.removeItem(key);
          clearedCount++;
        }
      }
    });
    
    console.log(`Cleared ${clearedCount} expired cache entries`);
    return clearedCount;
  } catch (error) {
    console.error('Error clearing expired cache:', error);
    return 0;
  }
};

export const clearAllCache = () => {
  try {
    const keys = Object.keys(localStorage);
    let clearedCount = 0;
    
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
        clearedCount++;
      }
    });
    
    console.log(`Cleared ${clearedCount} cache entries`);
    return clearedCount;
  } catch (error) {
    console.error('Error clearing all cache:', error);
    return 0;
  }
};

/**
 * Get cache size for this cache system only (excludes voice messages)
 */
export const getCacheSize = () => {
  try {
    let size = 0;
    const keys = Object.keys(localStorage);
    
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        const item = localStorage.getItem(key);
        if (item) {
          size += item.length + key.length;
        }
      }
    });
    
    return size;
  } catch (error) {
    console.error('Error calculating cache size:', error);
    return 0;
  }
};

/**
 * Get total localStorage usage (all caches including voice messages)
 */
export const getTotalStorageSize = () => {
  try {
    let size = 0;
    const keys = Object.keys(localStorage);
    
    keys.forEach(key => {
      const item = localStorage.getItem(key);
      if (item) {
        size += item.length + key.length;
      }
    });
    
    return size;
  } catch (error) {
    console.error('Error calculating total storage size:', error);
    return 0;
  }
};

/**
 * Get voice message cache size
 */
export const getVoiceCacheSize = () => {
  try {
    let size = 0;
    const keys = Object.keys(localStorage);
    
    keys.forEach(key => {
      if (key.startsWith(VOICE_CACHE_PREFIX)) {
        const item = localStorage.getItem(key);
        if (item) {
          size += item.length + key.length;
        }
      }
    });
    
    return size;
  } catch (error) {
    console.error('Error calculating voice cache size:', error);
    return 0;
  }
};

export const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export const isCached = (key) => {
  const cacheKey = `${CACHE_PREFIX}${key}`;
  const expiryKey = `${cacheKey}${CACHE_EXPIRY_KEY}`;
  
  const expiryTime = localStorage.getItem(expiryKey);
  
  if (!expiryTime) return false;
  
  return Date.now() <= parseInt(expiryTime);
};

export default {
  setCacheData,
  getCacheData,
  removeCacheData,
  clearExpiredCache,
  clearAllCache,
  getCacheSize,
  getTotalStorageSize,
  getVoiceCacheSize,
  formatBytes,
  isCached,
};
