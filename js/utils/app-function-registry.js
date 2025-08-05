/**
 * Registry Event-Driven App Functions
 * 
 * ZASTĘPUJE tradycyjne event listeners w app.js
 * UŻYWA selektywnego monitorowania do wykrywania zdarzeń dla funkcji aplikacji
 */

import SelectiveAnomalyMonitor from './selective-anomaly-monitor.js';

class AppFunctionRegistry {
    constructor(app) {
        this.app = app; // Referencja do głównej aplikacji
        this.monitor = new SelectiveAnomalyMonitor('app-functions-' + Date.now());
        this.registeredFunctions = new Map();
        this.isActive = false;
        
        console.info('🏗️ App Function Registry initialized');
    }

    /**
     * Zarejestruj funkcję aplikacji z event pattern
     */
    registerAppFunction(functionId, config) {
        const appFunction = {
            id: functionId,
            name: config.name,
            description: config.description,
            eventPattern: config.eventPattern, // Wzorzec zdarzenia
            handler: config.handler, // Funkcja do wykonania
            conditions: config.conditions || [], // Warunki wykonania
            cooldown: config.cooldown || 0, // Cooldown między wywołaniami
            lastExecution: null,
            executionCount: 0,
            enabled: config.enabled !== false
        };

        this.registeredFunctions.set(functionId, appFunction);
        
        // Zarejestruj w monitorze
        this.monitor.registerParameter(functionId, {
            type: config.eventPattern.type,
            events: config.eventPattern.events,
            conditions: config.eventPattern.conditions || [],
            onAnomaly: (anomaly, data) => {
                this.executeAppFunction(functionId, data, anomaly);
            }
        });

        console.info(`📋 Zarejestrowano funkcję aplikacji: ${functionId}`, appFunction);
        return functionId;
    }

    /**
     * Wykonaj funkcję aplikacji
     */
    async executeAppFunction(functionId, eventData, anomaly = null) {
        const appFunction = this.registeredFunctions.get(functionId);
        if (!appFunction || !appFunction.enabled) return;

        // Sprawdź cooldown
        if (appFunction.cooldown > 0 && appFunction.lastExecution) {
            const timeSince = Date.now() - appFunction.lastExecution;
            if (timeSince < appFunction.cooldown) {
                console.debug(`⏱️ Funkcja ${functionId} w cooldown (${timeSince}ms/${appFunction.cooldown}ms)`);
                return;
            }
        }

        // Sprawdź warunki
        if (appFunction.conditions.length > 0) {
            const conditionsMet = this.checkConditions(appFunction.conditions, eventData);
            if (!conditionsMet) {
                console.debug(`❌ Warunki nie spełnione dla ${functionId}`);
                return;
            }
        }

        try {
            console.info(`🎯 Wykonywanie funkcji aplikacji: ${functionId}`, eventData);
            
            // Wykonaj handler
            await appFunction.handler(eventData, this.app, anomaly);
            
            // Aktualizuj statystyki
            appFunction.lastExecution = Date.now();
            appFunction.executionCount++;
            
            console.info(`✅ Funkcja ${functionId} wykonana pomyślnie`);
            
        } catch (error) {
            console.error(`❌ Błąd wykonania funkcji ${functionId}:`, error);
            
            // Zgłoś anomalię
            this.monitor.reportAnomaly({
                type: 'app_function_error',
                functionId,
                error: error.message,
                eventData,
                timestamp: Date.now()
            });
        }
    }

    /**
     * Sprawdź warunki wykonania
     */
    checkConditions(conditions, eventData) {
        return conditions.every(condition => {
            switch (condition.type) {
                case 'element_exists':
                    return document.querySelector(condition.selector) !== null;
                    
                case 'app_state':
                    return this.app[condition.property] === condition.value;
                    
                case 'component_selected':
                    return this.app.propertiesManager && 
                           this.app.propertiesManager.getSelectedComponent() !== null;
                    
                case 'not_connection_mode':
                    return !this.app.connectionManager?.isConnectionMode;
                    
                case 'custom':
                    return condition.check(eventData, this.app);
                    
                default:
                    return true;
            }
        });
    }

    /**
     * Rozpocznij monitoring funkcji aplikacji
     */
    startAppFunctionMonitoring() {
        if (this.isActive) return;
        
        this.monitor.startMonitoring();
        this.isActive = true;
        
        console.info('🚀 App Function Monitoring aktywny');
        console.info(`📊 Monitorowane funkcje: ${this.registeredFunctions.size}`);
    }

    /**
     * Zatrzymaj monitoring
     */
    stopAppFunctionMonitoring() {
        if (!this.isActive) return;
        
        const report = this.monitor.stopMonitoring();
        this.isActive = false;
        
        console.info('🛑 App Function Monitoring zatrzymany');
        return {
            ...report,
            functionStats: this.getFunctionStats()
        };
    }

    /**
     * Statystyki funkcji aplikacji
     */
    getFunctionStats() {
        const stats = {};
        for (let [id, func] of this.registeredFunctions) {
            stats[id] = {
                name: func.name,
                enabled: func.enabled,
                executionCount: func.executionCount,
                lastExecution: func.lastExecution,
                averageDelay: func.lastExecution ? Date.now() - func.lastExecution : null
            };
        }
        return stats;
    }

