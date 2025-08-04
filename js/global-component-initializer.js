// Digital Twin IDE - Global Component Initializer
// Provides global initialization functions for SVG components called via onload

import { initPump } from './components/pump.js';

/**
 * Global Component Initializer - Bridges SVG onload calls to ES6 modules
 */
class GlobalComponentInitializer {
    constructor() {
        this.initializers = new Map();
        this.setupGlobalFunctions();
        this.registerDefaultInitializers();
    }

    /**
     * Register an initializer function for a component type
     */
    register(type, initFunction) {
        this.initializers.set(type, initFunction);
        console.log(`[GlobalComponentInitializer] Registered ${type} initializer`);
    }

    /**
     * Register default component initializers
     */
    registerDefaultInitializers() {
        this.register('pump', initPump);
        // Add more as needed:
        // this.register('valve', initValve);
        // this.register('sensor', initSensor);
    }

    /**
     * Generic component initialization dispatcher
     */
    initComponent(evt, type) {
        try {
            const svgElement = evt.target;
            const initializer = this.initializers.get(type);
            
            if (!initializer) {
                console.warn(`[GlobalComponentInitializer] No initializer found for type: ${type}`);
                return;
            }

            // Generate or get component ID
            let componentId = svgElement.getAttribute('data-id');
            if (!componentId) {
                componentId = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                svgElement.setAttribute('data-id', componentId);
            }

            // Add component type if missing
            if (!svgElement.getAttribute('data-component-type')) {
                svgElement.setAttribute('data-component-type', type);
            }

            console.log(`[GlobalComponentInitializer] Initializing ${type} component: ${componentId}`);
            
            // Call the specific initializer
            initializer(svgElement, componentId);
            
            // Mark as initialized
            svgElement.setAttribute('data-initialized', 'true');
            
            // Dispatch initialization complete event
            const initEvent = new CustomEvent('component-initialized', {
                detail: { type, componentId, element: svgElement }
            });
            document.dispatchEvent(initEvent);

        } catch (error) {
            console.error(`[GlobalComponentInitializer] Error initializing ${type} component:`, error);
        }
    }

    /**
     * Setup global functions that SVG files can call
     */
    setupGlobalFunctions() {
        // Create global initialization functions for each component type
        window.initPump = (evt) => this.initComponent(evt, 'pump');
        window.initValve = (evt) => this.initComponent(evt, 'valve');
        window.initSensor = (evt) => this.initComponent(evt, 'sensor');
        window.initTank = (evt) => this.initComponent(evt, 'tank');
        window.initDisplay = (evt) => this.initComponent(evt, 'display');
        window.initMotor = (evt) => this.initComponent(evt, 'motor');
        window.initButton = (evt) => this.initComponent(evt, 'button');
        window.initLed = (evt) => this.initComponent(evt, 'led');
        window.initGauge = (evt) => this.initComponent(evt, 'gauge');
        
        // Generic initializer
        window.initComponent = (evt, type) => this.initComponent(evt, type);
    }

    /**
     * Get all registered component types
     */
    getRegisteredTypes() {
        return Array.from(this.initializers.keys());
    }

    /**
     * Check if a component type is registered
     */
    isRegistered(type) {
        return this.initializers.has(type);
    }
}

// Create global instance
const globalComponentInitializer = new GlobalComponentInitializer();

// Export for module use
export default globalComponentInitializer;

// Make available globally for debugging
window.globalComponentInitializer = globalComponentInitializer;

console.log('🔧 Global Component Initializer loaded - SVG onload functions now available');
