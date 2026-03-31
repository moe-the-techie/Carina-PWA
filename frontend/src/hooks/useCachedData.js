/**
 * useCachedData Hook - Stale-While-Revalidate Pattern
 * 
 * This hook provides instant data display from cache while fetching fresh data
 * in the background. Pages never show loading spinners for cached data.
 * 
 * Features:
 * - Instant display of cached data (no loading state for returning users)
 * - Background refresh with automatic state updates
 * - Request deduplication (prevents duplicate in-flight requests)
 * - Optimistic updates support
 * - Cache invalidation helpers
 * - Offline support
 * - Smart refetch strategies
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getCacheData, setCacheData, removeCacheData } from '../utils/offlineCache';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Global request deduplication store
const inFlightRequests = new Map();

// Global cache subscription store for cross-component updates
const cacheSubscribers = new Map();

/**
 * Subscribe to cache updates for a specific key
 */
const subscribeToCacheKey = (cacheKey, callback) => {
  if (!cacheSubscribers.has(cacheKey)) {
    cacheSubscribers.set(cacheKey, new Set());
  }
  cacheSubscribers.get(cacheKey).add(callback);
  return () => {
    cacheSubscribers.get(cacheKey)?.delete(callback);
  };
};

/**
 * Notify all subscribers of cache update
 */
const notifyCacheUpdate = (cacheKey, data) => {
  cacheSubscribers.get(cacheKey)?.forEach(callback => callback(data));
};

/**
 * Custom hook for data fetching with stale-while-revalidate caching
 * 
 * @param {string} cacheKey - Unique key for caching this data
 * @param {Function} fetchFn - Async function that fetches the data
 * @param {Object} options - Configuration options
 * @param {number} options.cacheTTL - Cache time-to-live in ms (default: 24 hours)
 * @param {boolean} options.enabled - Whether to fetch data (default: true)
 * @param {any} options.initialData - Initial data before cache/fetch
 * @param {Function} options.onSuccess - Callback when fresh data is fetched
 * @param {Function} options.onError - Callback when fetch fails
 * @param {boolean} options.refetchOnMount - Always refetch on mount (default: true)
 * @param {boolean} options.refetchOnFocus - Refetch when window gains focus (default: false)
 * @param {number} options.staleTime - Time before data is considered stale (default: 0)
 * @param {Array} options.dependencies - Dependencies that trigger refetch
 * @param {boolean} options.deduplicate - Enable request deduplication (default: true)
 * @param {boolean} options.syncAcrossComponents - Sync data across components using same key (default: true)
 * 
 * @returns {Object} { data, isLoading, isRefreshing, error, refetch, setData, invalidate }
 */
