/**
 * HMI Grid Manager - Grid functionality for canvas
 * Refactored from canvas-properties-manager.js
 * @module hmi/canvas
 */

export class GridManager {
    constructor() {
        this.canvasElement = null;
        this.gridVisible = true;
        this.gridSize = 20;
        this.smallGridSize = 4;
        this.mainGridColor = '#cccccc';
        this.smallGridColor = '#e0e0e0';
    }

    /**
     * Initialize grid manager
     */
    init() {
        console.log('🔳 HMI Grid Manager initialized');
    }

    /**
     * Set reference to canvas element
     */
    setCanvas(canvasElement) {
        this.canvasElement = canvasElement;
        console.log('🔳 Canvas element set in HMI Grid Manager');
    }

    /**
     * Get grid properties
     */
    getGridProperties() {
        if (!this.canvasElement) {
            return {
                gridVisible: this.gridVisible,
                gridSize: this.gridSize,
                smallGridSize: this.smallGridSize,
                mainGridColor: this.mainGridColor,
                smallGridColor: this.smallGridColor
            };
        }

        // Check if grid is visible
        const gridElement = this.canvasElement.querySelector('.grid');
        const gridVisible = gridElement ? gridElement.style.display !== 'none' : true;
        
        // Get grid size from first line spacing
        let gridSize = this.gridSize;
        const firstLine = this.canvasElement.querySelector('.grid line');
        if (firstLine) {
            const x1 = parseInt(firstLine.getAttribute('x1')) || 0;
            const x2 = parseInt(firstLine.getAttribute('x2')) || 20;
            gridSize = Math.abs(x2 - x1) || 20;
        }

        // Get grid colors and small grid size from canvas attributes
        const mainGridColor = this.canvasElement.getAttribute('data-main-grid-color') || this.mainGridColor;
        const smallGridColor = this.canvasElement.getAttribute('data-small-grid-color') || this.smallGridColor;
        const smallGridSize = parseInt(this.canvasElement.getAttribute('data-small-grid-size')) || Math.floor(gridSize/5);

        return {
            gridVisible,
            gridSize,
            smallGridSize,
            mainGridColor,
            smallGridColor
        };
    }

