/**
 * 🔔 PWA Manager - Push Notifications & Offline Storage
 * Handles PWA features: notifications, offline storage, background sync
 */

// Import configuration
import pwaConfig from '../config/pwa-config.js';

class PWAManager {
    constructor() {
        this.registration = null;
        this.isSupported = 'serviceWorker' in navigator;
        this.isInstalled = false;
        this.isUpdateAvailable = false;
        this.config = null;
        this.configManager = null;
        
        // Will be initialized after config is loaded
        this.initPromise = this._initWithConfig();
    }
    
    async _initWithConfig() {
        try {
            // Import config manager dynamically
            const { configManager } = await import('./config-manager.js');
            this.configManager = configManager;
            
            // Load configuration
            this.config = await configManager.loadConfig();
            
            if (this.isSupported && this.configManager.shouldEnableServiceWorker()) {
                await this.init();
            } else {
                if (!this.isSupported) {
                    console.warn('⚠️ Service Workers not supported');
                } else {
                    this.configManager.debugLog('pwa', 'PWA/Service Worker disabled by configuration');
                }
            }
        } catch (error) {
            console.error('❌ PWA Manager initialization failed:', error);
        }
    }

    async init() {
        if (!this.isSupported) {
            console.warn('❌ Service Worker not supported');
            return;
        }

        try {
            // Only register Service Worker if enabled in config
            if (pwaConfig.enableServiceWorker) {
                console.log('🔧 Service Worker enabled in config');
                await this.registerServiceWorker();
            } else {
                console.log('ℹ️ Service Worker disabled in config - skipping registration');
            }
            
            // Only initialize push notifications if enabled in config
            if (pwaConfig.enablePushNotifications) {
                console.log('🔔 Push notifications enabled in config');
                await this.initPushNotifications();
            } else {
                console.log('ℹ️ Push notifications disabled in config - skipping initialization');
            }
            
            this.setupOfflineHandling();
            this.setupBackgroundSync();
        } catch (error) {
            console.error('❌ PWA Manager initialization failed:', error);
        }
    }

    // Service Worker Registration
    async registerServiceWorker() {
        // Use configuration to determine if service worker should be enabled
        if (!this.configManager.shouldEnableServiceWorker()) {
            this.configManager.debugLog('serviceWorker', 'Service Worker registration skipped by configuration');
            
            // Unregister any existing service workers if disabled
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (let registration of registrations) {
                    this.configManager.debugLog('serviceWorker', 'Unregistering existing service worker:', registration.scope);
                    await registration.unregister();
                }
            }
            return;
        }
        
