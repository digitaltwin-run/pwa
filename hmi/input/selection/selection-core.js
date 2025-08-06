/**
 * HMI Selection Core - Unified component selection management
 * Migrated from js/selection/selection-core.js
 * @module hmi/input/selection
 */

export class SelectionCore {
    constructor() {
        this.selectedComponents = new Set();
        this.canvasElement = null;
        this.componentManager = null;
        this.selectionCallbacks = new Set();
    }

    /**
     * Set references to canvas and component manager
     */
    setReferences(canvasElement, componentManager) {
        this.canvasElement = canvasElement;
        this.componentManager = componentManager;
        console.log('🎯 HMI Selection Core initialized with references');
    }

    /**
     * Select a component
     */
    selectComponent(component) {
        if (!component || this.selectedComponents.has(component)) return;

        this.selectedComponents.add(component);
        component.classList.add('selected');
        
        // Trigger selection event
        this.triggerSelectionEvent('select', component);
        console.log(`🎯 Selected component:`, component.getAttribute('data-id'));
    }

    /**
     * Deselect a component
     */
    deselectComponent(component) {
        if (!component || !this.selectedComponents.has(component)) return;

        this.selectedComponents.delete(component);
        component.classList.remove('selected');
        
        // Trigger selection event
        this.triggerSelectionEvent('deselect', component);
        console.log(`🎯 Deselected component:`, component.getAttribute('data-id'));
    }

    /**
     * Toggle component selection
     */
    toggleComponentSelection(component) {
        if (this.selectedComponents.has(component)) {
            this.deselectComponent(component);
        } else {
            this.selectComponent(component);
        }
    }

    /**
     * Clear all selections
     */
    clearSelection() {
        const wasEmpty = this.selectedComponents.size === 0;
        
        this.selectedComponents.forEach(component => {
            component.classList.remove('selected');
        });
        
        this.selectedComponents.clear();
        
        if (!wasEmpty) {
            this.triggerSelectionEvent('clear');
            console.log('🎯 Cleared all selections');
        }
    }

    /**
     * Select all components
     */
    selectAllComponents() {
        const components = this.getAllComponents();
        let selectedCount = 0;

        components.forEach(component => {
            if (!this.selectedComponents.has(component)) {
                this.selectComponent(component);
                selectedCount++;
            }
        });

        console.log(`🎯 Selected all ${selectedCount} components`);
    }

    /**
     * Select components within rectangle
     */
    selectComponentsInRect(rect) {
        const components = this.getAllComponents();
        let selectedCount = 0;

        components.forEach(component => {
            const componentRect = component.getBoundingClientRect();
            const canvasRect = this.canvasElement.getBoundingClientRect();
            
            const relativeRect = {
                left: componentRect.left - canvasRect.left,
                top: componentRect.top - canvasRect.top,
                right: componentRect.right - canvasRect.left,
                bottom: componentRect.bottom - canvasRect.top
            };

            if (this.rectsIntersect(rect, relativeRect)) {
                this.selectComponent(component);
                selectedCount++;
            }
        });

        console.log(`🎯 Selected ${selectedCount} components in rectangle`);
    }

    /**
     * Get component from event
     */
    getComponentFromEvent(e) {
        let element = e.target;
        
        // Traverse up the DOM tree to find a component
        while (element && element !== this.canvasElement) {
            if (element.hasAttribute && element.hasAttribute('data-id')) {
                return element;
            }
            element = element.parentElement;
        }
        
        return null;
    }

    /**
     * Get all components from canvas
     */
    getAllComponents() {
        if (!this.canvasElement) return [];
        
        return Array.from(this.canvasElement.querySelectorAll('[data-id]'));
    }

    /**
     * Check if rectangles intersect
     */
    rectsIntersect(rect1, rect2) {
        return !(rect1.right < rect2.left || 
                rect1.left > rect2.right || 
                rect1.bottom < rect2.top || 
                rect1.top > rect2.bottom);
    }

    /**
     * Get selected components as array (for gesture integration API compatibility)
     */
    getSelectedComponents() {
        return Array.from(this.selectedComponents);
    }

    /**
     * Get selection info
     */
    getSelectionInfo() {
        return {
            count: this.selectedComponents.size,
            components: Array.from(this.selectedComponents),
            isEmpty: this.selectedComponents.size === 0,
            isMultiple: this.selectedComponents.size > 1
        };
    }

    /**
     * Add selection callback
     */
    addSelectionCallback(callback) {
        this.selectionCallbacks.add(callback);
        return () => this.selectionCallbacks.delete(callback);
    }

    /**
     * Trigger selection event
     */
    triggerSelectionEvent(type, component = null) {
        const event = {
            type,
            component,
            selection: this.getSelectionInfo(),
            timestamp: Date.now()
        };

        this.selectionCallbacks.forEach(callback => {
            try {
                callback(event);
            } catch (error) {
                console.error('🔴 Selection callback error:', error);
            }
        });
    }
}

// Create and export singleton instance
export const selectionCore = new SelectionCore();
export default selectionCore;
