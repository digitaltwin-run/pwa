import { selectionCore } from './hmi/input/selection/selection-core.js';
import { marqueeSelection } from './hmi/input/selection/marquee-selection.js';
import { dragDropManager } from './hmi/input/dragdrop-manager.js';
import { keyboardHandler } from './hmi/input/keyboard-handler.js';
import { clipboardManager } from './hmi/input/clipboard-manager.js';

/**
 * Canvas Selection Manager - Refactored coordinator for selection functionality
 * Now uses modular components for better maintainability
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
        
        this.setupCanvasInteractions();
        this.isInitialized = true;
        
        console.log('🎯 Canvas Selection Manager (Refactored) initialized');
    }

    /**
     * Set references to canvas and component manager
     */
    setReferences(canvasElement, componentManager) {
        this.canvasElement = canvasElement;
        this.componentManager = componentManager;
        
        // Set references for all modules
        this.selectionCore.setReferences(canvasElement, componentManager);
        this.marqueeSelection.setReferences(canvasElement, this.selectionCore);
        this.dragDropManager.setReferences(canvasElement, componentManager, this.selectionCore);
        this.clipboardManager.setReferences(canvasElement, this.selectionCore);
        
        if (this.canvasElement) {
            this.setupCanvasEventListeners();
        }
    }

    /**
     * Setup canvas mouse interactions
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
     * Handle mouse down on canvas
     */
    handleCanvasMouseDown(e) {
        // Get className properly for SVG elements
        const className = e.target.className instanceof SVGAnimatedString ? 
            e.target.className.baseVal : e.target.className;
        
        console.log('🎯 Mouse down on canvas', e.target === this.canvasElement, e.target.tagName, className);
        
        // Check if clicked on empty canvas area
        const isEmptyArea = e.target === this.canvasElement || 
                           e.target.classList.contains('grid') ||
                           e.target.tagName === 'line' ||
                           (e.target.tagName === 'g' && e.target.classList.contains('grid'));

        if (isEmptyArea) {
            // Clear selection if not holding Ctrl
            if (!e.ctrlKey && !e.metaKey) {
                this.selectionCore.clearSelection();
            }
            
            // Start marquee selection
            this.marqueeSelection.startSelectionBox(e);
            return;
        }

        // Check if clicked on a component using simplified event-based approach
        const clickedComponent = this.selectionCore.getComponentFromEvent(e);
        if (clickedComponent) {
            console.log(`🎯 Component clicked: ${clickedComponent.getAttribute('data-id')}`);
            
            // Handle component selection
            if (e.ctrlKey || e.metaKey) {
                this.selectionCore.toggleComponentSelection(clickedComponent);
            } else {
                if (!this.selectionCore.selectedComponents.has(clickedComponent)) {
                    this.selectionCore.clearSelection();
                    this.selectionCore.selectComponent(clickedComponent);
                }
            }
            
            // Start dragging if component is selected
            if (this.selectionCore.selectedComponents.has(clickedComponent)) {
                this.dragDropManager.startDrag(e);
            }
            
            // Prevent empty area selection logic
            return;
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
     * Show context menu for selection operations
     */
    showContextMenu(e) {
        // Simple context menu implementation
        console.log('🎯 Context menu requested at', e.clientX, e.clientY);
        
        // Could implement actual context menu here
        const hasSelection = this.selectionCore.selectedComponents.size > 0;
        const hasClipboard = this.clipboardManager.clipboard.length > 0;
        
        console.log('Context options:', {
            hasSelection,
            hasClipboard,
            canCopy: hasSelection,
            canPaste: hasClipboard,
            canDelete: hasSelection
        });
    }

    /**
     * Setup canvas interactions - listen for canvas ready event
     */
    setupCanvasInteractions() {
        document.addEventListener('canvas-ready', (e) => {
            this.setReferences(e.detail.canvas, e.detail.componentManager);
        });
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
     * Get selection info
     */
    getSelectionInfo() {
        const selectionInfo = this.selectionCore.getSelectionInfo();
        const clipboardInfo = this.clipboardManager.getClipboardInfo();
        
        return {
            ...selectionInfo,
            clipboardCount: clipboardInfo.count,
            clipboardTypes: clipboardInfo.types
        };
    }

    /**
     * Copy selected components
     */
    copySelectedComponents() {
        this.clipboardManager.copySelectedComponents();
    }

    /**
     * Paste components
     */
    pasteComponents() {
        this.clipboardManager.pasteComponents();
    }

    /**
     * Delete selected components
     */
    deleteSelectedComponents() {
        this.keyboardHandler.deleteSelectedComponents();
    }

    /**
     * Select all components
     */
    selectAllComponents() {
        this.selectionCore.selectAllComponents();
    }

    /**
     * Clear all selections
     */
    clearSelection() {
        this.selectionCore.clearSelection();
    }

    /**
     * Check if component is selected
     */
    isComponentSelected(component) {
        return this.selectionCore.selectedComponents.has(component);
    }

    /**
     * Get all selected components
     */
    getSelectedComponents() {
        return Array.from(this.selectionCore.selectedComponents);
    }

    // ===== Legacy compatibility methods =====

    /**
     * Legacy method for backward compatibility
     */
    get selectedComponents() {
        return this.selectionCore.selectedComponents;
    }

    /**
     * Legacy method for backward compatibility
     */
    get clipboard() {
        return this.clipboardManager.clipboard;
    }

    /**
     * Legacy method for component selection
     */
    selectComponent(component) {
        this.selectionCore.selectComponent(component);
    }

    /**
     * Legacy method for component deselection
     */
    deselectComponent(component) {
        this.selectionCore.deselectComponent(component);
    }

    /**
     * Legacy method for component toggle
     */
    toggleComponentSelection(component) {
        this.selectionCore.toggleComponentSelection(component);
    }
}

// Create and export singleton instance
export const canvasSelectionManager = new CanvasSelectionManager();

// Default export for convenience
export default canvasSelectionManager;
