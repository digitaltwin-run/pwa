/**
 * HMI Canvas Module - Unified canvas management system
 * Coordinates canvas core, grid manager, and properties UI
 * @module hmi/canvas
 */

import { canvasCore } from './canvas-core.js';
import { gridManager } from './grid-manager.js';
import { canvasPropertiesUI } from './canvas-properties-ui.js';

export class CanvasModule {
    constructor() {
        this.core = canvasCore;
        this.grid = gridManager;
        this.ui = canvasPropertiesUI;
        this.isInitialized = false;
    }

    /**
     * Initialize the entire canvas module
     */
    init() {
        if (this.isInitialized) return;

        // Initialize all sub-modules
        this.core.init();
        this.grid.init();
        this.ui.init();

        // Set up references between modules
        this.ui.setReferences(this.core, this.grid);

        // Set up event listeners
        this.ui.setupEventListeners();

        this.isInitialized = true;
        console.log('🎨 HMI Canvas Module fully initialized');
    }

    /**
     * Set canvas element for all sub-modules
     */
    setCanvas(canvasElement) {
        this.core.setCanvas(canvasElement);
        this.grid.setCanvas(canvasElement);
        
        // Create grid if it doesn't exist
        this.grid.createGrid();
        
        console.log('🎨 Canvas element set for all HMI Canvas modules');
    }

    /**
     * Get combined canvas and grid properties
     */
    getAllProperties() {
        const canvasProps = this.core.getCanvasProperties();
        const gridProps = this.grid.getGridProperties();
        
        return {
            ...canvasProps,
            ...gridProps
        };
    }

    /**
     * Update canvas size and refresh grid
     */
    updateCanvasSize(width, height) {
        this.core.updateCanvasSize(width, height);
        this.grid.updateGrid(width, height);
    }

    /**
     * Generate HTML for properties panel
     */
    generatePropertiesHTML() {
        return this.ui.generateCanvasPropertiesHTML();
    }

    /**
     * Refresh all UI components
     */
    refresh() {
        this.core.updateCanvasStats();
        this.ui.refreshPropertiesPanel();
    }

    /**
     * Get canvas bounds with grid snapping
     */
    getBoundsWithSnapping() {
        const bounds = this.core.getCanvasBounds();
        const gridSize = this.grid.getGridProperties().gridSize;
        
        return {
            ...bounds,
            snapToGrid: (x, y) => this.grid.snapToGrid(x, y),
            gridSize
        };
    }
}

// Create and export singleton instance
export const canvasModule = new CanvasModule();

// Export individual modules for direct access
export { canvasCore, gridManager, canvasPropertiesUI };

// Default export
export default canvasModule;