        try {
            const swConfig = {
                scope: '/'
            };
            
            this.registration = await navigator.serviceWorker.register('/sw.js', swConfig);
            this.configManager.debugLog('serviceWorker', 'Service Worker registered:', this.registration.scope);

            // Handle service worker updates
            this.registration.addEventListener('updatefound', () => {
                const newWorker = this.registration.installing;
                console.log('🔄 New Service Worker installing...');
                
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // New version available
                        this.showUpdateNotification();
                    }
                });
            });

            // Listen for messages from service worker
            navigator.serviceWorker.addEventListener('message', event => {
                this.handleServiceWorkerMessage(event);
            });

        } catch (error) {
            console.error('❌ Service Worker registration failed:', error);
        }
    }

    // Push Notifications Setup
    async initPushNotifications() {
        if (!this.pushSupported || !this.notificationSupported) {
            console.warn('❌ Push notifications not supported');
            return;
        }

        try {
            // Check current permission
            const permission = await Notification.requestPermission();
            console.log('🔔 Notification permission:', permission);

            if (permission === 'granted' && this.registration) {
                await this.subscribeToPush();
            }
        } catch (error) {
            console.error('❌ Push notification setup failed:', error);
        }
    }

    // Subscribe to push notifications
    async subscribeToPush() {
        if (!pwaConfig.enablePushNotifications) {
            console.log('ℹ️ Push notifications are disabled in configuration');
            return;
        }

        try {
            if (!pwaConfig.vapidPublicKey) {
                throw new Error('VAPID public key is not configured');
            }
            
            console.log('🔑 Using VAPID public key:', pwaConfig.vapidPublicKey.substring(0, 20) + '...');
            
            const applicationServerKey = this.urlBase64ToUint8Array(pwaConfig.vapidPublicKey);
            
            // Check for existing subscription first
            this.pushSubscription = await this.registration.pushManager.getSubscription();
            
            if (!this.pushSubscription) {
                console.log('🔄 Creating new push subscription...');
                this.pushSubscription = await this.registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: applicationServerKey
                });
                console.log('✅ Push subscription created:', this.pushSubscription.endpoint);
                
                // Send subscription to server
                await this.sendSubscriptionToServer(this.pushSubscription);
            } else {
                console.log('ℹ️ Using existing push subscription:', this.pushSubscription.endpoint);
            }
            
        } catch (error) {
            console.error('❌ Push subscription failed:', error);
            
            // If the error is due to an invalid key, provide helpful message
            if (error.name === 'InvalidAccessError' && error.message.includes('applicationServerKey')) {
                console.error('⚠️ Invalid VAPID public key. Please generate a new key pair.');
                console.log('💡 Run: node scripts/generate-vapid-keys.js');
            }
            
            // Disable push notifications to prevent repeated errors
            pwaConfig.enablePushNotifications = false;
        }
    }

    // Send subscription to server
    async sendSubscriptionToServer(subscription) {
        const subscriptionData = {
            endpoint: subscription.endpoint,
            keys: {
                p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')),
                auth: this.arrayBufferToBase64(subscription.getKey('auth'))
            }
        };

        console.log('📤 Subscription data prepared:', subscriptionData);
        
        // In real app, send to your push server
        // await fetch('/api/push/subscribe', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(subscriptionData)
        // });
    }

    // Show local notification
    async showNotification(title, options = {}) {
        if (!this.notificationSupported) {
            console.warn('❌ Notifications not supported');
            return;
        }

        const defaultOptions = {
            body: 'Digital Twin IDE notification',
            icon: '/manifest.json',
            badge: '/manifest.json',
            tag: 'digital-twin-notification',
            requireInteraction: false,
            silent: false,
            data: {
                timestamp: Date.now(),
                source: 'pwa-manager'
            }
        };

        const notificationOptions = { ...defaultOptions, ...options };

        try {
            if (this.registration) {
                await this.registration.showNotification(title, notificationOptions);
            } else {
                new Notification(title, notificationOptions);
            }
            console.log('✅ Notification shown:', title);
        } catch (error) {
            console.error('❌ Failed to show notification:', error);
        }
    }

    // Offline Handling
    setupOfflineHandling() {
        window.addEventListener('online', () => {
            console.log('🌐 Back online!');
            this.showNotification('Connection Restored', {
                body: 'You are back online. Syncing data...',
                icon: '✅'
            });
            this.syncOfflineData();
        });

        window.addEventListener('offline', () => {
            console.log('📴 Gone offline!');
            this.showNotification('Working Offline', {
                body: 'No internet connection. Changes will sync when online.',
                icon: '📴'
            });
        });

        // Check initial status
        if (!navigator.onLine) {
            console.log('📴 Currently offline');
        }
    }

    // Background Sync Setup
    setupBackgroundSync() {
        if (!('serviceWorker' in navigator) || !('sync' in window.ServiceWorkerRegistration.prototype)) {
            console.warn('❌ Background sync not supported');
            return;
        }

        console.log('✅ Background sync available');
    }

    // Queue data for background sync
    async queueBackgroundSync(data, tag = 'background-sync-projects') {
        try {
            // Store data in IndexedDB for sync later
            await this.storeOfflineData(data);
            
            if (this.registration && 'sync' in this.registration) {
                await this.registration.sync.register(tag);
                console.log('✅ Background sync queued:', tag);
            }
        } catch (error) {
            console.error('❌ Failed to queue background sync:', error);
        }
    }

    // Offline Storage (simplified IndexedDB wrapper)
    async storeOfflineData(data) {
        const key = `offline-data-${Date.now()}`;
        try {
            localStorage.setItem(key, JSON.stringify({
                ...data,
                timestamp: Date.now(),
                synced: false
            }));
            console.log('💾 Data stored offline:', key);
        } catch (error) {
            console.error('❌ Failed to store offline data:', error);
        }
    }

    // Sync offline data when back online
    async syncOfflineData() {
        try {
            const offlineData = this.getOfflineData();
            console.log(`🔄 Syncing ${offlineData.length} offline items...`);

            for (const item of offlineData) {
                try {
                    // In real app, sync with server
                    console.log('📤 Syncing item:', item.key);
                    
                    // Mark as synced
                    localStorage.removeItem(item.key);
                } catch (error) {
                    console.error('❌ Failed to sync item:', error);
                }
            }

            if (offlineData.length > 0) {
                this.showNotification('Sync Complete', {
                    body: `${offlineData.length} items synced successfully`,
                    icon: '✅'
                });
            }
        } catch (error) {
            console.error('❌ Offline data sync failed:', error);
        }
    }

    // Get offline data from localStorage
    getOfflineData() {
        const offlineData = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('offline-data-')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (!data.synced) {
                        offlineData.push({ key, data });
                    }
                } catch (error) {
                    console.error('❌ Failed to parse offline data:', error);
                }
            }
        }
        return offlineData;
    }

    // Handle service worker messages
    handleServiceWorkerMessage(event) {
        const { type, data } = event.data || {};
        
        switch (type) {
            case 'VERSION_INFO':
                console.log('📊 Service Worker version:', data);
                break;
            case 'CACHE_UPDATED':
                console.log('💾 Cache updated:', data);
                break;
            case 'SYNC_COMPLETE':
                console.log('🔄 Background sync complete:', data);
                break;
            default:
                console.log('📨 Service Worker message:', event.data);
        }
    }

    // Show update notification when new version available
    showUpdateNotification() {
        this.showNotification('Update Available', {
            body: 'A new version is available. Click to update.',
            requireInteraction: true,
            actions: [
                {
                    action: 'update',
                    title: 'Update Now'
                },
                {
                    action: 'dismiss',
                    title: 'Later'
                }
            ],
            data: {
                type: 'app-update'
            }
        });
    }

    // Utility functions
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }

    // Public API methods
    async requestNotificationPermission() {
        if (!this.notificationSupported) return false;
        
        const permission = await Notification.requestPermission();
        console.log('🔔 Notification permission requested:', permission);
        
        if (permission === 'granted' && !this.pushSubscription) {
            await this.subscribeToPush();
        }
        
        return permission === 'granted';
    }

    async testNotification() {
        await this.showNotification('Test Notification', {
            body: 'This is a test notification from Digital Twin IDE',
            icon: '🧪',
            requireInteraction: true
        });
    }

    getStatus() {
        return {
            serviceWorkerSupported: this.isSupported,
            pushSupported: this.pushSupported,
            notificationSupported: this.notificationSupported,
            registered: !!this.registration,
            pushSubscribed: !!this.pushSubscription,
            online: navigator.onLine,
            offlineDataCount: this.getOfflineData().length
        };
    }
}

// Global PWA Manager instance
window.pwaManager = new PWAManager();

// Export for module usage
export { PWAManager };
export default PWAManager;

console.log('🔔 PWA Manager loaded!');
console.log('📋 Available PWA commands:');
console.log('  pwaManager.requestNotificationPermission() - Request notification permission');
console.log('  pwaManager.testNotification() - Send test notification');
console.log('  pwaManager.getStatus() - Get PWA status info');
console.log('  pwaManager.queueBackgroundSync(data) - Queue data for background sync');
