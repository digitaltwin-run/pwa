// Digital Twin IDE - Language Detector Module
// Handles language detection and translation file loading

export class LanguageDetector {
    constructor() {
        // Supported languages configuration
        this.supportedLanguages = {
            'en': { name: 'English', nativeName: 'English', flag: '🇺🇸' },
            'pl': { name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
            'de': { name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
            'fr': { name: 'French', nativeName: 'Français', flag: '🇫🇷' },
            'es': { name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
            'it': { name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
            'ru': { name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
            'zh': { name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
            'ja': { name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' }
        };

        this.defaultLanguage = 'en';
        this.fallbackChain = ['en', 'pl'];
        
        console.log('[LanguageDetector] Initialized with', Object.keys(this.supportedLanguages).length, 'supported languages');
    }

    /**
     * Detect user's preferred language using multiple strategies
     * @returns {string} Detected language code
     */
    detectLanguage() {
        console.log('[LanguageDetector] Starting language detection...');

        // Strategy 1: Check URL parameter
        const urlLang = this.detectFromURL();
        if (urlLang) {
            console.log('[LanguageDetector] Language from URL:', urlLang);
            return urlLang;
        }

        // Strategy 2: Check localStorage
        const storedLang = this.detectFromStorage();
        if (storedLang) {
            console.log('[LanguageDetector] Language from storage:', storedLang);
            return storedLang;
        }

        // Strategy 3: Check browser language
        const browserLang = this.detectFromBrowser();
        if (browserLang) {
            console.log('[LanguageDetector] Language from browser:', browserLang);
            return browserLang;
        }

        // Strategy 4: Fallback to default
        console.log('[LanguageDetector] Using default language:', this.defaultLanguage);
        return this.defaultLanguage;
    }

    /**
     * Detect language from URL parameters
     * @returns {string|null} Language code or null
     */
    detectFromURL() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const urlLang = urlParams.get('lang');
            
            if (urlLang && this.isLanguageSupported(urlLang)) {
                return urlLang;
            }
        } catch (error) {
            console.warn('[LanguageDetector] Error reading URL params:', error);
        }
        return null;
    }

    /**
     * Detect language from localStorage
     * @returns {string|null} Language code or null
     */
    detectFromStorage() {
        try {
            const storedLang = localStorage.getItem('preferred-language');
            
            if (storedLang && this.isLanguageSupported(storedLang)) {
                return storedLang;
            }
        } catch (error) {
            console.warn('[LanguageDetector] Error reading localStorage:', error);
        }
        return null;
    }

    /**
     * Detect language from browser settings
     * @returns {string|null} Language code or null
     */
    detectFromBrowser() {
        try {
            // Check primary browser language
            const browserLang = navigator.language.split('-')[0];
            if (this.isLanguageSupported(browserLang)) {
                return browserLang;
            }

            // Check all browser languages
            for (const lang of navigator.languages) {
                const langCode = lang.split('-')[0];
                if (this.isLanguageSupported(langCode)) {
                    return langCode;
                }
            }
        } catch (error) {
            console.warn('[LanguageDetector] Error reading browser language:', error);
        }
        return null;
    }

    /**
     * Check if a language is supported
     * @param {string} langCode - Language code to check
     * @returns {boolean} Whether language is supported
     */
    isLanguageSupported(langCode) {
        return !!this.supportedLanguages[langCode];
    }

    /**
     * Get supported languages configuration
     * @returns {Object} Supported languages object
     */
    getSupportedLanguages() {
        return this.supportedLanguages;
    }

    /**
     * Get default language
     * @returns {string} Default language code
     */
    getDefaultLanguage() {
        return this.defaultLanguage;
    }

    /**
     * Get fallback chain
     * @returns {Array} Fallback language chain
     */
    getFallbackChain() {
        return this.fallbackChain;
    }

    /**
     * Save language preference to localStorage
     * @param {string} langCode - Language code to save
     */
    saveLanguagePreference(langCode) {
        try {
            if (this.isLanguageSupported(langCode)) {
                localStorage.setItem('preferred-language', langCode);
                console.log('[LanguageDetector] Saved language preference:', langCode);
            }
        } catch (error) {
            console.warn('[LanguageDetector] Error saving language preference:', error);
        }
    }

    /**
     * Load translation file from server
     * @param {string} langCode - Language code to load
     * @returns {Promise<Object|null>} Translation data or null
     */
    async loadTranslationsFromFile(langCode) {
        if (!this.isLanguageSupported(langCode)) {
            console.warn('[LanguageDetector] Unsupported language:', langCode);
            return null;
        }

        try {
            console.log(`[LanguageDetector] Loading translations from file: ${langCode}`);
            
            const response = await fetch(`./i18n/${langCode}.json`);
            
            if (!response.ok) {
                console.warn(`[LanguageDetector] Translation file not found: ${langCode}.json`);
                return null;
            }

            const translations = await response.json();
            console.log(`[LanguageDetector] Successfully loaded ${Object.keys(translations).length} translations for ${langCode}`);
            
            return translations;
        } catch (error) {
            console.warn(`[LanguageDetector] Error loading translation file for ${langCode}:`, error);
            return null;
        }
    }

    /**
     * Get language information
     * @param {string} langCode - Language code
     * @returns {Object|null} Language information object
     */
    getLanguageInfo(langCode) {
        return this.supportedLanguages[langCode] || null;
    }

    /**
     * Get locale string for Intl APIs
     * @param {string} langCode - Language code
     * @returns {string} Locale string
     */
    getLocaleString(langCode) {
        const localeMap = {
            'en': 'en-US',
            'pl': 'pl-PL',
            'de': 'de-DE',
            'fr': 'fr-FR',
            'es': 'es-ES',
            'it': 'it-IT',
            'ru': 'ru-RU',
            'zh': 'zh-CN',
            'ja': 'ja-JP'
        };

        return localeMap[langCode] || 'en-US';
    }

    /**
     * Check if language file exists
     * @param {string} langCode - Language code to check
     * @returns {Promise<boolean>} Whether file exists
     */
    async checkLanguageFileExists(langCode) {
        try {
            const response = await fetch(`./i18n/${langCode}.json`, { method: 'HEAD' });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get available language files
     * @returns {Promise<Array>} Array of available language codes
     */
    async getAvailableLanguageFiles() {
        const available = [];
        
        for (const langCode of Object.keys(this.supportedLanguages)) {
            if (await this.checkLanguageFileExists(langCode)) {
                available.push(langCode);
            }
        }
        
        return available;
    }

    /**
     * Validate language code format
     * @param {string} langCode - Language code to validate
     * @returns {boolean} Whether format is valid
     */
    isValidLanguageCode(langCode) {
        return typeof langCode === 'string' && 
               langCode.length >= 2 && 
               langCode.length <= 3 && 
               /^[a-z]+$/.test(langCode);
    }
}
