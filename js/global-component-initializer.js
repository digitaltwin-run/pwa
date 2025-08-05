// Digital Twin IDE - Global Component Initializer
// Provides global initialization functions for SVG components called via onload

// Import the component manifest
import manifest from './components/manifest.json';

/**
 * Global Component Initializer - Dynamically loads and initializes components
 * based on the manifest.json configuration.
 */
class GlobalComponentInitializer {
    constructor() {
        this.initializers = new Map();
        this.manifest = manifest;
        this.componentTypes = [];
        this.setupGlobalFunctions();
        this.loadComponentInitializers();
    }

    /**
     * Register an initializer function for a component type
     * @param {string} type - The component type (e.g., 'pump', 'valve')
     * @param {Function} initFunction - The initialization function for the component
     */
    register(type, initFunction) {
        this.initializers.set(type, initFunction);
        console.log(`[GlobalComponentInitializer] Registered ${type} initializer`);
    }

    /**
     * Load component initializers dynamically based on the manifest
     */
    async loadComponentInitializers() {
        try {
            if (!this.manifest || !Array.isArray(this.manifest.components)) {
                throw new Error('Invalid or missing component manifest');
            }

            // Get the list of components to preload from the manifest
            const componentsToLoad = this.manifest.preload || [];
            
            // Create a mapping of component types to their module paths
            const componentModules = this.manifest.components.reduce((acc, component) => {
                if (component.type && component.modulePath) {
                    acc[component.type] = component.modulePath;
                    this.componentTypes.push(component.type);
                }
                return acc;
            }, {});
            
            // Dynamically import and register each component initializer
            for (const componentType of componentsToLoad) {
                const modulePath = componentModules[componentType];
                if (modulePath) {
                    await this.registerDynamicComponent(componentType, modulePath);
                } else {
                    console.warn(`[GlobalComponentInitializer] No module path found for component type: ${componentType}`);
                }
            }
            
            // Dispatch event when all components are loaded
            document.dispatchEvent(new CustomEvent('component-system-ready', {
                detail: { componentTypes: this.componentTypes }
            }));
            
            console.log(`[GlobalComponentInitializer] Loaded ${this.initializers.size} component initializers`);
        } catch (error) {
            console.error('[GlobalComponentInitializer] Error loading component initializers:', error);
            throw error;
        }
    }
    
    /**
     * Register a component type with dynamic import
     * @param {string} type - The component type (e.g., 'pump')
     * @param {string} modulePath - The path to the component module
     */
    async registerDynamicComponent(type, modulePath) {
        try {
            // Convert relative path to absolute if needed
            const fullPath = modulePath.startsWith('/') ? 
                `.${modulePath}` : 
                `./components/${modulePath}`;
            
            // Remove file extension if present
            const cleanPath = fullPath.replace(/\.js$/, '');
            
            // Dynamically import the component module
            const module = await import(cleanPath);
            
            // The init function should be exported as 'init{ComponentType}' or as default
            const initFnName = `init${type.charAt(0).toUpperCase() + type.slice(1)}`;
            const initFn = module[initFnName] || module.default || module.init;
            
            if (typeof initFn === 'function') {
                this.register(type, initFn);
            } else {
                throw new Error(`No valid initializer function found for ${type}`);
            }
        } catch (error) {
            console.error(`[GlobalComponentInitializer] Failed to load ${type} from ${modulePath}:`, error);
            throw error;
        }
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
     * This dynamically creates global init functions based on loaded components
     */
    setupGlobalFunctions() {
        // Set up the generic initializer that can be called directly
        window.initComponent = (evt, type) => {
            if (!type) {
                console.error('[GlobalComponentInitializer] Component type not specified');
                return;
            }
            return this.initComponent(evt, type);
        };
        
        // Create a proxy to handle dynamic component initializers
        const handler = {
            get: (target, prop) => {
                // Handle existing properties
                if (prop in target) {
                    return target[prop];
                }
                
                // Handle dynamic initializers (initPump, initValve, etc.)
                if (prop.startsWith('init') && prop.length > 4) {
                    const type = prop.substring(4).toLowerCase();
                    if (this.componentTypes.includes(type)) {
                        return (evt) => this.initComponent(evt, type);
                    }
                    
                    // If the component type exists in manifest but not yet loaded
                    const componentInfo = this.manifest.components.find(c => c.type.toLowerCase() === type);
                    if (componentInfo) {
                        return async (evt) => {
                            try {
                                await this.registerDynamicComponent(componentInfo.type, componentInfo.modulePath);
                                return this.initComponent(evt, type);
                            } catch (error) {
                                console.error(`[GlobalComponentInitializer] Failed to initialize ${type}:`, error);
                            }
                        };
                    }
                    
                    // Return a function that will log an error
                    return () => {
                        console.error(`[GlobalComponentInitializer] Unknown component type: ${type}`);
                    };
                }
                
                // Default behavior
                return target[prop];
            },
            set: (target, prop, value) => {
                target[prop] = value;
                return true;
            }
        };
        
        // Create a proxy for the window object
        const windowProxy = new Proxy(window, handler);
        
        // Override the global window object with our proxy
        global.window = windowProxy;
        
        // Register a method to add new component types at runtime
        window.registerComponentType = async (type, modulePath) => {
            try {
                if (!this.componentTypes.includes(type)) {
                    await this.registerDynamicComponent(type, modulePath);
                    this.componentTypes.push(type);
                    console.log(`[GlobalComponentInitializer] Registered new component type: ${type}`);
                    return true;
                }
                return false;
            } catch (error) {
                console.error(`[GlobalComponentInitializer] Failed to register component type ${type}:`, error);
                throw error;
            }
        };
        
        console.log('[GlobalComponentInitializer] Global functions initialized');
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
