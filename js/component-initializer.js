// Digital Twin IDE - Component Initializer Module
// Responsible for dynamically initializing components based on their type

import { componentRegistry } from './component-registry.js';

/**
 * Component Initializer - Handles initialization of components
 * Solves the problem of SVG components with inline initialization functions
 * by providing a standardized way to initialize components
 */
class ComponentInitializer {
    constructor() {
        this.initializationQueue = new Set();
        this.initializedComponents = new Set();
        this.initializationErrors = new Map();
        
        // Auto-initialize components when they're added to the DOM
        this.setupMutationObserver();
    }

    /**
     * Initialize a component based on its type and element
     * @param {Element} element - The component element to initialize
     * @returns {boolean} - True if initialization succeeded, false otherwise
     */
    initializeComponent(element) {
        if (!element || !element.hasAttribute('data-id')) {
            console.warn('[ComponentInitializer] Cannot initialize component without data-id');
            return false;
        }

        const componentId = element.getAttribute('data-id');
        
        // Skip if already initialized
        if (this.initializedComponents.has(componentId)) {
            return true;
        }
        
        // Remove from queue if present
        if (this.initializationQueue.has(componentId)) {
            this.initializationQueue.delete(componentId);
        }

        try {
            // Extract component type
            const svgUrl = element.getAttribute('data-svg-url') || '';
            const componentType = element.getAttribute('data-component-type') || 
                                  componentRegistry.extractComponentType(svgUrl);
            
            console.log(`[ComponentInitializer] Initializing component: ${componentId}, type: ${componentType}`);
            
            // Get initializer from registry
            const initializer = componentRegistry.getInitializer(componentType);
            
            if (!initializer) {
                console.warn(`[ComponentInitializer] No initializer found for component type: ${componentType}`);
                
                // Store for diagnostics
                this.initializationErrors.set(componentId, {
                    error: 'No initializer found',
                    componentType,
                    timestamp: new Date()
                });
                
                return false;
            }
            
            // Call the initializer with the element and ID
            initializer(element, componentId);
            
            // Mark as initialized
            this.initializedComponents.add(componentId);
            console.log(`[ComponentInitializer] Successfully initialized component: ${componentId}`);
            
            // Clean up any stored errors
            if (this.initializationErrors.has(componentId)) {
                this.initializationErrors.delete(componentId);
            }
            
            // Notify that component was initialized
            this.dispatchInitializationEvent(element, componentId, componentType);
            
            return true;
        } catch (error) {
            console.error(`[ComponentInitializer] Error initializing component ${componentId}:`, error);
            
            // Store error for diagnostics
            this.initializationErrors.set(componentId, {
                error: error.message || 'Unknown error',
                stack: error.stack,
                timestamp: new Date()
            });
            
            return false;
        }
    }

    /**
     * Queue a component for initialization
     * @param {string} componentId - Component ID to queue
     */
    queueForInitialization(componentId) {
        if (!componentId) return;
        
        // Skip if already initialized
        if (this.initializedComponents.has(componentId)) {
            return;
        }
        
        this.initializationQueue.add(componentId);
    }

    /**
     * Initialize all components in the queue
     */
    processQueue() {
        const queue = Array.from(this.initializationQueue);
        queue.forEach(componentId => {
            const element = document.querySelector(`[data-id="${componentId}"]`);
            if (element) {
                this.initializeComponent(element);
            } else {
                // Remove from queue if element no longer exists
                this.initializationQueue.delete(componentId);
            }
        });
    }

    /**
     * Observe DOM for added components and initialize them
     */
    setupMutationObserver() {
        const observer = new MutationObserver(mutations => {
            let needsInitialization = false;
            
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    // Check if node is an element with data-id
                    if (node.nodeType === Node.ELEMENT_NODE && node.hasAttribute && node.hasAttribute('data-id')) {
                        this.queueForInitialization(node.getAttribute('data-id'));
                        needsInitialization = true;
                    }
                    
                    // Check if node has child elements with data-id
                    if (node.nodeType === Node.ELEMENT_NODE && node.querySelectorAll) {
                        const components = node.querySelectorAll('[data-id]');
                        if (components.length > 0) {
                            components.forEach(component => {
                                this.queueForInitialization(component.getAttribute('data-id'));
                                needsInitialization = true;
                            });
                        }
                    }
                });
            });
            
            if (needsInitialization) {
                // Process initialization queue on next tick
                setTimeout(() => this.processQueue(), 0);
            }
        });
        
        // Start observing document body for added nodes
        observer.observe(document.body, { childList: true, subtree: true });
    }
    
    /**
     * Get list of components with initialization errors
     * @returns {Array<Object>} - List of components with errors
     */
    getComponentsWithErrors() {
        const errors = [];
        this.initializationErrors.forEach((errorInfo, componentId) => {
            errors.push({
                componentId,
                ...errorInfo
            });
        });
        return errors;
    }
    
    /**
     * Clear initialization status for a component
     * @param {string} componentId - Component ID to reset
     */
    resetComponent(componentId) {
        this.initializedComponents.delete(componentId);
        this.initializationErrors.delete(componentId);
    }
    
    /**
     * Dispatch a custom event when a component is initialized
     * @param {Element} element - The initialized element
     * @param {string} componentId - Component ID
     * @param {string} componentType - Component type
     */
    dispatchInitializationEvent(element, componentId, componentType) {
        const event = new CustomEvent('component-initialized', {
            bubbles: true,
            detail: {
                componentId,
                componentType,
                element
            }
        });
        
        element.dispatchEvent(event);
    }
}

// Create and export singleton instance
export const componentInitializer = new ComponentInitializer();

// Default export for convenience
export default componentInitializer;
