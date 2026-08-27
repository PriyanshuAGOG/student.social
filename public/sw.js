// Service Worker for Student.social PWA
const CACHE_VERSION = 'student-social-v8';
const RUNTIME_CACHE = 'student-social-runtime';

// Assets to cache on install
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/maskable-512.png',
  '/icons/badge-96.png',
  '/apple-touch-icon.png',
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
  // Activate immediately on first install. Updates wait for the person to
  // accept the in-app update prompt before taking over the current session.
  if (!self.registration.active) self.skipWaiting();
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

  // Cache Storage only supports GET. Pass form submissions, Server Actions,
  // uploads, and every other mutation straight through to the network.
  if (request.method !== 'GET') {
    event.respondWith(fetch(request));
    return;
  }

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Development must always see the current Next.js chunks and RSC payloads.
  // Cache-first responses here otherwise mask HMR changes and produce false
  // runtime errors from incompatible client/server bundles.
  if (['localhost', '127.0.0.1'].includes(location.hostname)) {
    event.respondWith(fetch(request, { cache: 'no-store', credentials: 'include' }));
    return;
  }

  // Never cache API responses: most endpoints are user-specific.
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request, { cache: 'no-store', credentials: 'include' }));
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
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline - Resource not available', {
      status: 503,
      statusText: 'Service Unavailable',
    });
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
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'Student.social', body: event.data.text() };
  }

  event.waitUntil((async () => {
    const incomingCall = data.type === 'incoming-call';
    const newMessage = data.type === 'new-message';
    const windowClients = newMessage
      ? await clients.matchAll({ type: 'window', includeUncontrolled: true })
      : [];
    const visibleClient = windowClients.find((client) => client.visibilityState === 'visible');

    // A visible app renders its own richer message strip. Avoid showing a
    // second operating-system notification for the same message.
    if (newMessage && visibleClient) {
      visibleClient.postMessage({ type: 'NEW_MESSAGE_PUSH', payload: data });
      return;
    }

    const options = {
      body: data.body || 'New notification from Student.social',
      icon: data.data?.callerAvatar || data.data?.senderAvatar || '/icons/icon-192.png',
      badge: '/icons/badge-96.png',
      tag: data.tag || 'student-social-notification',
      data: data.data || {},
      requireInteraction: incomingCall || Boolean(data.requireInteraction),
      renotify: incomingCall || newMessage,
      silent: false,
      vibrate: incomingCall ? [420, 160, 420, 720, 420, 160, 420] : [140, 70, 210],
      timestamp: Date.now(),
      actions: incomingCall ? [
        { action: 'accept-call', title: 'Answer' },
        { action: 'decline-call', title: 'Decline' },
      ] : [],
    };

    await self.registration.showNotification(data.title || 'Student.social', options);
    if ((incomingCall || newMessage) && self.navigator?.setAppBadge) await self.navigator.setAppBadge(1);
  })());
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.waitUntil((async () => {
    const data = event.notification.data || {};
    const callId = data.callId;
    const isCall = Boolean(callId);

    if (isCall && (event.action === 'accept-call' || event.action === 'decline-call')) {
      const action = event.action === 'accept-call' ? 'accept' : 'decline';
      await fetch(`/api/calls/sessions/${encodeURIComponent(callId)}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      }).catch(() => undefined);
    }

    event.notification.close();
    if (self.navigator?.clearAppBadge) await self.navigator.clearAppBadge().catch(() => undefined);
    if (event.action === 'decline-call') return;

    const targetUrl = new URL(data.url || (isCall ? `/app/chat?call=${encodeURIComponent(callId)}` : '/app/notifications'), self.location.origin).href;
    const clientList = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    const existing = clientList.find((client) => new URL(client.url).origin === self.location.origin);
    if (existing && 'focus' in existing) {
      if ('navigate' in existing) await existing.navigate(targetUrl).catch(() => undefined);
      return existing.focus();
    }
    if (clients.openWindow) return clients.openWindow(targetUrl);
  })());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }
  if (event.data?.type !== 'CALL_RESOLVED' || !event.data.callId) return;
  event.waitUntil((async () => {
    const notifications = await self.registration.getNotifications({ tag: `student-call-${event.data.callId}` });
    notifications.forEach((notification) => notification.close());
    if (self.navigator?.clearAppBadge) await self.navigator.clearAppBadge().catch(() => undefined);
  })());
});
