// i18n configuration
class I18nManager {
    constructor() {
        this.currentLanguage = 'pl'; // Default language
        this.translations = {};
        this.availableLanguages = ['en', 'pl', 'de', 'es']; // Added German (de) and Spanish (es)
        
        // Elements that need translation
        this.translatableElements = [];
        
        // Initialize
        this.loadTranslations().then(() => {
            this.applyTranslations();
        });
    }
    
    async loadTranslations() {
        // Try different possible paths for the translation files
        const paths = [
            `/locales/${this.currentLanguage}/translation.json`,
            `./locales/${this.currentLanguage}/translation.json`,
            `../locales/${this.currentLanguage}/translation.json`
        ];
        
        let lastError = null;
        
        for (const url of paths) {
            console.log(`Trying to load translations from: ${url}`);
            
            try {
                const response = await fetch(url);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                console.log('Successfully loaded translations from:', url);
                this.translations = data;
                
                // Update HTML lang attribute
                document.documentElement.lang = this.currentLanguage;
                console.log(`Language set to: ${this.currentLanguage}`);
                
                return true;
                
            } catch (error) {
                console.warn(`Failed to load from ${url}:`, error.message);
                lastError = error;
                continue;
            }
        }
        
        // If we get here, all paths failed
        console.error('All attempts to load translations failed.');
        console.error('Available languages:', this.availableLanguages);
        console.error('Last error:', lastError);
        
        // Fallback to hardcoded translations if file loading fails
        console.warn('Using fallback translations');
        this.translations = {
            'en': {
                'app': {
                    'title': 'Digital Twin IDE',
                    'menu': {
                        'file': 'File',
                        'simulation': 'Simulation',
                        'view': 'View',
                        'help': 'Help'
                    },
                    'buttons': {
                        'export': 'Export',
                        'import': 'Import',
                        'connect': 'Connect Components',
                        'start': 'Start',
                        'stop': 'Stop'
                    },
                    'simulation': {
                        'title': '📊 Data Simulation',
                        'noComponents': 'No components to simulate'
                    }
                }
            },
            'pl': {
                'app': {
                    'title': 'Digital Twin IDE',
                    'menu': {
                        'file': 'Plik',
                        'simulation': 'Symulacja',
                        'view': 'Widok',
                        'help': 'Pomoc'
                    },
                    'buttons': {
                        'export': 'Eksportuj',
                        'import': 'Importuj',
                        'connect': 'Łącz komponenty',
                        'start': 'Start',
                        'stop': 'Stop'
                    },
                    'simulation': {
                        'title': '📊 Symulacja Danych',
                        'noComponents': 'Brak komponentów do symulacji'
                    }
                }
            },
            'de': {
                'app': {
                    'title': 'Digital Twin IDE',
                    'menu': {
                        'file': 'Datei',
                        'simulation': 'Simulation',
                        'view': 'Ansicht',
                        'help': 'Hilfe'
                    },
                    'buttons': {
                        'export': 'Exportieren',
                        'import': 'Importieren',
                        'connect': 'Komponenten verbinden',
                        'start': 'Starten',
                        'stop': 'Stoppen'
                    },
                    'simulation': {
                        'title': '📊 Datensimulation',
                        'noComponents': 'Keine Komponenten zur Simulation'
                    }
                }
            },
            'es': {
                'app': {
                    'title': 'IDE de Gemelo Digital',
                    'menu': {
                        'file': 'Archivo',
                        'simulation': 'Simulación',
                        'view': 'Vista',
                        'help': 'Ayuda'
                    },
                    'buttons': {
                        'export': 'Exportar',
                        'import': 'Importar',
                        'connect': 'Conectar Componentes',
                        'start': 'Iniciar',
                        'stop': 'Detener'
                    },
                    'simulation': {
                        'title': '📊 Simulación de Datos',
                        'noComponents': 'No hay componentes para simular'
                    }
                }
            }
        }[this.currentLanguage] || {};
        
        return Object.keys(this.translations).length > 0;
    }
    
    async changeLanguage(lang) {
        if (this.availableLanguages.includes(lang) && lang !== this.currentLanguage) {
            this.currentLanguage = lang;
            const success = await this.loadTranslations();
            if (success) {
                this.applyTranslations();
                // Save language preference
                localStorage.setItem('userLanguage', lang);
            }
            return success;
        }
        return false;
    }
    
    t(key, defaultValue = '') {
        // Simple key path resolution (e.g., 'app.title' -> translations.app.title)
        return key.split('.').reduce((obj, k) => obj && obj[k], this.translations) || defaultValue;
    }
    
    registerElement(element, key) {
        this.translatableElements.push({ element, key });
        this.updateElementTranslation(element, key);
    }
    
    updateElementTranslation(element, key) {
        if (!element || !key) {
            console.warn('Invalid element or key:', { element, key });
            return;
        }
        
        const text = this.t(key);
        console.log(`Updating element for key '${key}':`, { text, element });
        
        if (text) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = text;
            } else if (element.hasAttribute('data-i18n-title')) {
                element.title = text;
            } else if (element.hasAttribute('data-i18n-aria-label')) {
                element.setAttribute('aria-label', text);
            } else {
                element.textContent = text;
            }
        } else {
            console.warn(`No translation found for key: ${key}`);
        }
    }
    
    applyTranslations() {
        console.log('Applying translations...');
        
        // Update all registered elements
        this.translatableElements.forEach(({ element, key }) => {
            this.updateElementTranslation(element, key);
        });
        
        // Also update elements with data-i18n attributes
        const i18nElements = document.querySelectorAll('[data-i18n]');
        console.log(`Found ${i18nElements.length} elements with data-i18n attribute`);
        
        i18nElements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            console.log(`Updating element with key: ${key}`);
            this.updateElementTranslation(element, key);
        });
        
        // Update title
        const titleKey = document.documentElement.getAttribute('data-i18n-title');
        if (titleKey) {
            const translatedTitle = this.t(titleKey, document.title);
            console.log(`Updating title to: ${translatedTitle}`);
            document.title = translatedTitle;
        }
        
        console.log('Translations applied');
    }
}

// Initialize i18n
const i18n = new I18nManager();

// Export for use in other modules
window.i18n = i18n;

document.addEventListener('DOMContentLoaded', () => {
    // Load saved language preference
    const savedLanguage = localStorage.getItem('userLanguage');
    if (savedLanguage && savedLanguage !== i18n.currentLanguage) {
        i18n.changeLanguage(savedLanguage);
    }
    
    // Add language switcher to the menu
    const menu = document.querySelector('.top-menu ul');
    if (menu) {
        const langSwitcher = document.createElement('li');
        langSwitcher.className = 'language-switcher';
        
        // Create language options with flags and language codes
        const languageOptions = {
            'en': '🇬🇧 EN',
            'pl': '🇵🇱 PL',
            'de': '🇩🇪 DE',
            'es': '🇪🇸 ES'
        };
        
        // Generate select options
        let options = '';
        for (const [code, label] of Object.entries(languageOptions)) {
            const selected = i18n.currentLanguage === code ? 'selected' : '';
            options += `<option value="${code}" ${selected}>${label}</option>`;
        }
        
        langSwitcher.innerHTML = `
            <select id="language-selector" aria-label="Select language">
                ${options}
            </select>
        `;
        
        menu.appendChild(langSwitcher);
        
        // Add event listener for language change
        const selector = document.getElementById('language-selector');
        if (selector) {
            selector.addEventListener('change', (e) => {
                i18n.changeLanguage(e.target.value);
            });
        }
    }
});
