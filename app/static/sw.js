// FootLogic Service Worker - PWA Offline Support
const CACHE_NAME = 'footlogic-v1.0.0';
const OFFLINE_URL = '/offline';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/static/css/style.css',
  '/static/manifest.json',
  '/offline',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Cache strategies
const CACHE_STRATEGIES = {
  cacheFirst: ['fonts.googleapis.com', 'fonts.gstatic.com', 'cdnjs.cloudflare.com'],
  networkFirst: ['/api/', '/auth/'],
  staleWhileRevalidate: ['/static/']
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[ServiceWorker] Installed successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[ServiceWorker] Install failed:', error);
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('[ServiceWorker] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[ServiceWorker] Activated successfully');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests except for allowed CDNs
  if (url.origin !== location.origin &&
    !CACHE_STRATEGIES.cacheFirst.some(domain => url.hostname.includes(domain))) {
    return;
  }

  // Determine cache strategy
  let strategy = 'networkFirst';

  if (CACHE_STRATEGIES.cacheFirst.some(domain => url.hostname.includes(domain))) {
    strategy = 'cacheFirst';
  } else if (CACHE_STRATEGIES.staleWhileRevalidate.some(path => url.pathname.startsWith(path))) {
    strategy = 'staleWhileRevalidate';
  } else if (CACHE_STRATEGIES.networkFirst.some(path => url.pathname.startsWith(path))) {
    strategy = 'networkFirst';
  }

  event.respondWith(handleFetch(request, strategy));
});

// Handle fetch with different strategies
async function handleFetch(request, strategy) {
  switch (strategy) {
    case 'cacheFirst':
      return cacheFirst(request);
    case 'staleWhileRevalidate':
      return staleWhileRevalidate(request);
    case 'networkFirst':
    default:
      return networkFirst(request);
  }
}

// Cache First - Good for static assets that don't change
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return new Response('Offline', { status: 503 });
  }
}

// Network First - Good for dynamic content
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match(OFFLINE_URL);
    }

    return new Response('Offline', { status: 503 });
  }
}

// Stale While Revalidate - Good for frequently updated assets
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  const networkResponsePromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => cachedResponse);

  return cachedResponse || networkResponsePromise;
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push received');

  const options = {
    body: event.data ? event.data.text() : 'Nouvelle notification FootLogic',
    icon: '/static/img/icons/icon.svg',
    badge: '/static/img/icons/icon.svg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      { action: 'explore', title: 'Voir', icon: '/static/img/icons/icon.svg' },
      { action: 'close', title: 'Fermer', icon: '/static/img/icons/icon.svg' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('FootLogic', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification clicked');

  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/app-home')
    );
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Sync event:', event.tag);

  if (event.tag === 'sync-attendance') {
    event.waitUntil(syncAttendance());
  } else if (event.tag === 'sync-events') {
    event.waitUntil(syncEvents());
  }
});

// Sync attendance data when back online
async function syncAttendance() {
  try {
    const db = await openDB();
    const pendingAttendance = await db.getAll('pending-attendance');

    for (const data of pendingAttendance) {
      await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      await db.delete('pending-attendance', data.id);
    }
  } catch (error) {
    console.error('[ServiceWorker] Sync attendance failed:', error);
  }
}

// Sync events data when back online
async function syncEvents() {
  try {
    const db = await openDB();
    const pendingEvents = await db.getAll('pending-events');

    for (const data of pendingEvents) {
      await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      await db.delete('pending-events', data.id);
    }
  } catch (error) {
    console.error('[ServiceWorker] Sync events failed:', error);
  }
}

console.log('[ServiceWorker] Loaded');
