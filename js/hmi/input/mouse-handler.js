/**
 * HMI Mouse Handler - Unified mouse interaction management
 * Consolidates mouse handling from multiple files
 * @module hmi/input
 */

export class MouseHandler {
    constructor() {
        this.canvasElement = null;
        this.selectionCore = null;
        this.marqueeSelection = null;
        this.dragManager = null;
        
        this.isMouseDown = false;
        this.mouseDownTarget = null;
        this.mouseDownPosition = { x: 0, y: 0 };
        this.lastClickTime = 0;
        this.doubleClickThreshold = 300; // ms
        
        this.eventHandlers = new Map();
    }

    /**
     * Initialize mouse handler
     */
    init() {
        this.setupMouseListeners();
        console.log('🖱️ HMI Mouse Handler initialized');
    }

    /**
     * Set references to other managers
     */
    setReferences(canvasElement, selectionCore, marqueeSelection, dragManager) {
        this.canvasElement = canvasElement;
        this.selectionCore = selectionCore;
        this.marqueeSelection = marqueeSelection;
        this.dragManager = dragManager;
    }

    /**
     * Setup mouse event listeners
     */
    setupMouseListeners() {
        if (!this.canvasElement) return;

        // Primary mouse events
        this.canvasElement.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        
        // Additional mouse events
        this.canvasElement.addEventListener('click', (e) => this.handleClick(e));
        this.canvasElement.addEventListener('dblclick', (e) => this.handleDoubleClick(e));
        this.canvasElement.addEventListener('contextmenu', (e) => this.handleContextMenu(e));
        
        // Mouse wheel for zoom
        this.canvasElement.addEventListener('wheel', (e) => this.handleWheel(e));
        
        console.log('🖱️ Mouse event listeners attached');
    }

    /**
     * Handle mouse down event
     */
    handleMouseDown(e) {
        this.isMouseDown = true;
        this.mouseDownTarget = e.target;
        this.mouseDownPosition = { x: e.clientX, y: e.clientY };

        // Check if clicked on empty canvas area
        const isEmptyArea = this.isEmptyCanvasArea(e.target);
        
        if (isEmptyArea) {
            // Clear selection if not holding Ctrl
            if (!e.ctrlKey && !e.metaKey && this.selectionCore) {
                this.selectionCore.clearSelection();
            }
            
            // Start marquee selection if available
            if (this.marqueeSelection) {
                this.marqueeSelection.startSelectionBox(e);
            }
            
            console.log('🖱️ Mouse down on empty canvas - starting marquee');
            return;
        }

        // Check if clicked on a component
        const clickedComponent = this.getComponentFromEvent(e);
        if (clickedComponent && this.selectionCore) {
            this.handleComponentMouseDown(e, clickedComponent);
        }

        // Notify drag manager
        if (this.dragManager) {
            this.dragManager.handleMouseDown(e);
        }

        // Trigger custom event
        this.triggerEvent('mousedown', { event: e, target: e.target });
    }

    /**
     * Handle mouse move event
     */
    handleMouseMove(e) {
        // Handle marquee selection
        if (this.marqueeSelection && this.marqueeSelection.isMarqueeActive()) {
            this.marqueeSelection.handleMouseMove(e);
        }

        // Handle dragging
        if (this.dragManager) {
            this.dragManager.handleMouseMove(e);
        }

        // Update cursor based on what's under mouse
        this.updateCursor(e);

        // Trigger custom event
        this.triggerEvent('mousemove', { event: e });
    }

    /**
     * Handle mouse up event
     */
    handleMouseUp(e) {
        this.isMouseDown = false;
        
        // Handle marquee selection
        if (this.marqueeSelection) {
            this.marqueeSelection.handleMouseUp(e);
        }

        // Handle dragging
        if (this.dragManager) {
            this.dragManager.handleMouseUp(e);
        }

        // Reset cursor
        this.resetCursor();

        // Trigger custom event
        this.triggerEvent('mouseup', { event: e });
    }

    /**
     * Handle click event
     */
    handleClick(e) {
        const now = Date.now();
        const isDoubleClick = (now - this.lastClickTime) < this.doubleClickThreshold;
        this.lastClickTime = now;

        if (isDoubleClick) {
            // Double click will be handled by dblclick event
            return;
        }

        // Single click on component
        const clickedComponent = this.getComponentFromEvent(e);
        if (clickedComponent && this.selectionCore) {
            if (e.ctrlKey || e.metaKey) {
                this.selectionCore.toggleComponentSelection(clickedComponent);
            } else {
                this.selectionCore.clearSelection();
                this.selectionCore.selectComponent(clickedComponent);
            }
        }

        // Trigger custom event
        this.triggerEvent('click', { event: e, component: clickedComponent });
    }

