/**
 * i18n Mixin for HTML Modules
 * Provides internationalization capabilities for modules
 */

export const I18nMixin = (BaseClass) => class extends BaseClass {
    constructor() {
        super();
        
        // i18n specific state
        this.currentLanguage = 'en';
        this.translations = new Map();
        this.fallbackTranslations = new Map();
    }

    /**
     * Load translations for module
     */
    async loadModuleTranslations(moduleName) {
        try {
            // Try to load from global i18n manager first
            if (window.i18nManager) {
                this.currentLanguage = window.i18nManager.currentLanguage || 'en';
                return;
            }

            // Load module-specific translations
            const languages = ['en', 'pl']; // Supported languages
            
            for (const lang of languages) {
                try {
                    const response = await fetch(`/html-modules/translations/${moduleName}.${lang}.json`);
                    if (response.ok) {
                        const translations = await response.json();
                        this.translations.set(lang, translations);
                        
                        // Set fallback to English
                        if (lang === 'en') {
                            this.fallbackTranslations = translations;
                        }
                    }
                } catch (error) {
                    console.warn(`Failed to load ${lang} translations for ${moduleName}:`, error);
                }
            }
        } catch (error) {
            console.error('Error loading module translations:', error);
        }
    }

    /**
     * Translate text with module context
     */
    t(key, params = {}) {
        let translation = this.getTranslation(key);
        
        // Replace parameters in translation
        if (params && typeof translation === 'string') {
            Object.entries(params).forEach(([param, value]) => {
                translation = translation.replace(`{{${param}}}`, value);
            });
        }
        
        return translation;
    }

    /**
     * Get translation for key
     */
    getTranslation(key) {
        // Try global i18n manager first
        if (window.i18nManager && window.i18nManager.translate) {
            const globalTranslation = window.i18nManager.translate(key);
            if (globalTranslation !== key) {
                return globalTranslation;
            }
        }

        // Try module-specific translations
        const currentTranslations = this.translations.get(this.currentLanguage);
        if (currentTranslations && currentTranslations[key]) {
            return currentTranslations[key];
        }

        // Try fallback translations
        if (this.fallbackTranslations[key]) {
            return this.fallbackTranslations[key];
        }

        // Return key if no translation found
        return key;
    }

    /**
     * Set language for module
     */
    setLanguage(lang) {
        if (this.translations.has(lang)) {
            this.currentLanguage = lang;
            this.applyTranslations();
            
            // Emit language change event
            this.emit('language-changed', { language: lang });
        }
    }

    /**
     * Get available languages for module
     */
    getAvailableLanguages() {
        return Array.from(this.translations.keys());
    }

    /**
     * Apply translations to DOM elements with data-i18n
     */
    applyTranslations() {
        const elements = this.$$('[data-i18n]');
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const params = this.parseI18nParams(element);
            const translation = this.t(key, params);
            
            if (element.hasAttribute('data-i18n-attr')) {
                // Translate attribute
                const attrName = element.getAttribute('data-i18n-attr');
                element.setAttribute(attrName, translation);
            } else {
                // Translate text content
                element.textContent = translation;
            }
        });
    }

    /**
     * Parse i18n parameters from element attributes
     */
    parseI18nParams(element) {
        const params = {};
        Array.from(element.attributes).forEach(attr => {
            if (attr.name.startsWith('data-i18n-param-')) {
                const paramName = attr.name.replace('data-i18n-param-', '');
                params[paramName] = attr.value;
            }
        });
        return params;
    }

    /**
     * Listen for global language changes
     */
    setupLanguageListener() {
        document.addEventListener('language-changed', (event) => {
            if (event.detail && event.detail.language) {
                this.setLanguage(event.detail.language);
            }
        });
    }

    /**
     * Create translatable element
     */
    createTranslatableElement(tag, i18nKey, attributes = {}, params = {}) {
        const element = this.createElement(tag, {
            ...attributes,
            'data-i18n': i18nKey
        });
        
        // Add i18n parameters as attributes
        Object.entries(params).forEach(([key, value]) => {
            element.setAttribute(`data-i18n-param-${key}`, value);
        });
        
        // Apply translation immediately
        element.textContent = this.t(i18nKey, params);
        
        return element;
    }
};

/**
 * Embedded fallback translations for core UI elements
 */
export const CoreTranslations = {
    en: {
        'ui.ok': 'OK',
        'ui.cancel': 'Cancel',
        'ui.apply': 'Apply',
        'ui.save': 'Save',
        'ui.close': 'Close',
        'ui.edit': 'Edit',
        'ui.delete': 'Delete',
        'ui.copy': 'Copy',
        'ui.paste': 'Paste',
        'ui.select': 'Select',
        'ui.clear': 'Clear',
        'ui.reset': 'Reset',
        'ui.loading': 'Loading...',
        'ui.error': 'Error',
        'ui.warning': 'Warning',
        'ui.success': 'Success',
        'ui.info': 'Information'
    },
    pl: {
        'ui.ok': 'OK',
        'ui.cancel': 'Anuluj',
        'ui.apply': 'Zastosuj',
        'ui.save': 'Zapisz',
        'ui.close': 'Zamknij',
        'ui.edit': 'Edytuj',
        'ui.delete': 'Usuń',
        'ui.copy': 'Kopiuj',
        'ui.paste': 'Wklej',
        'ui.select': 'Wybierz',
        'ui.clear': 'Wyczyść',
        'ui.reset': 'Resetuj',
        'ui.loading': 'Ładowanie...',
        'ui.error': 'Błąd',
        'ui.warning': 'Ostrzeżenie',
        'ui.success': 'Sukces',
        'ui.info': 'Informacja'
    }
};
