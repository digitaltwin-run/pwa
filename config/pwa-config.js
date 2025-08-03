/**
 * PWA Configuration
 * Loads environment variables for PWA features
 */

// Browser-compatible configuration (hardcoded values)
const config = {
    // Generated VAPID keys for push notifications (browser-safe)
    vapidPublicKey: 'BF_gMSomRFiLtQbJKDxEefNWqD0Y_zNOUbYc4dKmYZUtD1v185QrNiDk7Bzg72AI2eBlKM0QLmHy-8vBYEs9ydA',
    vapidPrivateKey: '3yCmFZINJY9Y7ayh3OrQDXMXPZR3sHwF1b6PBvrXjGo',
    vapidEmail: 'admin@digitaltwin-run.local',
    enablePushNotifications: true, // Enable by default
    enableServiceWorker: true,
    enableOffline: true,
    enableBackgroundSync: true
};

// Log configuration in development (browser-compatible)
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    console.log('🔧 PWA Configuration:', {
        ...config,
        vapidPrivateKey: config.vapidPrivateKey ? '*** (hidden) ***' : 'not set'
    });
}

export default config;
