// Service Worker for PWA with Ably support, notifications, and offline caching.
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST || []);

const CACHE_VERSION = 'v2';
const CACHE_NAME = `carina-pwa-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;
const API_CACHE = `api-cache-${CACHE_VERSION}`;
const IMAGE_CACHE = `image-cache-${CACHE_VERSION}`;

// Assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.webmanifest',
  '/icons/manifest-icon-192.maskable.png',
  '/icons/manifest-icon-512.maskable.png',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })));
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
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE, API_CACHE, IMAGE_CACHE];
  
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

  // Handle different types of requests with different strategies
  if (url.pathname.startsWith('/api/')) {
    // Network-first strategy for API calls
    event.respondWith(networkFirstStrategy(request, API_CACHE));
  } else if (request.destination === 'image') {
    // Cache-first strategy for images
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE));
  } else {
    // Stale-while-revalidate for other assets
    event.respondWith(staleWhileRevalidateStrategy(request, RUNTIME_CACHE));
  }
});

// Network-first strategy: Try network, fall back to cache
async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    // Only cache successful responses
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network request failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page or error response for API calls
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'You are currently offline. Please check your connection.' 
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      }
    );
  }
}

// Cache-first strategy: Check cache, fall back to network
async function cacheFirstStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
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
    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
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
      const body = await reqClone.json();
      const userName = body.name || body.username || '';

      if (userName) {
        console.log('[SW] Storing username:', userName);
        self.localStorageSet('username', userName);
      }
    }
  } catch (err) {
    console.error('[SW] Error handling request:', err);
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
  } else if (type === 'SHOW_PUSH_NOTIFICATION') {
    console.log('[SW] Showing push notification:', data);
    
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/icons/manifest-icon-192.maskable.png',
      badge: data.badge || '/icons/manifest-icon-192.maskable.png',
      tag: data.tag,
      renotify: true,
      requireInteraction: data.requireInteraction || false,
      vibrate: data.vibrate || [200, 100, 200],
      actions: [
        {
          action: 'open',
          title: data.data?.type === 'announcement' ? 'View Announcement' : 'Open'
        },
        {
          action: 'close',
          title: 'Dismiss'
        }
      ],
      data: data.data
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

self.addEventListener('push', event => {
  const data = event.data?.json() || {};
  const title = data.title || 'New Message';
  const options = {
    body: data.body || 'You have a new message',
    icon: '/icons/manifest-icon-192.maskable.png',
    badge: '/icons/manifest-icon-192.maskable.png',
    tag: `chat-${data.chatId || 'message'}`,
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
      url: data.url || '/chat',
      chatId: data.chatId
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});
