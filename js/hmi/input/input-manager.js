/**
 * HMI Input Manager - Unified coordinator for all input systems
 * Coordinates mouse, keyboard, touch, drag & drop, and selection
 * @module hmi/input
 */

import { mouseHandler } from './mouse-handler.js';
import { keyboardHandler } from './keyboard-handler.js';
import { touchHandler } from './touch-handler.js';
import { dragDropManager } from './dragdrop-manager.js';
import { selectionCore } from './selection/selection-core.js';
import { marqueeSelection } from './selection/marquee-selection.js';

export class InputManager {
    constructor() {
        this.canvasElement = null;
        this.componentManager = null;
        this.isInitialized = false;

        // Input system references
        this.mouse = mouseHandler;
        this.keyboard = keyboardHandler;
        this.touch = touchHandler;
        this.dragDrop = dragDropManager;
        this.selection = selectionCore;
        this.marquee = marqueeSelection;

        // Event coordination
        this.eventBus = new EventTarget();
        this.isEnabled = true;
    }

    /**
     * Initialize the unified input manager
     */
    async init() {
        if (this.isInitialized) return;

        try {
            // Initialize all input systems
            await this.initializeInputSystems();
            
            // Setup cross-system coordination
            this.setupEventCoordination();
            
            // Setup global input events
            this.setupGlobalEvents();

            this.isInitialized = true;
            console.log('🎮 HMI Input Manager initialized successfully');

        } catch (error) {
            console.error('❌ Failed to initialize HMI Input Manager:', error);
            throw error;
        }
    }

    /**
     * Set references to canvas and component manager
     */
    setReferences(canvasElement, componentManager) {
        this.canvasElement = canvasElement;
        this.componentManager = componentManager;

        // Distribute references to all input systems
        this.distributeReferences();

        console.log('🎮 HMI Input Manager references set');
    }

    /**
     * Initialize all input systems
     */
    async initializeInputSystems() {
        // Initialize core systems first
        this.selection.setReferences(this.canvasElement, this.componentManager);
        this.marquee.setReferences(this.canvasElement, this.selection);

        // Initialize input handlers
        this.keyboard.init();
        this.keyboard.setReferences(this.selection, null); // clipboardManager will be set later

        this.mouse.init();
        this.mouse.setReferences(this.canvasElement, this.selection, this.marquee, this.dragDrop);

        this.touch.init();
        this.touch.setReferences(this.canvasElement, this.selection, null); // gestureDetector from main HMI

        this.dragDrop.init();
        this.dragDrop.setReferences(this.canvasElement, this.componentManager, this.selection);

        console.log('🎮 All input systems initialized');
    }

    /**
     * Distribute references to all subsystems
     */
    distributeReferences() {
        if (!this.canvasElement || !this.componentManager) return;

        this.selection.setReferences(this.canvasElement, this.componentManager);
        this.marquee.setReferences(this.canvasElement, this.selection);
        this.mouse.setReferences(this.canvasElement, this.selection, this.marquee, this.dragDrop);
        this.touch.setReferences(this.canvasElement, this.selection, null);
        this.dragDrop.setReferences(this.canvasElement, this.componentManager, this.selection);
    }

    /**
     * Setup cross-system event coordination
     */
    setupEventCoordination() {
        // Coordinate mouse and touch to prevent conflicts
        this.mouse.on('mousedown', (data) => {
            if (this.touch.activeTouches.size > 0) {
                console.log('🎮 Ignoring mouse event - touch active');
                return;
            }
        });

        // Coordinate selection changes across systems
        this.selection.addSelectionCallback((event) => {
            this.eventBus.dispatchEvent(new CustomEvent('selection-changed', { detail: event }));
        });

        // Coordinate drag operations
        this.dragDrop.on = this.dragDrop.on || (() => {});
        
        // Setup global keyboard shortcuts for input coordination
        this.keyboard.registerShortcut('Ctrl+Shift+I', 'toggleInputDebug');

        console.log('🎮 Event coordination setup complete');
    }

