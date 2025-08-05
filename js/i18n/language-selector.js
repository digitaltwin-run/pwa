/**
 * Digital Twin IDE - Language Selector Component
 * Handles language selection UI interactions and integrates with i18n manager
 */

export class LanguageSelector {
    /**
     * Create a new language selector
     * @param {I18nManager} i18nManager - Reference to the i18n manager
     * @param {Object} options - Configuration options
     */
    constructor(i18nManager, options = {}) {
        // Store references
        this.i18nManager = i18nManager;
        
        // Configuration
        this.options = {
            selectorId: 'language-select',
            switcherId: 'language-switcher',
            persistSelection: true,
            showFlags: true,
            animateChange: true,
            ...options
        };
        
        // Element references
        this.selectElement = null;
        this.switcherElement = null;
        
        // State
        this.isInitialized = false;
        this.currentLanguage = this.i18nManager?.getCurrentLanguage() || 'en';
        this.supportedLanguages = this.i18nManager?.getSupportedLanguages() || {
            en: 'English',
            pl: 'Polski',
            de: 'Deutsch',
            es: 'Español'
        };
        
        // Flag emoji mapping for supported languages
        this.flagEmojis = {
            en: '🇺🇸',
            pl: '🇵🇱', 
            de: '🇩🇪',
            es: '🇪🇸',
            fr: '🇫🇷',
            it: '🇮🇹',
            pt: '🇵🇹',
            ru: '🇷🇺',
            zh: '🇨🇳',
            ja: '🇯🇵'
        };
        
        // Initialize component
        this.init();
    }
    
    /**
     * Initialize the language selector
     */
    init() {
        console.log('[LanguageSelector] Initializing...');
        
        try {
            // Find UI elements
            this.selectElement = document.getElementById(this.options.selectorId);
            this.switcherElement = document.getElementById(this.options.switcherId);
            
            if (!this.selectElement) {
                console.warn('[LanguageSelector] Select element not found:', this.options.selectorId);
                return;
            }
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Update UI to reflect current language
            this.updateSelectorUI();
            
            // Register with component registry if available
            this.registerComponent();
            
            this.isInitialized = true;
            console.log('[LanguageSelector] Initialized successfully');
            
            // Dispatch initialization event
            this.dispatchEvent('language-selector-ready');
        } catch (error) {
            console.error('[LanguageSelector] Initialization failed:', error);
        }
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        if (!this.selectElement) return;
        
        // Language change event
        this.selectElement.addEventListener('change', (event) => {
            const langCode = event.target.value;
            this.changeLanguage(langCode);
        });
        
        // Listen for i18n manager events
        window.addEventListener('language-changed', (event) => {
            if (event.detail?.language) {
                this.updateSelectorUI(event.detail.language);
            }
        });
        
        // Setup keyboard accessibility
        this.setupKeyboardAccessibility();
    }
    
    /**
     * Setup keyboard accessibility
     */
    setupKeyboardAccessibility() {
        if (!this.switcherElement) return;
        
        // Make the language switcher focusable if it isn't already
        if (!this.switcherElement.hasAttribute('tabindex')) {
            this.switcherElement.setAttribute('tabindex', '0');
        }
        
        // Add keyboard shortcut (Alt+L) for language switching focus
        document.addEventListener('keydown', (event) => {
            if (event.altKey && event.key.toLowerCase() === 'l') {
                this.selectElement?.focus();
                event.preventDefault();
            }
        });
    }
    
    /**
     * Update the selector UI to reflect the current language
     * @param {string} langCode - Language code
     */
    updateSelectorUI(langCode = null) {
        if (!this.selectElement) return;
        
        const language = langCode || this.currentLanguage || this.i18nManager?.getCurrentLanguage() || 'en';
        
        // Set the current selection
        this.selectElement.value = language;
        
        // Update the language attribute on HTML element
        document.documentElement.setAttribute('lang', language);
        
        // Add visual feedback
        if (this.options.animateChange) {
            this.switcherElement?.classList.add('language-changed');
            setTimeout(() => {
                this.switcherElement?.classList.remove('language-changed');
            }, 1000);
        }
        
        // Update current language
        this.currentLanguage = language;
        
        // Save to localStorage if enabled
        if (this.options.persistSelection) {
            try {
                localStorage.setItem('dt_preferred_language', language);
            } catch (e) {
                console.warn('[LanguageSelector] Could not save language preference to localStorage');
            }
        }
    }
    
