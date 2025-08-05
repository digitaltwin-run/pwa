/**
 * Selection Core - Basic component selection operations
 * Extracted from canvas-selection-manager.js for better modularity
 */
export class SelectionCore {
    constructor() {
        this.selectedComponents = new Set();
        this.canvasElement = null;
        this.componentManager = null;
    }

    /**
     * Set references to canvas and component manager
     */
    setReferences(canvasElement, componentManager) {
        this.canvasElement = canvasElement;
        this.componentManager = componentManager;
    }

    /**
     * Get all components on canvas
     */
    getAllComponents() {
        if (!this.canvasElement) return [];
        return Array.from(this.canvasElement.querySelectorAll('[data-id]'));
    }

    /**
     * Select a component
     */
    selectComponent(component) {
        if (!component) return;
        
        this.selectedComponents.add(component);
        this.highlightComponent(component);
        this.updateSelectionUI();
        console.log(`🎯 Selected component: ${component.getAttribute('data-id')}`);
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
     * Deselect a component
     */
    deselectComponent(component) {
        if (!component) return;
        
        this.selectedComponents.delete(component);
        this.unhighlightComponent(component);
        this.updateSelectionUI();
        console.log(`🎯 Deselected component: ${component.getAttribute('data-id')}`);
    }

    /**
     * Clear all selections
     */
    clearSelection() {
        this.selectedComponents.forEach(component => {
            this.unhighlightComponent(component);
        });
        this.selectedComponents.clear();
        this.updateSelectionUI();
        console.log('🎯 Cleared all selections');
    }

    /**
     * Select all components
     */
    selectAllComponents() {
        const allComponents = this.getAllComponents();
        allComponents.forEach(component => {
            this.selectedComponents.add(component);
            this.highlightComponent(component);
        });
        this.updateSelectionUI();
        console.log(`🎯 Selected all components: ${allComponents.length}`);
    }

    /**
     * Highlight selected component visually
     */
    highlightComponent(component) {
        if (!component) return;

        // Remove existing highlight
        this.unhighlightComponent(component);
        
        // Add highlight class and outline
        component.classList.add('selected-component');
        component.style.outline = '2px solid #007bff';
        component.style.outlineOffset = '2px';
        
        // Create selection indicator
        const rect = component.getBoundingClientRect();
        const canvasRect = this.canvasElement.getBoundingClientRect();
        
        const indicator = document.createElement('div');
        indicator.className = 'selection-indicator';
        indicator.setAttribute('data-for', component.getAttribute('data-id'));
        indicator.style.cssText = `
            position: absolute;
            left: ${rect.left - canvasRect.left - 4}px;
            top: ${rect.top - canvasRect.top - 4}px;
            width: ${rect.width + 8}px;
            height: ${rect.height + 8}px;
            border: 2px dashed #007bff;
            background: rgba(0, 123, 255, 0.1);
            pointer-events: none;
            z-index: 1000;
        `;
        this.canvasElement.appendChild(indicator);
    }

    /**
     * Remove highlight from component
     */
    unhighlightComponent(component) {
        if (!component) return;
        
        component.classList.remove('selected-component');
        component.style.outline = '';
        component.style.outlineOffset = '';
        
        // Remove selection indicator
        const indicator = this.canvasElement?.querySelector(`[data-for="${component.getAttribute('data-id')}"]`);
        if (indicator) {
            indicator.remove();
        }
    }

    /**
     * Update selection UI and notify other systems
     */
    updateSelectionUI() {
        // Dispatch selection change event
        const event = new CustomEvent('canvas-selection-changed', {
            detail: {
                selectedComponents: Array.from(this.selectedComponents),
                count: this.selectedComponents.size
            }
        });
        document.dispatchEvent(event);

        // Update components column if available
        if (window.componentsColumnManager) {
            window.componentsColumnManager.updateSelectionState();
        }
    }

    /**
     * Get component element from event target (simplified approach)
     */
    getComponentFromEvent(event) {
        console.log('🎯 getComponentFromEvent called');
        
        let target = event.target;
        console.log('📍 Event target:', {
            tagName: target.tagName,
            id: target.id,
            className: target.className instanceof SVGAnimatedString ? target.className.baseVal : target.className,
            hasDataId: target.hasAttribute('data-id'),
            dataId: target.getAttribute('data-id')
        });
        
        // Walk up the DOM tree to find element with data-id
        while (target && target !== this.canvasElement) {
            if (target.hasAttribute && target.hasAttribute('data-id')) {
                console.log('✅ Found component:', target.getAttribute('data-id'));
                return target;
            }
            target = target.parentElement;
        }
        
        console.log('❌ No component found in event path');
        return null;
    }

    /**
     * Legacy method for backward compatibility
     */
    getComponentAtPoint(x, y) {
        console.log('⚠️ getComponentAtPoint is deprecated, use getComponentFromEvent instead');
        return null;
    }

    /**
     * Get selection info
     */
    getSelectionInfo() {
        return {
            count: this.selectedComponents.size,
            components: Array.from(this.selectedComponents)
        };
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
     * Check if two rectangles intersect
     */
    rectsIntersect(rect1, rect2) {
        return !(rect1.right < rect2.left || 
                rect2.right < rect1.left || 
                rect1.bottom < rect2.top || 
                rect2.bottom < rect1.top);
    }
}

// Create and export singleton instance
export const selectionCore = new SelectionCore();
export default selectionCore;
