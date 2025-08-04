/**
 * Canvas Placement Helper - Smart positioning and collision detection for SVG components
 */
export class CanvasPlacementHelper {
    constructor() {
        this.gridSize = 20; // Default grid size
        this.minSpacing = 10; // Minimum spacing between components
        this.canvasElement = null;
    }

    /**
     * Set canvas reference and grid size
     */
    setCanvas(canvasElement, gridSize = 20) {
        this.canvasElement = canvasElement;
        this.gridSize = gridSize;
    }

    /**
     * Find optimal position for new component to avoid overlaps
     * @param {Object} preferredPosition - Preferred x, y position
     * @param {Object} componentSize - Width and height of component
     * @param {Array} existingComponents - Array of existing component elements
     * @returns {Object} Optimal position {x, y}
     */
    findOptimalPosition(preferredPosition, componentSize, existingComponents = []) {
        const canvasRect = this.getCanvasRect();
        
        // Start with preferred position
        let testPosition = { ...preferredPosition };
        
        // Get occupied areas from existing components
        const occupiedAreas = this.getOccupiedAreas(existingComponents);
        
        // Check if preferred position is available
        if (!this.hasCollision(testPosition, componentSize, occupiedAreas)) {
            return this.snapToGrid(testPosition);
        }

        // Try positions in expanding spiral pattern
        const positions = this.generateSpiralPositions(preferredPosition, canvasRect, componentSize);
        
        for (const position of positions) {
            if (!this.hasCollision(position, componentSize, occupiedAreas)) {
                return this.snapToGrid(position);
            }
        }

        // Fallback: place at bottom-right of canvas
        return this.snapToGrid({
            x: Math.max(50, canvasRect.width - componentSize.width - 50),
            y: Math.max(50, canvasRect.height - componentSize.height - 50)
        });
    }

    /**
     * Get canvas boundaries
     */
    getCanvasRect() {
        if (!this.canvasElement) {
            return { x: 0, y: 0, width: 800, height: 600 };
        }
        
        const rect = this.canvasElement.getBoundingClientRect();
        return {
            x: 0,
            y: 0,
            width: rect.width || 800,
            height: rect.height || 600
        };
    }

    /**
     * Get occupied areas from existing components
     */
    getOccupiedAreas(components) {
        return components.map(component => {
            const rect = this.getComponentBounds(component);
            return {
                x: rect.x - this.minSpacing,
                y: rect.y - this.minSpacing,
                width: rect.width + (this.minSpacing * 2),
                height: rect.height + (this.minSpacing * 2)
            };
        });
    }

    /**
     * Get component boundaries
     */
    getComponentBounds(component) {
        if (component.getBoundingClientRect) {
            const rect = component.getBoundingClientRect();
            const canvasRect = this.canvasElement ? this.canvasElement.getBoundingClientRect() : { left: 0, top: 0 };
            
            return {
                x: rect.left - canvasRect.left,
                y: rect.top - canvasRect.top,
                width: rect.width,
                height: rect.height
            };
        }
        
        // Fallback for SVG elements
        return {
            x: parseFloat(component.getAttribute('x') || component.style.left || '0'),
            y: parseFloat(component.getAttribute('y') || component.style.top || '0'),
            width: parseFloat(component.getAttribute('width') || '100'),
            height: parseFloat(component.getAttribute('height') || '100')
        };
    }

    /**
     * Check if position collides with occupied areas
     */
    hasCollision(position, size, occupiedAreas) {
        const testRect = {
            x: position.x,
            y: position.y,
            width: size.width,
            height: size.height
        };

        return occupiedAreas.some(area => this.rectsOverlap(testRect, area));
    }

    /**
     * Check if two rectangles overlap
     */
    rectsOverlap(rect1, rect2) {
        return !(rect1.x + rect1.width <= rect2.x || 
                rect2.x + rect2.width <= rect1.x || 
                rect1.y + rect1.height <= rect2.y || 
                rect2.y + rect2.height <= rect1.y);
    }