export const useCachedData = (cacheKey, fetchFn, options = {}) => {
  const {
    cacheTTL = 24 * 60 * 60 * 1000, // 24 hours default
    enabled = true,
    initialData = null,
    onSuccess,
    onError,
    refetchOnMount = true,
    refetchOnFocus = false,
    staleTime = 0,
    dependencies = [],
    deduplicate = true,
    syncAcrossComponents = true,
  } = options;

  // Try to get cached data immediately (synchronously)
  const getCached = () => {
    try {
      return getCacheData(cacheKey);
    } catch {
      return null;
    }
  };

  const cachedData = getCached();
  
  // Initialize with cached data or initialData
  const [data, setDataState] = useState(cachedData ?? initialData);
  // Only show loading if we have no cached data
  const [isLoading, setIsLoading] = useState(cachedData === null && enabled);
  // Shows when we're refreshing in background (cached data is being displayed)
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(null);
  
  const isMounted = useRef(true);
  const fetchInProgress = useRef(false);

  // Subscribe to cross-component updates
  useEffect(() => {
    if (!syncAcrossComponents) return;
    
    const unsubscribe = subscribeToCacheKey(cacheKey, (newData) => {
      if (isMounted.current) {
        setDataState(newData);
      }
    });
    
    return unsubscribe;
  }, [cacheKey, syncAcrossComponents]);

  // Keep manual updates in sync with persistent cache and peer subscribers.
  const setData = useCallback((updater) => {
    setDataState((previousData) => {
      const nextData = typeof updater === 'function' ? updater(previousData) : updater;

      setCacheData(cacheKey, nextData, cacheTTL);

      if (syncAcrossComponents) {
        notifyCacheUpdate(cacheKey, nextData);
      }

      return nextData;
    });
  }, [cacheKey, cacheTTL, syncAcrossComponents]);

  // Core fetch function with deduplication
  const fetchData = useCallback(async (showLoadingState = false) => {
    if (!enabled || fetchInProgress.current) return;

    // Check for in-flight request (deduplication)
    if (deduplicate && inFlightRequests.has(cacheKey)) {
      // Wait for existing request
      try {
        const result = await inFlightRequests.get(cacheKey);
        if (isMounted.current) {
          setDataState(result);
        }
        return result;
      } catch (err) {
        // Fall through to make new request
      }
    }

    fetchInProgress.current = true;
    
    // Only show loading spinner if we don't have data to display
    if (showLoadingState && data === null) {
      setIsLoading(true);
    } else if (data !== null) {
      // We have cached data, show refreshing indicator instead
      setIsRefreshing(true);
    }

    // Create the fetch promise for deduplication
    const fetchPromise = (async () => {
      try {
        const freshData = await fetchFn();
        
        if (!isMounted.current) return freshData;

        // Update state with fresh data
        setDataState(freshData);
        setError(null);
        setLastFetchTime(Date.now());
        
        // Cache the fresh data
        setCacheData(cacheKey, freshData, cacheTTL);
        
        // Notify other components using the same cache key
        if (syncAcrossComponents) {
          notifyCacheUpdate(cacheKey, freshData);
        }
        
        // Call success callback
        if (onSuccess) {
          onSuccess(freshData);
        }
        
        return freshData;
      } catch (err) {
        if (!isMounted.current) throw err;
        
        console.error(`[useCachedData] Error fetching ${cacheKey}:`, err);
        setError(err);
        
        // If we have cached data, keep showing it even on error
        if (onError) {
          onError(err);
        }
        throw err;
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
          setIsRefreshing(false);
          fetchInProgress.current = false;
        }
        // Remove from in-flight after a small delay
        setTimeout(() => inFlightRequests.delete(cacheKey), 100);
      }
    })();

    // Store for deduplication
    if (deduplicate) {
      inFlightRequests.set(cacheKey, fetchPromise);
    }

    return fetchPromise;
  }, [enabled, cacheKey, cacheTTL, fetchFn, onSuccess, onError, data, deduplicate, syncAcrossComponents]);

  // Manual refetch function
  const refetch = useCallback(() => {
    return fetchData(data === null);
  }, [fetchData, data]);

  // Invalidate cache and refetch
  const invalidate = useCallback(() => {
    removeCacheData(cacheKey);
    inFlightRequests.delete(cacheKey);
    setData(null);
    return fetchData(true);
  }, [cacheKey, fetchData]);

  // Initial fetch on mount
  useEffect(() => {
    isMounted.current = true;

    if (enabled && refetchOnMount) {
      const hasCachedValue = cachedData !== null;
      // Revalidate cached data only when staleTime is explicitly enabled (> 0)
      // and we have a known in-memory fetch timestamp.
      const shouldRevalidateCached =
        hasCachedValue &&
        staleTime > 0 &&
        lastFetchTime !== null &&
        (Date.now() - lastFetchTime) > staleTime;

      if (!hasCachedValue || shouldRevalidateCached) {
        fetchData(!hasCachedValue);
      }
    }

    return () => {
      isMounted.current = false;
    };
  }, [enabled, cacheKey, ...dependencies]);

  // Refetch on window focus
  useEffect(() => {
    if (!refetchOnFocus) return;

    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        fetchData(false);
      }
    };

    document.addEventListener('visibilitychange', handleFocus);
    return () => document.removeEventListener('visibilitychange', handleFocus);
  }, [refetchOnFocus, fetchData]);

  return {
    data,
    isLoading,      // True only when we have no data to display
    isRefreshing,   // True when we're updating in background
    error,
    refetch,
    setData,        // For optimistic updates
    invalidate,     // Clear cache and refetch
    hasCachedData: cachedData !== null,
  };
};

/**
 * Helper hook for authenticated API fetching with caching
 * Wraps useCachedData with common patterns for API calls
 */
export const useCachedApi = (endpoint, options = {}) => {
  const {
    method = 'GET',
    body = null,
    headers = {},
    cacheKey = endpoint,
    transform = (data) => data,
    ...restOptions
  } = options;

  const fetchFn = useCallback(async () => {
    const token = localStorage.getItem('token');
    
    const fetchOptions = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...headers,
      },
    };

    if (body && method !== 'GET') {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, fetchOptions);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return transform(data);
  }, [endpoint, method, body, headers, transform]);

  return useCachedData(cacheKey, fetchFn, restOptions);
};

/**
 * Hook for paginated data with caching
 */
export const useCachedPaginatedData = (baseCacheKey, fetchFn, options = {}) => {
  const {
    page = 1,
    limit = 10,
    ...restOptions
  } = options;

  const cacheKey = `${baseCacheKey}_page_${page}_limit_${limit}`;
  
  return useCachedData(cacheKey, () => fetchFn(page, limit), {
    ...restOptions,
    dependencies: [page, limit, ...(restOptions.dependencies || [])],
  });
};

/**
 * Prefetch data into cache without updating component state
 * Useful for prefetching data the user might navigate to
 */
export const prefetchData = async (cacheKey, fetchFn, cacheTTL = 24 * 60 * 60 * 1000) => {
  try {
    // Check if already cached
    const cached = getCacheData(cacheKey);
    if (cached !== null) return cached;

    const data = await fetchFn();
    setCacheData(cacheKey, data, cacheTTL);
    return data;
  } catch (error) {
    console.error(`[prefetchData] Error prefetching ${cacheKey}:`, error);
    return null;
  }
};

/**
 * Invalidate multiple cache keys at once
 */
export const invalidateCache = (...cacheKeys) => {
  cacheKeys.forEach(key => removeCacheData(key));
};

/**
 * Clear all page-related caches
 */
export const clearPageCaches = () => {
  const pageCachePatterns = [
    'home_forms',
    'active_plans',
    'admin_dashboard',
    'admin_users',
    'admin_forms',
    'admin_chats',
    'announcements',
    'user_announcements',
  ];
  
  pageCachePatterns.forEach(pattern => {
    // Clear all variations of this cache
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes(pattern)) {
        localStorage.removeItem(key);
      }
    });
  });
};

export default useCachedData;
