import { canvasPlacementHelper } from './canvas-placement-helper.js';

/**
 * Canvas Selection Manager - Handles multi-selection, copy-paste, and bulk operations on SVG canvas
 */
export class CanvasSelectionManager {
    constructor() {
        this.selectedComponents = new Set();
        this.clipboard = [];
        this.selectionBox = null;
        this.isSelecting = false;
        this.selectionStart = { x: 0, y: 0 };
        this.canvasElement = null;
        this.componentManager = null;
        
        this.init();
    }

    /**
     * Initialize the selection manager with event handlers
     */
    init() {
        this.setupKeyboardShortcuts();
        this.setupCanvasInteractions();
        console.log('🎯 Canvas Selection Manager initialized');
    }

    /**
     * Set references to canvas and component manager
     */
    setReferences(canvasElement, componentManager) {
        this.canvasElement = canvasElement;
        this.componentManager = componentManager;
        
        // Initialize placement helper with canvas reference
        canvasPlacementHelper.setCanvas(canvasElement, 20);
        
        if (this.canvasElement) {
            this.setupCanvasEventListeners();
        }
    }

    /**
     * Setup keyboard shortcuts for copy, paste, delete, select all
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Skip if typing in input fields
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
                return;
            }

            const isCtrl = e.ctrlKey || e.metaKey;

            switch (e.key) {
                case 'c':
                case 'C':
                    if (isCtrl) {
                        e.preventDefault();
                        this.copySelectedComponents();
                    }
                    break;
                
                case 'v':
                case 'V':
                    if (isCtrl) {
                        e.preventDefault();
                        this.pasteComponents();
                    }
                    break;
                
                case 'Delete':
                case 'Backspace':
                    e.preventDefault();
                    this.deleteSelectedComponents();
                    break;
                
                case 'a':
                case 'A':
                    if (isCtrl) {
                        e.preventDefault();
                        this.selectAllComponents();
                    }
                    break;
                
                case 'Escape':
                    this.clearSelection();
                    break;
            }
        });
    }

    /**
     * Setup canvas mouse interactions for selection
     */
    setupCanvasEventListeners() {
        if (!this.canvasElement) return;

        this.canvasElement.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvasElement.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvasElement.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        
        // Prevent context menu on canvas for custom operations
        this.canvasElement.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showContextMenu(e);
        });
    }

    /**
     * Handle mouse down - start selection or component interaction
     */
    handleMouseDown(e) {
        // Get all components at this point (for overlapping components)
        const elementsAtPoint = document.elementsFromPoint(e.clientX, e.clientY);
        const componentsAtPoint = elementsAtPoint.filter(el => el.hasAttribute('data-id'));
        
        if (componentsAtPoint.length > 0) {
            // Component(s) clicked - choose the topmost one
            const clickedComponent = componentsAtPoint[0];
            
            // If there are multiple components at this point, prioritize selected ones
            const selectedAtPoint = componentsAtPoint.filter(comp => this.selectedComponents.has(comp));
            const targetComponent = selectedAtPoint.length > 0 ? selectedAtPoint[0] : clickedComponent;
            
            if (!e.ctrlKey && !e.shiftKey) {
                // Single selection (clear others)
                this.clearSelection();
                this.selectComponent(targetComponent);
            } else if (e.ctrlKey) {
                // Toggle selection
                this.toggleComponentSelection(targetComponent);
            }
            
            // Mark this as a component interaction to prevent selection box
            this.lastInteractionWasComponent = true;
        } else {
            // Empty area clicked - start selection box
            this.lastInteractionWasComponent = false;
            if (!e.ctrlKey && !e.shiftKey) {
                this.clearSelection();
            }
            this.startSelectionBox(e);
        }
    }

    /**
     * Handle mouse move - update selection box
     */
    handleMouseMove(e) {
        if (this.isSelecting) {
            this.updateSelectionBox(e);
        }
    }

    /**
     * Handle mouse up - finalize selection
     */
    handleMouseUp(e) {
        if (this.isSelecting) {
            this.finalizeSelectionBox();
        }
    }

    /**
     * Get component element at specific point
     */
    getComponentAtPoint(x, y) {
        const elements = document.elementsFromPoint(x, y);
        
        for (const element of elements) {
            // Look for components with data-id attribute
            if (element.hasAttribute('data-id')) {
                return element;
            }
            // Or look for parent with data-id
            const componentParent = element.closest('[data-id]');
            if (componentParent) {
                return componentParent;
            }
        }
        return null;
    }

    /**
     * Start selection box drawing
     */
    startSelectionBox(e) {
        this.isSelecting = true;
        this.selectionStart = {
            x: e.clientX,
            y: e.clientY
        };
        
        this.createSelectionBox();
    }

    /**
     * Create visual selection box element
     */
    createSelectionBox() {
        this.selectionBox = document.createElement('div');
        this.selectionBox.className = 'canvas-selection-box';
        this.selectionBox.style.cssText = `
            position: fixed;
            border: 2px dashed #007bff;
            background: rgba(0, 123, 255, 0.1);
            pointer-events: none;
            z-index: 9999;
            display: none;
        `;
        document.body.appendChild(this.selectionBox);
    }

    /**
     * Update selection box size and position
     */
    updateSelectionBox(e) {
        if (!this.selectionBox) return;

        const rect = {
            left: Math.min(this.selectionStart.x, e.clientX),
            top: Math.min(this.selectionStart.y, e.clientY),
            width: Math.abs(e.clientX - this.selectionStart.x),
            height: Math.abs(e.clientY - this.selectionStart.y)
        };

        this.selectionBox.style.left = rect.left + 'px';
        this.selectionBox.style.top = rect.top + 'px';
        this.selectionBox.style.width = rect.width + 'px';
        this.selectionBox.style.height = rect.height + 'px';
        this.selectionBox.style.display = 'block';
    }

    /**
     * Finalize selection box and select components within
     */
    finalizeSelectionBox() {
        if (this.selectionBox) {
            const rect = this.selectionBox.getBoundingClientRect();
            this.selectComponentsInRect(rect);
            
            // Remove selection box
            this.selectionBox.remove();
            this.selectionBox = null;
        }
        this.isSelecting = false;
    }

    /**
     * Select all components within rectangle
     */
    selectComponentsInRect(rect) {
        const components = this.getAllComponents();
        
        components.forEach(component => {
            const componentRect = component.getBoundingClientRect();
            
            // Check if component intersects with selection rectangle
            if (this.rectsIntersect(rect, componentRect)) {
                this.selectComponent(component);
            }
        });
    }

    /**
     * Check if two rectangles intersect
     */
    rectsIntersect(rect1, rect2) {
        return !(rect1.right < rect2.left || 
                rect1.left > rect2.right || 
                rect1.bottom < rect2.top || 
                rect1.top > rect2.bottom);
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
        if (!component || this.selectedComponents.has(component)) return;
        
        this.selectedComponents.add(component);
        this.highlightComponent(component);
        
        console.log(`🎯 Selected component: ${component.getAttribute('data-id')}`);
        this.updateSelectionUI();
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
        if (!this.selectedComponents.has(component)) return;
        
        this.selectedComponents.delete(component);
        this.unhighlightComponent(component);
        
        console.log(`🎯 Deselected component: ${component.getAttribute('data-id')}`);
        this.updateSelectionUI();
    }

    /**
     * Clear all selections
     */
    clearSelection() {
        this.selectedComponents.forEach(component => {
            this.unhighlightComponent(component);
        });
        this.selectedComponents.clear();
        
        console.log('🎯 Cleared all selections');
        this.updateSelectionUI();
    }

    /**
     * Select all components
     */
    selectAllComponents() {
        const components = this.getAllComponents();
        components.forEach(component => this.selectComponent(component));
        
        console.log(`🎯 Selected all ${components.length} components`);
    }

    /**
     * Highlight selected component visually
     */
    highlightComponent(component) {
        component.classList.add('canvas-selected');
        
        // Add visual selection styling if not already present
        if (!document.querySelector('#canvas-selection-styles')) {
            const style = document.createElement('style');
            style.id = 'canvas-selection-styles';
            style.textContent = `
                .canvas-selected {
                    outline: 2px solid #007bff !important;
                    outline-offset: 2px !important;
                    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.2) !important;
                }
                
                .canvas-selection-box {
                    border: 2px dashed #007bff;
                    background: rgba(0, 123, 255, 0.1);
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Remove highlight from component
     */
    unhighlightComponent(component) {
        component.classList.remove('canvas-selected');
    }

    /**
     * Copy selected components to clipboard
     */
    copySelectedComponents() {
        if (this.selectedComponents.size === 0) {
            console.log('🎯 No components selected to copy');
            return;
        }

        this.clipboard = Array.from(this.selectedComponents).map(component => {
            return {
                element: component.cloneNode(true),
                originalId: component.getAttribute('data-id'),
                svgUrl: component.getAttribute('data-svg-url'),
                componentType: component.getAttribute('data-component-type'),
                position: this.getComponentPosition(component)
            };
        });

        console.log(`🎯 Copied ${this.clipboard.length} component(s) to clipboard`);
        this.showNotification(`Copied ${this.clipboard.length} component(s)`);
    }

    /**
     * Paste components from clipboard
     */
    async pasteComponents() {
        if (this.clipboard.length === 0) {
            console.log('🎯 Clipboard is empty');
            return;
        }

        console.log(`🎯 Pasting ${this.clipboard.length} component(s) from clipboard`);
        
        const newComponents = [];
        
        for (let i = 0; i < this.clipboard.length; i++) {
            const clipboardItem = this.clipboard[i];
            const newComponent = await this.createComponentCopy(clipboardItem, i);
            if (newComponent) {
                newComponents.push(newComponent);
            }
        }

        // Select newly pasted components
        this.clearSelection();
        newComponents.forEach(component => this.selectComponent(component));

        this.showNotification(`Pasted ${newComponents.length} component(s)`);
    }

    /**
     * Create a copy of a component with smart positioning
     */
    async createComponentCopy(clipboardItem, index) {
        const newElement = clipboardItem.element.cloneNode(true);
        
        // Generate new unique ID
        const newId = this.generateUniqueId(clipboardItem.originalId);
        newElement.setAttribute('data-id', newId);
        
        // Calculate new position
        const newPosition = this.calculateSmartPosition(clipboardItem.position, index);
        this.setComponentPosition(newElement, newPosition);
        
        // Add to canvas
        if (this.canvasElement) {
            this.canvasElement.appendChild(newElement);
            
            // Initialize the component if component manager is available
            if (this.componentManager && this.componentManager.initializeComponent) {
                await this.componentManager.initializeComponent(newElement);
            }
            
            console.log(`🎯 Created component copy: ${newId} at position (${newPosition.x}, ${newPosition.y})`);
            return newElement;
        }
        
        return null;
    }

    /**
     * Calculate smart position for pasted component using placement helper
     */
    calculateSmartPosition(originalPosition, index) {
        const existingComponents = this.getAllComponents();
        const componentSize = { width: 100, height: 100 }; // Default size, will be updated from actual component
        
        if (index === 0) {
            // For first component, use placement helper to find optimal position
            const preferredPosition = {
                x: originalPosition.x + 50,
                y: originalPosition.y + 50
            };
            
            return canvasPlacementHelper.findOptimalPosition(
                preferredPosition, 
                componentSize, 
                existingComponents
            );
        } else {
            // For multiple components, use multi-paste offset calculation
            const baseOffset = canvasPlacementHelper.calculateMultiPasteOffset(index);
            const preferredPosition = {
                x: originalPosition.x + baseOffset.x,
                y: originalPosition.y + baseOffset.y
            };
            
            return canvasPlacementHelper.findOptimalPosition(
                preferredPosition,
                componentSize,
                existingComponents
            );
        }
    }

    /**
     * Delete selected components
     */
    deleteSelectedComponents() {
        if (this.selectedComponents.size === 0) {
            console.log('🎯 No components selected to delete');
            return;
        }

        const count = this.selectedComponents.size;
        const componentsToDelete = Array.from(this.selectedComponents);
        
        // Confirm deletion if multiple components
        if (count > 1) {
            if (!confirm(`Are you sure you want to delete ${count} selected components?`)) {
                return;
            }
        }

        componentsToDelete.forEach(component => {
            const componentId = component.getAttribute('data-id');
            
            // Remove from component manager if available
            if (this.componentManager && this.componentManager.removeComponent) {
                this.componentManager.removeComponent(componentId);
            }
            
            // Remove from DOM
            component.remove();
            console.log(`🎯 Deleted component: ${componentId}`);
        });

        this.clearSelection();
        this.showNotification(`Deleted ${count} component(s)`);
    }

    /**
     * Show context menu for selection operations
     */
    showContextMenu(e) {
        // TODO: Implement context menu
        console.log('🎯 Context menu requested at', e.clientX, e.clientY);
    }

    /**
     * Get component position
     */
    getComponentPosition(component) {
        const rect = component.getBoundingClientRect();
        const canvasRect = this.canvasElement ? this.canvasElement.getBoundingClientRect() : { left: 0, top: 0 };
        
        return {
            x: rect.left - canvasRect.left,
            y: rect.top - canvasRect.top
        };
    }

    /**
     * Set component position
     */
    setComponentPosition(component, position) {
        component.style.left = position.x + 'px';
        component.style.top = position.y + 'px';
        component.style.position = 'absolute';
    }

    /**
     * Generate unique ID for component
     */
    generateUniqueId(baseId) {
        // Extract the original component ID (remove any previous -copy- suffixes)
        const originalId = baseId.split('-copy-')[0];
        
        // Generate shorter unique suffix
        const timestamp = Date.now().toString().slice(-6); // Last 6 digits
        const random = Math.random().toString(36).substr(2, 4); // Shorter random
        return `${originalId}-copy-${timestamp}-${random}`;
    }

    /**
     * Update selection UI (status bar, properties panel, etc.)
     */
    updateSelectionUI() {
        const count = this.selectedComponents.size;
        
        // Dispatch selection change event
        const event = new CustomEvent('canvas-selection-changed', {
            detail: {
                selectedCount: count,
                selectedComponents: Array.from(this.selectedComponents)
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * Show notification to user
     */
    showNotification(message) {
        // Simple notification - can be enhanced with toast library
        console.log(`📢 ${message}`);
        
        // Create temporary notification
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 10px 15px;
            border-radius: 4px;
            z-index: 10000;
            font-size: 14px;
            font-family: Arial, sans-serif;
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    /**
     * Setup canvas interactions
     */
    setupCanvasInteractions() {
        // Listen for canvas ready event
        document.addEventListener('canvas-ready', (e) => {
            this.setReferences(e.detail.canvas, e.detail.componentManager);
        });
    }

    /**
     * Get selection info
     */
    getSelectionInfo() {
        return {
            count: this.selectedComponents.size,
            components: Array.from(this.selectedComponents),
            clipboardCount: this.clipboard.length
        };
    }
}

// Create and export singleton instance
export const canvasSelectionManager = new CanvasSelectionManager();

// Default export for convenience
export default canvasSelectionManager;
