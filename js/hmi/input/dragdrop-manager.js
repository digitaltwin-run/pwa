/**
 * HMI Drag & Drop Manager - Unified drag and drop functionality
 * Migrated and enhanced from js/dragdrop.js and js/selection/drag-manager.js
 * @module hmi/input
 */

export class DragDropManager {
    constructor() {
        this.componentManager = null;
        this.canvasElement = null;
        this.selectionCore = null;
        
        this.isDragging = false;
        this.dragStartPosition = { x: 0, y: 0 };
        this.draggedComponents = new Set();
        this.dragThreshold = 5; // pixels
        
        this.isLibraryDrop = false;
        this.currentDropData = null;
    }

    /**
     * Initialize drag & drop manager
     */
    init() {
        this.setupDragListeners();
        console.log('🔄 HMI Drag & Drop Manager initialized');
    }

    /**
     * Set references to other managers
     */
    setReferences(canvasElement, componentManager, selectionCore) {
        this.canvasElement = canvasElement;
        this.componentManager = componentManager;
        this.selectionCore = selectionCore;
    }

    /**
     * Setup drag and drop event listeners
     */
    setupDragListeners() {
        // Component library drag & drop
        this.setupLibraryDragDrop();
        
        // Canvas component dragging
        this.setupComponentDragging();
        
        console.log('🔄 Drag & drop listeners attached');
    }

    /**
     * Setup drag & drop from component library
     */
    setupLibraryDragDrop() {
        const componentLibrary = document.getElementById("component-library");
        if (!componentLibrary) return;

        // Library drag start
        componentLibrary.addEventListener("dragstart", (e) => {
            const target = e.target.closest(".component-button");
            if (target) {
                e.dataTransfer.setData("text/plain", target.dataset.svg);
                e.dataTransfer.effectAllowed = 'copy';
                this.isLibraryDrop = true;
                console.log('🔄 Started library component drag');
            }
        });

        if (!this.canvasElement) return;

        // Canvas drag over
        this.canvasElement.addEventListener("dragover", (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            this.canvasElement.classList.add('drag-over');
        });

        // Canvas drag leave
        this.canvasElement.addEventListener('dragleave', (e) => {
            if (!this.canvasElement.contains(e.relatedTarget)) {
                this.canvasElement.classList.remove('drag-over');
            }
        });

        // Canvas drop
        this.canvasElement.addEventListener('drop', (e) => this.handleLibraryDrop(e));
    }

    /**
     * Setup component dragging on canvas
     */
    setupComponentDragging() {
        if (!this.canvasElement) return;

        // We'll handle mouse events through the mouse handler
        // This method sets up component-specific drag behavior
    }

    /**
     * Handle library component drop on canvas
     */
    async handleLibraryDrop(e) {
        e.preventDefault();
        this.canvasElement.classList.remove('drag-over');

        const svgUrl = e.dataTransfer.getData("text/plain");
        if (!svgUrl) {
            console.error("❌ No SVG data in drop event");
            return;
        }

        const canvasX = e.offsetX;
        const canvasY = e.offsetY;

        try {
            const svgElement = await this.loadSvgComponent(svgUrl);
            this.placeComponent(svgElement, canvasX, canvasY, svgUrl);
            console.log('🔄 Placed library component on canvas');
        } catch (error) {
            console.error("❌ Error placing component:", error);
        }

        this.isLibraryDrop = false;
    }

    /**
     * Load SVG component from URL
     */
    async loadSvgComponent(svgUrl) {
        const response = await fetch(svgUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const svgText = await response.text();
        if (!svgText || (!svgText.trim().startsWith('<svg') && !svgText.trim().startsWith('<?xml'))) {
            throw new Error("Invalid SVG format");
        }

        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgText, "image/svg+xml");

        const parserError = svgDoc.querySelector("parsererror");
        if (parserError) {
            throw new Error("SVG parsing error");
        }

        const svgElement = svgDoc.documentElement;
        if (!svgElement || svgElement.nodeName !== 'svg') {
            throw new Error("No SVG element found");
        }

        return svgElement;
    }

    /**
     * Place component on canvas
     */
    placeComponent(svgElement, x, y, svgUrl) {
        if (!this.componentManager) return;

        // Generate new ID
        const componentId = this.componentManager.generateComponentId();

        // Configure SVG element
        svgElement.setAttribute("data-id", componentId);
        svgElement.setAttribute("data-svg-url", svgUrl);
        svgElement.setAttribute("class", "draggable-component hmi-component");
        svgElement.setAttribute("style", "cursor: move;");

        // Set position
        svgElement.setAttribute('x', x);
        svgElement.setAttribute('y', y);

        // Parse and store metadata
        const metadata = this.componentManager.parseXMLMetadata(svgElement);
        metadata.position = { x, y };
        svgElement.setAttribute('data-metadata', JSON.stringify(metadata));

        // Add to canvas
        this.canvasElement.appendChild(svgElement);

        // Store in component manager
        this.componentManager.storeComponent(componentId, svgElement, svgUrl);

        // Make draggable
        this.makeComponentDraggable(svgElement);

        // Auto-select new component
        if (this.selectionCore) {
            this.selectionCore.clearSelection();
            this.selectionCore.selectComponent(svgElement);
        }

        console.log(`🔄 Placed component ${componentId} at (${x}, ${y})`);
    }

