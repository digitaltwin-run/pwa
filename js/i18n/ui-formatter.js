// Digital Twin IDE - UI Formatter Module
// Handles UI translation application, formatting, and language switcher

export class UIFormatter {
    constructor(translationManager, languageDetector) {
        this.translationManager = translationManager;
        this.languageDetector = languageDetector;
        this.currentLanguage = 'en';
        this.translationTimeout = null;
        this.autoTranslationObserver = null;
        
        console.log('[UIFormatter] Initialized UI formatter');
    }

    /**
     * Apply translations to current page
     * @param {string} langCode - Language code to apply
     */
    applyTranslations(langCode = this.currentLanguage) {
        console.log(`[UIFormatter] Applying translations for: ${langCode}`);
        
        const elements = document.querySelectorAll('[data-i18n]');
        let appliedCount = 0;
        
        // Create scoped translation function
        const t = (key, params) => {
            return this.translationManager.getTranslation(key, langCode, params);
        };

        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (!key) return;

            // Get optional parameters from data attributes
            const params = this.extractTranslationParams(element);
            
            // Get translated text
            const translatedText = t(key, params);
            
            // Apply translation based on element type
            this.applyTranslationToElement(element, translatedText, key);
            appliedCount++;
        });

        console.log(`[UIFormatter] Applied ${appliedCount} translations for ${langCode}`);
        
        // Dispatch event for custom handlers
        document.dispatchEvent(new CustomEvent('translations-applied', {
            detail: { langCode, appliedCount }
        }));
    }

    /**
     * Extract translation parameters from data attributes
     * @param {Element} element - Element to extract params from
     * @returns {Object} Parameters object
     */
    extractTranslationParams(element) {
        const params = {};
        
        // Look for data-i18n-* attributes
        Array.from(element.attributes).forEach(attr => {
            if (attr.name.startsWith('data-i18n-param-')) {
                const paramName = attr.name.replace('data-i18n-param-', '');
                params[paramName] = attr.value;
            }
        });
        
        return params;
    }

    /**
     * Apply translation to specific element
     * @param {Element} element - Element to apply translation to
     * @param {string} translatedText - Translated text
     * @param {string} key - Translation key (for debugging)
     */
    applyTranslationToElement(element, translatedText, key) {
        try {
            // Handle different element types
            switch (element.tagName.toLowerCase()) {
                case 'input':
                    if (element.type === 'button' || element.type === 'submit') {
                        element.value = translatedText;
                    } else {
                        element.placeholder = translatedText;
                    }
                    break;
                    
                case 'img':
                    element.alt = translatedText;
                    break;
                    
                case 'meta':
                    if (element.name === 'description') {
                        element.content = translatedText;
                    }
                    break;
                    
                default:
                    // Check for data-i18n-attr to specify which attribute to update
                    const targetAttr = element.getAttribute('data-i18n-attr');
                    if (targetAttr) {
                        element.setAttribute(targetAttr, translatedText);
                    } else {
                        // Default to textContent for most elements
                        element.textContent = translatedText;
                    }
                    break;
            }
        } catch (error) {
            console.warn(`[UIFormatter] Error applying translation for key ${key}:`, error);
        }
    }

    /**
     * Setup language switcher UI
     */
    setupLanguageSwitcher() {
        const existingSwitcher = document.getElementById('language-switcher');
        if (existingSwitcher) {
            existingSwitcher.remove();
        }

        const switcher = this.createLanguageSwitcher();
        
        // Try to add to existing header/nav
        const header = document.querySelector('header, nav, .header, .navbar');
        if (header) {
            header.appendChild(switcher);
        } else {
            document.body.appendChild(switcher);
        }
        
        console.log('[UIFormatter] Language switcher setup complete');
    }

    /**
     * Create language switcher element
     * @returns {Element} Language switcher element
     */
    createLanguageSwitcher() {
        const switcher = document.createElement('div');
        switcher.id = 'language-switcher';
        switcher.className = 'language-switcher';
        
        const select = document.createElement('select');
        select.id = 'language-select';
        select.className = 'form-select form-select-sm';
        
        // Add languages to select
        const supportedLanguages = this.languageDetector.getSupportedLanguages();
        Object.entries(supportedLanguages).forEach(([code, info]) => {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = `${info.flag} ${info.nativeName}`;
            if (code === this.currentLanguage) {
                option.selected = true;
            }
            select.appendChild(option);
        });
        
        // Add change event listener
        select.addEventListener('change', (e) => {
            this.changeLanguage(e.target.value);
        });
        
        switcher.appendChild(select);
        return switcher;
    }

    /**
     * Update language switcher selection
     */
    updateLanguageSwitcher() {
        const select = document.getElementById('language-select');
        if (select) {
            select.value = this.currentLanguage;
        }
    }

    /**
     * Change current language
     * @param {string} langCode - New language code
     */
    async changeLanguage(langCode) {
        if (!this.languageDetector.isLanguageSupported(langCode)) {
            console.warn(`[UIFormatter] Unsupported language: ${langCode}`);
            return;
        }

        console.log(`[UIFormatter] Changing language to: ${langCode}`);
        
        // Save preference
        this.languageDetector.saveLanguagePreference(langCode);
        
        // Update current language
        this.currentLanguage = langCode;
        
        // Load language if not already loaded
        if (!this.translationManager.isLanguageLoaded(langCode)) {
            const translations = await this.languageDetector.loadTranslationsFromFile(langCode);
            if (translations) {
                this.translationManager.addTranslations(langCode, translations);
            } else {
                // Fallback to embedded translations
                const embeddedTranslations = this.translationManager.getEmbeddedTranslations(langCode);
                if (embeddedTranslations) {
                    this.translationManager.addTranslations(langCode, embeddedTranslations);
                }
            }
        }
        
        // Apply new translations
        this.applyTranslations(langCode);
        
        // Update language switcher
        this.updateLanguageSwitcher();
        
        // Update document language attribute
        document.documentElement.lang = langCode;
        
        // Dispatch language change event
        document.dispatchEvent(new CustomEvent('language-changed', {
            detail: { langCode, previous: this.currentLanguage }
        }));
        
        console.log(`[UIFormatter] Language changed to: ${langCode}`);
    }

    /**
     * Setup automatic translation detection for dynamic content
     */
    setupAutoTranslation() {
        if (this.autoTranslationObserver) {
            this.autoTranslationObserver.disconnect();
        }

        this.autoTranslationObserver = new MutationObserver((mutations) => {
            let shouldTranslate = false;

            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Check if new element or its children have i18n attributes
                            if (node.hasAttribute && node.hasAttribute('data-i18n')) {
                                shouldTranslate = true;
                            } else if (node.querySelectorAll) {
                                const i18nElements = node.querySelectorAll('[data-i18n]');
                                if (i18nElements.length > 0) {
                                    shouldTranslate = true;
                                }
                            }
                        }
                    });
                }
            });

            if (shouldTranslate) {
                // Debounce translation application
                this.scheduleTranslationApplication();
            }
        });

        this.autoTranslationObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        console.log('[UIFormatter] Auto-translation observer setup complete');
    }

    /**
     * Schedule translation application with debouncing
     */
    scheduleTranslationApplication() {
        if (this.translationTimeout) {
            clearTimeout(this.translationTimeout);
        }
        
        this.translationTimeout = setTimeout(() => {
            this.applyTranslations();
        }, 100);
    }

    /**
     * Format numbers according to current locale
     * @param {number} number - Number to format
     * @param {Object} options - Intl.NumberFormat options
     * @returns {string} Formatted number
     */
    formatNumber(number, options = {}) {
        try {
            const locale = this.languageDetector.getLocaleString(this.currentLanguage);
            return new Intl.NumberFormat(locale, options).format(number);
        } catch (error) {
            console.warn('[UIFormatter] Error formatting number:', error);
            return number.toString();
        }
    }

    /**
     * Format dates according to current locale
     * @param {Date} date - Date to format
     * @param {Object} options - Intl.DateTimeFormat options
     * @returns {string} Formatted date
     */
    formatDate(date, options = {}) {
        try {
            const locale = this.languageDetector.getLocaleString(this.currentLanguage);
            return new Intl.DateTimeFormat(locale, options).format(date);
        } catch (error) {
            console.warn('[UIFormatter] Error formatting date:', error);
            return date.toString();
        }
    }

    /**
     * Format currency according to current locale
     * @param {number} amount - Amount to format
     * @param {string} currency - Currency code (e.g., 'USD', 'EUR')
     * @param {Object} options - Additional formatting options
     * @returns {string} Formatted currency
     */
    formatCurrency(amount, currency = 'USD', options = {}) {
        try {
            const locale = this.languageDetector.getLocaleString(this.currentLanguage);
            return new Intl.NumberFormat(locale, {
                style: 'currency',
                currency: currency,
                ...options
            }).format(amount);
        } catch (error) {
            console.warn('[UIFormatter] Error formatting currency:', error);
            return `${amount} ${currency}`;
        }
    }

    /**
     * Format relative time (e.g., "2 hours ago")
     * @param {Date} date - Date to format
     * @param {Object} options - Intl.RelativeTimeFormat options
     * @returns {string} Formatted relative time
     */
    formatRelativeTime(date, options = {}) {
        try {
            const locale = this.languageDetector.getLocaleString(this.currentLanguage);
            const rtf = new Intl.RelativeTimeFormat(locale, options);
            
            const diffInSeconds = (date.getTime() - Date.now()) / 1000;
            
            // Determine appropriate unit
            if (Math.abs(diffInSeconds) < 60) {
                return rtf.format(Math.round(diffInSeconds), 'second');
            } else if (Math.abs(diffInSeconds) < 3600) {
                return rtf.format(Math.round(diffInSeconds / 60), 'minute');
            } else if (Math.abs(diffInSeconds) < 86400) {
                return rtf.format(Math.round(diffInSeconds / 3600), 'hour');
            } else {
                return rtf.format(Math.round(diffInSeconds / 86400), 'day');
            }
        } catch (error) {
            console.warn('[UIFormatter] Error formatting relative time:', error);
            return date.toString();
        }
    }

    /**
     * Get current language
     * @returns {string} Current language code
     */
    getCurrentLanguage() {
        return this.currentLanguage;
    }

    /**
     * Set current language without changing UI
     * @param {string} langCode - Language code
     */
    setCurrentLanguage(langCode) {
        this.currentLanguage = langCode;
    }

    /**
     * Create translation function for current language
     * @returns {Function} Translation function
     */
    createTranslationFunction() {
        return (key, params = {}) => {
            return this.translationManager.getTranslation(key, this.currentLanguage, params);
        };
    }

    /**
     * Cleanup method
     */
    cleanup() {
        if (this.autoTranslationObserver) {
            this.autoTranslationObserver.disconnect();
            this.autoTranslationObserver = null;
        }
        
        if (this.translationTimeout) {
            clearTimeout(this.translationTimeout);
            this.translationTimeout = null;
        }
        
        console.log('[UIFormatter] Cleanup completed');
    }
}
