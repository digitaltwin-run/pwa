// Digital Twin IDE - I18n Manager (Refactored)
// Main coordinator for modular internationalization system

import { LanguageDetector } from './i18n/language-detector.js';
import { TranslationManager } from './i18n/translation-manager.js';
import { UIFormatter } from './i18n/ui-formatter.js';

export class I18nManager {
    constructor() {
        console.log('[I18nManager] Initializing refactored i18n manager...');
        
        // Initialize core modules
        this.languageDetector = new LanguageDetector();
        this.translationManager = new TranslationManager();
        this.uiFormatter = new UIFormatter(this.translationManager, this.languageDetector);
        
        // Set initial state
        this.currentLanguage = 'en';
        this.defaultLanguage = 'en';
        
        console.log('[I18nManager] Refactored i18n manager initialized successfully');
        
        // Auto-initialize
        this.init();
    }

    /**
     * Initialize the i18n system
     */
    async init() {
        console.log('[I18nManager] Starting initialization...');
        
        // Detect user's preferred language
        this.currentLanguage = this.languageDetector.detectLanguage();
        console.log('🔍 Detected language:', this.currentLanguage);

        // Set UI formatter current language
        this.uiFormatter.setCurrentLanguage(this.currentLanguage);

        // Load initial translation data
        await this.loadLanguage(this.currentLanguage);
        await this.loadLanguage(this.defaultLanguage); // Always load fallback

        // Apply translations to current page
        this.uiFormatter.applyTranslations(this.currentLanguage);

        // Setup language switcher UI
        this.uiFormatter.setupLanguageSwitcher();

        // Setup automatic translation detection
        this.uiFormatter.setupAutoTranslation();

        console.log('✅ I18n Manager ready');
    }

    /**
     * Detect user's preferred language - delegates to language detector
     * @returns {string} Detected language code
     */
    detectLanguage() {
        return this.languageDetector.detectLanguage();
    }

    /**
     * Load translation data for a language
     * @param {string} langCode - Language code to load
     * @returns {Promise<boolean>} Whether loading was successful
     */
    async loadLanguage(langCode) {
        if (this.translationManager.isLanguageLoaded(langCode)) {
            return true; // Already loaded
        }

        try {
            console.log(`📥 Loading translations for: ${langCode}`);

            // Try to load from file first
            const translations = await this.languageDetector.loadTranslationsFromFile(langCode);
            if (translations) {
                this.translationManager.addTranslations(langCode, translations);
                console.log(`✅ Loaded ${Object.keys(translations).length} translations for ${langCode}`);
                return true;
            }

            // Fallback to embedded translations
            const embeddedTranslations = this.translationManager.getEmbeddedTranslations(langCode);
            if (embeddedTranslations) {
                this.translationManager.addTranslations(langCode, embeddedTranslations);
                console.log(`✅ Loaded embedded translations for ${langCode}`);
                return true;
            }

            console.warn(`❌ No translations found for ${langCode}`);
            return false;
        } catch (error) {
            console.error(`❌ Error loading translations for ${langCode}:`, error);
            return false;
        }
    }

    /**
     * Load translations from file - delegates to language detector
     * @param {string} langCode - Language code
     * @returns {Promise<Object|null>} Translation data or null
     */
    async loadTranslationsFromFile(langCode) {
        return this.languageDetector.loadTranslationsFromFile(langCode);
    }

    /**
     * Get embedded translations - delegates to translation manager
     * @param {string} langCode - Language code
     * @returns {Object|null} Embedded translations or null
     */
    getEmbeddedTranslations(langCode) {
        return this.translationManager.getEmbeddedTranslations(langCode);
    }

    /**
     * Get translated text - delegates to translation manager
     * @param {string} key - Translation key
     * @param {Object} params - Interpolation parameters
     * @returns {string} Translated text
     */
    t(key, params = {}) {
        return this.translationManager.getTranslation(key, this.currentLanguage, params);
    }

    /**
     * Get translation from specific language - delegates to translation manager
     * @param {string} key - Translation key
     * @param {string} langCode - Language code
     * @returns {string} Translated text
     */
    getTranslation(key, langCode) {
        return this.translationManager.getTranslation(key, langCode);
    }

    /**
     * Interpolate parameters in translation - delegates to translation manager
     * @param {string} text - Text with placeholders
     * @param {Object} params - Parameters to interpolate
     * @returns {string} Interpolated text
     */
    interpolate(text, params) {
        return this.translationManager.interpolate(text, params);
    }

    /**
     * Change language - delegates to UI formatter
     * @param {string} langCode - New language code
     */
    async changeLanguage(langCode) {
        this.currentLanguage = langCode;
        await this.uiFormatter.changeLanguage(langCode);
    }

    /**
     * Apply translations to current page - delegates to UI formatter
     */
    applyTranslations() {
        this.uiFormatter.applyTranslations(this.currentLanguage);
    }

