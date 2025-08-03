/**
 * PWA Configuration
 * Loads environment variables for PWA features
 */

// Check if we're in development mode
const isDevelopment = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// Browser-compatible configuration (hardcoded values)
const config = {
    // Generated VAPID keys for push notifications (browser-safe)
    vapidPublicKey: 'BCYXjHfZ_qV8YPYqQhKBUJx8hSmXyUIgK3z7Q4F3yZd1PJTX2_bKU7F9MRKX2-rCd3wE4a_VVN5_Y7LFd8g7wqY',
    vapidPrivateKey: 'O_KOhZ8gV3yJlKlRJR4pV1kKGF7iFGNYpY5KQW2YXVQ',
    vapidEmail: 'admin@digitaltwin-run.local',
    enablePushNotifications: false, // Temporarily disabled - VAPID key issues
    enableServiceWorker: !isDevelopment, // Disable in development to prevent caching
    enableOffline: !isDevelopment, // Disable offline mode in development
    enableBackgroundSync: !isDevelopment // Disable background sync in development
};

// Log configuration in development (browser-compatible)
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    console.log('🔧 PWA Configuration:', {
        ...config,
        vapidPrivateKey: config.vapidPrivateKey ? '*** (hidden) ***' : 'not set'
    });
}

export default config;