    /**
     * Update grid pattern
     */
    updateGrid(width, height, gridSize = null, smallGridSize = null, mainGridColor = null, smallGridColor = null) {
        if (!this.canvasElement) {
            console.warn('❌ Cannot update grid - no canvas element');
            return;
        }

        const grid = this.canvasElement.querySelector('.grid');
        if (!grid) {
            console.warn('❌ Cannot update grid - no grid element found');
            return;
        }

        const props = this.getGridProperties();
        const currentGridSize = gridSize || props.gridSize;
        const currentMainGridColor = mainGridColor || props.mainGridColor;
        const currentSmallGridColor = smallGridColor || props.smallGridColor;
        const currentSmallGridSize = smallGridSize || props.smallGridSize;
        
        // Store grid properties in canvas attributes
        this.canvasElement.setAttribute('data-main-grid-color', currentMainGridColor);
        this.canvasElement.setAttribute('data-small-grid-color', currentSmallGridColor);
        this.canvasElement.setAttribute('data-small-grid-size', currentSmallGridSize.toString());
        
        // Clear existing grid lines
        grid.innerHTML = '';

        // Create small grid lines (finer grid)
        if (currentSmallGridSize > 0) {
            for (let x = 0; x <= width; x += currentSmallGridSize) {
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', x.toString());
                line.setAttribute('y1', '0');
                line.setAttribute('x2', x.toString());
                line.setAttribute('y2', height.toString());
                line.setAttribute('stroke', currentSmallGridColor);
                line.setAttribute('stroke-width', '0.25');
                line.setAttribute('opacity', '0.5');
                grid.appendChild(line);
            }

            for (let y = 0; y <= height; y += currentSmallGridSize) {
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', '0');
                line.setAttribute('y1', y.toString());
                line.setAttribute('x2', width.toString());
                line.setAttribute('y2', y.toString());
                line.setAttribute('stroke', currentSmallGridColor);
                line.setAttribute('stroke-width', '0.25');
                line.setAttribute('opacity', '0.5');
                grid.appendChild(line);
            }
        }

        // Create main grid lines
        for (let x = 0; x <= width; x += currentGridSize) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x.toString());
            line.setAttribute('y1', '0');
            line.setAttribute('x2', x.toString());
            line.setAttribute('y2', height.toString());
            line.setAttribute('stroke', currentMainGridColor);
            line.setAttribute('stroke-width', '0.5');
            grid.appendChild(line);
        }

        for (let y = 0; y <= height; y += currentGridSize) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', '0');
            line.setAttribute('y1', y.toString());
            line.setAttribute('x2', width.toString());
            line.setAttribute('y2', y.toString());
            line.setAttribute('stroke', currentMainGridColor);
            line.setAttribute('stroke-width', '0.5');
            grid.appendChild(line);
        }

        // Update internal properties
        this.gridSize = currentGridSize;
        this.smallGridSize = currentSmallGridSize;
        this.mainGridColor = currentMainGridColor;
        this.smallGridColor = currentSmallGridColor;

        console.log(`🔳 Grid updated: ${currentGridSize}px main, ${currentSmallGridSize}px small`);
        this.notifyGridChange();
    }

    /**
     * Toggle grid visibility
     */
    toggleGrid(visible = null) {
        if (!this.canvasElement) {
            console.warn('❌ Cannot toggle grid - no canvas element');
            return;
        }
        
        const gridElement = this.canvasElement.querySelector('.grid');
        if (!gridElement) {
            console.warn('❌ Cannot toggle grid - no grid element found');
            return;
        }

        // If visible is not specified, toggle current state
        if (visible === null) {
            const currentlyVisible = gridElement.style.display !== 'none';
            visible = !currentlyVisible;
        }
        
        gridElement.style.display = visible ? 'block' : 'none';
        this.gridVisible = visible;
        
        console.log(`🔳 Grid ${visible ? 'shown' : 'hidden'}`);
        this.notifyGridChange();
    }

    /**
     * Set grid size
     */
    setGridSize(size) {
        if (!this.canvasElement) {
            console.warn('❌ Cannot set grid size - no canvas element');
            return;
        }
        
        const gridSize = parseInt(size);
        if (isNaN(gridSize) || gridSize <= 0) {
            console.warn('❌ Invalid grid size:', size);
            return;
        }

        // Get canvas dimensions
        const width = parseInt(this.canvasElement.getAttribute('width')) || 800;
        const height = parseInt(this.canvasElement.getAttribute('height')) || 600;
        
        // Update grid with new size
        this.updateGrid(width, height, gridSize);
        
        console.log(`🔳 Grid size set to: ${gridSize}px`);
    }

    /**
     * Set small grid size
     */
    setSmallGridSize(size) {
        const smallGridSize = parseInt(size);
        if (isNaN(smallGridSize) || smallGridSize < 0) {
            console.warn('❌ Invalid small grid size:', size);
            return;
        }

        // Get canvas dimensions
        const width = parseInt(this.canvasElement.getAttribute('width')) || 800;
        const height = parseInt(this.canvasElement.getAttribute('height')) || 600;
        
        // Update grid with new small grid size
        this.updateGrid(width, height, null, smallGridSize);
        
        console.log(`🔳 Small grid size set to: ${smallGridSize}px`);
    }

    /**
     * Set main grid color
     */
    setMainGridColor(color) {
        if (!color) {
            console.warn('❌ Invalid main grid color:', color);
            return;
        }

        // Get canvas dimensions
        const width = parseInt(this.canvasElement.getAttribute('width')) || 800;
        const height = parseInt(this.canvasElement.getAttribute('height')) || 600;
        
        // Update grid with new main color
        this.updateGrid(width, height, null, null, color);
        
        console.log(`🔳 Main grid color set to: ${color}`);
    }

    /**
     * Set small grid color
     */
    setSmallGridColor(color) {
        if (!color) {
            console.warn('❌ Invalid small grid color:', color);
            return;
        }

        // Get canvas dimensions
        const width = parseInt(this.canvasElement.getAttribute('width')) || 800;
        const height = parseInt(this.canvasElement.getAttribute('height')) || 600;
        
        // Update grid with new small color
        this.updateGrid(width, height, null, null, null, color);
        
        console.log(`🔳 Small grid color set to: ${color}`);
    }

    /**
     * Create initial grid if it doesn't exist
     */
    createGrid() {
        if (!this.canvasElement) {
            console.warn('❌ Cannot create grid - no canvas element');
            return;
        }

        let gridElement = this.canvasElement.querySelector('.grid');
        if (!gridElement) {
            gridElement = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            gridElement.setAttribute('class', 'grid');
            // Insert grid as second element (after background, before components)
            const background = this.canvasElement.querySelector('.canvas-background');
            if (background && background.nextSibling) {
                this.canvasElement.insertBefore(gridElement, background.nextSibling);
            } else {
                this.canvasElement.appendChild(gridElement);
            }
            console.log('🔳 Grid element created');
        }

        // Initialize grid with current canvas size
        const width = parseInt(this.canvasElement.getAttribute('width')) || 800;
        const height = parseInt(this.canvasElement.getAttribute('height')) || 600;
        this.updateGrid(width, height);
    }

    /**
     * Snap coordinate to grid
     */
    snapToGrid(x, y, snapSize = null) {
        const gridSize = snapSize || this.gridSize;
        return {
            x: Math.round(x / gridSize) * gridSize,
            y: Math.round(y / gridSize) * gridSize
        };
    }

    /**
     * Check if grid is visible
     */
    isGridVisible() {
        if (!this.canvasElement) return this.gridVisible;
        
        const gridElement = this.canvasElement.querySelector('.grid');
        return gridElement ? gridElement.style.display !== 'none' : this.gridVisible;
    }

    /**
     * Notify other components about grid changes
     */
    notifyGridChange() {
        const event = new CustomEvent('grid-changed', {
            detail: {
                properties: this.getGridProperties(),
                timestamp: Date.now()
            }
        });
        document.dispatchEvent(event);
        console.log('📢 Grid change notification sent');
    }
}

// Create and export singleton instance
export const gridManager = new GridManager();
export default gridManager;
