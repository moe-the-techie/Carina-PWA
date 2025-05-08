// Simple Service Worker for testing

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

  // Only handle POST requests to /api/profile or /api/user (example)
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

// Listen for postMessage to actually write to localStorage on client
self.addEventListener('message', event => {
  const { type, key, value } = event.data;
  if (type === 'SET_LOCALSTORAGE') {
    localStorage.setItem(key, value);
  }
});
