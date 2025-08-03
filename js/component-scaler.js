/**
 * ComponentScaler - SVG component zoom/scale system with aspect ratio preservation
 * Allows scaling SVG components using transform="scale()" attribute
 */

export class ComponentScaler {
    constructor(componentManager) {
        this.componentManager = componentManager;
        this.init();
    }
    
    init() {
        console.log('🔍 ComponentScaler initialized with zoom/scale functionality');
    }
    
    /**
     * Get current scale factor from SVG transform attribute
     * @param {SVGElement} svgElement - The SVG component
     * @returns {number} Current scale factor (default: 1.0)
     */
    getCurrentScale(svgElement) {
        if (!svgElement) return 1.0;
        
        const transform = svgElement.getAttribute('transform') || '';
        
        // Parse scale from transform attribute
        // Supports: scale(1.5), scale(1.5, 1.5), or matrix transformations
        const scaleMatch = transform.match(/scale\(([0-9.]+)(?:,\s*[0-9.]+)?\)/);
        if (scaleMatch) {
            return parseFloat(scaleMatch[1]);
        }
        
        // Check for matrix transform (more complex parsing)
        const matrixMatch = transform.match(/matrix\(([0-9.-]+),\s*[0-9.-]+,\s*[0-9.-]+,\s*([0-9.-]+),\s*[0-9.-]+,\s*[0-9.-]+\)/);
        if (matrixMatch) {
            const scaleX = parseFloat(matrixMatch[1]);
            const scaleY = parseFloat(matrixMatch[2]);
            // Return average if uniform scaling, otherwise scaleX
            return Math.abs(scaleX - scaleY) < 0.001 ? scaleX : scaleX;
        }
        
        return 1.0; // Default scale
    }
    
    /**
     * Set scale for SVG component while preserving aspect ratio
     * @param {string} componentId - Component ID
     * @param {number} scale - Scale factor (e.g., 1.5 = 150%)
     * @param {boolean} [updateMetadata=true] - Update component metadata
     */
    setComponentScale(componentId, scale, updateMetadata = true) {
        const componentData = this.componentManager.getComponent(componentId);
        if (!componentData) {
            console.warn(`Component ${componentId} not found for scaling`);
            return;
        }
        
        const svgElement = componentData.element;
        const clampedScale = this.clampScale(scale);
        
        // Get existing transform and preserve non-scale transformations
        const currentTransform = svgElement.getAttribute('transform') || '';
        let newTransform = this.updateTransformScale(currentTransform, clampedScale);
        
        // Apply new transform
        svgElement.setAttribute('transform', newTransform);
        
        // Update metadata if requested
        if (updateMetadata) {
            this.updateScaleMetadata(svgElement, clampedScale);
        }
        
        console.log(`🔍 Scaled component ${componentId} to ${(clampedScale * 100).toFixed(0)}% (${clampedScale}x)`);
        
        // Trigger property panel update if component is selected
        if (window.propertiesManager) {
            const selectedComponent = this.componentManager.getSelectedComponent();
            if (selectedComponent && selectedComponent.element === svgElement) {
                window.propertiesManager.showProperties(svgElement);
            }
        }
    }
    
