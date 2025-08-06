// Digital Twin IDE - Component Loader Module
// Responsible for discovering, loading, and managing component modules

import { componentRegistry } from './component-registry.js';
import { componentInitializer } from './component-initializer.js';
import { ComponentIconLoader } from './utils/component-icon-loader.js';

/**
 * Component Loader - Handles dynamic loading of component modules
 * and initializes them in the registry
 */
export class ComponentLoader {
    constructor() {
        this.loadedModules = new Set();
        this.componentTypes = new Map();
        this.loadingPromises = new Map();
        this.baseComponentPath = '/js/components/';
    }

    /**
     * Initialize the component loader system
     * @returns {Promise} Promise that resolves when core components are loaded
     */
    async initialize() {
        console.log('[ComponentLoader] Initializing component loader system');
        
        try {
            // First try to load components manifest if available
            await this.loadComponentManifest();
            
            // Then ensure core components are loaded
            await this.ensureCoreComponentsLoaded();
            
            return true;
        } catch (error) {
            console.error('[ComponentLoader] Error initializing component system:', error);
            return false;
        }
    }

    /**
     * Load component manifest file if available
     * @returns {Promise} Promise that resolves when manifest is loaded
     */
    async loadComponentManifest() {
        try {
            const response = await fetch('/js/components/manifest.json');
            if (!response.ok) {
                console.warn('[ComponentLoader] Component manifest not found, will use dynamic discovery');
                return false;
            }
            
            const manifest = await response.json();
            
            if (manifest && manifest.components && Array.isArray(manifest.components)) {
                console.log(`[ComponentLoader] Found ${manifest.components.length} components in manifest`);
                
                // Register component types from manifest
                manifest.components.forEach(comp => {
                    this.componentTypes.set(comp.type, comp);
                });
                
                // Preload critical components if specified
                if (manifest.preload && Array.isArray(manifest.preload)) {
                    await Promise.all(
                        manifest.preload.map(type => this.loadComponentModule(type))
                    );
                }
                
                return true;
            }
        } catch (error) {
            console.warn('[ComponentLoader] Error loading component manifest:', error);
            return false;
        }
    }

    /**
     * Make sure core components are loaded from the manifest
     * @returns {Promise} Promise that resolves when core components are loaded
     */
    async ensureCoreComponentsLoaded() {
        try {
            // Try to load the component manifest
            const manifestResponse = await fetch('/js/components/manifest.json');
            if (!manifestResponse.ok) {
                throw new Error(`Failed to load component manifest: ${manifestResponse.statusText}`);
            }
            
            const manifest = await manifestResponse.json();
            
            // Get the list of components to preload from the manifest
            const coreComponents = manifest.preload || [];
            
            if (coreComponents.length === 0) {
                console.warn('[ComponentLoader] No core components found in manifest');
                return false;
            }
            
            console.log(`[ComponentLoader] Loading ${coreComponents.length} core components from manifest`);
            
            // Load all core components in parallel
            const loadPromises = coreComponents.map(type => 
                this.loadComponentModule(type).catch(err => {
                    console.warn(`[ComponentLoader] Non-critical: Core component not found: ${type}`, err);
                    return null;
                })
            );
            
            await Promise.all(loadPromises);
            return true;
            
        } catch (error) {
            console.error('[ComponentLoader] Error loading core components from manifest:', error);
            
            // Fallback to default components if manifest fails to load
            console.warn('[ComponentLoader] Falling back to default core components');
            const defaultComponents = ['pump', 'valve', 'sensor', 'tank', 'display'];
            
            const fallbackPromises = defaultComponents.map(type => 
                this.loadComponentModule(type).catch(err => {
                    console.warn(`[ComponentLoader] Non-critical: Fallback component not found: ${type}`);
                    return null;
                })
            );
            
            await Promise.all(fallbackPromises);
            return false; // Indicate that we fell back to defaults
        }
    }

