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
        
        // Drag functionality for selected components
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.originalPositions = new Map();
        
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

        this.canvasElement.addEventListener('mousedown', (e) => this.handleCanvasMouseDown(e));
        this.canvasElement.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvasElement.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        
        // Prevent context menu on canvas for custom operations
        this.canvasElement.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showContextMenu(e);
        });
    }

    /**
     * Handle mouse down on canvas - check for multi-selection and start drag
     */
    handleCanvasMouseDown(e) {
        console.log('🎯 Mouse down on canvas', e.target === this.canvasElement, e.target.tagName, e.target.className);
        
        // Check if clicked on empty canvas area (canvas itself, grid, or non-component elements)
        const isEmptyArea = e.target === this.canvasElement || 
                           e.target.classList.contains('grid') ||
                           (e.target.tagName === 'line' && e.target.getAttribute('stroke') === '#e0e0e0') ||
                           (e.target.tagName === 'g' && e.target.classList.contains('grid')) ||
                           !e.target.closest('.draggable-component');
        
        if (isEmptyArea) {
            console.log('🎯 Empty area click detected - starting marquee selection');
            // Clear selection if clicking on empty canvas (and not modifier key)
            if (!e.ctrlKey && !e.shiftKey) {
                this.clearSelection();
            }
            
            // Always start selection box for multi-select with mouse drag on canvas
            this.startSelectionBox(e);
        } else {
            // Check if clicked element is a component
            let component = e.target.closest('.draggable-component');
            if (component) {
                // Get all overlapping components at this point
                const rect = component.getBoundingClientRect();
                const elementsAtPoint = document.elementsFromPoint(rect.left + rect.width/2, rect.top + rect.height/2);
                const overlappingComponents = elementsAtPoint.filter(el => 
                    el.classList.contains('draggable-component')
                );
                
                if (overlappingComponents.length > 1) {
                    console.log(`🎯 Found ${overlappingComponents.length} overlapping components`);
                    
                    // Prioritize already selected components
                    const selectedOverlapping = overlappingComponents.filter(comp => 
                        this.selectedComponents.has(comp)
                    );
                    
                    if (selectedOverlapping.length > 0) {
                        // Use the first selected overlapping component
                        component = selectedOverlapping[0];
                    }
                }
                
                if (e.ctrlKey) {
                    // Toggle selection
                    this.toggleComponentSelection(component);
                } else if (e.shiftKey) {
                    // Add to selection
                    this.selectComponent(component);
                } else {
                    // Single selection (unless already selected for multi-drag)
                    if (!this.selectedComponents.has(component)) {
                        this.clearSelection();
                        this.selectComponent(component);
                    }
                }
                
                // Start drag if we have selected components
                if (this.selectedComponents.size > 0) {
                    this.startDrag(e);
                }
            }
        }
    }

    /**
     * Handle mouse move - update selection box or component dragging
     */
    handleMouseMove(e) {
        if (this.isDragging) {
            this.updateDrag(e);
        } else if (this.isSelecting && this.selectionBox) {
            this.updateSelectionBox(e);
        }
    }

    /**
     * Handle mouse up - finalize selection or dragging
     */
    handleMouseUp(e) {
        if (this.isDragging) {
            this.endDrag();
        } else if (this.isSelecting) {
            this.endSelectionBox();
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
        // Remove old selection box if it exists
        if (this.selectionBox) {
            this.selectionBox.remove();
        }
        
        // Create new selection box
        this.selectionBox = document.createElement('div');
        this.selectionBox.className = 'canvas-selection-box';
        this.selectionBox.style.cssText = `
            position: absolute;
            border: 2px dashed #007bff;
            background: rgba(0, 123, 255, 0.1);
            pointer-events: none;
            z-index: 9999;
        `;
        
        // Add to workspace instead of body for better positioning
        const workspace = document.getElementById('workspace');
        if (workspace) {
            workspace.appendChild(this.selectionBox);
        } else {
            document.body.appendChild(this.selectionBox);
        }
        
        console.log('🎯 Created selection box', this.selectionBox);
    }

    /**
     * Update selection box size and position
     */
    updateSelectionBox(e) {
        if (!this.selectionBox || !this.isSelecting) return;

        // Get canvas position to adjust coordinates relative to workspace
        const canvasRect = this.canvasElement ? this.canvasElement.getBoundingClientRect() : { left: 0, top: 0 };
        
        // Calculate rectangle in client coordinates
        const clientRect = {
            left: Math.min(this.selectionStart.x, e.clientX),
            top: Math.min(this.selectionStart.y, e.clientY),
            width: Math.abs(e.clientX - this.selectionStart.x),
            height: Math.abs(e.clientY - this.selectionStart.y)
        };
        
        // Convert to workspace coordinates
        const workspaceRect = {
            left: clientRect.left - canvasRect.left,
            top: clientRect.top - canvasRect.top,
            width: clientRect.width,
            height: clientRect.height
        };

        // Apply position and size
        this.selectionBox.style.left = workspaceRect.left + 'px';
        this.selectionBox.style.top = workspaceRect.top + 'px';
        this.selectionBox.style.width = workspaceRect.width + 'px';
        this.selectionBox.style.height = workspaceRect.height + 'px';
        
        console.log('🎯 Selection box updated', workspaceRect);
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
     * End selection box - alias for finalizeSelectionBox for consistency
     */
    endSelectionBox() {
        this.finalizeSelectionBox();
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
     * Start dragging selected components
     */
    startDrag(e) {
        if (this.selectedComponents.size === 0) return;
        
        this.isDragging = true;
        this.dragStart = { x: e.clientX, y: e.clientY };
        
        // Store original positions of all selected components
        this.originalPositions.clear();
        
        this.selectedComponents.forEach(component => {
            // Get position data from transform attribute if available, or x/y attributes as fallback
            let x = parseInt(component.getAttribute('x')) || 0;
            let y = parseInt(component.getAttribute('y')) || 0;
            
            // If component is a g element or complex SVG, get position from transform
            const transform = component.getAttribute('transform');
            if (transform && transform.startsWith('translate')) {
                const match = transform.match(/translate\(\s*([\d.-]+)(?:[,\s]+([\d.-]+))?\s*\)/);
                if (match) {
                    x = parseFloat(match[1]) || 0;
                    y = parseFloat(match[2]) || 0;
                }
            }
            
            // Save original position
            this.originalPositions.set(component, { x, y });
            
            // Ensure component is tagged as draggable for CSS
            component.classList.add('draggable-component');
        });
        
        // Add dragging visual feedback
        this.selectedComponents.forEach(component => {
            component.style.opacity = '0.7';
            component.style.cursor = 'grabbing';
        });
        
        console.log(`🎯 Started dragging ${this.selectedComponents.size} component(s)`);
        
        // Prevent default browser behavior
        e.preventDefault();
    }
    
    /**
     * Update drag - move all selected components
     */
    updateDrag(e) {
        if (!this.isDragging || this.selectedComponents.size === 0) return;
        
        const deltaX = e.clientX - this.dragStart.x;
        const deltaY = e.clientY - this.dragStart.y;
        
        // Apply delta to all selected components
        this.selectedComponents.forEach(component => {
            const original = this.originalPositions.get(component);
            if (original) {
                const newX = original.x + deltaX;
                const newY = original.y + deltaY;
                
                // Update component position based on component type
                if (component.tagName.toLowerCase() === 'g') {
                    // For group elements, set transform
                    component.setAttribute('transform', `translate(${newX}, ${newY})`);
                } else {
                    // For other SVG elements like rect, circle, etc.
                    component.setAttribute('x', newX);
                    component.setAttribute('y', newY);
                }
                
                // Store new position in data attributes for easier access
                component.dataset.x = newX;
                component.dataset.y = newY;
                
                // Update any associated resize handles
                if (window.componentResizer) {
                    window.componentResizer.updateHandlePositions(component);
                }
            }
        });
        
        e.preventDefault();
    }
    
    /**
     * End dragging
     */
    endDrag() {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        
        // Remove dragging visual feedback
        this.selectedComponents.forEach(component => {
            component.style.opacity = '';
            component.style.cursor = '';
        });
        
        // Notify about position changes - get the actual updated positions
        const movedComponents = Array.from(this.selectedComponents).map(component => {
            // Get position data considering both attributes and transform
            let x, y;
            
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
            
            return { id, x, y };
        });
        
        console.log(`🎯 Finished dragging. Moved components:`, movedComponents);
        
        // Dispatch event for other managers to update
        const event = new CustomEvent('components-moved', {
            detail: { components: movedComponents }
        });
        document.dispatchEvent(event);
        
        // Also notify the ComponentManager directly if available
        if (this.componentManager) {
            movedComponents.forEach(comp => {
                const element = document.querySelector(`[data-id="${comp.id}"]`);
                if (element) {
                    // ComponentManager doesn't have updateComponentPosition method
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
        this.updateSelectionUI();
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
