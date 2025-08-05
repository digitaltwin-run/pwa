// Digital Twin IDE - Translation Manager Module
// Handles translation storage, retrieval, and embedded translations

export class TranslationManager {
    constructor() {
        this.translations = new Map();
        this.loadedLanguages = new Set();
        this.fallbackChain = ['en', 'pl'];
        
        console.log('[TranslationManager] Initialized translation storage');
    }

    /**
     * Add translations for a language
     * @param {string} langCode - Language code
     * @param {Object} translations - Translation object
     */
    addTranslations(langCode, translations) {
        if (!this.translations.has(langCode)) {
            this.translations.set(langCode, {});
        }

        const existing = this.translations.get(langCode);
        Object.assign(existing, translations);

        this.loadedLanguages.add(langCode);
        
        console.log(`[TranslationManager] Added ${Object.keys(translations).length} translations for ${langCode}`);
    }

    /**
     * Get translation for a key
     * @param {string} key - Translation key
     * @param {string} langCode - Language code
     * @param {Object} params - Interpolation parameters
     * @returns {string} Translated text
     */
    getTranslation(key, langCode, params = {}) {
        // Try current language first
        let translation = this.getTranslationFromLanguage(key, langCode);
        
        // Fallback through chain if not found
        if (!translation) {
            for (const fallbackLang of this.fallbackChain) {
                if (fallbackLang !== langCode) {
                    translation = this.getTranslationFromLanguage(key, fallbackLang);
                    if (translation) {
                        console.warn(`[TranslationManager] Used fallback ${fallbackLang} for key: ${key}`);
                        break;
                    }
                }
            }
        }
        
        // Return key if no translation found
        if (!translation) {
            console.warn(`[TranslationManager] No translation found for key: ${key}`);
            return key;
        }

        // Apply parameter interpolation
        return this.interpolate(translation, params);
    }

    /**
     * Get translation from specific language
     * @param {string} key - Translation key
     * @param {string} langCode - Language code
     * @returns {string|null} Translation or null
     */
    getTranslationFromLanguage(key, langCode) {
        const langTranslations = this.translations.get(langCode);
        if (!langTranslations) return null;

        // Support nested keys (e.g., "menu.file.new")
        const keys = key.split('.');
        let value = langTranslations;
        
        for (const k of keys) {
            if (value && typeof value === 'object' && value[k] !== undefined) {
                value = value[k];
            } else {
                return null;
            }
        }
        
        return typeof value === 'string' ? value : null;
    }