    /**
     * Update transform attribute to include/modify scale while preserving other transforms
     * @param {string} currentTransform - Current transform attribute value
     * @param {number} scale - New scale factor
     * @returns {string} Updated transform string
     */
    updateTransformScale(currentTransform, scale) {
        // Remove existing scale transforms
        let transform = currentTransform
            .replace(/scale\([0-9.,\s]+\)/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        
        // Add new scale transform
        const scaleTransform = `scale(${scale})`;
        
        if (transform) {
            return `${scaleTransform} ${transform}`;
        } else {
            return scaleTransform;
        }
    }
    
    /**
     * Clamp scale factor to reasonable limits
     * @param {number} scale - Desired scale factor
     * @returns {number} Clamped scale factor
     */
    clampScale(scale) {
        const minScale = 0.1;  // 10% minimum
        const maxScale = 5.0;  // 500% maximum
        return Math.max(minScale, Math.min(maxScale, scale));
    }
    
    /**
     * Update component metadata with scale information
     * @param {SVGElement} svgElement - The SVG element
     * @param {number} scale - Scale factor
     */
    updateScaleMetadata(svgElement, scale) {
        const metadata = JSON.parse(svgElement.getAttribute('data-metadata') || '{}');
        
        if (!metadata.transform) {
            metadata.transform = {};
        }
        
        metadata.transform.scale = scale;
        svgElement.setAttribute('data-metadata', JSON.stringify(metadata));
    }
    
    /**
     * Get scale percentage for UI display
     * @param {SVGElement} svgElement - The SVG element
     * @returns {number} Scale as percentage (e.g., 150 for 1.5x)
     */
    getScalePercentage(svgElement) {
        return Math.round(this.getCurrentScale(svgElement) * 100);
    }
    
    /**
     * Set scale from percentage
     * @param {string} componentId - Component ID
     * @param {number} percentage - Scale percentage (e.g., 150 for 1.5x)
     */
    setScaleFromPercentage(componentId, percentage) {
        const scale = Math.max(10, Math.min(500, percentage)) / 100; // Clamp 10%-500%
        this.setComponentScale(componentId, scale);
    }
    
    /**
     * Reset component scale to 100% (1.0x)
     * @param {string} componentId - Component ID
     */
    resetComponentScale(componentId) {
        this.setComponentScale(componentId, 1.0);
    }
    
    /**
     * Get predefined zoom levels for UI
     * @returns {Array} Array of zoom level objects
     */
    getZoomLevels() {
        return [
            { value: 0.25, label: '25% (0.25x)', percentage: 25 },
            { value: 0.5, label: '50% (0.5x)', percentage: 50 },
            { value: 0.75, label: '75% (0.75x)', percentage: 75 },
            { value: 1.0, label: '100% (1x) - Original', percentage: 100 },
            { value: 1.25, label: '125% (1.25x)', percentage: 125 },
            { value: 1.5, label: '150% (1.5x)', percentage: 150 },
            { value: 2.0, label: '200% (2x)', percentage: 200 },
            { value: 2.5, label: '250% (2.5x)', percentage: 250 },
            { value: 3.0, label: '300% (3x)', percentage: 300 },
            { value: 4.0, label: '400% (4x)', percentage: 400 },
            { value: 5.0, label: '500% (5x) - Maximum', percentage: 500 }
        ];
    }
    
    /**
     * Apply zoom in/out with step increments
     * @param {string} componentId - Component ID
     * @param {string} direction - 'in' or 'out'
     * @param {number} [step=0.25] - Zoom step increment
     */
    applyZoom(componentId, direction, step = 0.25) {
        const componentData = this.componentManager.getComponent(componentId);
        if (!componentData) return;
        
        const currentScale = this.getCurrentScale(componentData.element);
        let newScale;
        
        if (direction === 'in') {
            newScale = currentScale + step;
        } else if (direction === 'out') {
            newScale = currentScale - step;
        } else {
            console.warn('Invalid zoom direction. Use "in" or "out"');
            return;
        }
        
        this.setComponentScale(componentId, newScale);
    }
    
    /**
     * Get component bounds adjusted for scale (for positioning calculations)
     * @param {SVGElement} svgElement - The SVG element
     * @returns {Object} Bounds with scale adjustments
     */
    getScaledBounds(svgElement) {
        try {
            const bbox = svgElement.getBBox();
            const scale = this.getCurrentScale(svgElement);
            
            return {
                x: bbox.x,
                y: bbox.y,
                width: bbox.width * scale,
                height: bbox.height * scale,
                originalWidth: bbox.width,
                originalHeight: bbox.height,
                scale: scale
            };
        } catch (error) {
            console.warn('Could not get scaled bounds:', error);
            return { x: 0, y: 0, width: 50, height: 50, originalWidth: 50, originalHeight: 50, scale: 1 };
        }
    }
    
    /**
     * Get visual feedback info for current scale
     * @param {SVGElement} svgElement - The SVG element
     * @returns {Object} Scale info for UI display
     */
    getScaleInfo(svgElement) {
        const scale = this.getCurrentScale(svgElement);
        const percentage = Math.round(scale * 100);
        const bounds = this.getScaledBounds(svgElement);
        
        return {
            scale: scale,
            percentage: percentage,
            displayText: `${percentage}% (${scale.toFixed(2)}x)`,
            isOriginalSize: Math.abs(scale - 1.0) < 0.001,
            scaledDimensions: `${Math.round(bounds.width)}×${Math.round(bounds.height)}px`,
            originalDimensions: `${Math.round(bounds.originalWidth)}×${Math.round(bounds.originalHeight)}px`
        };
    }
}

// Global functions for HTML integration
window.setComponentScale = function(componentId, scale) {
    if (window.componentScaler) {
        window.componentScaler.setComponentScale(componentId, parseFloat(scale));
    }
};

window.setComponentScalePercentage = function(componentId, percentage) {
    if (window.componentScaler) {
        window.componentScaler.setScaleFromPercentage(componentId, parseInt(percentage));
    }
};

window.resetComponentScale = function(componentId) {
    if (window.componentScaler) {
        window.componentScaler.resetComponentScale(componentId);
    }
};

window.zoomComponent = function(componentId, direction) {
    if (window.componentScaler) {
        window.componentScaler.applyZoom(componentId, direction);
    }
};
