/**
 * 🌍 Internationalization Manager
 * Multi-language support with dynamic language switching
 */

class I18nManager {
    constructor() {
        this.currentLanguage = 'en';
        this.defaultLanguage = 'en';
        this.translations = new Map();
        this.loadedLanguages = new Set();
        this.fallbackChain = ['en', 'pl'];
        
        // Supported languages
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
        
        console.log('🌍 I18n Manager initialized');
        this.init();
    }

    async init() {
        // Detect user's preferred language
        this.currentLanguage = this.detectLanguage();
        console.log('🔍 Detected language:', this.currentLanguage);
        
        // Load initial translation data
        await this.loadLanguage(this.currentLanguage);
        await this.loadLanguage(this.defaultLanguage); // Always load fallback
        
        // Apply translations to current page
        this.applyTranslations();
        
        // Setup language switcher UI
        this.setupLanguageSwitcher();
        
        // Setup automatic translation detection
        this.setupAutoTranslation();
        
        console.log('✅ I18n Manager ready');
    }

    // Detect user's preferred language
    detectLanguage() {
        // 1. Check URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        const urlLang = urlParams.get('lang');
        if (urlLang && this.supportedLanguages[urlLang]) {
            return urlLang;
        }
        
        // 2. Check localStorage
        const storedLang = localStorage.getItem('preferred-language');
        if (storedLang && this.supportedLanguages[storedLang]) {
            return storedLang;
        }
        
        // 3. Check browser language
        const browserLang = navigator.language.split('-')[0];
        if (this.supportedLanguages[browserLang]) {
            return browserLang;
        }
        
        // 4. Check browser languages array
        for (const lang of navigator.languages) {
            const langCode = lang.split('-')[0];
            if (this.supportedLanguages[langCode]) {
                return langCode;
            }
        }
        
        // 5. Fallback to default
        return this.defaultLanguage;
    }

    // Load translation data for a language
    async loadLanguage(langCode) {
        if (this.loadedLanguages.has(langCode)) {
            return true; // Already loaded
        }

        try {
            console.log(`📥 Loading translations for: ${langCode}`);
            
            // Try to load from file first
            const translations = await this.loadTranslationsFromFile(langCode);
            if (translations) {
                this.translations.set(langCode, translations);
                this.loadedLanguages.add(langCode);
                console.log(`✅ Loaded ${Object.keys(translations).length} translations for ${langCode}`);
                return true;
            }
            
            // Fallback to embedded translations
            const embeddedTranslations = this.getEmbeddedTranslations(langCode);
            if (embeddedTranslations) {
                this.translations.set(langCode, embeddedTranslations);
                this.loadedLanguages.add(langCode);
                console.log(`✅ Loaded embedded translations for ${langCode}`);
                return true;
            }
            
            console.warn(`⚠️ No translations found for ${langCode}`);
            return false;
        } catch (error) {
            console.error(`❌ Failed to load translations for ${langCode}:`, error);
            return false;
        }
    }

    // Load translations from file
    async loadTranslationsFromFile(langCode) {
        try {
            const response = await fetch(`/i18n/${langCode}.json`);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.log(`ℹ️ Translation file not found for ${langCode}, using embedded`);
        }
        return null;
    }