    /**
     * Interpolate parameters in translation text
     * @param {string} text - Text with placeholders
     * @param {Object} params - Parameters to interpolate
     * @returns {string} Interpolated text
     */
    interpolate(text, params) {
        if (!params || Object.keys(params).length === 0) {
            return text;
        }

        return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return params[key] !== undefined ? params[key] : match;
        });
    }

    /**
     * Check if language is loaded
     * @param {string} langCode - Language code
     * @returns {boolean} Whether language is loaded
     */
    isLanguageLoaded(langCode) {
        return this.loadedLanguages.has(langCode);
    }

    /**
     * Get all loaded languages
     * @returns {Array} Array of loaded language codes
     */
    getLoadedLanguages() {
        return Array.from(this.loadedLanguages);
    }

    /**
     * Get all translations for a language
     * @param {string} langCode - Language code
     * @returns {Object|null} All translations or null
     */
    getAllTranslations(langCode) {
        return this.translations.get(langCode) || null;
    }

    /**
     * Remove translations for a language
     * @param {string} langCode - Language code
     */
    removeLanguage(langCode) {
        this.translations.delete(langCode);
        this.loadedLanguages.delete(langCode);
        console.log(`[TranslationManager] Removed translations for ${langCode}`);
    }

    /**
     * Clear all translations
     */
    clearAll() {
        this.translations.clear();
        this.loadedLanguages.clear();
        console.log('[TranslationManager] Cleared all translations');
    }

    /**
     * Get embedded translations for a language (fallback when files not available)
     * @param {string} langCode - Language code
     * @returns {Object|null} Embedded translations or null
     */
    getEmbeddedTranslations(langCode) {
        const embeddedTranslations = {
            'en': {
                // Application Core
                'app.title': 'Digital Twin IDE',
                'app.description': 'Industrial Digital Twin Development Environment',
                'app.loading': 'Loading...',
                'app.error': 'Error',
                'app.success': 'Success',
                'app.warning': 'Warning',
                'app.info': 'Information',

                // Menu System
                'menu.file': 'File',
                'menu.file.new': 'New',
                'menu.file.open': 'Open',
                'menu.file.save': 'Save',
                'menu.file.save_as': 'Save As',
                'menu.file.export': 'Export',
                'menu.file.import': 'Import',
                'menu.file.exit': 'Exit',

                'menu.edit': 'Edit',
                'menu.edit.undo': 'Undo',
                'menu.edit.redo': 'Redo',
                'menu.edit.cut': 'Cut',
                'menu.edit.copy': 'Copy',
                'menu.edit.paste': 'Paste',
                'menu.edit.delete': 'Delete',
                'menu.edit.select_all': 'Select All',

                'menu.view': 'View',
                'menu.view.zoom_in': 'Zoom In',
                'menu.view.zoom_out': 'Zoom Out',
                'menu.view.zoom_reset': 'Reset Zoom',
                'menu.view.fullscreen': 'Fullscreen',

                'menu.tools': 'Tools',
                'menu.tools.settings': 'Settings',
                'menu.tools.debug': 'Debug',

                'menu.help': 'Help',
                'menu.help.about': 'About',
                'menu.help.documentation': 'Documentation',

                // Properties Panel
                'properties.title': 'Properties',
                'properties.component_id': 'Component ID',
                'properties.component_type': 'Component Type',
                'properties.position': 'Position',
                'properties.size': 'Size',
                'properties.colors': 'Colors',
                'properties.parameters': 'Parameters',
                'properties.interactions': 'Interactions',
                'properties.copy': 'Copy',
                'properties.clear_all': 'Clear All',
                'properties.select_all': 'Select All',
                'properties.multi_selection': 'Multi-Selection',
                'properties.selected_components': 'components selected',
                'properties.scale': 'Scale',
                'properties.zoom_level': 'Zoom Level',
                'properties.mixed_values': 'Mixed values',
                'properties.color': 'Color',
                'properties.batch_actions': 'Batch Actions',
                'properties.copy_all': 'Copy All',
                'properties.delete_all': 'Delete All',
                'properties.confirm_delete_multiple': 'Delete',
                'properties.components': 'components',

                // Canvas Properties
                'canvas.title': 'Canvas Properties',
                'canvas.size': 'Canvas Size',
                'canvas.width': 'Width',
                'canvas.height': 'Height',
                'canvas.background': 'Background',
                'canvas.background_color': 'Background Color',
                'canvas.grid': 'Grid',
                'canvas.grid_size': 'Grid Size',
                'canvas.grid_color': 'Grid Color',
                'canvas.large_grid_color': 'Large Grid Color',
                'canvas.small_grid_color': 'Small Grid Color',
                'canvas.zoom': 'Zoom',

                // Components
                'components.title': 'Components',
                'components.add': 'Add Component',
                'components.remove': 'Remove Component',
                'components.duplicate': 'Duplicate',
                'components.pump': 'Pump',
                'components.valve': 'Valve',
                'components.sensor': 'Sensor',
                'components.display': 'Display',
                'components.led': 'LED',
                'components.tank': 'Tank',
                'components.pipe': 'Pipe',

                // Interactions
                'interactions.title': 'Interactions',
                'interactions.add': 'Add Interaction',
                'interactions.edit': 'Edit Interaction',
                'interactions.remove': 'Remove Interaction',
                'interactions.trigger': 'Trigger',
                'interactions.condition': 'Condition',
                'interactions.action': 'Action',

                // Common UI
                'ui.ok': 'OK',
                'ui.cancel': 'Cancel',
                'ui.apply': 'Apply',
                'ui.close': 'Close',
                'ui.save': 'Save',
                'ui.reset': 'Reset',
                'ui.delete': 'Delete',
                'ui.edit': 'Edit',
                'ui.view': 'View',
                'ui.hide': 'Hide',
                'ui.show': 'Show',
                'ui.enable': 'Enable',
                'ui.disable': 'Disable',
                'ui.yes': 'Yes',
                'ui.no': 'No',

                // Colors
                'colors.red': 'Red',
                'colors.green': 'Green',
                'colors.blue': 'Blue',
                'colors.yellow': 'Yellow',
                'colors.orange': 'Orange',
                'colors.purple': 'Purple',
                'colors.pink': 'Pink',
                'colors.brown': 'Brown',
                'colors.black': 'Black',
                'colors.white': 'White',
                'colors.gray': 'Gray',

                // Simulation
                'simulation.title': 'Simulation',
                'simulation.start': 'Start',
                'simulation.stop': 'Stop',
                'simulation.pause': 'Pause',
                'simulation.reset': 'Reset',
                'simulation.speed': 'Speed',
                'simulation.data': 'Simulation Data',

                // Status Messages
                'status.ready': 'Ready',
                'status.loading': 'Loading...',
                'status.saving': 'Saving...',
                'status.saved': 'Saved',
                'status.error': 'Error occurred',
                'status.success': 'Operation successful',

                // Font Properties
                'font.family': 'Font Family',
                'font.size': 'Font Size',
                'font.weight': 'Font Weight',
                'font.style': 'Font Style',

                // Scale/Zoom
                'scale.title': 'Scale',
                'scale.zoom_in': 'Zoom In',
                'scale.zoom_out': 'Zoom Out',
                'scale.reset': 'Reset Scale'
            },

            'pl': {
                // Application Core
                'app.title': 'Edytor Cyfrowych Bliźniaków',
                'app.description': 'Środowisko Rozwoju Przemysłowych Cyfrowych Bliźniaków',
                'app.loading': 'Ładowanie...',
                'app.error': 'Błąd',
                'app.success': 'Sukces',
                'app.warning': 'Ostrzeżenie',
                'app.info': 'Informacja',

                // Menu System
                'menu.file': 'Plik',
                'menu.file.new': 'Nowy',
                'menu.file.open': 'Otwórz',
                'menu.file.save': 'Zapisz',
                'menu.file.save_as': 'Zapisz jako',
                'menu.file.export': 'Eksportuj',
                'menu.file.import': 'Importuj',
                'menu.file.exit': 'Wyjście',

                'menu.edit': 'Edycja',
                'menu.edit.undo': 'Cofnij',
                'menu.edit.redo': 'Ponów',
                'menu.edit.cut': 'Wytnij',
                'menu.edit.copy': 'Kopiuj',
                'menu.edit.paste': 'Wklej',
                'menu.edit.delete': 'Usuń',
                'menu.edit.select_all': 'Zaznacz wszystko',

                'menu.view': 'Widok',
                'menu.view.zoom_in': 'Powiększ',
                'menu.view.zoom_out': 'Pomniejsz',
                'menu.view.zoom_reset': 'Resetuj powiększenie',
                'menu.view.fullscreen': 'Pełny ekran',

                'menu.tools': 'Narzędzia',
                'menu.tools.settings': 'Ustawienia',
                'menu.tools.debug': 'Debugowanie',

                'menu.help': 'Pomoc',
                'menu.help.about': 'O programie',
                'menu.help.documentation': 'Dokumentacja',

                // Properties Panel
                'properties.title': 'Właściwości',
                'properties.component_id': 'ID komponentu',
                'properties.component_type': 'Typ komponentu',
                'properties.position': 'Pozycja',
                'properties.size': 'Rozmiar',
                'properties.colors': 'Kolory',
                'properties.parameters': 'Parametry',
                'properties.interactions': 'Interakcje',
                'properties.copy': 'Kopiuj',
                'properties.clear_all': 'Wyczyść wszystko',
                'properties.select_all': 'Zaznacz wszystko',
                'properties.multi_selection': 'Wybór Wielokrotny',
                'properties.selected_components': 'wybranych komponentów',
                'properties.scale': 'Skala',
                'properties.zoom_level': 'Poziom Powiększenia',
                'properties.mixed_values': 'Mieszane wartości',
                'properties.color': 'Kolor',
                'properties.batch_actions': 'Akcje Zbiorcze',
                'properties.copy_all': 'Kopiuj Wszystkie',
                'properties.delete_all': 'Usuń Wszystkie',
                'properties.confirm_delete_multiple': 'Usuń',
                'properties.components': 'komponenty',

                // Canvas Properties
                'canvas.title': 'Właściwości płótna',
                'canvas.size': 'Rozmiar płótna',
                'canvas.width': 'Szerokość',
                'canvas.height': 'Wysokość',
                'canvas.background': 'Tło',
                'canvas.background_color': 'Kolor tła',
                'canvas.grid': 'Siatka',
                'canvas.grid_size': 'Rozmiar siatki',
                'canvas.grid_color': 'Kolor siatki',
                'canvas.large_grid_color': 'Kolor dużej siatki',
                'canvas.small_grid_color': 'Kolor małej siatki',
                'canvas.zoom': 'Powiększenie',

                // Components
                'components.title': 'Komponenty',
                'components.add': 'Dodaj komponent',
                'components.remove': 'Usuń komponent',
                'components.duplicate': 'Duplikuj',
                'components.pump': 'Pompa',
                'components.valve': 'Zawór',
                'components.sensor': 'Czujnik',
                'components.display': 'Wyświetlacz',
                'components.led': 'LED',
                'components.tank': 'Zbiornik',
                'components.pipe': 'Rura',

                // Interactions
                'interactions.title': 'Interakcje',
                'interactions.add': 'Dodaj interakcję',
                'interactions.edit': 'Edytuj interakcję',
                'interactions.remove': 'Usuń interakcję',
                'interactions.trigger': 'Wyzwalacz',
                'interactions.condition': 'Warunek',
                'interactions.action': 'Akcja',

                // Common UI
                'ui.ok': 'OK',
                'ui.cancel': 'Anuluj',
                'ui.apply': 'Zastosuj',
                'ui.close': 'Zamknij',
                'ui.save': 'Zapisz',
                'ui.reset': 'Resetuj',
                'ui.delete': 'Usuń',
                'ui.edit': 'Edytuj',
                'ui.view': 'Pokaż',
                'ui.hide': 'Ukryj',
                'ui.show': 'Pokaż',
                'ui.enable': 'Włącz',
                'ui.disable': 'Wyłącz',
                'ui.yes': 'Tak',
                'ui.no': 'Nie',

                // Colors
                'colors.red': 'Czerwony',
                'colors.green': 'Zielony',
                'colors.blue': 'Niebieski',
                'colors.yellow': 'Żółty',
                'colors.orange': 'Pomarańczowy',
                'colors.purple': 'Fioletowy',
                'colors.pink': 'Różowy',
                'colors.brown': 'Brązowy',
                'colors.black': 'Czarny',
                'colors.white': 'Biały',
                'colors.gray': 'Szary',

                // Simulation
                'simulation.title': 'Symulacja',
                'simulation.start': 'Start',
                'simulation.stop': 'Stop',
                'simulation.pause': 'Pauza',
                'simulation.reset': 'Reset',
                'simulation.speed': 'Prędkość',
                'simulation.data': 'Dane symulacji',

                // Status Messages
                'status.ready': 'Gotowy',
                'status.loading': 'Ładowanie...',
                'status.saving': 'Zapisywanie...',
                'status.saved': 'Zapisano',
                'status.error': 'Wystąpił błąd',
                'status.success': 'Operacja zakończona sukcesem',

                // Font Properties
                'font.family': 'Rodzina czcionki',
                'font.size': 'Rozmiar czcionki',
                'font.weight': 'Grubość czcionki',
                'font.style': 'Styl czcionki',

                // Scale/Zoom
                'scale.title': 'Skala',
                'scale.zoom_in': 'Powiększ',
                'scale.zoom_out': 'Pomniejsz',
                'scale.reset': 'Resetuj skalę'
            }
        };

        const translations = embeddedTranslations[langCode];
        if (translations) {
            console.log(`[TranslationManager] Using embedded translations for ${langCode} (${Object.keys(translations).length} keys)`);
            return translations;
        }

        return null;
    }

    /**
     * Search for translations by pattern
     * @param {string} pattern - Search pattern (regex or string)
     * @param {string} langCode - Language code to search in
     * @returns {Array} Array of matching translations
     */
    searchTranslations(pattern, langCode) {
        const translations = this.getAllTranslations(langCode);
        if (!translations) return [];

        const results = [];
        const regex = new RegExp(pattern, 'i');

        const searchInObject = (obj, prefix = '') => {
            for (const [key, value] of Object.entries(obj)) {
                const fullKey = prefix ? `${prefix}.${key}` : key;
                
                if (typeof value === 'string') {
                    if (regex.test(fullKey) || regex.test(value)) {
                        results.push({
                            key: fullKey,
                            value: value
                        });
                    }
                } else if (typeof value === 'object') {
                    searchInObject(value, fullKey);
                }
            }
        };

        searchInObject(translations);
        return results;
    }

    /**
     * Get translation statistics
     * @returns {Object} Translation statistics
     */
    getStatistics() {
        const stats = {
            totalLanguages: this.loadedLanguages.size,
            languages: {},
            totalKeys: 0
        };

        for (const langCode of this.loadedLanguages) {
            const translations = this.getAllTranslations(langCode);
            const keyCount = this.countKeys(translations);
            
            stats.languages[langCode] = {
                keyCount: keyCount,
                loaded: true
            };
            
            stats.totalKeys = Math.max(stats.totalKeys, keyCount);
        }

        return stats;
    }

    /**
     * Count keys in translation object (including nested)
     * @param {Object} obj - Translation object
     * @returns {number} Number of keys
     */
    countKeys(obj) {
        let count = 0;
        
        const countInObject = (o) => {
            for (const value of Object.values(o)) {
                if (typeof value === 'string') {
                    count++;
                } else if (typeof value === 'object') {
                    countInObject(value);
                }
            }
        };
        
        if (obj) {
            countInObject(obj);
        }
        
        return count;
    }
}
