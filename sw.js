/**
 * 🚀 Digital Twin PWA - Enhanced Service Worker
 * Provides offline support, caching, and push notifications
 */

const CACHE_NAME = 'digital-twin-pwa-v1.2.0';
const CACHE_VERSION = '1.2.0';

// Assets to cache for offline functionality
const CORE_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/config.json',
    
    // Core JavaScript files
    '/js/app.js',
    '/js/components.js',
    '/js/dragdrop.js',
    '/js/properties.js',
    '/js/properties-core.js',
    '/js/properties-mapper.js',
    '/js/interactions.js',
    '/js/connections.js',
    '/js/export.js',
    '/js/actions.js',
    '/js/error-detector.js',
    
    // Styles
    '/style.css',
    
    // SVG Components
    '/components/led.svg',
    '/components/button.svg',
    '/components/switch.svg',
    '/components/knob.svg',
    '/components/motor.svg',
    '/components/slider.svg',
    '/components/gauge.svg',
    '/components/relay.svg',
    '/components/pump.svg',
    '/components/fan.svg',
    '/components/valve.svg',
    '/components/sensor.svg',
    '/components/display.svg',
    '/components/battery.svg',
    '/components/transformer.svg'
];

// Dynamic cache for user-generated content
const DYNAMIC_CACHE = 'digital-twin-dynamic-v1.0.0';
const USER_DATA_CACHE = 'digital-twin-userdata-v1.0.0';

// Install event - cache core assets
self.addEventListener('install', event => {
    console.log('🔧 Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 Service Worker: Caching core assets...');
                return cache.addAll(CORE_ASSETS);
            })
            .then(() => {
                console.log('✅ Service Worker: Core assets cached successfully');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('❌ Service Worker: Failed to cache assets:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('🚀 Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== CACHE_NAME && 
                            cacheName !== DYNAMIC_CACHE && 
                            cacheName !== USER_DATA_CACHE) {
                            console.log('🗑️ Service Worker: Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('✅ Service Worker: Activated successfully');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Filter out unsupported URL schemes
    if (url.protocol === 'chrome-extension:' || 
        url.protocol === 'moz-extension:' || 
        url.protocol === 'safari-extension:' ||
        url.protocol === 'ms-browser-extension:') {
        return;
    }
    
    // Only handle requests from our origin
    if (url.origin !== self.location.origin) {
        return;
    }
    
    // Only handle GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Handle different types of requests
    if (isCoreAsset(url.pathname)) {
        // Core assets - cache first strategy
        event.respondWith(cacheFirstStrategy(request));
    } else if (isAPIRequest(url.pathname)) {
        // API requests - network first strategy
        event.respondWith(networkFirstStrategy(request));
    } else if (isUserData(url.pathname)) {
        // User data - stale while revalidate
        event.respondWith(staleWhileRevalidateStrategy(request));
    } else {
        // Everything else - network first with cache fallback
        event.respondWith(networkFirstStrategy(request));
    }
});

// Cache first strategy for core assets
async function cacheFirstStrategy(request) {
    try {
        // Filter out unsupported URL schemes
        const url = new URL(request.url);
        if (url.protocol === 'chrome-extension:' || 
            url.protocol === 'moz-extension:' || 
            url.protocol === 'safari-extension:' ||
            url.protocol === 'ms-browser-extension:') {
            return fetch(request); // Just fetch, don't cache
        }
        
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            try {
                cache.put(request, networkResponse.clone());
            } catch (cacheError) {
                console.warn('Cache put failed:', cacheError.message);
                // Continue without caching
            }
        }
        return networkResponse;
    } catch (error) {
        console.error('Cache first strategy failed:', error);
        return new Response('Offline - Asset not available', { 
            status: 503, 
            statusText: 'Service Unavailable' 
        });
    }
}

// Network first strategy for dynamic content
async function networkFirstStrategy(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
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
            return caches.match('/index.html');
        }
        
        return new Response('Offline - Content not available', { 
            status: 503, 
            statusText: 'Service Unavailable' 
        });
    }
}

// Stale while revalidate strategy for user data
async function staleWhileRevalidateStrategy(request) {
    const cachedResponse = await caches.match(request);
    
    const networkResponsePromise = fetch(request)
        .then(networkResponse => {
            if (networkResponse.ok) {
                const cache = caches.open(USER_DATA_CACHE);
                cache.then(c => c.put(request, networkResponse.clone()));
            }
            return networkResponse;
        })
        .catch(() => null);
    
    return cachedResponse || networkResponsePromise;
}

// Helper functions
function isCoreAsset(pathname) {
    return CORE_ASSETS.some(asset => {
        return pathname === asset || pathname.startsWith(asset);
    });
}

function isAPIRequest(pathname) {
    return pathname.startsWith('/api/');
}

function isUserData(pathname) {
    return pathname.startsWith('/user-data/') || 
           pathname.startsWith('/projects/') ||
           pathname.includes('metadata') ||
           pathname.includes('user-config');
}

// Push notification handling
self.addEventListener('push', event => {
    console.log('📬 Service Worker: Push notification received');
    
    let notificationData = {
        title: 'Digital Twin IDE',
        body: 'New notification',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        data: {}
    };
    
    if (event.data) {
        try {
            const data = event.data.json();
            notificationData = { ...notificationData, ...data };
        } catch (error) {
            console.error('Failed to parse push notification data:', error);
        }
    }
    
    event.waitUntil(
        self.registration.showNotification(notificationData.title, {
            body: notificationData.body,
            icon: notificationData.icon,
            badge: notificationData.badge,
            data: notificationData.data,
            actions: [
                {
                    action: 'open',
                    title: 'Open App'
                },
                {
                    action: 'dismiss',
                    title: 'Dismiss'
                }
            ]
        })
    );
});

// Notification click handling
self.addEventListener('notificationclick', event => {
    console.log('🔔 Service Worker: Notification clicked');
    
    event.notification.close();
    
    if (event.action === 'open' || !event.action) {
        event.waitUntil(
            clients.openWindow('/').then(client => {
                if (client && client.focus) {
                    client.focus();
                }
            })
        );
    }
});

// Background sync for offline actions
self.addEventListener('sync', event => {
    console.log('🔄 Service Worker: Background sync triggered');
    
    if (event.tag === 'background-sync-projects') {
        event.waitUntil(syncProjects());
    }
});

// Sync user projects when online
async function syncProjects() {
    try {
        console.log('🔄 Syncing projects...');
        
        // Get pending sync data from IndexedDB
        const pendingData = await getPendingSyncData();
        
        for (const data of pendingData) {
            try {
                await fetch('/api/sync', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                
                // Remove from pending sync after successful upload
                await removePendingSyncData(data.id);
            } catch (error) {
                console.error('Failed to sync data:', error);
            }
        }
        
        console.log('✅ Project sync completed');
    } catch (error) {
        console.error('Background sync failed:', error);
    }
}

// IndexedDB helpers (simplified)
async function getPendingSyncData() {
    // Placeholder - would implement IndexedDB operations
    return [];
}

async function removePendingSyncData(id) {
    // Placeholder - would implement IndexedDB operations
    console.log('Removed pending sync data:', id);
}

// Version info and diagnostics
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({
            version: CACHE_VERSION,
            cacheName: CACHE_NAME,
            assets: CORE_ASSETS.length
        });
    }
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

console.log(`🚀 Digital Twin PWA Service Worker v${CACHE_VERSION} loaded`);
console.log(`📦 Caching ${CORE_ASSETS.length} core assets`);
console.log('✅ Offline support enabled');
console.log('📬 Push notifications ready');
console.log('🔄 Background sync configured');