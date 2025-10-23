// Service Worker for PWA with Ably support and notifications

const CACHE_NAME = 'carina-pwa-v1';

self.addEventListener('install', () => {
  console.log('[SW] Installed');
  self.skipWaiting(); // Activate immediately
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activated');
  event.waitUntil(self.clients.claim());
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
            chatId: chatId
          }
        });
      }
    }
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification clicked:', event.action);
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  const urlToOpen = event.notification.data?.url || '/chat';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
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
