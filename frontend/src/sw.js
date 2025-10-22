// Service Worker for PWA with Ably support

self.addEventListener('install', () => {
  console.log('[SW] Installed');
  self.skipWaiting(); // Activate immediately
});

self.addEventListener('activate', () => {
  console.log('[SW] Activated');
  return self.clients.claim();
});

// Intercept fetch requests
self.addEventListener('fetch', event => {
  const { request } = event;

  // Only handle POST requests to /api (example)
  if (request.method === 'POST' && request.url.includes('/api')) {
    event.respondWith(handleRequest(request));
  }
});

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
  const { type, key, value } = event.data;
  
  if (type === 'SET_LOCALSTORAGE') {
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({ type: 'UPDATE_LOCALSTORAGE', key, value });
      });
    });
  } else if (type === 'ABLY_MESSAGE') {
    console.log('[SW] Ably message received:', event.data);
    
    if (event.data.messageData) {
      const { content, senderRole } = event.data.messageData;
      
      if (senderRole === 'admin' || senderRole === 'user') {
        self.registration.showNotification('New Message', {
          body: content,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-96x96.png',
          tag: 'chat-message',
          renotify: true,
          requireInteraction: false,
          data: {
            url: '/chat',
            messageData: event.data.messageData
          }
        });
      }
    }
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/chat';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      for (const client of clients) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      
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
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    tag: 'chat-message',
    data: {
      url: data.url || '/chat',
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});
