/**
 * i18n Utility Functions
 * Provides safe access to translation functions with fallbacks
 */

/**
 * Get a translated string with fallback handling
 * @param {string} key - Translation key (e.g., 'app.title')
 * @param {Object} [params] - Parameters for the translation
 * @param {string} [defaultValue] - Default value if translation is not found
 * @returns {string} Translated string or fallback
 */
export function t(key, params = {}, defaultValue = '') {
    if (!key) return defaultValue || '';
    
    try {
        // Try to use the global i18n manager if available
        if (window.i18nManager && typeof window.i18nManager.t === 'function') {
            const result = window.i18nManager.t(key, params);
            if (result && result !== key) {
                return result;
            }
        }
        
        // Fallback to window.t if available
        if (window.t && typeof window.t === 'function') {
            const result = window.t(key, params);
            if (result && result !== key) {
                return result;
            }
        }
        
        // If we have a default value, use it
        if (defaultValue) {
            return typeof defaultValue === 'function' ? defaultValue() : defaultValue;
        }
        
        // As a last resort, return the key in a way that's visible but indicates it needs translation
        return `[${key}]`;
    } catch (error) {
        console.warn(`[i18n] Error translating key "${key}":`, error);
        return defaultValue || key;
    }
}

/**
 * Initialize i18n with default values
 * This ensures that even if i18n fails to load, the app remains functional
 */
export function initI18nFallback() {
    // Ensure window.t exists as a fallback
    if (typeof window.t !== 'function') {
        window.t = (key, params = {}) => {
            // Simple parameter replacement for fallback
            if (Object.keys(params).length > 0) {
                return `${key} ${JSON.stringify(params)}`;
            }
            return key;
        };
    }
    
    // Ensure i18nManager has a minimal implementation
    if (!window.i18nManager) {
        window.i18nManager = {
            t: window.t,
            isInitialized: false,
            currentLanguage: 'en',
            defaultLanguage: 'en',
            init: () => Promise.resolve(false)
        };
    }
}

/**
 * Format a translation with variables
 * @param {string} template - String with {{variables}}
 * @param {Object} params - Key-value pairs for replacement
 * @returns {string} Formatted string
 */
export function formatTranslation(template, params = {}) {
    if (!template) return '';
    if (typeof template !== 'string') return String(template);
    
    return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
        return key in params ? params[key] : match;
    });
}

// Initialize fallback immediately when this module loads
initI18nFallback();
