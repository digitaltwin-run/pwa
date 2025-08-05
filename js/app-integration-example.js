/**
 * PRZYKŁAD INTEGRACJI: Zastąpienie event listeners w app.js
 * Registry-driven App Functions
 * 
 * PRZED (tradycyjne):
 * exportBtn.addEventListener('click', () => this.exportManager.exportProject());
 * 
 * PO (registry-driven):
 * appRegistry.registerAppFunction('export_project', { ... });
 */

import { createAppFunctionRegistry } from './utils/app-function-registry.js';

/**
 * Enhanced DigitalTwinApp z Event Registry
 */
class EnhancedDigitalTwinApp {
    constructor() {
        // Zachowaj oryginalną strukturę
        this.componentManager = null;
        this.dragDropManager = null;
        this.propertiesManager = null;
        this.exportManager = null;
        // ... inne managers
        
        // NOWY: App Function Registry
        this.appRegistry = null;
        
        console.info('🚀 Enhanced DigitalTwinApp with Event Registry');
    }

    async init() {
        // Oryginalny kod inicjalizacji...
        await this.initializeManagers();
        
        // NOWY: Inicjalizuj Event Registry
        await this.initializeAppRegistry();
        
        // ZASTĄP setupEventListeners()
        // this.setupEventListeners(); // <-- USUŃ TO
        this.setupRegistryBasedEvents(); // <-- DODAJ TO
        
        console.info('✅ Enhanced app initialized with Registry-based events');
    }

    /**
     * Inicjalizuj App Function Registry (NOWE)
     */
    async initializeAppRegistry() {
        console.info('🏗️ Inicjalizacja App Function Registry...');
        
        this.appRegistry = createAppFunctionRegistry(this);
        
        // Zarejestruj dodatkowe custom funkcje
        this.registerCustomAppFunctions();
        
        // Rozpocznij monitoring
        this.appRegistry.startAppFunctionMonitoring();
        
        // Udostępnij globalnie dla debugowania
        window.appRegistry = this.appRegistry;
        
        console.info('✅ App Registry aktywny');
    }

    /**
     * Registry-based events (ZASTĘPUJE setupEventListeners)
     */
    setupRegistryBasedEvents() {
        console.info('📋 Konfiguracja Registry-based events...');
        
        // Wszystkie event handlers są teraz w registry!
        // Żadnych bezpośrednich addEventListener calls
        
        // Dodatkowe custom event patterns
        this.registerAdvancedEventPatterns();
        
        console.info('✅ Registry-based events skonfigurowane');
    }

    /**
     * Dodatkowe custom funkcje aplikacji
     */
    registerCustomAppFunctions() {
        // CANVAS ZOOM (nowa funkcja)
        this.appRegistry.registerAppFunction('canvas_zoom', {
            name: 'Canvas Zoom',
            description: 'Zoom canvas przy scroll + Ctrl',
            eventPattern: {
                type: 'mouse',
                events: ['wheel'],
                conditions: [{
                    type: 'wheel_with_ctrl'
                }]
            },
            handler: async (eventData, app) => {
                if (eventData.ctrlKey && app.canvasZoomManager) {
                    const delta = eventData.deltaY > 0 ? -0.1 : 0.1;
                    app.canvasZoomManager.zoomBy(delta);
                    eventData.preventDefault?.();
                }
            },
            conditions: [{
                type: 'element_exists',
                selector: '#svg-canvas'
            }]
        });

        // MULTI-SELECT (nowa funkcja)
        this.appRegistry.registerAppFunction('multi_select', {
            name: 'Multi Component Select',
            description: 'Zaznaczenie wielu komponentów z Ctrl+Click',
            eventPattern: {
                type: 'component',
                events: ['click'],
                conditions: [{
                    type: 'ctrl_click_component'
                }]
            },
            handler: async (eventData, app) => {
                if (eventData.ctrlKey && app.canvasSelectionManager) {
                    const component = eventData.target?.closest('.draggable-component');
                    if (component) {
                        app.canvasSelectionManager.toggleSelection(component);
                    }
                }
            }
        });

        // CONNECTION MODE ESCAPE
        this.appRegistry.registerAppFunction('escape_connection_mode', {
            name: 'Escape Connection Mode',
            description: 'Wyjście z trybu połączeń klawiszem Escape',
            eventPattern: {
                type: 'keyboard',
                events: ['keydown'],
                conditions: [{
                    type: 'key_press',
                    key: 'Escape'
                }]
            },
            handler: async (eventData, app) => {
                if (app.connectionManager?.isConnectionMode) {
                    app.connectionManager.toggleConnectionMode();
                    console.info('🚪 Wyszedł z trybu połączeń');
                }
            }
        });

        // WINDOW RESIZE
        this.appRegistry.registerAppFunction('window_resize', {
            name: 'Window Resize Handler',
            description: 'Aktualizacja rozmiaru SVG po zmianie okna',
            eventPattern: {
                type: 'window',
                events: ['resize'],
                conditions: []
            },
            handler: async (eventData, app) => {
                if (app.dragDropManager) {
                    app.dragDropManager.updateSvgSize();
                    console.info('📐 Rozmiar SVG zaktualizowany');
                }
            },
            cooldown: 100 // Throttle resize events
        });
    }

