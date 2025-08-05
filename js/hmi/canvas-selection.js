/**
 * Canvas Selection Module - Handles canvas selection functionality
 * This is a refactored version of the original canvas-selection-manager.js
 */

import { selectionCore } from './input/selection/selection-core.js';
import { marqueeSelection } from './input/selection/marquee-selection.js';
import { dragDropManager } from './input/dragdrop-manager.js';
import { keyboardHandler } from './input/keyboard-handler.js';
import { clipboardManager } from './input/clipboard-manager.js';

/**
 * Canvas Selection Manager - Coordinates selection functionality
 */
export class CanvasSelectionManager {
    constructor() {
        this.canvasElement = null;
        this.componentManager = null;
        this.isInitialized = false;
        
        // Module references
        this.selectionCore = selectionCore;
        this.marqueeSelection = marqueeSelection;
        this.dragDropManager = dragDropManager;
        this.keyboardHandler = keyboardHandler;
        this.clipboardManager = clipboardManager;
        
        // Bind methods to maintain 'this' context
        this.handleCanvasMouseDown = this.handleCanvasMouseDown.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleContextMenu = this.handleContextMenu.bind(this);
        this.handleCanvasReady = this.handleCanvasReady.bind(this);
        
        this.init();
    }

    /**
     * Initialize the selection manager
     */
    init() {
        if (this.isInitialized) return;
        
        // Initialize keyboard handler first
        this.keyboardHandler.init();
        this.keyboardHandler.setReferences(this.selectionCore, this.clipboardManager);
        
        // Set up canvas interactions
        this.setupCanvasInteractions();
        
        this.isInitialized = true;
        console.log('🎯 Canvas Selection Manager (HMI) initialized');
    }

    /**
     * Set references to canvas and component manager
     */
    setReferences(canvasElement, componentManager) {
        // Clean up old references if they exist
        this.cleanupEventListeners();
        
        this.canvasElement = canvasElement;
        this.componentManager = componentManager;
        
        if (!canvasElement || !componentManager) {
            console.warn('Canvas or ComponentManager not provided to CanvasSelectionManager');
            return;
        }
        
        // Set references for all modules
        this.selectionCore.setReferences(canvasElement, componentManager);
        this.marqueeSelection.setReferences(canvasElement, this.selectionCore);
        this.dragDropManager.setReferences(canvasElement, componentManager, this.selectionCore);
        this.clipboardManager.setReferences(canvasElement, this.selectionCore);
        
        // Set up event listeners for the new canvas
        this.setupCanvasEventListeners();
    }

    /**
     * Set up canvas event listeners
     */
    setupCanvasEventListeners() {
        if (!this.canvasElement) return;
        
        // Mouse events
        this.canvasElement.addEventListener('mousedown', this.handleCanvasMouseDown);
        this.canvasElement.addEventListener('mousemove', this.handleMouseMove);
        this.canvasElement.addEventListener('mouseup', this.handleMouseUp);
        this.canvasElement.addEventListener('contextmenu', this.handleContextMenu);
        
        // Touch events for mobile
        this.canvasElement.addEventListener('touchstart', this.handleCanvasMouseDown, { passive: false });
        this.canvasElement.addEventListener('touchmove', this.handleMouseMove, { passive: false });
        this.canvasElement.addEventListener('touchend', this.handleMouseUp, { passive: false });
    }
    
    /**
     * Clean up event listeners
     */
    cleanupEventListeners() {
        if (!this.canvasElement) return;
        
        // Remove mouse event listeners
        this.canvasElement.removeEventListener('mousedown', this.handleCanvasMouseDown);
        this.canvasElement.removeEventListener('mousemove', this.handleMouseMove);
        this.canvasElement.removeEventListener('mouseup', this.handleMouseUp);
        this.canvasElement.removeEventListener('contextmenu', this.handleContextMenu);
        
        // Remove touch event listeners
        this.canvasElement.removeEventListener('touchstart', this.handleCanvasMouseDown);
        this.canvasElement.removeEventListener('touchmove', this.handleMouseMove);
        this.canvasElement.removeEventListener('touchend', this.handleMouseUp);
        
        // Remove document-level event listeners
        document.removeEventListener('canvas-ready', this.handleCanvasReady);
    }

