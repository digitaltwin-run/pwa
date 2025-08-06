/**
 * Internationalization (i18n) Manager
 * Handles loading and applying translations
 */

class I18nManager {
  constructor() {
    this.translations = {};
    this.currentLanguage = 'en';
    this.defaultLanguage = 'en';
    this.availableLanguages = ['en'];
    this.initialized = false;
    this.loadingPromises = {};
  }

  /**
   * Initialize the i18n manager
   * @param {string} [defaultLanguage='en'] - The default language code
   * @param {string[]} [availableLanguages=['en']] - List of available language codes
   * @returns {Promise<boolean>} True if initialization was successful
   */
  async initialize(defaultLanguage = 'en', availableLanguages = ['en']) {
    if (this.initialized) {
      console.log('[i18n] Already initialized');
      return true;
    }

    this.defaultLanguage = defaultLanguage;
    this.availableLanguages = [...new Set([...availableLanguages, defaultLanguage])];
    
    // Try to detect user's preferred language
    this.currentLanguage = this.detectLanguage();
    
    // Load translations for the current language
    await this.loadLanguage(this.currentLanguage);
    
    this.initialized = true;
    console.log(`[i18n] Initialized with language: ${this.currentLanguage}`);
    
    // Dispatch event when translations are ready
    document.dispatchEvent(new CustomEvent('i18n:ready', { 
      detail: { language: this.currentLanguage }
    }));
    
    return true;
  }

  /**
   * Detect the user's preferred language
   * @returns {string} The detected language code
   */
  detectLanguage() {
    // Check URL parameter first
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang');
    if (langParam && this.availableLanguages.includes(langParam)) {
      return langParam;
    }
    
    // Check localStorage
    const savedLang = localStorage.getItem('preferredLanguage');
    if (savedLang && this.availableLanguages.includes(savedLang)) {
      return savedLang;
    }
    
    // Check browser language
    const browserLang = navigator.language.split('-')[0];
    if (browserLang && this.availableLanguages.includes(browserLang)) {
      return browserLang;
    }
    
    // Fall back to default
    return this.defaultLanguage;
  }

  /**
   * Load translations for a specific language
   * @param {string} lang - The language code to load
   * @returns {Promise<boolean>} True if the language was loaded successfully
   */
  async loadLanguage(lang) {
    if (!this.availableLanguages.includes(lang)) {
      console.warn(`[i18n] Language not available: ${lang}`);
      return false;
    }
    
    // If already loading this language, return the existing promise
    if (this.loadingPromises[lang]) {
      return this.loadingPromises[lang];
    }
    
    // Create a new promise for loading the language
    this.loadingPromises[lang] = (async () => {
      try {
        const response = await fetch(`/i18n/${lang}.json`);
        if (!response.ok) {
          throw new Error(`Failed to load ${lang} translations`);
        }
        
        const translations = await response.json();
        this.translations[lang] = translations;
        this.currentLanguage = lang;
        
        // Save preference
        localStorage.setItem('preferredLanguage', lang);
        
        // Update the document language
        document.documentElement.lang = lang;
        
        // Apply translations to the page
        this.applyTranslations();
        
        console.log(`[i18n] Loaded translations for: ${lang}`);
        
        // Dispatch event when language changes
        document.dispatchEvent(new CustomEvent('i18n:languageChanged', { 
          detail: { language: lang }
        }));
        
        return true;
      } catch (error) {
        console.error(`[i18n] Error loading ${lang} translations:`, error);
        
        // If we can't load the requested language, fall back to default
        if (lang !== this.defaultLanguage) {
          console.log(`[i18n] Falling back to default language: ${this.defaultLanguage}`);
          return this.loadLanguage(this.defaultLanguage);
        }
        
        return false;
      } finally {
        // Clean up the loading promise
        delete this.loadingPromises[lang];
      }
    })();
    
    return this.loadingPromises[lang];
  }

  /**
   * Change the current language
   * @param {string} lang - The language code to change to
   * @returns {Promise<boolean>} True if the language was changed successfully
   */
  async changeLanguage(lang) {
    if (lang === this.currentLanguage) {
      return true;
    }
    
    if (!this.availableLanguages.includes(lang)) {
      console.warn(`[i18n] Cannot change to unsupported language: ${lang}`);
      return false;
    }
    
    return this.loadLanguage(lang);
  }

  /**
   * Get a translated string
   * @param {string} key - The translation key (e.g., 'app.title')
   * @param {Object} [params] - Optional parameters to interpolate into the translation
   * @returns {string} The translated string, or the key if not found
   */
  t(key, params = {}) {
    if (!key) return '';
    
    // Get the translation for the current language
    let translation = this._getNestedProperty(this.translations[this.currentLanguage], key) ||
                     this._getNestedProperty(this.translations[this.defaultLanguage], key) ||
                     key;
    
    // Replace placeholders with parameters
    if (params && typeof params === 'object') {
      Object.entries(params).forEach(([param, value]) => {
        const placeholder = new RegExp(`\\{${param}\\}`, 'g');
        translation = translation.replace(placeholder, value);
      });
    }
    
    return translation;
  }

  /**
   * Apply translations to the page
   */
  applyTranslations() {
    // Find all elements with data-i18n attributes
    const elements = document.querySelectorAll('[data-i18n]');
    
    elements.forEach(element => {
      const key = element.getAttribute('data-i18n');
      if (!key) return;
      
      // Get the translation
      const translation = this.t(key);
      
      // Special handling for different element types
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        const placeholder = element.getAttribute('data-i18n-placeholder');
        if (placeholder) {
          element.placeholder = this.t(placeholder);
        }
        
        const title = element.getAttribute('data-i18n-title');
        if (title) {
          element.title = this.t(title);
        }
        
        if (element.type === 'submit' || element.type === 'button') {
          element.value = translation;
        }
      } else if (element.tagName === 'IMG') {
        const alt = element.getAttribute('data-i18n-alt');
        if (alt) {
          element.alt = this.t(alt);
        }
      } else {
        // Default: set text content
        element.textContent = translation;
      }
    });
    
    // Also update the document title if it has a data-i18n-title attribute
    const titleElement = document.querySelector('title[data-i18n-title]');
    if (titleElement) {
      const titleKey = titleElement.getAttribute('data-i18n-title');
      if (titleKey) {
        document.title = this.t(titleKey);
      }
    }
  }

  /**
   * Helper method to get a nested property from an object using dot notation
   * @private
   */
  _getNestedProperty(obj, path) {
    if (!obj) return null;
    
    return path.split('.').reduce((o, p) => {
      return o && typeof o === 'object' ? o[p] : null;
    }, obj);
  }
}

// Create and export singleton instance
const i18n = new I18nManager();

export default i18n;