    /**
     * Enable/disable funkcji
     */
    toggleFunction(functionId, enabled = null) {
        const func = this.registeredFunctions.get(functionId);
        if (!func) return false;
        
        func.enabled = enabled !== null ? enabled : !func.enabled;
        console.info(`🔄 Funkcja ${functionId} ${func.enabled ? 'włączona' : 'wyłączona'}`);
        return func.enabled;
    }

    /**
     * Pobierz raport wszystkich funkcji
     */
    getAppFunctionReport() {
        return {
            timestamp: new Date().toISOString(),
            totalFunctions: this.registeredFunctions.size,
            activeFunctions: Array.from(this.registeredFunctions.values()).filter(f => f.enabled).length,
            executionStats: this.getFunctionStats(),
            monitoringActive: this.isActive,
            anomalyReport: this.monitor.getAnomalyReport()
        };
    }
}

// Factory function do łatwej integracji z app.js
export function createAppFunctionRegistry(app) {
    const registry = new AppFunctionRegistry(app);
    
    // ZAREJESTRUJ STANDARDOWE FUNKCJE APLIKACJI
    registerStandardAppFunctions(registry);
    
    return registry;
}

/**
 * Rejestracja standardowych funkcji aplikacji (zastąpienie event listeners z app.js)
 */
function registerStandardAppFunctions(registry) {
    console.info('📋 Rejestracja standardowych funkcji aplikacji...');

    // 1. EXPORT PROJECT
    registry.registerAppFunction('export_project', {
        name: 'Export Project',
        description: 'Eksportuj projekt do pliku',
        eventPattern: {
            type: 'component',
            events: ['click'],
            conditions: [{
                type: 'element_click',
                selector: '#export-btn'
            }]
        },
        handler: async (eventData, app) => {
            if (app.exportManager) {
                await app.exportManager.exportProject();
            }
        },
        conditions: [{
            type: 'element_exists',
            selector: '#export-btn'
        }]
    });

    // 2. IMPORT PROJECT
    registry.registerAppFunction('import_project', {
        name: 'Import Project',
        description: 'Importuj projekt z pliku',
        eventPattern: {
            type: 'component',
            events: ['click'],
            conditions: [{
                type: 'element_click',
                selector: '#import-btn'
            }]
        },
        handler: async (eventData, app) => {
            if (app.exportManager) {
                await app.exportManager.importProject();
            }
        }
    });

    // 3. COMPONENT SELECTION
    registry.registerAppFunction('component_selection', {
        name: 'Component Selection',
        description: 'Zaznacz komponent na canvas',
        eventPattern: {
            type: 'component',
            events: ['click'],
            conditions: [{
                type: 'canvas_component_click'
            }]
        },
        handler: async (eventData, app) => {
            const component = eventData.target?.closest('.draggable-component');
            if (component && app.propertiesManager) {
                if (app.connectionManager?.isConnectionMode) {
                    app.connectionManager.startConnection(component);
                } else {
                    app.propertiesManager.selectComponent(component);
                }
            }
        },
        conditions: [{
            type: 'element_exists',
            selector: '#svg-canvas'
        }]
    });

    // 4. DELETE COMPONENT
    registry.registerAppFunction('delete_component', {
        name: 'Delete Component',
        description: 'Usuń zaznaczony komponent klawiszem Delete',
        eventPattern: {
            type: 'keyboard',
            events: ['keydown'],
            conditions: [{
                type: 'key_press',
                key: 'Delete'
            }]
        },
        handler: async (eventData, app) => {
            const selectedComponent = app.componentManager?.getSelectedComponent();
            if (selectedComponent && app.propertiesManager) {
                const selectedId = selectedComponent.getAttribute('data-id');
                if (selectedId) {
                    app.propertiesManager.removeComponent(selectedId);
                }
            }
        },
        conditions: [{
            type: 'component_selected'
        }]
    });

    // 5. START SIMULATION
    registry.registerAppFunction('start_simulation', {
        name: 'Start Simulation',
        description: 'Rozpocznij symulację',
        eventPattern: {
            type: 'component',
            events: ['click'],
            conditions: [{
                type: 'element_click',
                selector: '#start-sim-btn'
            }]
        },
        handler: async (eventData, app) => {
            if (app.simulationManager) {
                app.simulationManager.startSimulation();
            }
        },
        cooldown: 1000 // 1 sekunda cooldown
    });

    // 6. CANVAS PROPERTIES
    registry.registerAppFunction('show_canvas_properties', {
        name: 'Show Canvas Properties',
        description: 'Pokaż właściwości canvas po kliknięciu pustego miejsca',
        eventPattern: {
            type: 'component',
            events: ['click'],
            conditions: [{
                type: 'empty_canvas_click'
            }]
        },
        handler: async (eventData, app) => {
            if (app.propertiesManager && !app.connectionManager?.isConnectionMode) {
                app.propertiesManager.selectComponent(null);
                app.propertiesManager.showCanvasProperties();
            }
        },
        conditions: [{
            type: 'not_connection_mode'
        }]
    });

    console.info(`✅ Zarejestrowano ${registry.registeredFunctions.size} standardowych funkcji aplikacji`);
}

export default AppFunctionRegistry;
