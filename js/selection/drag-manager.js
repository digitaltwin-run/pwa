/**
 * Drag Manager - Component dragging functionality
 * Extracted from canvas-selection-manager.js for better modularity
 */
export class DragManager {
    constructor() {
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.originalPositions = new Map();
        this.canvasElement = null;
        this.componentManager = null;
        this.selectionCore = null;
    }

    /**
     * Set references to canvas, component manager, and selection core
     */
    setReferences(canvasElement, componentManager, selectionCore) {
        this.canvasElement = canvasElement;
        this.componentManager = componentManager;
        this.selectionCore = selectionCore;
    }

    /**
     * Start dragging selected components
     */
    startDrag(e) {
        if (!this.selectionCore || this.selectionCore.selectedComponents.size === 0) return;

        this.isDragging = true;
        this.dragStart = { x: e.clientX, y: e.clientY };
        
        // Store original positions for all selected components
        this.originalPositions.clear();
        this.selectionCore.selectedComponents.forEach(component => {
            const rect = component.getBoundingClientRect();
            this.originalPositions.set(component, {
                x: rect.left,
                y: rect.top
            });
        });

        console.log(`🎯 Started dragging ${this.selectionCore.selectedComponents.size} components`);
    }

    /**
     * Update drag positions
     */
    updateDrag(e) {
        if (!this.isDragging || !this.selectionCore) return;

        const deltaX = e.clientX - this.dragStart.x;
        const deltaY = e.clientY - this.dragStart.y;

        this.selectionCore.selectedComponents.forEach(component => {
            const originalPos = this.originalPositions.get(component);
            if (!originalPos) return;

            // Update component position based on its type
            this.updateComponentPosition(component, deltaX, deltaY, originalPos);
        });
    }

    /**
     * Update individual component position
     */
    updateComponentPosition(component, deltaX, deltaY, originalPos) {
        if (component.tagName.toLowerCase() === 'g') {
            // For group elements, we need to calculate position in SVG coordinates
            const canvasRect = this.canvasElement.getBoundingClientRect();
            const ctm = this.canvasElement.getScreenCTM().inverse();
            
            // Calculate original position in SVG coordinates
            let originalSvgX = (originalPos.x - canvasRect.left) * ctm.a + ctm.e;
            let originalSvgY = (originalPos.y - canvasRect.top) * ctm.d + ctm.f;
            
            // Calculate new position based on original position + delta
            const newSvgX = originalSvgX + deltaX * ctm.a;
            const newSvgY = originalSvgY + deltaY * ctm.d;
            
            // Apply transform directly without trying to merge with existing transforms
            component.setAttribute('transform', `translate(${newSvgX}, ${newSvgY})`);
        } else {
            // For regular elements with x/y attributes
            // Get position in SVG coordinates from original browser coordinates
            const canvasRect = this.canvasElement.getBoundingClientRect();
            const ctm = this.canvasElement.getScreenCTM().inverse();
            
            // Calculate screen to SVG coordinate conversion
            let originalSvgPt = {
                x: (originalPos.x - canvasRect.left) * ctm.a + ctm.e,
                y: (originalPos.y - canvasRect.top) * ctm.d + ctm.f
            };
            
            // Add delta to the original SVG position
            const newX = originalSvgPt.x + deltaX * ctm.a;
            const newY = originalSvgPt.y + deltaY * ctm.d;
            
            component.setAttribute('x', newX);
            component.setAttribute('y', newY);
        }
    }

    /**
     * End dragging and finalize positions
     */
    endDrag() {
        if (!this.isDragging || !this.selectionCore) return;

        this.isDragging = false;
        
        // Collect information about moved components
        const movedComponents = [];
        this.selectionCore.selectedComponents.forEach(component => {
            let x = 0, y = 0;
            
            if (component.tagName.toLowerCase() === 'g') {
                // For group elements, parse transform
                const transform = component.getAttribute('transform');
                if (transform && transform.startsWith('translate')) {
                    const match = transform.match(/translate\(\s*([\d.-]+)(?:[,\s]+([\d.-]+))?\s*\)/);
                    if (match) {
                        x = parseFloat(match[1]) || 0;
                        y = parseFloat(match[2]) || 0;
                    }
                }
            } else {
                // For regular elements, use x/y attributes
                x = parseInt(component.getAttribute('x')) || 0;
                y = parseInt(component.getAttribute('y')) || 0;
            }
            
            // Get data-id or generate fallback id if needed
            const id = component.getAttribute('data-id') || 
                      component.id || 
                      `component-${Math.floor(Math.random() * 10000)}`;
            
            // Ensure component has data-id for future operations
            if (!component.hasAttribute('data-id')) {
                component.setAttribute('data-id', id);
            }
            
            movedComponents.push({ id, x, y });
        });
        
        console.log(`🎯 Finished dragging. Moved components:`, movedComponents);
        
        // Dispatch event for other managers to update
        const event = new CustomEvent('components-moved', {
            detail: { components: movedComponents }
        });
        document.dispatchEvent(event);
        
        // Notify the ComponentManager directly if available
        if (this.componentManager) {
            movedComponents.forEach(comp => {
                const element = document.querySelector(`[data-id="${comp.id}"]`);
                if (element) {
                    // Position is already updated in DOM, so we just trigger update event
                    this.componentManager.triggerComponentUpdate(comp.id);
                }
            });
        }
        
        // If PropertiesMapper is available, trigger a refresh
        if (window.propertiesMapper) {
            window.propertiesMapper.scanCanvasProperties();
        }
        
        this.originalPositions.clear();
        
        // Update selection UI to ensure properties panel reflects changes
        if (this.selectionCore) {
            this.selectionCore.updateSelectionUI();
        }
    }

    /**
     * Check if currently dragging
     */
    isDraggingActive() {
        return this.isDragging;
    }

    /**
     * Cancel ongoing drag operation
     */
    cancelDrag() {
        if (this.isDragging) {
            // Restore original positions
            this.originalPositions.forEach((originalPos, component) => {
                // Reset component to original position logic would go here
                // For now, we just end the drag
            });
            
            this.isDragging = false;
            this.originalPositions.clear();
            console.log('🎯 Cancelled drag operation');
        }
    }

    /**
     * Handle mouse move for dragging
     */
    handleMouseMove(e) {
        if (this.isDragging) {
            this.updateDrag(e);
        }
    }

    /**
     * Handle mouse up for dragging
     */
    handleMouseUp(e) {
        if (this.isDragging) {
            this.endDrag();
        }
    }
}

// Create and export singleton instance
export const dragManager = new DragManager();
export default dragManager;
