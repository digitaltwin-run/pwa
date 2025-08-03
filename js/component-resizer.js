/**
 * ComponentResizer - Grid-based component resizing system
 * Allows resizing SVG components as multiples of grid units
 */

import { gridManager } from './grid.js';

export class ComponentResizer {
    constructor(componentManager) {
        this.componentManager = componentManager;
        this.isResizing = false;
        this.currentComponent = null;
        this.resizeHandles = null;
        this.startDimensions = null;
        this.startMousePos = null;
        
        this.init();
    }
    
    init() {
        console.log('🔧 ComponentResizer initialized with grid-based resizing');
    }
    
    /**
     * Enable resizing for a component by adding resize handles
     * @param {SVGElement} svgElement - The SVG component to make resizable
     */
    enableResizing(svgElement) {
        if (!svgElement) return;
        
        // Remove existing handles first
        this.disableResizing(svgElement);
        
        // Create resize handles container
        const handleGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        handleGroup.setAttribute('class', 'resize-handles');
        handleGroup.setAttribute('data-component-id', svgElement.getAttribute('data-id'));
        
        // Get current dimensions
        const bounds = this.getComponentBounds(svgElement);
        
        // Create 8 resize handles (corners + sides)
        const handles = this.createResizeHandles(bounds);
        handles.forEach(handle => handleGroup.appendChild(handle));
        
        // Add handles to canvas (not to component itself)
        const canvas = svgElement.closest('svg');
        if (canvas) {
            canvas.appendChild(handleGroup);
        }
        
        // Store reference
        svgElement.setAttribute('data-resize-handles', 'true');
        
        console.log(`✅ Resize handles enabled for component ${svgElement.getAttribute('data-id')}`);
    }
    
    /**
     * Disable resizing for a component by removing resize handles
     * @param {SVGElement} svgElement - The SVG component
     */
    disableResizing(svgElement) {
        if (!svgElement) return;
        
        const canvas = svgElement.closest('svg');
        if (!canvas) return;
        
        const componentId = svgElement.getAttribute('data-id');
        const handles = canvas.querySelector(`g.resize-handles[data-component-id="${componentId}"]`);
        
        if (handles) {
            handles.remove();
        }
        
        svgElement.removeAttribute('data-resize-handles');
    }
    
    /**
     * Get component bounds for positioning resize handles
     * @param {SVGElement} svgElement - The SVG component
     * @returns {Object} Bounds with x, y, width, height
     */
    getComponentBounds(svgElement) {
        try {
            const bbox = svgElement.getBBox();
            
            // Get position from attributes if available
            const x = parseFloat(svgElement.getAttribute('x')) || bbox.x;
            const y = parseFloat(svgElement.getAttribute('y')) || bbox.y;
            const width = parseFloat(svgElement.getAttribute('width')) || bbox.width;
            const height = parseFloat(svgElement.getAttribute('height')) || bbox.height;
            
            return { x, y, width, height };
        } catch (error) {
            console.warn('Could not get component bounds, using fallback:', error);
            return { x: 0, y: 0, width: 50, height: 50 };
        }
    }
    
    /**
     * Create resize handles for component bounds
     * @param {Object} bounds - Component bounds
     * @returns {Array} Array of SVG handle elements
     */
    createResizeHandles(bounds) {
        const { x, y, width, height } = bounds;
        const handleSize = 8;
        const handles = [];
        
        // Define handle positions and cursors
        const handlePositions = [
            { x: x - handleSize/2, y: y - handleSize/2, cursor: 'nw-resize', direction: 'nw' },
            { x: x + width/2 - handleSize/2, y: y - handleSize/2, cursor: 'n-resize', direction: 'n' },
            { x: x + width - handleSize/2, y: y - handleSize/2, cursor: 'ne-resize', direction: 'ne' },
            { x: x + width - handleSize/2, y: y + height/2 - handleSize/2, cursor: 'e-resize', direction: 'e' },
            { x: x + width - handleSize/2, y: y + height - handleSize/2, cursor: 'se-resize', direction: 'se' },
            { x: x + width/2 - handleSize/2, y: y + height - handleSize/2, cursor: 's-resize', direction: 's' },
            { x: x - handleSize/2, y: y + height - handleSize/2, cursor: 'sw-resize', direction: 'sw' },
            { x: x - handleSize/2, y: y + height/2 - handleSize/2, cursor: 'w-resize', direction: 'w' }
        ];
        
        handlePositions.forEach(pos => {
            const handle = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            handle.setAttribute('x', pos.x);
            handle.setAttribute('y', pos.y);
            handle.setAttribute('width', handleSize);
            handle.setAttribute('height', handleSize);
            handle.setAttribute('fill', '#007bff');
            handle.setAttribute('stroke', '#ffffff');
            handle.setAttribute('stroke-width', '1');
            handle.setAttribute('class', 'resize-handle');
            handle.setAttribute('data-direction', pos.direction);
            handle.style.cursor = pos.cursor;
            
            // Add resize event listeners
            this.addResizeEventListeners(handle);
            
            handles.push(handle);
        });
        
        return handles;
    }
    