    /**
     * Make component draggable
     */
    makeComponentDraggable(svgElement) {
        // Components are now handled through the unified mouse handler
        // This method can be used for component-specific drag setup
        svgElement.setAttribute('draggable', 'false'); // Prevent HTML5 drag
    }

    /**
     * Handle mouse down for component dragging
     */
    handleMouseDown(e) {
        if (this.isLibraryDrop) return;

        const component = this.getComponentFromEvent(e);
        if (!component) return;

        this.dragStartPosition = { x: e.clientX, y: e.clientY };
        this.prepareComponentsForDragging(component);
    }

    /**
     * Handle mouse move for component dragging
     */
    handleMouseMove(e) {
        if (!this.isDragging && this.draggedComponents.size > 0) {
            // Check if we've moved enough to start dragging
            const distance = Math.sqrt(
                Math.pow(e.clientX - this.dragStartPosition.x, 2) +
                Math.pow(e.clientY - this.dragStartPosition.y, 2)
            );

            if (distance > this.dragThreshold) {
                this.startDragging(e);
            }
        }

        if (this.isDragging) {
            this.updateComponentPositions(e);
        }
    }

    /**
     * Handle mouse up for component dragging
     */
    handleMouseUp(e) {
        if (this.isDragging) {
            this.stopDragging(e);
        }
        
        this.draggedComponents.clear();
    }

    /**
     * Prepare components for dragging
     */
    prepareComponentsForDragging(clickedComponent) {
        this.draggedComponents.clear();

        if (this.selectionCore && this.selectionCore.selectedComponents.has(clickedComponent)) {
            // Drag all selected components
            this.selectionCore.selectedComponents.forEach(component => {
                this.draggedComponents.add(component);
            });
        } else {
            // Drag only clicked component
            this.draggedComponents.add(clickedComponent);
        }

        console.log(`🔄 Prepared ${this.draggedComponents.size} components for dragging`);
    }

    /**
     * Start dragging components
     */
    startDragging(e) {
        this.isDragging = true;
        document.body.style.cursor = 'grabbing';
        
        // Store initial positions
        this.draggedComponents.forEach(component => {
            const x = parseFloat(component.getAttribute('x') || '0');
            const y = parseFloat(component.getAttribute('y') || '0');
            component._dragStart = { x, y };
        });

        console.log('🔄 Started dragging components');
    }

    /**
     * Update component positions during drag
     */
    updateComponentPositions(e) {
        const dx = e.clientX - this.dragStartPosition.x;
        const dy = e.clientY - this.dragStartPosition.y;

        this.draggedComponents.forEach(component => {
            if (component._dragStart) {
                const newX = component._dragStart.x + dx;
                const newY = component._dragStart.y + dy;

                component.setAttribute('x', newX);
                component.setAttribute('y', newY);

                // Update metadata
                const metadata = JSON.parse(component.getAttribute('data-metadata') || '{}');
                metadata.position = { x: newX, y: newY };
                component.setAttribute('data-metadata', JSON.stringify(metadata));
            }
        });
    }

    /**
     * Stop dragging components
     */
    stopDragging(e) {
        this.isDragging = false;
        document.body.style.cursor = '';

        // Clean up drag start positions
        this.draggedComponents.forEach(component => {
            delete component._dragStart;
        });

        console.log('🔄 Stopped dragging components');
    }

    /**
     * Get component from event
     */
    getComponentFromEvent(e) {
        if (this.selectionCore) {
            return this.selectionCore.getComponentFromEvent(e);
        }
        
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
     * Destroy drag & drop manager
     */
    destroy() {
        // Remove event listeners
        const componentLibrary = document.getElementById("component-library");
        if (componentLibrary) {
            componentLibrary.removeEventListener("dragstart", this.handleLibraryDragStart);
        }

        if (this.canvasElement) {
            this.canvasElement.removeEventListener("dragover", this.handleCanvasDragOver);
            this.canvasElement.removeEventListener('dragleave', this.handleCanvasDragLeave);
            this.canvasElement.removeEventListener('drop', this.handleLibraryDrop);
        }

        this.draggedComponents.clear();
        console.log('🔄 HMI Drag & Drop Manager destroyed');
    }
}

// Create and export singleton instance
export const dragDropManager = new DragDropManager();
export default dragDropManager;