    /**
     * Load a component module dynamically
     * @param {string} type - Component type to load (e.g., 'pump')
     * @returns {Promise} Promise that resolves with the loaded module
     */
    async loadComponentModule(type) {
        // If already loaded or loading, return existing promise
        if (this.loadedModules.has(type)) {
            return true;
        }
        
        if (this.loadingPromises.has(type)) {
            return this.loadingPromises.get(type);
        }
        
        // Create a new loading promise
        const loadPromise = (async () => {
            try {
                console.log(`[ComponentLoader] Loading component module: ${type}`);
                
                // Try to load the component module
                const modulePath = `${this.baseComponentPath}${type}.js`;
                const module = await import(modulePath);
                
                this.loadedModules.add(type);
                
                // Check if the module has self-registered with componentRegistry
                // If not, try to register it if it has an initializer
                if (!componentRegistry.isRegistered(type) && module.default) {
                    const initializer = module.default;
                    componentRegistry.register(type, initializer, {
                        type,
                        name: this.formatComponentName(type),
                        autoLoaded: true
                    });
                }
                
                console.log(`[ComponentLoader] Successfully loaded component module: ${type}`);
                return module;
            } catch (error) {
                console.error(`[ComponentLoader] Error loading component module: ${type}`, error);
                throw error;
            }
        })();
        
        // Store the promise
        this.loadingPromises.set(type, loadPromise);
        
        try {
            const result = await loadPromise;
            // Remove from loading promises after loaded
            this.loadingPromises.delete(type);
            return result;
        } catch (error) {
            // Remove from loading promises if failed
            this.loadingPromises.delete(type);
            throw error;
        }
    }

    /**
     * Get icon for a component type
     * @param {string} componentId - Component type ID
     * @returns {Promise<string>} SVG content or emoji fallback
     */
    async getComponentIcon(componentId) {
        try {
            return await ComponentIconLoader.loadIcon(componentId);
        } catch (error) {
            console.warn(`[ComponentLoader] Error loading icon for ${componentId}:`, error);
            return '🔧'; // Default fallback
        }
    }

    /**
     * Format component type as a readable name
     * @param {string} type - Component type identifier
     * @returns {string} Formatted component name
     */
    formatComponentName(type) {
        return type
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, s => s.toUpperCase())
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
            .trim();
    }

    /**
     * Get component type from a component URL or element
     * @param {string|Element} component - Component URL or SVG element
     * @returns {string} Extracted component type or 'unknown'
     */
    getComponentType(component) {
        // Use the ComponentIconLoader's extraction method for consistency
        const extractedId = ComponentIconLoader.extractComponentId(component);
        
        // If ComponentIconLoader couldn't extract a valid ID, fallback to registry
        if (extractedId === 'unknown') {
            return componentRegistry.extractComponentType(component);
        }
        
        return extractedId;
    }

    /**
     * Ensure a component type is loaded, load it if necessary
     * @param {string} type - Component type to ensure is loaded
     * @returns {Promise} Promise that resolves when component is loaded
     */
    async ensureComponentLoaded(type) {
        if (!type || type === 'unknown') {
            return false;
        }
        
        try {
            // Check if already registered
            if (componentRegistry.isRegistered(type)) {
                return true;
            }
            
            // Otherwise try to load it
            await this.loadComponentModule(type);
            return componentRegistry.isRegistered(type);
        } catch (error) {
            console.warn(`[ComponentLoader] Could not load component type: ${type}`, error);
            return false;
        }
    }

    /**
     * Initialize a component based on its element or SVG URL
     * @param {Element} element - Component element to initialize
     * @returns {Promise<boolean>} Promise that resolves with initialization status
     */
    async initializeComponent(element) {
        if (!element || !element.hasAttribute('data-id')) {
            console.warn('[ComponentLoader] Cannot initialize component without data-id');
            return false;
        }

        try {
            // Extract component type
            const svgUrl = element.getAttribute('data-svg-url') || '';
            const componentType = element.getAttribute('data-component-type') || 
                                 this.getComponentType(svgUrl);
            
            // Ensure component module is loaded
            await this.ensureComponentLoaded(componentType);
            
            // Use the component initializer to initialize
            return componentInitializer.initializeComponent(element);
        } catch (error) {
            console.error('[ComponentLoader] Error initializing component:', error);
            return false;
        }
    }
}

// Create and export singleton instance
export const componentLoader = new ComponentLoader();

// Default export for convenience
export default componentLoader;