    /**
     * Zaawansowane event patterns
     */
    registerAdvancedEventPatterns() {
        // WORKFLOW DETECTION (poziom wyższy)
        this.appRegistry.registerAppFunction('component_workflow', {
            name: 'Component Creation Workflow',
            description: 'Wykrywa kompletny workflow tworzenia komponentu',
            eventPattern: {
                type: 'workflow',
                events: ['component_added', 'component_positioned', 'properties_edited'],
                conditions: [{
                    type: 'workflow_sequence',
                    sequence: ['drag_from_palette', 'drop_on_canvas', 'edit_properties']
                }]
            },
            handler: async (eventData, app) => {
                console.info('🎯 Kompletny workflow tworzenia komponentu wykryty!', eventData);
                
                // Możemy teraz robić analytics, tips dla użytkownika, etc.
                if (app.analyticsManager) {
                    app.analyticsManager.recordWorkflow('component_creation', eventData);
                }
            }
        });

        // PERFORMANCE MONITORING
        this.appRegistry.registerAppFunction('performance_monitor', {
            name: 'Performance Monitor',
            description: 'Monitor wydajności operacji',
            eventPattern: {
                type: 'performance',
                events: ['long_operation'],
                conditions: [{
                    type: 'operation_duration',
                    threshold: 1000 // > 1 sekunda
                }]
            },
            handler: async (eventData, app) => {
                console.warn('⚠️ Wolna operacja wykryta:', eventData);
                
                // Automatyczna optymalizacja
                if (eventData.operation === 'canvas_render' && app.canvasOptimizer) {
                    app.canvasOptimizer.enablePerformanceMode();
                }
            }
        });
    }

    /**
     * Pobierz raport funkcji aplikacji
     */
    getAppFunctionReport() {
        return this.appRegistry?.getAppFunctionReport() || null;
    }

    /**
     * Toggle funkcji (do debugowania)
     */
    toggleAppFunction(functionId, enabled = null) {
        return this.appRegistry?.toggleFunction(functionId, enabled) || false;
    }

    /**
     * Cleanup przy zamknięciu
     */
    destroy() {
        if (this.appRegistry) {
            this.appRegistry.stopAppFunctionMonitoring();
        }
        
        // Inne cleanup...
    }
}

/**
 * MIGRATION GUIDE: Jak zastąpić istniejący app.js
 */
export const migrationGuide = {
    instructions: `
📚 MIGRATION GUIDE: app.js → Registry-based Events

1. ZASTĄP KLASĘ:
   - class DigitalTwinApp → class EnhancedDigitalTwinApp

2. USUŃ setupEventListeners():
   - Usuń cały blok addEventListener calls
   - Zastąp wywołaniem setupRegistryBasedEvents()

3. DODAJ DO KONSTRUKTORA:
   - this.appRegistry = null;

4. DODAJ DO init():
   - await this.initializeAppRegistry();

5. ZAIMPORTUJ:
   - import { createAppFunctionRegistry } from './utils/app-function-registry.js';

6. TESTOWANIE:
   - window.appRegistry.getAppFunctionReport()
   - window.appRegistry.toggleFunction('export_project', false)

REZULTAT:
- ✅ Zero bezpośrednich event listeners
- ✅ Wszystkie funkcje przez registry
- ✅ Monitoring i analytics out-of-the-box
- ✅ Łatwe włączanie/wyłączanie funkcji
- ✅ Performance monitoring
- ✅ Workflow detection
    `,
    
    beforeAfterComparison: {
        before: `
// PRZED - tradycyjny sposób
exportBtn.addEventListener('click', () => {
    this.exportManager.exportProject();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Delete') {
        // kod delete
    }
});
        `,
        after: `
// PO - registry-driven
this.appRegistry.registerAppFunction('export_project', {
    eventPattern: { type: 'component', events: ['click'] },
    handler: async (data, app) => app.exportManager.exportProject(),
    conditions: [{ type: 'element_exists', selector: '#export-btn' }]
});
        `
    }
};

// Demo function
export function demonstrateRegistryIntegration() {
    console.info('🎯 DEMO: Registry-based App Functions');
    console.info('════════════════════════════════════');
    console.info('');
    console.info('🔧 KORZYŚCI:');
    console.info('  ✅ Centralne zarządzanie eventami');
    console.info('  ✅ Warunki wykonania');
    console.info('  ✅ Cooldown protection');
    console.info('  ✅ Performance monitoring');
    console.info('  ✅ Łatwe włączanie/wyłączanie');
    console.info('  ✅ Analytics i workflow detection');
    console.info('');
    console.info('📋 MIGRACJA:');
    console.info('  1. Zastąp class DigitalTwinApp');
    console.info('  2. Usuń setupEventListeners()');
    console.info('  3. Dodaj initializeAppRegistry()');
    console.info('');
    console.info('🚀 UŻYCIE:');
    console.info('  window.appRegistry.getAppFunctionReport()');
    console.info('  window.appRegistry.toggleFunction("export_project")');
    console.info('');
    
    return migrationGuide;
}

export default EnhancedDigitalTwinApp;
