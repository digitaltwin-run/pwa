/**
 * HMI Canvas Core - Basic canvas operations and properties
 * Refactored from canvas-properties-manager.js
 * @module hmi/canvas
 */

export class CanvasCore {
    constructor() {
        this.canvasElement = null;
        this.defaultWidth = 800;
        this.defaultHeight = 600;
        this.backgroundColor = '#ffffff';
    }

    /**
     * Initialize canvas core
     */
    init() {
        console.log('🎨 HMI Canvas Core initialized');
    }

    /**
     * Set reference to canvas element
     */
    setCanvas(canvasElement) {
        this.canvasElement = canvasElement;
        console.log('🎨 Canvas element set in HMI Canvas Core');
    }

    /**
     * Get basic canvas properties
     */
    getCanvasProperties() {
        if (!this.canvasElement) {
            return {
                width: this.defaultWidth,
                height: this.defaultHeight,
                viewBox: `0 0 ${this.defaultWidth} ${this.defaultHeight}`,
                backgroundColor: this.backgroundColor
            };
        }

        const width = parseInt(this.canvasElement.getAttribute('width')) || this.defaultWidth;
        const height = parseInt(this.canvasElement.getAttribute('height')) || this.defaultHeight;
        const viewBox = this.canvasElement.getAttribute('viewBox') || `0 0 ${width} ${height}`;

        return {
            width,
            height,
            viewBox,
            backgroundColor: this.backgroundColor
        };
    }

    /**
     * Update canvas size
     */
    updateCanvasSize(width, height) {
        if (!this.canvasElement) {
            console.warn('❌ Cannot update canvas size - no canvas element');
            return;
        }

        // Update canvas attributes
        this.canvasElement.setAttribute('width', width);
        this.canvasElement.setAttribute('height', height);
        this.canvasElement.setAttribute('viewBox', `0 0 ${width} ${height}`);

        // Notify other components about canvas change
        this.notifyCanvasChange();
        
        console.log(`🎨 Canvas size updated: ${width}x${height}`);
    }

    /**
     * Set canvas background color
     */
    setBackgroundColor(color) {
        this.backgroundColor = color;
        
        if (!this.canvasElement) {
            console.warn('❌ Canvas element not available for background update');
            return;
        }

        // Remove existing background
        const existingBg = this.canvasElement.querySelector('.canvas-background');
        if (existingBg) {
            existingBg.remove();
        }

        // Create new background rectangle
        const props = this.getCanvasProperties();
        const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bgRect.classList.add('canvas-background');
        bgRect.setAttribute('x', '0');
        bgRect.setAttribute('y', '0');
        bgRect.setAttribute('width', String(props.width));
        bgRect.setAttribute('height', String(props.height));
        bgRect.setAttribute('fill', color);
        
        // Insert as first element (behind all other elements)
        this.canvasElement.insertBefore(bgRect, this.canvasElement.firstChild);
        
        console.log(`🎨 Canvas background color updated to: ${color}`);
        
        // Notify other components about canvas change
        this.notifyCanvasChange();
    }

    /**
     * Get canvas bounds for components
     */
    getCanvasBounds() {
        const props = this.getCanvasProperties();
        return {
            minX: 0,
            minY: 0,
            maxX: props.width,
            maxY: props.height
        };
    }

    /**
     * Export canvas as SVG
     */
    exportCanvas() {
        if (!this.canvasElement) {
            console.warn('❌ Cannot export canvas - no canvas element');
            return null;
        }

        return this.canvasElement.outerHTML;
    }

    /**
     * Notify other components about canvas changes
     */
    notifyCanvasChange() {
        const event = new CustomEvent('canvas-changed', {
            detail: {
                canvas: this.canvasElement,
                properties: this.getCanvasProperties(),
                timestamp: Date.now()
            }
        });
        document.dispatchEvent(event);
        console.log('📢 Canvas change notification sent');
    }

    /**
     * Refresh properties panel
     */
    refreshPropertiesPanel() {
        const event = new CustomEvent('refresh-canvas-properties');
        document.dispatchEvent(event);
    }

    /**
     * Update canvas statistics in UI
     */
    updateCanvasStats() {
        if (!this.canvasElement) return;

        const components = this.canvasElement.querySelectorAll('[data-id]');
        const gridElement = this.canvasElement.querySelector('.grid');
        const props = this.getCanvasProperties();

        const stats = {
            components: components.length,
            canvasSize: `${props.width}x${props.height}`,
            gridVisible: gridElement ? gridElement.style.display !== 'none' : false,
            backgroundColor: this.backgroundColor
        };

        const event = new CustomEvent('canvas-stats-updated', {
            detail: stats
        });
        document.dispatchEvent(event);

        console.log('📊 Canvas stats updated:', stats);
    }
}

// Create and export singleton instance
export const canvasCore = new CanvasCore();
export default canvasCore;
