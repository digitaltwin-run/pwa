// Digital Twin IDE - Component Registry Module
// Centralized registry for component types, initializers, and metadata

/**
 * Component Registry - Manages component types and their initialization functions
 * This provides a central place to register and retrieve component information
 * without relying on hardcoded paths or global initialization functions
 */
class ComponentRegistry {
    constructor() {
        this.componentTypes = new Map();
        this.defaultInitializers = new Map();
        this.componentMetadata = new Map();
    }

    /**
     * Register a component type with its initializer and metadata
     * @param {string} type - Component type identifier (e.g., 'pump', 'valve', 'sensor')
     * @param {Function} initializer - Function to initialize this component type
     * @param {Object} metadata - Additional metadata for this component
     */
    register(type, initializer, metadata = {}) {
        if (!type) {
            console.error('Cannot register component: type is required');
            return false;
        }

        // Store the component type and its initializer
        this.componentTypes.set(type, true);
        this.defaultInitializers.set(type, initializer);
        this.componentMetadata.set(type, {
            ...metadata,
            type
        });

        console.log(`[ComponentRegistry] Registered component type: ${type}`);
        return true;
    }

    /**
     * Check if a component type is registered
     * @param {string} type - Component type to check
     * @returns {boolean} - True if registered, false otherwise
     */
    isRegistered(type) {
        return this.componentTypes.has(type);
    }

    /**
     * Get initializer for a component type
     * @param {string} type - Component type
     * @returns {Function|null} - Initializer function or null if not found
     */
    getInitializer(type) {
        return this.defaultInitializers.get(type) || null;
    }

    /**
     * Get metadata for a component type
     * @param {string} type - Component type
     * @returns {Object|null} - Component metadata or null if not found
     */
    getMetadata(type) {
        return this.componentMetadata.get(type) || null;
    }

    /**
     * Get all registered component types
     * @returns {Array<string>} - Array of registered component types
     */
    getAllTypes() {
        return Array.from(this.componentTypes.keys());
    }

    /**
     * Extract component type from a component URL or element
     * @param {string|Element} component - Component URL or SVG element
     * @returns {string} - Extracted component type or 'unknown'
     */
    extractComponentType(component) {
        let type = 'unknown';

        if (typeof component === 'string') {
            // Extract from URL
            const urlMatch = component.match(/\/([^\/]+)\.svg$/);
            if (urlMatch && urlMatch[1]) {
                type = urlMatch[1].toLowerCase();
            }
        } else if (component instanceof Element) {
            // Extract from element
            type = component.getAttribute('data-component-type') || 
                   component.getAttribute('data-type') || 
                   'unknown';
                   
            // Fallback: try to extract from SVG URL if available
            if (type === 'unknown') {
                const svgUrl = component.getAttribute('data-svg-url');
                if (svgUrl) {
                    return this.extractComponentType(svgUrl);
                }
            }
        }

        return type;
    }
}

// Create and export singleton instance
export const componentRegistry = new ComponentRegistry();

// Default export for convenience
export default componentRegistry;