    // Get embedded translations (fallback)
    getEmbeddedTranslations(langCode) {
        const translations = {
            'en': {
                // Common UI
                'app.title': 'Digital Twin IDE',
                'app.description': 'Design and simulate digital twins',
                'loading': 'Loading...',
                'save': 'Save',
                'cancel': 'Cancel',
                'delete': 'Delete',
                'edit': 'Edit',
                'close': 'Close',
                'ok': 'OK',
                'yes': 'Yes',
                'no': 'No',
                
                // Components
                'components.title': 'Components',
                'components.drag_to_canvas': 'Drag to canvas',
                'components.led': 'LED',
                'components.button': 'Button',
                'components.switch': 'Switch',
                'components.motor': 'Motor',
                'components.sensor': 'Sensor',
                
                // Properties Panel
                'properties.title': 'Properties',
                'properties.general': 'General',
                'properties.colors': 'Colors',
                'properties.interactions': 'Interactions',
                'properties.metadata': 'Metadata',
                'properties.name': 'Name',
                'properties.value': 'Value',
                
                // Interactions
                'interactions.title': 'Interactions',
                'interactions.add': 'Add Interaction',
                'interactions.event': 'Event',
                'interactions.action': 'Action',
                'interactions.target': 'Target Component',
                'interactions.property': 'Property/Variable',
                'interactions.select_event': 'Select event',
                'interactions.select_component': 'Select component',
                'interactions.select_property': 'Select property',
                
                // Collaboration
                'collaboration.title': 'Collaboration',
                'collaboration.join_room': 'Join Room',
                'collaboration.create_room': 'Create Room',
                'collaboration.leave_room': 'Leave Room',
                'collaboration.room_id': 'Room ID',
                'collaboration.connected_users': 'Connected Users',
                'collaboration.user_joined': '{name} joined',
                'collaboration.user_left': '{name} left',
                
                // PWA
                'pwa.install': 'Install App',
                'pwa.update_available': 'Update Available',
                'pwa.offline_mode': 'Working Offline',
                'pwa.back_online': 'Back Online',
                
                // Error messages
                'error.generic': 'An error occurred',
                'error.network': 'Network error',
                'error.file_not_found': 'File not found',
                'error.invalid_format': 'Invalid format'
            },
            
            'pl': {
                // Common UI
                'app.title': 'Edytor Cyfrowych Bliźniaków',
                'app.description': 'Projektuj i symuluj cyfrowe bliźniaki',
                'loading': 'Ładowanie...',
                'save': 'Zapisz',
                'cancel': 'Anuluj',
                'delete': 'Usuń',
                'edit': 'Edytuj',
                'close': 'Zamknij',
                'ok': 'OK',
                'yes': 'Tak',
                'no': 'Nie',
                
                // Components
                'components.title': 'Komponenty',
                'components.drag_to_canvas': 'Przeciągnij na obszar roboczy',
                'components.led': 'Dioda LED',
                'components.button': 'Przycisk',
                'components.switch': 'Przełącznik',
                'components.motor': 'Silnik',
                'components.sensor': 'Czujnik',
                
                // Properties Panel
                'properties.title': 'Właściwości',
                'properties.general': 'Ogólne',
                'properties.colors': 'Kolory',
                'properties.interactions': 'Interakcje',
                'properties.metadata': 'Metadane',
                'properties.name': 'Nazwa',
                'properties.value': 'Wartość',
                
                // Interactions
                'interactions.title': 'Interakcje',
                'interactions.add': 'Dodaj Interakcję',
                'interactions.event': 'Zdarzenie',
                'interactions.action': 'Akcja',
                'interactions.target': 'Komponent Docelowy',
                'interactions.property': 'Właściwość/Zmienna',
                'interactions.select_event': 'Wybierz zdarzenie',
                'interactions.select_component': 'Wybierz komponent',
                'interactions.select_property': 'Wybierz właściwość',
                
                // Collaboration
                'collaboration.title': 'Współpraca',
                'collaboration.join_room': 'Dołącz do Pokoju',
                'collaboration.create_room': 'Utwórz Pokój',
                'collaboration.leave_room': 'Opuść Pokój',
                'collaboration.room_id': 'ID Pokoju',
                'collaboration.connected_users': 'Połączeni Użytkownicy',
                'collaboration.user_joined': '{name} dołączył',
                'collaboration.user_left': '{name} wyszedł',
                
                // PWA
                'pwa.install': 'Zainstaluj Aplikację',
                'pwa.update_available': 'Dostępna Aktualizacja',
                'pwa.offline_mode': 'Praca Offline',
                'pwa.back_online': 'Powrót Online',
                
                // Error messages
                'error.generic': 'Wystąpił błąd',
                'error.network': 'Błąd sieci',
                'error.file_not_found': 'Nie znaleziono pliku',
                'error.invalid_format': 'Nieprawidłowy format'
            },
            
            // Add more languages as needed
            'de': {
                'app.title': 'Digital Twin IDE',
                'app.description': 'Digitale Zwillinge entwerfen und simulieren',
                'loading': 'Laden...',
                'save': 'Speichern',
                'cancel': 'Abbrechen'
                // ... more German translations
            }
        };
        
        return translations[langCode] || null;
    }

    // Get translated text
    t(key, params = {}) {
        // Try current language first
        let translation = this.getTranslation(key, this.currentLanguage);
        
        // Fallback through fallback chain
        if (!translation) {
            for (const fallbackLang of this.fallbackChain) {
                translation = this.getTranslation(key, fallbackLang);
                if (translation) break;
            }
        }
        
        // Final fallback to key itself
        if (!translation) {
            console.warn(`⚠️ Missing translation: ${key}`);
            translation = key;
        }
        
        // Replace parameters
        return this.interpolate(translation, params);
    }