    /**
     * Add event listeners for resize handles
     * @param {SVGElement} handle - The resize handle element
     */
    addResizeEventListeners(handle) {
        handle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.startResize(handle, e);
        });
    }
    
    /**
     * Start resize operation
     * @param {SVGElement} handle - The clicked resize handle
     * @param {MouseEvent} e - Mouse event
     */
    startResize(handle, e) {
        const handleGroup = handle.closest('.resize-handles');
        if (!handleGroup) return;
        
        const componentId = handleGroup.getAttribute('data-component-id');
        const svgElement = this.componentManager.getComponent(componentId)?.element;
        if (!svgElement) return;
        
        this.isResizing = true;
        this.currentComponent = svgElement;
        this.startMousePos = { x: e.clientX, y: e.clientY };
        this.startDimensions = this.getComponentBounds(svgElement);
        this.resizeDirection = handle.getAttribute('data-direction');
        
        // Add global mouse listeners
        this.addGlobalResizeListeners();
        
        // Add visual feedback
        document.body.style.cursor = handle.style.cursor;
        
        console.log(`🎯 Started resizing component ${componentId} in direction ${this.resizeDirection}`);
    }
    
    /**
     * Add global mouse listeners for resize operation
     */
    addGlobalResizeListeners() {
        const handleMouseMove = (e) => this.handleResize(e);
        const handleMouseUp = (e) => this.endResize(e);
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        
        // Store listeners for cleanup
        this.globalListeners = { handleMouseMove, handleMouseUp };
    }
    
    /**
     * Handle resize during mouse move
     * @param {MouseEvent} e - Mouse event
     */
    handleResize(e) {
        if (!this.isResizing || !this.currentComponent) return;
        
        const deltaX = e.clientX - this.startMousePos.x;
        const deltaY = e.clientY - this.startMousePos.y;
        
        // Calculate new dimensions based on resize direction
        const newDimensions = this.calculateNewDimensions(deltaX, deltaY);
        
        // Snap to grid
        const snappedDimensions = gridManager.snapDimensionsToGrid(newDimensions, {
            width: gridManager.config.size,
            height: gridManager.config.size
        });
        
        // Apply new dimensions
        this.applyComponentResize(this.currentComponent, snappedDimensions);
        
        // Update resize handles
        this.updateResizeHandles(this.currentComponent);
    }
    
    /**
     * Calculate new dimensions based on resize direction and mouse delta
     * @param {number} deltaX - Mouse X movement
     * @param {number} deltaY - Mouse Y movement
     * @returns {Object} New dimensions
     */
    calculateNewDimensions(deltaX, deltaY) {
        const { x, y, width, height } = this.startDimensions;
        let newX = x, newY = y, newWidth = width, newHeight = height;
        
        switch (this.resizeDirection) {
            case 'se': // Southeast - resize width and height
                newWidth = width + deltaX;
                newHeight = height + deltaY;
                break;
            case 'sw': // Southwest - resize width (left) and height
                newX = x + deltaX;
                newWidth = width - deltaX;
                newHeight = height + deltaY;
                break;
            case 'ne': // Northeast - resize width and height (top)
                newY = y + deltaY;
                newWidth = width + deltaX;
                newHeight = height - deltaY;
                break;
            case 'nw': // Northwest - resize both from top-left
                newX = x + deltaX;
                newY = y + deltaY;
                newWidth = width - deltaX;
                newHeight = height - deltaY;
                break;
            case 'e': // East - resize width only
                newWidth = width + deltaX;
                break;
            case 'w': // West - resize width from left
                newX = x + deltaX;
                newWidth = width - deltaX;
                break;
            case 's': // South - resize height only
                newHeight = height + deltaY;
                break;
            case 'n': // North - resize height from top
                newY = y + deltaY;
                newHeight = height - deltaY;
                break;
        }
        
        // Ensure minimum dimensions
        const minSize = gridManager.config.size;
        newWidth = Math.max(newWidth, minSize);
        newHeight = Math.max(newHeight, minSize);
        
        return { x: newX, y: newY, width: newWidth, height: newHeight };
    }
    
    /**
     * Apply new dimensions to component
     * @param {SVGElement} svgElement - The component element
     * @param {Object} dimensions - New dimensions
     */
    applyComponentResize(svgElement, dimensions) {
        const { x, y, width, height } = dimensions;
        
        // Update SVG attributes
        svgElement.setAttribute('x', x);
        svgElement.setAttribute('y', y);
        svgElement.setAttribute('width', width);
        svgElement.setAttribute('height', height);
        
        // Update viewBox if it exists
        const viewBox = svgElement.getAttribute('viewBox');
        if (viewBox) {
            const parts = viewBox.split(' ');
            svgElement.setAttribute('viewBox', `0 0 ${width} ${height}`);
        }
        
        // Update metadata
        const metadata = JSON.parse(svgElement.getAttribute('data-metadata') || '{}');
        metadata.dimensions = { width, height };
        metadata.position = { x, y };
        svgElement.setAttribute('data-metadata', JSON.stringify(metadata));
        
        console.log(`📏 Resized component to ${width}x${height} (${gridManager.getGridMultiplierForSize(width)}x${gridManager.getGridMultiplierForSize(height)} grid units)`);
    }
    
    /**
     * Update resize handles position after component resize
     * @param {SVGElement} svgElement - The component element
     */
    updateResizeHandles(svgElement) {
        const componentId = svgElement.getAttribute('data-id');
        const canvas = svgElement.closest('svg');
        if (!canvas) return;
        
        const handleGroup = canvas.querySelector(`g.resize-handles[data-component-id="${componentId}"]`);
        if (!handleGroup) return;
        
        // Remove old handles and create new ones
        while (handleGroup.firstChild) {
            handleGroup.removeChild(handleGroup.firstChild);
        }
        
        const bounds = this.getComponentBounds(svgElement);
        const newHandles = this.createResizeHandles(bounds);
        newHandles.forEach(handle => handleGroup.appendChild(handle));
    }
    
    /**
     * End resize operation
     * @param {MouseEvent} e - Mouse event
     */
    endResize(e) {
        if (!this.isResizing) return;
        
        this.isResizing = false;
        
        // Remove global listeners
        if (this.globalListeners) {
            document.removeEventListener('mousemove', this.globalListeners.handleMouseMove);
            document.removeEventListener('mouseup', this.globalListeners.handleMouseUp);
        }
        
        // Restore cursor
        document.body.style.cursor = '';
        
        // Trigger property panel update if component is selected
        if (this.currentComponent && window.propertiesManager) {
            window.propertiesManager.showProperties(this.currentComponent);
        }
        
        console.log(`✅ Finished resizing component ${this.currentComponent?.getAttribute('data-id')}`);
        
        this.currentComponent = null;
        this.globalListeners = null;
    }
    
    /**
     * Get grid size options for UI dropdown
     * @returns {Array} Array of size options
     */
    getGridSizeOptions() {
        return gridManager.getGridSizeOptions(20);
    }
    
    /**
     * Resize component to specific grid multiples
     * @param {string} componentId - Component ID
     * @param {number} widthMultiplier - Width in grid units
     * @param {number} heightMultiplier - Height in grid units
     */
    resizeToGridMultiples(componentId, widthMultiplier, heightMultiplier) {
        const componentData = this.componentManager.getComponent(componentId);
        if (!componentData) return;
        
        const svgElement = componentData.element;
        const currentBounds = this.getComponentBounds(svgElement);
        
        const newWidth = widthMultiplier * gridManager.config.size;
        const newHeight = heightMultiplier * gridManager.config.size;
        
        const newDimensions = {
            x: currentBounds.x,
            y: currentBounds.y,
            width: newWidth,
            height: newHeight
        };
        
        this.applyComponentResize(svgElement, newDimensions);
        this.updateResizeHandles(svgElement);
        
        console.log(`📐 Resized component ${componentId} to ${widthMultiplier}x${heightMultiplier} grid units (${newWidth}x${newHeight}px)`);
    }
}

// Global functions for HTML integration
window.enableComponentResizing = function(componentId) {
    if (window.componentResizer && window.componentManager) {
        const componentData = window.componentManager.getComponent(componentId);
        if (componentData) {
            window.componentResizer.enableResizing(componentData.element);
        }
    }
};

window.disableComponentResizing = function(componentId) {
    if (window.componentResizer && window.componentManager) {
        const componentData = window.componentManager.getComponent(componentId);
        if (componentData) {
            window.componentResizer.disableResizing(componentData.element);
        }
    }
};

window.resizeComponentToGrid = function(componentId, widthMultiplier, heightMultiplier) {
    if (window.componentResizer) {
        window.componentResizer.resizeToGridMultiples(componentId, parseInt(widthMultiplier), parseInt(heightMultiplier));
    }
};
