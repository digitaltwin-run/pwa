/**
 * Module Loader for HTML Modules System
 * Loads and manages HTML modules without build step
 */

export class ModuleLoader {
    constructor() {
        this.loadedModules = new Map();
        this.moduleCache = new Map();
        this.loadingPromises = new Map();
        
        console.log('🧩 Module Loader initialized');
    }

    /**
     * Load HTML module from file
     */
    async loadModule(moduleName, modulePath) {
        // Return cached module if already loaded
        if (this.loadedModules.has(moduleName)) {
            return this.loadedModules.get(moduleName);
        }

        // Return existing loading promise if already loading
        if (this.loadingPromises.has(moduleName)) {
            return this.loadingPromises.get(moduleName);
        }

        // Start loading
        const loadingPromise = this._loadModuleFile(moduleName, modulePath);
        this.loadingPromises.set(moduleName, loadingPromise);

        try {
            const result = await loadingPromise;
            this.loadedModules.set(moduleName, result);
            return result;
        } finally {
            this.loadingPromises.delete(moduleName);
        }
    }

    /**
     * Load module file and parse content
     */
    async _loadModuleFile(moduleName, modulePath) {
        try {
            const response = await fetch(modulePath);
            if (!response.ok) {
                throw new Error(`Failed to load module: ${response.status} ${response.statusText}`);
            }

            const html = await response.text();
            return this._parseModule(moduleName, html, modulePath);
        } catch (error) {
            console.error(`🧩 Failed to load module ${moduleName} from ${modulePath}:`, error);
            throw error;
        }
    }

    /**
     * Parse HTML module content
     */
    _parseModule(moduleName, html, modulePath) {
        const container = document.createElement('div');
        container.innerHTML = html;

        // Extract components
        const template = container.querySelector('template');
        const style = container.querySelector('style');
        const script = container.querySelector('script[type="module"]');

        if (!template) {
            throw new Error(`Module ${moduleName} missing <template> element`);
        }

        const moduleInfo = {
            name: moduleName,
            path: modulePath,
            template: template.content.cloneNode(true),
            style: style ? style.textContent : '',
            script: script ? script.textContent : '',
            loaded: true,
            loadedAt: new Date()
        };

        // Execute module script if present
        if (script) {
            this._executeModuleScript(moduleName, script.textContent);
        }

        console.log(`🧩 Parsed module: ${moduleName}`);
        return moduleInfo;
    }

    /**
     * Execute module script in context
     */
    _executeModuleScript(moduleName, scriptContent) {
        try {
            // Create module context
            const moduleContext = {
                moduleName,
                loader: this,
                console: console // Allow console access
            };

            // Execute script with module context
            const executeScript = new Function('module', 'loader', 'console', scriptContent);
            executeScript(moduleContext, this, console);
        } catch (error) {
            console.error(`🧩 Error executing script for module ${moduleName}:`, error);
        }
    }

    /**
     * Create instance of loaded module
     */
    createModuleInstance(moduleName, config = {}) {
        const moduleInfo = this.loadedModules.get(moduleName);
        if (!moduleInfo) {
            throw new Error(`Module ${moduleName} not loaded`);
        }

        // Create module container
        const container = document.createElement('div');
        container.className = `module-${moduleName}`;
        
        // Add style if present
        if (moduleInfo.style) {
            const styleElement = document.createElement('style');
            styleElement.textContent = moduleInfo.style;
            container.appendChild(styleElement);
        }

        // Add template content
        const content = moduleInfo.template.cloneNode(true);
        container.appendChild(content);

        // Apply configuration
        Object.entries(config).forEach(([key, value]) => {
            container.setAttribute(`data-${key}`, value);
        });

        return container;
    }

    /**
     * Load and register Web Component module
     */
    async loadWebComponent(moduleName, modulePath, componentClass) {
        const moduleInfo = await this.loadModule(moduleName, modulePath);
        
        // Register as custom element if class provided
        if (componentClass && !customElements.get(moduleName)) {
            customElements.define(moduleName, componentClass);
            console.log(`🧩 Registered Web Component: ${moduleName}`);
        }

        return moduleInfo;
    }

    /**
     * Preload multiple modules
     */
    async preloadModules(modules) {
        const promises = modules.map(({ name, path }) => 
            this.loadModule(name, path).catch(error => {
                console.warn(`🧩 Failed to preload module ${name}:`, error);
                return null;
            })
        );

        const results = await Promise.all(promises);
        const successful = results.filter(result => result !== null);
        
        console.log(`🧩 Preloaded ${successful.length}/${modules.length} modules`);
        return successful;
    }

    /**
     * Get loaded module info
     */
    getModuleInfo(moduleName) {
        return this.loadedModules.get(moduleName);
    }

    /**
     * Check if module is loaded
     */
    isModuleLoaded(moduleName) {
        return this.loadedModules.has(moduleName);
    }

    /**
     * Unload module
     */
    unloadModule(moduleName) {
        this.loadedModules.delete(moduleName);
        this.moduleCache.delete(moduleName);
        console.log(`🧩 Unloaded module: ${moduleName}`);
    }

    /**
     * Get all loaded modules
     */
    getLoadedModules() {
        return Array.from(this.loadedModules.keys());
    }

    /**
     * Clear all loaded modules
     */
    clearModules() {
        this.loadedModules.clear();
        this.moduleCache.clear();
        this.loadingPromises.clear();
        console.log('🧩 Cleared all modules');
    }
}

// Create global module loader instance
export const moduleLoader = new ModuleLoader();

// Make available globally
window.moduleLoader = moduleLoader;

/**
 * Helper function to load module and create instance
 */
export async function loadAndCreateModule(moduleName, modulePath, config = {}) {
    await moduleLoader.loadModule(moduleName, modulePath);
    return moduleLoader.createModuleInstance(moduleName, config);
}

/**
 * Helper function to define module registry
 */
export function defineModuleRegistry(modules) {
    return {
        async loadAll() {
            return moduleLoader.preloadModules(modules);
        },
        
        async load(name) {
            const module = modules.find(m => m.name === name);
            if (!module) {
                throw new Error(`Module ${name} not found in registry`);
            }
            return moduleLoader.loadModule(name, module.path);
        },
        
        getModules() {
            return modules;
        }
    };
}