    /**
     * Handle double click event
     */
    handleDoubleClick(e) {
        const clickedComponent = this.getComponentFromEvent(e);
        
        // Trigger custom event for double click (e.g., open properties)
        this.triggerEvent('doubleclick', { event: e, component: clickedComponent });
        
        console.log('🖱️ Double click detected', clickedComponent ? 'on component' : 'on canvas');
    }

    /**
     * Handle context menu (right click)
     */
    handleContextMenu(e) {
        e.preventDefault();
        
        const clickedComponent = this.getComponentFromEvent(e);
        
        // Trigger custom event for context menu
        this.triggerEvent('contextmenu', { 
            event: e, 
            component: clickedComponent,
            position: { x: e.clientX, y: e.clientY }
        });
        
        console.log('🖱️ Context menu requested');
    }

    /**
     * Handle mouse wheel for zoom
     */
    handleWheel(e) {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            
            // Trigger zoom event
            this.triggerEvent('zoom', { 
                event: e, 
                delta: delta,
                position: { x: e.clientX, y: e.clientY }
            });
        }
    }

    /**
     * Handle component mouse down
     */
    handleComponentMouseDown(e, component) {
        if (!this.selectionCore) return;

        if (e.ctrlKey || e.metaKey) {
            // Multi-select mode
            this.selectionCore.toggleComponentSelection(component);
        } else if (!this.selectionCore.selectedComponents.has(component)) {
            // Single select mode
            this.selectionCore.clearSelection();
            this.selectionCore.selectComponent(component);
        }
        // If component is already selected and not Ctrl-clicking, keep selection for dragging
    }

    /**
     * Check if target is empty canvas area
     */
    isEmptyCanvasArea(target) {
        const className = target.className instanceof SVGAnimatedString ? 
            target.className.baseVal : target.className;
        
        return target === this.canvasElement || 
               (typeof className === 'string' && className.includes('grid')) ||
               target.tagName === 'line' ||
               (target.tagName === 'g' && className.includes('grid'));
    }

    /**
     * Get component from event
     */
    getComponentFromEvent(e) {
        if (this.selectionCore) {
            return this.selectionCore.getComponentFromEvent(e);
        }
        
        // Fallback implementation
        let element = e.target;
        while (element && element !== this.canvasElement) {
            if (element.hasAttribute && element.hasAttribute('data-id')) {
                return element;
            }
            element = element.parentElement;
        }
        return null;
    }

    /**
     * Update cursor based on what's under mouse
     */
    updateCursor(e) {
        const component = this.getComponentFromEvent(e);
        
        if (component) {
            this.canvasElement.style.cursor = 'move';
        } else {
            this.canvasElement.style.cursor = 'default';
        }
    }

    /**
     * Reset cursor to default
     */
    resetCursor() {
        if (this.canvasElement) {
            this.canvasElement.style.cursor = 'default';
        }
    }

    /**
     * Register event handler
     */
    on(eventType, handler) {
        if (!this.eventHandlers.has(eventType)) {
            this.eventHandlers.set(eventType, new Set());
        }
        this.eventHandlers.get(eventType).add(handler);
        
        return () => this.off(eventType, handler);
    }

    /**
     * Unregister event handler
     */
    off(eventType, handler) {
        const handlers = this.eventHandlers.get(eventType);
        if (handlers) {
            handlers.delete(handler);
        }
    }

    /**
     * Trigger custom event
     */
    triggerEvent(eventType, data) {
        const handlers = this.eventHandlers.get(eventType);
        if (handlers) {
            handlers.forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`🔴 Mouse handler error (${eventType}):`, error);
                }
            });
        }
    }

    /**
     * Destroy mouse handler
     */
    destroy() {
        if (this.canvasElement) {
            this.canvasElement.removeEventListener('mousedown', this.handleMouseDown);
            this.canvasElement.removeEventListener('click', this.handleClick);
            this.canvasElement.removeEventListener('dblclick', this.handleDoubleClick);
            this.canvasElement.removeEventListener('contextmenu', this.handleContextMenu);
            this.canvasElement.removeEventListener('wheel', this.handleWheel);
        }
        
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseup', this.handleMouseUp);
        
        this.eventHandlers.clear();
        
        console.log('🖱️ HMI Mouse Handler destroyed');
    }
}

// Create and export singleton instance
export const mouseHandler = new MouseHandler();
export default mouseHandler;