    /**
     * Setup language switcher UI - delegates to UI formatter
     */
    setupLanguageSwitcher() {
        this.uiFormatter.setupLanguageSwitcher();
    }

    /**
     * Update language switcher - delegates to UI formatter
     */
    updateLanguageSwitcher() {
        this.uiFormatter.updateLanguageSwitcher();
    }

    /**
     * Setup automatic translation detection - delegates to UI formatter
     */
    setupAutoTranslation() {
        this.uiFormatter.setupAutoTranslation();
    }

    /**
     * Get current language
     * @returns {string} Current language code
     */
    getCurrentLanguage() {
        return this.currentLanguage;
    }

    /**
     * Get supported languages - delegates to language detector
     * @returns {Object} Supported languages
     */
    getSupportedLanguages() {
        return this.languageDetector.getSupportedLanguages();
    }

    /**
     * Check if language is loaded - delegates to translation manager
     * @param {string} langCode - Language code
     * @returns {boolean} Whether language is loaded
     */
    isLanguageLoaded(langCode) {
        return this.translationManager.isLanguageLoaded(langCode);
    }

    /**
     * Add custom translations - delegates to translation manager
     * @param {string} langCode - Language code
     * @param {Object} translations - Translation object
     */
    addTranslations(langCode, translations) {
        this.translationManager.addTranslations(langCode, translations);
        
        // Re-apply translations if it's the current language
        if (langCode === this.currentLanguage) {
            this.uiFormatter.applyTranslations(this.currentLanguage);
        }
    }

    /**
     * Format numbers according to locale - delegates to UI formatter
     * @param {number} number - Number to format
     * @param {Object} options - Formatting options
     * @returns {string} Formatted number
     */
    formatNumber(number, options = {}) {
        return this.uiFormatter.formatNumber(number, options);
    }

    /**
     * Format dates according to locale - delegates to UI formatter
     * @param {Date} date - Date to format
     * @param {Object} options - Formatting options
     * @returns {string} Formatted date
     */
    formatDate(date, options = {}) {
        return this.uiFormatter.formatDate(date, options);
    }

    /**
     * Format currency according to locale - delegates to UI formatter
     * @param {number} amount - Amount to format
     * @param {string} currency - Currency code
     * @param {Object} options - Formatting options
     * @returns {string} Formatted currency
     */
    formatCurrency(amount, currency = 'USD', options = {}) {
        return this.uiFormatter.formatCurrency(amount, currency, options);
    }

    /**
     * Format relative time - delegates to UI formatter
     * @param {Date} date - Date to format
     * @param {Object} options - Formatting options
     * @returns {string} Formatted relative time
     */
    formatRelativeTime(date, options = {}) {
        return this.uiFormatter.formatRelativeTime(date, options);
    }

    /**
     * Get locale string for Intl APIs - delegates to language detector
     * @returns {string} Locale string
     */
    getLocale() {
        return this.languageDetector.getLocaleString(this.currentLanguage);
    }

    /**
     * Search translations - delegates to translation manager
     * @param {string} pattern - Search pattern
     * @param {string} langCode - Language code to search in
     * @returns {Array} Search results
     */
    searchTranslations(pattern, langCode = this.currentLanguage) {
        return this.translationManager.searchTranslations(pattern, langCode);
    }

    /**
     * Get translation statistics - delegates to translation manager
     * @returns {Object} Translation statistics
     */
    getStatistics() {
        return this.translationManager.getStatistics();
    }

    /**
     * Get all translations for a language - delegates to translation manager
     * @param {string} langCode - Language code
     * @returns {Object|null} All translations or null
     */
    getAllTranslations(langCode) {
        return this.translationManager.getAllTranslations(langCode);
    }

    /**
     * Create translation function for current language
     * @returns {Function} Translation function
     */
    createTranslationFunction() {
        return this.uiFormatter.createTranslationFunction();
    }

    /**
     * Cleanup method - delegates to all modules
     */
    cleanup() {
        console.log('[I18nManager] Starting cleanup...');
        
        this.uiFormatter.cleanup();
        this.translationManager.clearAll();
        
        console.log('[I18nManager] Cleanup completed');
    }

    // Legacy properties for backward compatibility
    get translations() {
        return this.translationManager.translations;
    }

    get loadedLanguages() {
        return this.translationManager.loadedLanguages;
    }

    get supportedLanguages() {
        return this.languageDetector.getSupportedLanguages();
    }

    get fallbackChain() {
        return this.languageDetector.getFallbackChain();
    }
}

// Global i18n manager instance
window.i18nManager = new I18nManager();

// Global translation function for convenience
window.t = (key, params) => window.i18nManager.t(key, params);

// Export for module usage
export default I18nManager;

console.log('🌍 I18n Manager loaded!');
console.log('📋 Available i18n commands:');
console.log('  t("key") - Translate text');
console.log('  i18nManager.changeLanguage("en") - Change language');
console.log('  i18nManager.getCurrentLanguage() - Get current language');