    /**
     * Generate spiral pattern of positions around preferred point
     */
    generateSpiralPositions(center, canvasRect, componentSize, maxRadius = 300) {
        const positions = [];
        const step = Math.max(this.gridSize, 20);
        
        for (let radius = step; radius <= maxRadius; radius += step) {
            // Generate positions in a square spiral
            const angleStep = Math.PI / 8; // 8 directions per radius
            
            for (let angle = 0; angle < Math.PI * 2; angle += angleStep) {
                const x = center.x + Math.cos(angle) * radius;
                const y = center.y + Math.sin(angle) * radius;
                
                // Check if position is within canvas bounds
                if (x >= 0 && y >= 0 && 
                    x + componentSize.width <= canvasRect.width && 
                    y + componentSize.height <= canvasRect.height) {
                    positions.push({ x, y });
                }
            }
        }
        
        return positions;
    }

    /**
     * Snap position to grid
     */
    snapToGrid(position) {
        if (this.gridSize <= 1) return position;
        
        return {
            x: Math.round(position.x / this.gridSize) * this.gridSize,
            y: Math.round(position.y / this.gridSize) * this.gridSize
        };
    }

    /**
     * Calculate smart offset for multiple paste operations
     */
    calculateMultiPasteOffset(index, baseOffset = 50) {
        // Staggered diagonal pattern
        const row = Math.floor(index / 3);
        const col = index % 3;
        
        return {
            x: baseOffset + (col * baseOffset * 0.8),
            y: baseOffset + (row * baseOffset * 0.8)
        };
    }

    /**
     * Find best placement area on canvas
     */
    findBestPlacementArea(componentSize, existingComponents = []) {
        const canvasRect = this.getCanvasRect();
        const occupiedAreas = this.getOccupiedAreas(existingComponents);
        
        // Try common placement areas
        const preferredAreas = [
            { x: 50, y: 50 }, // Top-left
            { x: canvasRect.width / 2 - componentSize.width / 2, y: 50 }, // Top-center
            { x: canvasRect.width - componentSize.width - 50, y: 50 }, // Top-right
            { x: 50, y: canvasRect.height / 2 - componentSize.height / 2 }, // Left-center
            { x: canvasRect.width - componentSize.width - 50, y: canvasRect.height / 2 - componentSize.height / 2 }, // Right-center
        ];

        for (const area of preferredAreas) {
            if (!this.hasCollision(area, componentSize, occupiedAreas)) {
                return this.snapToGrid(area);
            }
        }

        // Fallback to spiral search from center
        const centerPosition = {
            x: canvasRect.width / 2 - componentSize.width / 2,
            y: canvasRect.height / 2 - componentSize.height / 2
        };

        return this.findOptimalPosition(centerPosition, componentSize, existingComponents);
    }

    /**
     * Get estimated component size from element or default
     */
    getComponentSize(element) {
        if (element && element.getBoundingClientRect) {
            const rect = element.getBoundingClientRect();
            return {
                width: rect.width || 100,
                height: rect.height || 100
            };
        }
        
        // Default size for unknown components
        return { width: 100, height: 100 };
    }

    /**
     * Arrange multiple components in a grid pattern
     */
    arrangeComponentsInGrid(components, startPosition = { x: 50, y: 50 }) {
        const positions = [];
        const cols = Math.ceil(Math.sqrt(components.length));
        const maxWidth = Math.max(...components.map(c => this.getComponentSize(c).width));
        const maxHeight = Math.max(...components.map(c => this.getComponentSize(c).height));
        
        const spacingX = maxWidth + this.minSpacing * 2;
        const spacingY = maxHeight + this.minSpacing * 2;

        components.forEach((component, index) => {
            const row = Math.floor(index / cols);
            const col = index % cols;
            
            const position = {
                x: startPosition.x + (col * spacingX),
                y: startPosition.y + (row * spacingY)
            };
            
            positions.push(this.snapToGrid(position));
        });

        return positions;
    }
}

// Create and export singleton instance
export const canvasPlacementHelper = new CanvasPlacementHelper();

// Default export for convenience
export default canvasPlacementHelper;
