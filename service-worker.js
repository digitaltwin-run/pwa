/**
 * Service Worker for Digital Twin PWA
 * Handles offline functionality and caching
 */

const CACHE_NAME = 'digital-twin-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/manifest.json',
  '/js/app.js',
  '/js/grid.js',
  '/html-modules/base/module-base.js',
  '/html-modules/base/i18n-mixin.js',
  '/assets/icons/icon-192x192.png',
  '/assets/icons/icon-512x512.png'
];

// Install event - cache essential files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching essential files');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Removing old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache when available
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }

        // Clone the request because it's a stream and can only be consumed once
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(response => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type === 'opaque') {
            return response;
          }

          // Clone the response because it's a stream
          const responseToCache = response.clone();

          // Cache the fetched response for future use
          caches.open(CACHE_NAME)
            .then(cache => {
              // Only cache same-origin and CORS-enabled requests
              if (event.request.url.startsWith(self.location.origin) || 
                  response.type === 'cors') {
                cache.put(event.request, responseToCache);
              }
            });

          return response;
        });
      })
      .catch(error => {
        console.error('Service Worker: Fetch failed', error);
        // You could return a custom offline page here
      })
  );
});

// Handle messages from clients
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