    // Get translation from specific language
    getTranslation(key, langCode) {
        const langTranslations = this.translations.get(langCode);
        if (!langTranslations) return null;
        
        // Support nested keys like 'app.title'
        const keys = key.split('.');
        let value = langTranslations;
        
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return null;
            }
        }
        
        return typeof value === 'string' ? value : null;
    }

    // Interpolate parameters in translation
    interpolate(text, params) {
        return text.replace(/\{(\w+)\}/g, (match, key) => {
            return params[key] !== undefined ? params[key] : match;
        });
    }

    // Change language
    async changeLanguage(langCode) {
        if (!this.supportedLanguages[langCode]) {
            console.error(`❌ Unsupported language: ${langCode}`);
            return false;
        }
        
        console.log(`🔄 Changing language to: ${langCode}`);
        
        // Load language if not already loaded
        await this.loadLanguage(langCode);
        
        // Update current language
        this.currentLanguage = langCode;
        
        // Save preference
        localStorage.setItem('preferred-language', langCode);
        
        // Apply translations
        this.applyTranslations();
        
        // Update language switcher
        this.updateLanguageSwitcher();
        
        // Update document language
        document.documentElement.lang = langCode;
        
        // Emit language change event
        window.dispatchEvent(new CustomEvent('languageChanged', {
            detail: { language: langCode }
        }));
        
        console.log(`✅ Language changed to: ${langCode}`);
        return true;
    }

    // Apply translations to current page
    applyTranslations() {
        console.log('🔄 Applying translations...');
        
        // Update static elements with data-i18n attribute
        const elements = document.querySelectorAll('[data-i18n]');
        let translatedCount = 0;
        
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);
            
            if (translation !== key) { // Only if translation found
                // Check if it's a placeholder, title, or regular content
                if (element.hasAttribute('placeholder')) {
                    element.placeholder = translation;
                } else if (element.hasAttribute('title')) {
                    element.title = translation;
                } else if (element.hasAttribute('data-i18n-html')) {
                    element.innerHTML = translation;
                } else if (element.tagName === 'INPUT') {
                    element.value = translation;
                } else {
                    element.textContent = translation;
                }
                translatedCount++;
            }
        });
        
        // Update page title
        const titleKey = document.documentElement.getAttribute('data-i18n-title');
        if (titleKey) {
            document.title = this.t(titleKey);
        }
        
        // Dispatch a custom event to notify all components about the language change
        // This allows dynamic UI components to update their content
        const event = new CustomEvent('languageChanged', {
            detail: { 
                language: this.currentLanguage,
                t: (key, params) => this.t(key, params) // Pass translation function
            }
        });
        document.dispatchEvent(event);
        
        console.log(`✅ Applied ${translatedCount} translations`);
        
        // Return the translation function for chaining if needed
        return this.t.bind(this);
    }

    // Setup language switcher UI
    setupLanguageSwitcher() {
        // Create language switcher
        const switcher = document.createElement('div');
        switcher.id = 'language-switcher';
        switcher.className = 'language-switcher';
        
        const select = document.createElement('select');
        select.id = 'language-select';
        
        // Add options for supported languages
        Object.entries(this.supportedLanguages).forEach(([code, info]) => {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = `${info.flag} ${info.nativeName}`;
            if (code === this.currentLanguage) {
                option.selected = true;
            }
            select.appendChild(option);
        });
        
        // Add change listener
        select.addEventListener('change', (event) => {
            this.changeLanguage(event.target.value);
        });
        
        switcher.appendChild(select);
        
        // Add to page (you might want to position this differently)
        const existingSwitcher = document.getElementById('language-switcher');
        if (existingSwitcher) {
            existingSwitcher.replaceWith(switcher);
        } else {
            document.body.appendChild(switcher);
        }
    }

    // Update language switcher
    updateLanguageSwitcher() {
        const select = document.getElementById('language-select');
        if (select) {
            select.value = this.currentLanguage;
        }
    }

    // Setup automatic translation detection
    setupAutoTranslation() {
        // Watch for new elements being added to DOM
        const observer = new MutationObserver((mutations) => {
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
                clearTimeout(this.translationTimeout);
                this.translationTimeout = setTimeout(() => {
                    this.applyTranslations();
                }, 100);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Public API methods
    getCurrentLanguage() {
        return this.currentLanguage;
    }

    getSupportedLanguages() {
        return this.supportedLanguages;
    }

    isLanguageLoaded(langCode) {
        return this.loadedLanguages.has(langCode);
    }

    // Add custom translations
    addTranslations(langCode, translations) {
        if (!this.translations.has(langCode)) {
            this.translations.set(langCode, {});
        }
        
        const existing = this.translations.get(langCode);
        Object.assign(existing, translations);
        
        this.loadedLanguages.add(langCode);
        
        // Re-apply translations if it's the current language
        if (langCode === this.currentLanguage) {
            this.applyTranslations();
        }
    }

    // Format numbers according to locale
    formatNumber(number, options = {}) {
        try {
            return new Intl.NumberFormat(this.getLocale(), options).format(number);
        } catch (error) {
            return number.toString();
        }
    }

    // Format dates according to locale
    formatDate(date, options = {}) {
        try {
            return new Intl.DateTimeFormat(this.getLocale(), options).format(date);
        } catch (error) {
            return date.toString();
        }
    }

    // Get locale string for Intl APIs
    getLocale() {
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
        
        return localeMap[this.currentLanguage] || 'en-US';
    }
}

// Global i18n manager instance
window.i18nManager = new I18nManager();

// Global translation function for convenience
window.t = (key, params) => window.i18nManager.t(key, params);

// Export for module usage
export { I18nManager };
export default I18nManager;

console.log('🌍 I18n Manager loaded!');
console.log('📋 Available i18n commands:');
console.log('  t("key") - Translate text');
console.log('  i18nManager.changeLanguage("en") - Change language');
console.log('  i18nManager.getCurrentLanguage() - Get current language');
