/**
 * Service Worker for Digital Twin PWA
 * Handles offline functionality, caching, and push notifications
 */

const CACHE_NAME = 'digitaltwin-v1';
const OFFLINE_URL = '/offline.html';

// Files to cache
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/test-pwa.html',
  '/static/css/style.css',
  '/static/js/app.js',
  '/static/js/pwa-manager.js',
  '/static/images/icon-192x192.png',
  '/static/images/icon-512x512.png',
  '/manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install');
  
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
  
  // Cache all static assets
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(PRECACHE_ASSETS);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate');
  
  // Remove previous cached data if it exists
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  
  // Take control of all clients immediately
  self.clients.claim();
});

// Fetch event - serve from cache, falling back to network
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests, like those to Google Analytics
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Handle navigation requests for HTML pages with network-first strategy
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // Try network first
          const networkResponse = await fetch(event.request);
          return networkResponse;
        } catch (error) {
          // If network fails, return offline page
          console.log('[Service Worker] Network request failed, serving offline page', error);
          const cache = await caches.open(CACHE_NAME);
          const cachedResponse = await cache.match(OFFLINE_URL);
          return cachedResponse || Response.error();
        }
      })()
    );
  } else {
    // For all other requests, use cache-first strategy
    event.respondWith(
      caches.match(event.request).then((response) => {
        // Return cached response if found
        if (response) {
          return response;
        }
        
        // Clone the request because it can only be consumed once
        const fetchRequest = event.request.clone();
        
        // Make network request and cache the response
        return fetch(fetchRequest).then((response) => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response because it needs to be consumed by both the browser and the cache
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          
          return response;
        });
      }).catch(() => {
        // If both cache and network fail, and this is an HTML page, return the offline page
        if (event.request.headers.get('accept').includes('text/html')) {
          return caches.match(OFFLINE_URL);
        }
      })
    );
  }
});

// Push event - handle push notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received');
  
  let notificationData = {
    title: 'New Notification',
    body: 'You have a new notification',
    icon: '/static/images/icon-192x192.png',
    badge: '/static/images/icon-96x96.png',
    data: {
      url: self.location.origin,
      timestamp: Date.now()
    }
  };
  
  // Parse the push message data
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (e) {
      console.log('[Service Worker] Error parsing push data', e);
      notificationData.body = event.data.text() || 'New notification received';
    }
  }
  
  // Keep the service worker alive until the notification is created
  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click received');
  
  // Close the notification
  event.notification.close();
  
  // Get the URL from the notification data or use the root URL
  const urlToOpen = event.notification.data?.url || '/';
  
  // Open or focus the URL in a client
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then((clientList) => {
        // Check if there's already a window/tab open with the URL
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no matching client is found, open a new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Handle background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    console.log('[Service Worker] Background sync event received');
    // You can add background sync logic here
  }
});

// Handle message events from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
