/**
 * 🔧 Configuration Manager
 * Manages application configuration loaded from server API
 */

class ConfigManager {
    constructor() {
        this.config = null;
        this.loaded = false;
        this.loadPromise = null;
    }

    /**
     * Load configuration from server API
     * @returns {Promise<Object>} Configuration object
     */
    async loadConfig() {
        if (this.loadPromise) {
            return this.loadPromise;
        }

        this.loadPromise = this._fetchConfig();
        return this.loadPromise;
    }

    async _fetchConfig() {
        try {
            const response = await fetch('/api/config');
            if (!response.ok) {
                throw new Error(`Config API responded with ${response.status}`);
            }
            
            this.config = await response.json();
            this.loaded = true;
            
            if (this.config.debug.console) {
                console.log('🔧 Configuration loaded:', this.config);
            }
            
            return this.config;
        } catch (error) {
            console.error('❌ Failed to load configuration:', error);
            
            // Fallback to default configuration
            this.config = this._getDefaultConfig();
            this.loaded = true;
            
            console.warn('⚠️ Using fallback configuration:', this.config);
            return this.config;
        }
    }

    /**
     * Get current configuration
     * @returns {Object|null} Current configuration or null if not loaded
     */
    getConfig() {
        return this.config;
    }

    /**
     * Check if configuration is loaded
     * @returns {boolean} True if config is loaded
     */
    isLoaded() {
        return this.loaded;
    }

    /**
     * Get a specific config value with dot notation
     * @param {string} path - Config path like 'serviceWorker.enabled'
     * @param {*} defaultValue - Default value if path not found
     * @returns {*} Config value or default
     */
    get(path, defaultValue = null) {
        if (!this.config) {
            return defaultValue;
        }

        const keys = path.split('.');
        let value = this.config;

        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return defaultValue;
            }
        }

        return value;
    }

    /**
     * Check if development mode should be used
     * @returns {boolean} True if in development mode
     */
    isDevelopmentMode() {
        const config = this.getConfig();
        if (!config) return true; // Safe default

        // Check for override
        if (config.overrides.forceProductionMode) {
            return false;
        }
        
        if (config.overrides.disableDevModeCheck) {
            return false;
        }

        // Default hostname-based detection
        const isLocalhost = window.location.hostname === 'localhost' ||
                          window.location.hostname === '[::1]' ||
                          window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/) ||
                          window.location.hostname === '127.0.0.1';
        
        return isLocalhost || config.environment === 'development';
    }

    /**
     * Check if service worker should be enabled
     * @returns {boolean} True if service worker should be enabled
     */
    shouldEnableServiceWorker() {
        const config = this.getConfig();
        if (!config) return false; // Safe default

        // If explicitly disabled
        if (!config.serviceWorker.enabled) {
            return false;
        }

        // If PWA is disabled
        if (!config.pwa.enabled) {
            return false;
        }

        // Check development mode override
        if (this.isDevelopmentMode() && !config.serviceWorker.devMode) {
            return false;
        }

        return true;
    }

    /**
     * Get debug settings for a specific area
     * @param {string} area - Debug area (serviceWorker, pwa, cache, etc.)
     * @returns {boolean} True if debug is enabled for this area
     */
    isDebugEnabled(area = 'console') {
        return this.get(`debug.${area}`, false);
    }

    /**
     * Log a debug message if debug is enabled for the area
     * @param {string} area - Debug area
     * @param {string} message - Message to log
     * @param {...any} args - Additional arguments to log
     */
    debugLog(area, message, ...args) {
        if (this.isDebugEnabled(area) || this.isDebugEnabled('console')) {
            console.log(`[${area.toUpperCase()}] ${message}`, ...args);
        }
    }

    /**
     * Default fallback configuration
     * @returns {Object} Default configuration
     */
    _getDefaultConfig() {
        return {
            environment: 'development',
            debugMode: true,
            pwa: {
                enabled: true,
                offlineSupport: true,
                pushNotifications: false
            },
            serviceWorker: {
                enabled: true,
                autoRegister: true,
                skipWaiting: true,
                updateCheck: true,
                devMode: false
            },
            debug: {
                serviceWorker: true,
                pwa: true,
                cache: true,
                offline: true,
                console: true
            },
            overrides: {
                forceProductionMode: false,
                disableDevModeCheck: false
            }
        };
    }
}

// Create global instance
const configManager = new ConfigManager();

// Export both class and instance
export { ConfigManager, configManager };
export default configManager;