    /**
     * Handle mouse down on canvas
     */
    handleCanvasMouseDown(e) {
        // Prevent default behavior for touch events
        if (e.type === 'touchstart') {
            e.preventDefault();
            // Convert touch event to mouse event
            const touch = e.touches[0];
            e = {
                ...e,
                clientX: touch.clientX,
                clientY: touch.clientY,
                target: document.elementFromPoint(touch.clientX, touch.clientY),
                ctrlKey: e.ctrlKey || e.metaKey,
                preventDefault: () => touch.preventDefault()
            };
        }

        // Check if clicked on empty canvas area
        const className = e.target.className instanceof SVGAnimatedString ? 
            e.target.className.baseVal : e.target.className;
            
        const isEmptyArea = e.target === this.canvasElement || 
                          (className && className.includes && className.includes('grid')) ||
                          e.target.tagName === 'line' ||
                          (e.target.tagName === 'g' && className && className.includes && className.includes('grid'));

        if (isEmptyArea) {
            // Clear selection if not holding Ctrl/Cmd
            if (!e.ctrlKey && !e.metaKey) {
                this.selectionCore.clearSelection();
            }
            
            // Start marquee selection
            this.marqueeSelection.startSelectionBox(e);
            return;
        }

        // Handle component selection
        const clickedComponent = this.selectionCore.getComponentFromEvent(e);
        if (clickedComponent) {
            // Handle component selection
            if (e.ctrlKey || e.metaKey) {
                this.selectionCore.toggleComponentSelection(clickedComponent);
            } else if (!this.selectionCore.selectedComponents.has(clickedComponent)) {
                this.selectionCore.clearSelection();
                this.selectionCore.selectComponent(clickedComponent);
            }
            
            // Start dragging if component is selected
            if (this.selectionCore.selectedComponents.has(clickedComponent)) {
                this.dragDropManager.startDragging(e);
            }
        }
    }

    /**
     * Handle mouse move
     */
    handleMouseMove(e) {
        // Handle marquee selection
        this.marqueeSelection.handleMouseMove(e);
        
        // Handle dragging
        this.dragDropManager.handleMouseMove(e);
    }

    /**
     * Handle mouse up
     */
    handleMouseUp(e) {
        // Handle marquee selection
        this.marqueeSelection.handleMouseUp(e);
        
        // Handle dragging
        this.dragDropManager.handleMouseUp(e);
    }

    /**
     * Handle context menu
     */
    handleContextMenu(e) {
        e.preventDefault();
        
        const hasSelection = this.selectionCore.selectedComponents.size > 0;
        const hasClipboard = this.clipboardManager.clipboard.length > 0;
        
        // Dispatch event for context menu
        const event = new CustomEvent('canvas-context-menu', {
            detail: {
                x: e.clientX,
                y: e.clientY,
                hasSelection,
                hasClipboard,
                canCopy: hasSelection,
                canPaste: hasClipboard,
                canDelete: hasSelection
            },
            bubbles: true,
            composed: true
        });
        
        this.canvasElement.dispatchEvent(event);
    }

    /**
     * Set up canvas interactions
     */
    setupCanvasInteractions() {
        // Listen for canvas-ready event
        document.addEventListener('canvas-ready', this.handleCanvasReady);
    }
    
    /**
     * Handle canvas ready event
     */
    handleCanvasReady(e) {
        this.setReferences(e.detail.canvas, e.detail.componentManager);
    }

    // ===== Public API Methods =====

    /**
     * Select component by ID
     */
    selectComponentById(componentId) {
        const component = document.querySelector(`[data-id="${componentId}"]`);
        if (component) {
            this.selectionCore.selectComponent(component);
        }
    }

    /**
     * Deselect component by ID
     */
    deselectComponentById(componentId) {
        const component = document.querySelector(`[data-id="${componentId}"]`);
        if (component) {
            this.selectionCore.deselectComponent(component);
        }
    }

    /**
     * Toggle component selection by ID
     */
    toggleComponentSelectionById(componentId) {
        const component = document.querySelector(`[data-id="${componentId}"]`);
        if (component) {
            this.selectionCore.toggleComponentSelection(component);
        }
    }

    /**
     * Select multiple components by ID
     */
    selectComponents(componentIds, clearExisting = true) {
        if (clearExisting) {
            this.selectionCore.clearSelection();
        }
        
        componentIds.forEach(id => this.selectComponentById(id));
    }

    /**
     * Get selected components
     */
    getSelectedComponents() {
        return Array.from(this.selectionCore.selectedComponents);
    }

    /**
     * Clear selection
     */
    clearSelection() {
        this.selectionCore.clearSelection();
    }

    /**
     * Delete selected components
     */
    deleteSelected() {
        this.selectionCore.deleteSelectedComponents();
    }

    /**
     * Get the number of selected components
     */
    get selectionCount() {
        return this.selectionCore.selectedComponents.size;
    }

    /**
     * Check if a component is selected
     */
    isSelected(component) {
        return this.selectionCore.selectedComponents.has(component);
    }

    /**
     * Clean up resources
     */
    destroy() {
        this.cleanupEventListeners();
        this.keyboardHandler.destroy();
    }
}

// Create and export singleton instance
export const canvasSelectionManager = new CanvasSelectionManager();

export default canvasSelectionManager;
