class GridManager {
    constructor(config) {
        this.config = {
            enabled: true,
            size: 5,
            color: '#e0e0e0',
            snapToGrid: true,
            ...config?.canvas?.grid
        };
        this.canvas = null;
        this.gridGroup = null;
    }

    /**
     * Initialize the grid on the specified SVG canvas
     * @param {SVGElement} svgCanvas - The SVG element to draw the grid on
     */
    init(svgCanvas) {
        if (!this.config.enabled) return;
        
        this.canvas = svgCanvas;
        
        // Create a group for the grid
        this.gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.gridGroup.setAttribute('class', 'grid');
        this.gridGroup.style.pointerEvents = 'none';
        
        // Add the grid to the canvas
        this.canvas.insertBefore(this.gridGroup, this.canvas.firstChild);
        
        // Draw the grid
        this.drawGrid();
        
        // Update grid visibility based on settings
        this.updateVisibility();
    }
    
    /**
     * Draw the grid lines
     */
    drawGrid() {
        if (!this.gridGroup) return;
        
        // Clear existing grid
        while (this.gridGroup.firstChild) {
            this.gridGroup.removeChild(this.gridGroup.firstChild);
        }
        
        const width = this.canvas.width.baseVal.value;
        const height = this.canvas.height.baseVal.value;
        const size = this.config.size;
        
        // Create vertical lines
        for (let x = 0; x <= width; x += size) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x);
            line.setAttribute('y1', 0);
            line.setAttribute('x2', x);
            line.setAttribute('y2', height);
            line.setAttribute('stroke', this.config.color);
            line.setAttribute('stroke-width', '0.5');
            this.gridGroup.appendChild(line);
        }
        
        // Create horizontal lines
        for (let y = 0; y <= height; y += size) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', 0);
            line.setAttribute('y1', y);
            line.setAttribute('x2', width);
            line.setAttribute('y2', y);
            line.setAttribute('stroke', this.config.color);
            line.setAttribute('stroke-width', '0.5');
            this.gridGroup.appendChild(line);
        }
    }
    
    /**
     * Snap a coordinate to the nearest grid point
     * @param {number} coord - The coordinate to snap
     * @returns {number} The snapped coordinate
     */
    snapToGrid(coord) {
        if (!this.config.snapToGrid) return coord;
        const gridSize = this.config.size;
        return Math.round(coord / gridSize) * gridSize;
    }
    
    /**
     * Snap an object's position to the grid
     * @param {Object} position - The position object with x and y coordinates
     * @returns {Object} The snapped position
     */
    snapPositionToGrid(position) {
        if (!this.config.snapToGrid) return position;
        return {
            x: this.snapToGrid(position.x),
            y: this.snapToGrid(position.y)
        };
    }
    
    /**
     * Update grid visibility based on settings
     */
    updateVisibility() {
        if (!this.gridGroup) return;
        this.gridGroup.style.display = this.config.enabled ? 'block' : 'none';
    }
    
    /**
     * Toggle grid visibility
     * @param {boolean} [show] - Optional: force show/hide, otherwise toggle
     */
    toggle(show) {
        if (show !== undefined) {
            this.config.enabled = show;
        } else {
            this.config.enabled = !this.config.enabled;
        }
        this.updateVisibility();
    }
    
    /**
     * Update grid configuration
     * @param {Object} newConfig - New configuration options
     */
    updateConfig(newConfig) {
        this.config = {
            ...this.config,
            ...newConfig
        };
        
        // Redraw grid if size or color changed
        if (newConfig.size || newConfig.color) {
            this.drawGrid();
        }
        
        this.updateVisibility();
    }
}

// Export as a singleton
export const gridManager = new GridManager();
