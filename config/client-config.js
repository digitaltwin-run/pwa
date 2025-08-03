/**
 * Client-side Configuration
 * This file is served to the client and contains runtime configuration
 */

// VAPID Public Key for push notifications
const VAPID_PUBLIC_KEY = 'BF_gMSomRFiLtQbJKDxEefNWqD0Y_zNOUbYc4dKmYZUtD1v185QrNiDk7Bzg72AI2eBlKM0QLmHy-8vBYEs9ydA';

// Feature flags
const CONFIG = {
    // PWA Features
    ENABLE_PUSH_NOTIFICATIONS: true,
    ENABLE_OFFLINE: true,
    
    // API Endpoints
    API_BASE_URL: window.location.hostname === 'localhost' ? 'http://localhost:3000' : '/api',
    
    // VAPID Configuration
    VAPID_PUBLIC_KEY: VAPID_PUBLIC_KEY,
    VAPID_EMAIL: 'admin@digitaltwin-run.local'
};

// Make config available globally
window.APP_CONFIG = CONFIG;

// Log the config in development
if (process.env.NODE_ENV !== 'production') {
    console.log('🔧 Client configuration loaded:', CONFIG);
}

export default CONFIG;