    /**
     * Dynamically generate language options if needed
     * @param {Object} languages - Languages object with code:name pairs
     */
    generateLanguageOptions(languages = null) {
        if (!this.selectElement) return;
        
        const languagesToUse = languages || this.supportedLanguages;
        
        // Clear current options
        this.selectElement.innerHTML = '';
        
        // Generate new options
        Object.entries(languagesToUse).forEach(([code, name]) => {
            const option = document.createElement('option');
            option.value = code;
            
            // Add flag emoji if enabled
            if (this.options.showFlags && this.flagEmojis[code]) {
                option.textContent = `${this.flagEmojis[code]} ${name}`;
            } else {
                option.textContent = name;
            }
            
            this.selectElement.appendChild(option);
        });
        
        // Set current value
        this.updateSelectorUI();
    }
    
    /**
     * Change the active language
     * @param {string} langCode - Language code to change to
     * @returns {Promise<boolean>} Whether the change was successful
     */
    async changeLanguage(langCode) {
        if (!langCode || langCode === this.currentLanguage) return false;
        
        console.log(`[LanguageSelector] Changing language to: ${langCode}`);
        
        try {
            // Update the selector UI immediately for responsive feedback
            this.updateSelectorUI(langCode);
            
            // Try to change the language via i18n manager
            if (this.i18nManager) {
                // Show loading state
                this.showLoadingState(true);
                
                // Change language
                await this.i18nManager.loadLanguage(langCode);
                await this.i18nManager.changeLanguage(langCode);
                
                // Hide loading state
                this.showLoadingState(false);
                
                // Dispatch custom event
                this.dispatchEvent('language-selector-changed', { language: langCode });
                
                return true;
            } else {
                console.warn('[LanguageSelector] Cannot change language: i18nManager not available');
                return false;
            }
        } catch (error) {
            console.error('[LanguageSelector] Error changing language:', error);
            this.showLoadingState(false);
            return false;
        }
    }
    
    /**
     * Show loading state during language change
     * @param {boolean} isLoading - Whether loading is active
     */
    showLoadingState(isLoading) {
        if (!this.switcherElement) return;
        
        if (isLoading) {
            this.switcherElement.classList.add('loading');
            this.selectElement?.setAttribute('disabled', 'disabled');
        } else {
            this.switcherElement.classList.remove('loading');
            this.selectElement?.removeAttribute('disabled');
        }
    }
    
    /**
     * Register this component with the component registry
     */
    registerComponent() {
        try {
            // Register with component registry if available
            if (window.componentRegistry) {
                window.componentRegistry.register('language-selector', (element) => {
                    return new LanguageSelector(window.i18nManager, {
                        selectorId: element.id || this.options.selectorId
                    });
                });
                console.log('[LanguageSelector] Registered with component registry');
            }
        } catch (error) {
            console.warn('[LanguageSelector] Could not register with component registry:', error);
        }
    }
    
    /**
     * Dispatch a custom event
     * @param {string} name - Event name
     * @param {Object} detail - Event details
     */
    dispatchEvent(name, detail = {}) {
        const event = new CustomEvent(name, {
            bubbles: true,
            cancelable: true,
            detail: detail
        });
        
        window.dispatchEvent(event);
    }
    
    /**
     * Get the current language code
     * @returns {string} Current language code
     */
    getCurrentLanguage() {
        return this.currentLanguage;
    }
    
    /**
     * Clean up resources
     */
    cleanup() {
        if (this.selectElement) {
            this.selectElement.removeEventListener('change', this.changeLanguage);
        }
        
        console.log('[LanguageSelector] Cleaned up');
    }
}

// Create and initialize global instance
let languageSelector;
try {
    // Check if i18nManager is available
    if (window.i18nManager) {
        languageSelector = new LanguageSelector(window.i18nManager);
        window.languageSelector = languageSelector;
        console.log('[LanguageSelector] Global instance created');
    } else {
        console.warn('[LanguageSelector] i18nManager not available, waiting...');
        
        // Wait for i18nManager to be available
        window.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                if (window.i18nManager) {
                    languageSelector = new LanguageSelector(window.i18nManager);
                    window.languageSelector = languageSelector;
                    console.log('[LanguageSelector] Global instance created (delayed)');
                } else {
                    console.error('[LanguageSelector] i18nManager not available after waiting');
                }
            }, 500);
        });
    }
} catch (error) {
    console.error('[LanguageSelector] Failed to create global instance:', error);
}

export default LanguageSelector;
