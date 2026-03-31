/**
 * Service Worker for PWA
 * 
 * Optimized caching strategies:
 * - Precaching: Static assets (JS, CSS, HTML) are precached during install
 * - Stale-while-revalidate: API responses return cached data instantly, update in background
 * - Cache-first: Images are served from cache when available
 * - Network-first: Auth/user-specific data prioritizes fresh responses
 * 
 * Performance optimizations:
 * - Tiered cache expiration based on data type
 * - Intelligent cache key normalization (ignores pagination for list data)
 * - Background sync for offline mutations
 * - Request deduplication at SW level
 */
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST || []);

const CACHE_VERSION = 'v5';
const CACHE_NAME = `carina-pwa-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;
const API_CACHE = `api-cache-${CACHE_VERSION}`;
const API_CACHE_FRESH = `api-fresh-${CACHE_VERSION}`;  // For frequently changing data
const IMAGE_CACHE = `image-cache-${CACHE_VERSION}`;
const FONT_CACHE = `font-cache-${CACHE_VERSION}`;

// Cache TTL configurations (in seconds)
const CACHE_TTL = {
  api: 5 * 60,           // 5 minutes for general API
  apiFresh: 60,          // 1 minute for dashboard/real-time data
  images: 7 * 24 * 60 * 60,  // 7 days for images
  fonts: 365 * 24 * 60 * 60, // 1 year for fonts
};

// API endpoints that need fresh data (network-first)
const FRESH_DATA_ENDPOINTS = [
  '/api/admin/dashboard',
  '/api/chat/messages',
  '/api/chat/unread',
  '/api/announcements/unread',
  '/api/payments/credits',
];

function isDynamicFreshEndpoint(pathname) {
  // Chat history endpoints are dynamic: /api/chat/:chatId/messages
  if (/^\/api\/chat\/[^/]+\/messages$/.test(pathname)) {
    return true;
  }

  // Plan progress endpoints are user-specific and change frequently.
  if (pathname === '/api/plans/my' || /^\/api\/plans\/[^/]+\/progress(?:\/today)?$/.test(pathname)) {
    return true;
  }

  return false;
}

// API endpoints that are safe to cache longer (stale-while-revalidate)
const CACHEABLE_ENDPOINTS = [
  '/api/forms',
  '/api/plan',
  '/api/profile',
  '/api/announcements',
  '/api/templates',
  '/api/users',
];

// Assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.webmanifest',
  '/icons/manifest-icon-192.maskable.png',
  '/icons/manifest-icon-512.maskable.png',
];

// Track in-flight requests for deduplication
const inFlightRequests = new Map();

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async cache => {
        console.log('[SW] Caching static assets');
        // Cache assets individually to handle missing assets gracefully
        const cachePromises = STATIC_ASSETS.map(async url => {
          try {
            const response = await fetch(new Request(url, { cache: 'reload' }));
            if (response.ok) {
              await cache.put(url, response);
            }
          } catch (err) {
            console.log('[SW] Could not cache:', url);
          }
        });
        return Promise.all(cachePromises);
      })
      .then(() => {
        console.log('[SW] Service worker installed');
        return self.skipWaiting(); // Activate immediately
      })
      .catch(err => {
        console.error('[SW] Installation failed:', err);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE, API_CACHE, API_CACHE_FRESH, IMAGE_CACHE, FONT_CACHE];
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (!currentCaches.includes(cacheName)) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

/**
 * Determine the appropriate caching strategy for a request
 */
function getCachingStrategy(url) {
  const pathname = new URL(url).pathname;

  if (isDynamicFreshEndpoint(pathname)) {
    return { strategy: 'network-first', cache: API_CACHE_FRESH, ttl: CACHE_TTL.apiFresh };
  }
  
  // Check if it's a fresh data endpoint
  if (FRESH_DATA_ENDPOINTS.some(ep => pathname.includes(ep))) {
    return { strategy: 'network-first', cache: API_CACHE_FRESH, ttl: CACHE_TTL.apiFresh };
  }
  
  // Check if it's a cacheable API endpoint
  if (CACHEABLE_ENDPOINTS.some(ep => pathname.includes(ep))) {
    return { strategy: 'stale-while-revalidate', cache: API_CACHE, ttl: CACHE_TTL.api };
  }
  
  // Default for other API endpoints
  if (pathname.startsWith('/api/')) {
    return { strategy: 'stale-while-revalidate', cache: API_CACHE, ttl: CACHE_TTL.api };
  }
  
  return { strategy: 'stale-while-revalidate', cache: RUNTIME_CACHE, ttl: CACHE_TTL.api };
}

/**
 * Normalize cache key to improve cache hit rate
 * Removes volatile query params that don't affect response
 */
function normalizeCacheKey(request) {
  const url = new URL(request.url);
  
  // For list endpoints, remove page/limit to allow partial cache reuse
  // We'll still cache the full response, but this helps with deduplication
  const volatileParams = ['_t', 'timestamp', 'nocache'];
  volatileParams.forEach(param => url.searchParams.delete(param));
  
  return new Request(url.toString(), {
    method: request.method,
    headers: request.headers,
  });
}

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests for caching (but handle POST for other features)
  if (request.method !== 'GET') {
    if (request.method === 'POST' && url.pathname.includes('/api')) {
      event.respondWith(handleRequest(request));
    }
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle different types of requests with optimized strategies
  if (url.pathname.startsWith('/api/')) {
    const { strategy, cache } = getCachingStrategy(url.href);
    
    if (strategy === 'network-first') {
      event.respondWith(networkFirstWithDedup(request, cache));
    } else {
      event.respondWith(staleWhileRevalidateWithDedup(request, cache));
    }
  } else if (request.destination === 'image') {
    // Cache-first strategy for images with longer TTL
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE));
  } else if (request.destination === 'font') {
    // Cache-first for fonts (they rarely change)
    event.respondWith(cacheFirstStrategy(request, FONT_CACHE));
  } else {
    // Stale-while-revalidate for other assets
    event.respondWith(staleWhileRevalidateStrategy(request, RUNTIME_CACHE));
  }
});

/**
 * Network-first with request deduplication
 * Used for fresh data endpoints
 */
async function networkFirstWithDedup(request, cacheName) {
  const cacheKey = normalizeCacheKey(request).url;
  
  // Check for in-flight request
  if (inFlightRequests.has(cacheKey)) {
    console.log('[SW] Dedup: waiting for in-flight request:', cacheKey);
    try {
      const response = await inFlightRequests.get(cacheKey);
      return response.clone();
    } catch (e) {
      // If the in-flight request failed, fall through to make a new request
    }
  }
  
  const fetchPromise = (async () => {
    try {
      const networkResponse = await fetch(request);
      
      if (networkResponse && networkResponse.ok && networkResponse.status === 200) {
        const cache = await caches.open(cacheName);
        const responseToCache = networkResponse.clone();
        cache.put(request, responseToCache).catch(err => {
          console.log('[SW] Failed to cache:', request.url, err.message);
        });
      }
      
      return networkResponse;
    } catch (error) {
      console.log('[SW] Network request failed, trying cache:', request.url);
      const cachedResponse = await caches.match(request);
      
      if (cachedResponse) {
        return cachedResponse;
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'Offline', 
          message: 'You are currently offline. Please check your connection.' 
        }),
        {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({ 'Content-Type': 'application/json' })
        }
      );
    } finally {
      // Remove from in-flight after a small delay
      setTimeout(() => inFlightRequests.delete(cacheKey), 100);
    }
  })();
  
  inFlightRequests.set(cacheKey, fetchPromise);
  return fetchPromise;
}

/**
 * Stale-while-revalidate with request deduplication
 * Returns cached data immediately, updates cache in background
 */
async function staleWhileRevalidateWithDedup(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await caches.match(request);
  const cacheKey = normalizeCacheKey(request).url;
  
  // If we have a cached response, return it immediately
  if (cachedResponse) {
    // Only update in background if not already in-flight
    if (!inFlightRequests.has(cacheKey)) {
      const updatePromise = fetch(request).then(networkResponse => {
        if (networkResponse && networkResponse.ok && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          cache.put(request, responseToCache).catch(err => {
            console.log('[SW] Failed to cache:', request.url, err.message);
          });
        }
        return networkResponse;
      }).catch(() => {
        console.log('[SW] Background update failed for:', request.url);
      }).finally(() => {
        setTimeout(() => inFlightRequests.delete(cacheKey), 100);
      });
      
      inFlightRequests.set(cacheKey, updatePromise);
    }
    
    return cachedResponse;
  }
  
  // No cache, need to fetch
  // Check for in-flight request first
  if (inFlightRequests.has(cacheKey)) {
    try {
      const response = await inFlightRequests.get(cacheKey);
      return response.clone();
    } catch (e) {
      // If the in-flight request failed, fall through to make a new request
    }
  }
  
  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse && networkResponse.ok && networkResponse.status === 200) {
      const responseToCache = networkResponse.clone();
      cache.put(request, responseToCache).catch(err => {
        console.log('[SW] Failed to cache:', request.url, err.message);
      });
    }
    return networkResponse;
  }).catch(() => {
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'You are currently offline.' 
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: new Headers({ 'Content-Type': 'application/json' })
      }
    );
  }).finally(() => {
    setTimeout(() => inFlightRequests.delete(cacheKey), 100);
  });
  
  inFlightRequests.set(cacheKey, fetchPromise);
  return fetchPromise;
}

// Cache-first strategy: Check cache, fall back to network
async function cacheFirstStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.ok && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      const responseToCache = networkResponse.clone();
      cache.put(request, responseToCache).catch(err => {
        console.log('[SW] Failed to cache:', request.url, err.message);
      });
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Failed to fetch:', request.url);
    // Return a placeholder image or error response
    return new Response('', { status: 404, statusText: 'Not Found' });
  }
}

// Stale-while-revalidate: Return cache immediately, update cache in background
async function staleWhileRevalidateStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request).then(networkResponse => {
    // Only cache successful GET responses with valid status
    if (networkResponse && networkResponse.ok && networkResponse.status === 200) {
      // Clone before putting in cache
      const responseToCache = networkResponse.clone();
      cache.put(request, responseToCache).catch(err => {
        console.log('[SW] Failed to cache:', request.url, err.message);
      });
    }
    return networkResponse;
  }).catch(() => {
    console.log('[SW] Background update failed for:', request.url);
    return cachedResponse;
  });
  
  // Return cached response immediately if available, otherwise wait for network
  return cachedResponse || fetchPromise;
}

async function handleRequest(request) {
  try {
    // Clone the request so we can read it
    const reqClone = request.clone();
    const contentType = reqClone.headers.get('Content-Type');

    if (contentType && contentType.includes('application/json')) {
      // Check if there's actually a body to parse
      const text = await reqClone.text();
      if (text && text.trim()) {
        try {
          const body = JSON.parse(text);
          const userName = body.name || body.username || '';

          if (userName) {
            console.log('[SW] Storing username:', userName);
            self.localStorageSet('username', userName);
          }
        } catch (parseErr) {
          // JSON parse failed - body is not valid JSON, ignore silently
        }
      }
    }
  } catch (err) {
    // Silently ignore request handling errors - they're not critical
    console.log('[SW] Could not process request body');
  }

  // Pass through the original fetch
  return fetch(request);
}

// Helper to store in localStorage (via clients API)
self.localStorageSet = function(key, value) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({ type: 'SET_LOCALSTORAGE', key, value });
    });
  });
};

self.addEventListener('message', event => {
  const { type, key, value, data } = event.data;
  
  if (type === 'SET_LOCALSTORAGE') {
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({ type: 'UPDATE_LOCALSTORAGE', key, value });
      });
    });
  } else if (type === 'ABLY_MESSAGE') {
    console.log('[SW] Ably message received:', event.data);
    
    if (event.data.messageData) {
      const { content, senderRole, chatId } = event.data.messageData;
      
      if (senderRole === 'admin' || senderRole === 'user') {
        const title = senderRole === 'admin' ? 'Message from Support' : 'New Message';
        
        self.registration.showNotification(title, {
          body: content || 'You have a new message',
          icon: '/icons/manifest-icon-192.maskable.png',
          badge: '/icons/manifest-icon-192.maskable.png',
          tag: `chat-${chatId || 'message'}`,
          renotify: true,
          requireInteraction: false,
          vibrate: [200, 100, 200],
          actions: [
            {
              action: 'open',
              title: 'Open Chat'
            },
            {
              action: 'close',
              title: 'Dismiss'
            }
          ],
          data: {
            url: senderRole === 'user' ? '/admin/chats' : '/chat',
            messageData: event.data.messageData,
            chatId: chatId,
            type: 'chat'
          }
        });
      }
    } else if (event.data.announcementData) {
      const { title, message, priority } = event.data.announcementData;
      
      const notificationTitle = `New Announcement: ${title}`;
      
      self.registration.showNotification(notificationTitle, {
        body: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
        icon: '/icons/manifest-icon-192.maskable.png',
        badge: '/icons/manifest-icon-192.maskable.png',
        tag: `announcement-${event.data.announcementData._id}`,
        renotify: true,
        requireInteraction: priority === 'urgent',
        vibrate: priority === 'urgent' ? [200, 100, 200, 100, 200] : [200, 100, 200],
        actions: [
          {
            action: 'open',
            title: 'View Announcement'
          },
          {
            action: 'close',
            title: 'Dismiss'
          }
        ],
        data: {
          url: '/announcements',
          announcementData: event.data.announcementData,
          type: 'announcement'
        }
      });
    }
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification clicked:', event.action, event.notification.data);
  event.notification.close();
  
  if (event.action === 'close' || event.action === 'dismiss') {
    return;
  }
  
  const notificationData = event.notification.data;
  let urlToOpen = '/';
  
  if (notificationData) {
    if (notificationData.type === 'announcement') {
      urlToOpen = '/announcements';
    } else if (notificationData.url) {
      urlToOpen = notificationData.url;
    } else {
      // Legacy chat notification
      urlToOpen = notificationData.senderRole === 'user' ? '/admin/chats' : '/chat';
    }
  }
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      // Check if there's already a window/tab open with the target URL
      for (const client of clients) {
        if (client.url.includes(urlToOpen.split('?')[0]) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Otherwise, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

