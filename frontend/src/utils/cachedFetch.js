import { setCacheData, getCacheData } from '../utils/offlineCache';

export const fetchWithCache = async (url, options = {}, cacheConfig = {}) => {
  const {
    cacheKey = url,
    cacheTTL = 24 * 60 * 60 * 1000,
    forceRefresh = false,
    fallbackToCache = true,
  } = cacheConfig;

  // Try to get cached data first if not forcing refresh
  if (!forceRefresh && options.method === 'GET') {
    const cachedData = getCacheData(cacheKey);
    if (cachedData) {
      console.log('[Cache] Returning cached data for:', cacheKey);
      
      // Fetch in background to update cache
      fetchAndUpdateCache(url, options, cacheKey, cacheTTL);
      
      return cachedData;
    }
  }

  try {
    // Attempt network request
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Cache successful GET requests
    if (options.method === 'GET' || !options.method) {
      setCacheData(cacheKey, data, cacheTTL);
    }

    return data;
  } catch (error) {
    console.error('[Fetch] Network request failed:', error);

    // If offline or network error, try to use cached data
    if (!navigator.onLine || fallbackToCache) {
      const cachedData = getCacheData(cacheKey);
      if (cachedData) {
        console.log('[Cache] Using cached data due to network error:', cacheKey);
        return cachedData;
      }
    }

    throw error;
  }
};

const fetchAndUpdateCache = async (url, options, cacheKey, cacheTTL) => {
  try {
    const response = await fetch(url, options);
    if (response.ok) {
      const data = await response.json();
      setCacheData(cacheKey, data, cacheTTL);
      console.log('[Cache] Background update successful for:', cacheKey);
    }
  } catch (error) {
    console.log('[Cache] Background update failed:', error.message);
  }
};

export const createCachedApiClient = (baseURL, defaultHeaders = {}) => {
  const getAuthToken = () => localStorage.getItem('token');

  const request = async (endpoint, options = {}, cacheConfig = {}) => {
    const token = getAuthToken();
    
    const url = `${baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...defaultHeaders,
      ...options.headers,
    };

    const fetchOptions = {
      ...options,
      headers,
    };

    return fetchWithCache(url, fetchOptions, cacheConfig);
  };

  return {
    get: (endpoint, cacheConfig = {}) => 
      request(endpoint, { method: 'GET' }, cacheConfig),
    
    post: (endpoint, body, cacheConfig = {}) =>
      request(endpoint, { 
        method: 'POST',
        body: JSON.stringify(body),
      }, { ...cacheConfig, forceRefresh: true }),
    
    put: (endpoint, body, cacheConfig = {}) =>
      request(endpoint, { 
        method: 'PUT',
        body: JSON.stringify(body),
      }, { ...cacheConfig, forceRefresh: true }),
    
    delete: (endpoint, cacheConfig = {}) =>
      request(endpoint, { method: 'DELETE' }, { ...cacheConfig, forceRefresh: true }),
  };
};

export default {
  fetchWithCache,
  createCachedApiClient,
};
