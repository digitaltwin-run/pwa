/**
 * Canvas Zoom Module - Handles zooming and panning of the entire SVG canvas
 * This is a refactored version of the original canvas-zoom-manager.js
 */

export class CanvasZoomManager {
    constructor() {
        this.zoomLevel = 1.0;
        this.minZoom = 0.1;
        this.maxZoom = 5.0;
        this.panX = 0;
        this.panY = 0;
        this.isPanning = false;
        this.lastPanPoint = { x: 0, y: 0 };
        this.canvasElement = null;
        this.containerElement = null;
        
        // Bind methods to maintain 'this' context
        this.handleWheel = this.handleWheel.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);
        this.handleDoubleClick = this.handleDoubleClick.bind(this);
        
        this.init();
    }

    /**
     * Initialize zoom manager
     */
    init() {
        this.setupEventListeners();
        console.log('🔍 Canvas Zoom Manager (HMI) initialized');
    }

    /**
     * Set references to canvas and container elements
     */
    setReferences(canvasElement, containerElement) {
        // Remove old event listeners if elements were previously set
        this.cleanupEventListeners();
        
        this.canvasElement = canvasElement;
        this.containerElement = containerElement || canvasElement?.parentElement;
        
        if (this.canvasElement) {
            this.applyTransform();
            this.setupEventListeners();
        }
    }

    /**
     * Setup event listeners for zoom and pan
     */
    setupEventListeners() {
        if (!this.canvasElement) return;
        
        // Mouse wheel zoom
        this.canvasElement.addEventListener('wheel', this.handleWheel, { passive: false });
        
        // Mouse panning
        this.canvasElement.addEventListener('mousedown', this.handleMouseDown);
        
        // Touch events for mobile
        this.canvasElement.addEventListener('touchstart', this.handleTouchStart, { passive: false });
        
        // Double click to reset zoom
        this.canvasElement.addEventListener('dblclick', this.handleDoubleClick);
    }
    
    /**
     * Clean up event listeners
     */
    cleanupEventListeners() {
        if (!this.canvasElement) return;
        
        this.canvasElement.removeEventListener('wheel', this.handleWheel);
        this.canvasElement.removeEventListener('mousedown', this.handleMouseDown);
        this.canvasElement.removeEventListener('touchstart', this.handleTouchStart);
        this.canvasElement.removeEventListener('dblclick', this.handleDoubleClick);
        
        // Remove document-level event listeners
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseup', this.handleMouseUp);
        document.removeEventListener('touchmove', this.handleTouchMove);
        document.removeEventListener('touchend', this.handleTouchEnd);
    }

    /**
     * Handle mouse wheel events for zooming
     */
    handleWheel(e) {
        if (!e.ctrlKey || !this.canvasElement.contains(e.target)) return;
        
        e.preventDefault();
        
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const rect = this.canvasElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const mouseX = e.clientX - centerX;
        const mouseY = e.clientY - centerY;
        
        this.zoomToPoint(delta, { x: mouseX, y: mouseY });
    }
    
    /**
     * Handle mouse down for panning
     */
    handleMouseDown(e) {
        if (e.button !== 1) return; // Only middle mouse button for panning
        
        e.preventDefault();
        this.isPanning = true;
        this.lastPanPoint = { x: e.clientX, y: e.clientY };
        
        document.addEventListener('mousemove', this.handleMouseMove);
        document.addEventListener('mouseup', this.handleMouseUp);
    }
    
    /**
     * Handle mouse move for panning
     */
    handleMouseMove(e) {
        if (!this.isPanning) return;
        
        const dx = e.clientX - this.lastPanPoint.x;
        const dy = e.clientY - this.lastPanPoint.y;
        
        this.panX += dx;
        this.panY += dy;
        this.lastPanPoint = { x: e.clientX, y: e.clientY };
        
        this.applyTransform();
    }
    
    /**
     * Handle mouse up for panning
     */
    handleMouseUp() {
        this.isPanning = false;
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseup', this.handleMouseUp);
    }
    
    /**
     * Handle touch start for mobile pan/zoom
     */
    handleTouchStart(e) {
        if (e.touches.length !== 2) return;
        
        e.preventDefault();
        this.lastTouchDistance = this.getTouchDistance(e.touches[0], e.touches[1]);
        this.lastTouchCenter = this.getTouchCenter(e.touches[0], e.touches[1]);
        
        document.addEventListener('touchmove', this.handleTouchMove, { passive: false });
        document.addEventListener('touchend', this.handleTouchEnd);
    }
    
    /**
     * Handle touch move for mobile pan/zoom
     */
    handleTouchMove(e) {
        if (e.touches.length !== 2) return;
        
        e.preventDefault();
        
        // Calculate new touch distance and center
        const touchDistance = this.getTouchDistance(e.touches[0], e.touches[1]);
        const touchCenter = this.getTouchCenter(e.touches[0], e.touches[1]);
        
        // Handle zoom
        const scale = touchDistance / this.lastTouchDistance;
        this.zoomLevel = Math.min(Math.max(this.zoomLevel * scale, this.minZoom), this.maxZoom);
        
        // Handle pan
        this.panX += (touchCenter.x - this.lastTouchCenter.x) * this.zoomLevel;
        this.panY += (touchCenter.y - this.lastTouchCenter.y) * this.zoomLevel;
        
        // Update last touch values
        this.lastTouchDistance = touchDistance;
        this.lastTouchCenter = touchCenter;
        
        this.applyTransform();
    }
    
    /**
     * Handle touch end
     */
    handleTouchEnd() {
        document.removeEventListener('touchmove', this.handleTouchMove);
        document.removeEventListener('touchend', this.handleTouchEnd);
    }
    
    /**
     * Handle double click to reset zoom
     */
    handleDoubleClick() {
        this.resetView();
    }
    
    /**
     * Zoom to a specific point
     */
    zoomToPoint(delta, point) {
        const oldZoom = this.zoomLevel;
        this.zoomLevel = Math.min(Math.max(this.zoomLevel + delta, this.minZoom), this.maxZoom);
        
        // Calculate the new pan to keep the point under the cursor in the same position
        this.panX = point.x - (point.x - this.panX) * (this.zoomLevel / oldZoom);
        this.panY = point.y - (point.y - this.panY) * (this.zoomLevel / oldZoom);
        
        this.applyTransform();
    }
    
    /**
     * Apply the current transform to the canvas
     */
    applyTransform() {
        if (!this.canvasElement) return;
        
        const transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoomLevel})`;
        this.canvasElement.style.transform = transform;
        this.canvasElement.style.transformOrigin = '0 0';
        
        // Dispatch event to notify of zoom/pan change
        this.dispatchZoomChanged();
    }
    
    /**
     * Reset the view to default zoom and pan
     */
    resetView() {
        this.zoomLevel = 1.0;
        this.panX = 0;
        this.panY = 0;
        this.applyTransform();
    }
    
    /**
     * Get the current transform matrix
     */
    getTransformMatrix() {
        return {
            scale: this.zoomLevel,
            translateX: this.panX,
            translateY: this.panY
        };
    }
    
    /**
     * Dispatch zoom changed event
     */
    dispatchZoomChanged() {
        const event = new CustomEvent('canvas-zoom-changed', {
            detail: {
                zoom: this.zoomLevel,
                panX: this.panX,
                panY: this.panY
            }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * Helper to calculate distance between two touch points
     */
    getTouchDistance(touch1, touch2) {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Helper to calculate center point between two touches
     */
    getTouchCenter(touch1, touch2) {
        return {
            x: (touch1.clientX + touch2.clientX) / 2,
            y: (touch1.clientY + touch2.clientY) / 2
        };
    }
    
    /**
     * Clean up resources
     */
    destroy() {
        this.cleanupEventListeners();
    }
}

// Create and export singleton instance
export const canvasZoomManager = new CanvasZoomManager();

export default canvasZoomManager;
