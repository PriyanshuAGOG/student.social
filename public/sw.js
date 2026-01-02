// Service Worker for PeerSpark PWA
const CACHE_VERSION = 'peerspark-v1';
const RUNTIME_CACHE = 'peerspark-runtime';

// Assets to cache on install
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/placeholder-icon.png',
  '/placeholder-logo.png',
  '/favicon.ico',
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('Asset caching failed:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_VERSION && cacheName !== RUNTIME_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(navigationRoute(request));
    return;
  }

  // Handle image requests
  if (request.destination === 'image') {
    event.respondWith(cacheImages(request));
    return;
  }

  // Default: cache first
  event.respondWith(cacheFirst(request));
});

// Cache first strategy
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_VERSION);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.add(request);
    }
    return response;
  } catch {
    return new Response('Offline - Resource not available', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

// Network first strategy (for API calls)
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('Offline - API unavailable', { status: 503 });
  }
}

// Navigation route strategy
async function navigationRoute(request) {
  try {
    return await fetch(request);
  } catch {
    const cache = await caches.open(CACHE_VERSION);
    return cache.match('/') || new Response('Offline', { status: 503 });
  }
}

// Cache images strategy
async function cacheImages(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Image not available', { status: 503 });
  }
}

// Handle background sync for pod updates
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pods') {
    event.waitUntil(syncPods());
  }
});

async function syncPods() {
  try {
    // Sync logic would go here
    console.log('Pod data synced');
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

// Handle push notifications
self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }

  const data = event.data.json();
  const options = {
    body: data.body || 'New notification from PeerSpark',
    icon: '/placeholder-icon.png',
    badge: '/favicon.ico',
    tag: data.tag || 'notification',
    requireInteraction: data.requireInteraction || false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'PeerSpark', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