    /**
     * Setup global input events
     */
    setupGlobalEvents() {
        // Listen for canvas-ready event
        document.addEventListener('canvas-ready', (e) => {
            this.setReferences(e.detail.canvas, e.detail.componentManager);
        });

        // Listen for component events
        document.addEventListener('hmi-delete-components', (e) => {
            this.handleDeleteComponents(e.detail.components);
        });

        // Listen for global actions
        document.addEventListener('hmi-save', () => this.handleGlobalSave());
        document.addEventListener('hmi-undo', () => this.handleGlobalUndo());
        document.addEventListener('hmi-redo', () => this.handleGlobalRedo());

        console.log('🎮 Global event listeners setup');
    }

    /**
     * Handle component deletion
     */
    handleDeleteComponents(components) {
        if (!Array.isArray(components)) return;

        components.forEach(component => {
            // Remove from canvas
            if (component.parentElement) {
                component.parentElement.removeChild(component);
            }

            // Remove from component manager
            const componentId = component.getAttribute('data-id');
            if (componentId && this.componentManager) {
                this.componentManager.components.delete(componentId);
            }
        });

        // Clear selection
        this.selection.clearSelection();

        console.log(`🎮 Deleted ${components.length} components`);
    }

    /**
     * Handle global save
     */
    handleGlobalSave() {
        // Trigger save event for main app
        const event = new CustomEvent('app-save-requested');
        document.dispatchEvent(event);
        console.log('🎮 Global save requested');
    }

    /**
     * Handle global undo
     */
    handleGlobalUndo() {
        const event = new CustomEvent('app-undo-requested');
        document.dispatchEvent(event);
        console.log('🎮 Global undo requested');
    }

    /**
     * Handle global redo
     */
    handleGlobalRedo() {
        const event = new CustomEvent('app-redo-requested');
        document.dispatchEvent(event);
        console.log('🎮 Global redo requested');
    }

    /**
     * Enable/disable input systems
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        
        if (enabled) {
            console.log('🎮 Input systems enabled');
        } else {
            console.log('🎮 Input systems disabled');
        }
    }

    /**
     * Get current selection info
     */
    getSelectionInfo() {
        return this.selection.getSelectionInfo();
    }

    /**
     * Get input system status
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            enabled: this.isEnabled,
            hasCanvas: !!this.canvasElement,
            hasComponentManager: !!this.componentManager,
            systems: {
                mouse: !!this.mouse,
                keyboard: !!this.keyboard,
                touch: !!this.touch,
                dragDrop: !!this.dragDrop,
                selection: !!this.selection,
                marquee: !!this.marquee
            },
            selection: this.selection.getSelectionInfo()
        };
    }

    /**
     * Add event listener to input manager
     */
    addEventListener(type, listener, options) {
        this.eventBus.addEventListener(type, listener, options);
    }

    /**
     * Remove event listener from input manager
     */
    removeEventListener(type, listener, options) {
        this.eventBus.removeEventListener(type, listener, options);
    }

    /**
     * Dispatch event from input manager
     */
    dispatchEvent(event) {
        return this.eventBus.dispatchEvent(event);
    }

    /**
     * Debug mode toggle
     */
    toggleDebug() {
        const currentStatus = this.getStatus();
        console.table(currentStatus);
        console.log('🎮 Input Manager Debug Info:', {
            mouse: this.mouse,
            keyboard: this.keyboard,
            touch: this.touch,
            dragDrop: this.dragDrop,
            selection: this.selection,
            marquee: this.marquee
        });
    }

    /**
     * Destroy input manager and all subsystems
     */
    destroy() {
        // Destroy all input systems
        if (this.mouse) this.mouse.destroy();
        if (this.keyboard) this.keyboard.destroy();
        if (this.touch) this.touch.destroy();
        if (this.dragDrop) this.dragDrop.destroy();

        // Clear references
        this.canvasElement = null;
        this.componentManager = null;
        this.isInitialized = false;

        console.log('🎮 HMI Input Manager destroyed');
    }
}

// Create and export singleton instance
export const inputManager = new InputManager();
export default inputManager;
