/**
 * PWA Configuration
 * Loads environment variables for PWA features
 */

// Default configuration (will be overridden by environment variables)
const config = {
    // Generated VAPID keys for push notifications
    vapidPublicKey: process.env.VAPID_PUBLIC_KEY || 'BF_gMSomRFiLtQbJKDxEefNWqD0Y_zNOUbYc4dKmYZUtD1v185QrNiDk7Bzg72AI2eBlKM0QLmHy-8vBYEs9ydA',
    vapidPrivateKey: process.env.VAPID_PRIVATE_KEY || '3yCmFZINJY9Y7ayh3OrQDXMXPZR3sHwF1b6PBvrXjGo',
    vapidEmail: process.env.VAPID_MAILTO || 'admin@digitaltwin-run.local',
    enablePushNotifications: process.env.ENABLE_PUSH_NOTIFICATIONS !== 'false',
    enableServiceWorker: process.env.ENABLE_SERVICE_WORKER !== 'false',
    enableOffline: process.env.ENABLE_OFFLINE !== 'false',
    enableBackgroundSync: process.env.ENABLE_BACKGROUND_SYNC !== 'false'
};

// Log configuration in development
if (process.env.NODE_ENV !== 'production') {
    console.log('🔧 PWA Configuration:', {
        ...config,
        vapidPrivateKey: config.vapidPrivateKey ? '*** (hidden) ***' : 'not set'
    });
}

export default config;
