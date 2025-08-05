// Digital Twin IDE - Properties Mapper Core Module
// Core initialization and management for properties mapping

export class MapperCore {
    constructor(componentManager) {
        this.componentManager = componentManager;
        // Ensure Maps are properly initialized
        this.mappedProperties = new Map();
        this.availableVariables = new Map();
        console.log('[MapperCore] Initialized with empty Maps');
        
        // Store observer instance for cleanup
        this.canvasObserver = null;
    }

    /**
     * Initialize the mapper with auto-refresh and initial scan
     */
    initialize() {
        // Set up auto-refresh and initial scan
        this.setupAutoRefresh();
        
        // Initial scan after a short delay to ensure DOM is ready
        setTimeout(() => {
            console.log('[MapperCore] Running initial canvas scan...');
            this.scanCanvasProperties();
        }, 100);
    }

    /**
     * Get the main canvas element using multiple fallback selectors
     * @returns {Element|null} Canvas element or null if not found
     */
    getCanvas() {
        const canvas = document.getElementById('svg-canvas') || 
                      document.getElementById('canvas') ||
                      document.querySelector('svg#canvas') ||
                      document.querySelector('#workspace svg');
        
        if (!canvas) {
            console.warn('[MapperCore] Canvas not found for property mapping');
            return null;
        }
        
        console.log('[MapperCore] Canvas found:', canvas.id || canvas.tagName);
        return canvas;
    }

    /**
     * Clear all mappings and variables
     */
    clearMappings() {
        this.mappedProperties.clear();
        this.availableVariables.clear();
        console.log('[MapperCore] Cleared all mappings and variables');
    }

    /**
     * Get all mapped properties
     * @returns {Map} Map of component properties
     */
    getMappedProperties() {
        return this.mappedProperties;
    }

    /**
     * Get all available variables
     * @returns {Map} Map of available variables
     */
    getAvailableVariables() {
        return this.availableVariables;
    }

    /**
     * Set mapped property for a component
     * @param {string} componentId - Component identifier
     * @param {Object} properties - Component properties
     */
    setMappedProperty(componentId, properties) {
        this.mappedProperties.set(componentId, properties);
    }

    /**
     * Get mapped property for a component
     * @param {string} componentId - Component identifier
     * @returns {Object|null} Component properties or null
     */
    getMappedProperty(componentId) {
        return this.mappedProperties.get(componentId) || null;
    }

    /**
     * Setup auto-refresh functionality - delegated to interaction manager
     */
    setupAutoRefresh() {
        // This will be implemented by the interaction manager
        console.log('[MapperCore] Auto-refresh setup delegated to interaction manager');
    }

    /**
     * Scan canvas properties - delegated to component detector
     */
    scanCanvasProperties() {
        // This will be implemented by the component detector
        console.log('[MapperCore] Canvas scanning delegated to component detector');
    }

    /**
     * Cleanup method to disconnect observers
     */
    cleanup() {
        if (this.canvasObserver) {
            this.canvasObserver.disconnect();
            this.canvasObserver = null;
        }
        this.clearMappings();
        console.log('[MapperCore] Cleanup completed');
    }
}
