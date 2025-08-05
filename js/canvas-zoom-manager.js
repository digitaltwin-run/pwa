import { zoomManager } from './hmi/input/zoom/zoom-manager.js';

/**
 * Canvas Zoom Manager - Handles zooming and panning of the entire SVG canvas
 * This is a wrapper around the HMI ZoomManager module for backward compatibility
 */
export class CanvasZoomManager {
    constructor() {
        // Reference to the HMI zoom manager module
        this.zoomManager = zoomManager;
        
        // Maintain API compatibility with original
        this.canvasElement = null;
        this.containerElement = null;
        
        this.init();
    }

    /**
     * Initialize zoom manager
     */
    init() {
        console.log('🔍 Canvas Zoom Manager initialized (using HMI zoom module)');
    }

    /**
     * Set references to canvas and container elements
     */
    setReferences(canvasElement, containerElement) {
        this.canvasElement = canvasElement;
        this.containerElement = containerElement || canvasElement?.parentElement;
        
        // Delegate to HMI module
        this.zoomManager.setReferences(canvasElement, containerElement);
        
        // Set callbacks to maintain API compatibility
        this.zoomManager.setCallbacks({
            onZoomChange: (zoomInfo) => this.notifyZoomChange()
        });
    }

    /**
     * Setup event listeners for zoom and pan
     * Note: This is now handled by the HMI zoom module
     */
    setupEventListeners() {
        // Event listeners now managed by HMI module
    }

    /**
     * Zoom in by fixed amount
     */
    zoomIn() {
        this.zoomManager.zoomIn();
    }

    /**
     * Zoom out by fixed amount
     */
    zoomOut() {
        this.zoomManager.zoomOut();
    }

    /**
     * Reset zoom to 100%
     */
    resetZoom() {
        this.zoomManager.resetZoom();
    }

    /**
     * Fit canvas to screen
     */
    fitToScreen() {
        this.zoomManager.fitToScreen();
    }

    /**
     * Zoom at specific point
     */
    zoomAt(clientX, clientY, delta) {
        this.zoomManager.zoomAt(clientX, clientY, delta);
    }

    /**
     * Set zoom level
     */
    setZoom(zoom) {
        this.zoomManager.setZoom(zoom);
    }

    /**
     * Start panning
     */
    startPan(clientX, clientY) {
        this.zoomManager.startPan(clientX, clientY);
    }

    /**
     * Update pan position
     */
    updatePan(clientX, clientY) {
        this.zoomManager.updatePan(clientX, clientY);
    }

    /**
     * End panning
     */
    endPan() {
        this.zoomManager.endPan();
    }

    /**
     * Apply transform to canvas
     * Now delegated to zoom manager
     */
    applyTransform() {
        // This is now handled by the HMI zoom module internally
    }

    /**
     * Get current zoom percentage
     */
    getZoomPercentage() {
        return this.zoomManager.getZoomPercentage();
    }

    /**
     * Get current zoom info
     */
    getZoomInfo() {
        return this.zoomManager.getZoomInfo();
    }

    /**
     * Notify other components about zoom changes
     * Now handled by the HMI module, this is just for API compatibility
     */
    notifyZoomChange() {
        // This will be called by the HMI zoom module via callbacks
        // Additional custom logic for backward compatibility can be added here if needed
    }

    /**
     * Convert screen coordinates to canvas coordinates
     */
    screenToCanvas(screenX, screenY) {
        return this.zoomManager.screenToCanvas(screenX, screenY);
    }

    /**
     * Convert canvas coordinates to screen coordinates
     */
    canvasToScreen(canvasX, canvasY) {
        return this.zoomManager.canvasToScreen(canvasX, canvasY);
    }
}

// Export singleton instance
export const canvasZoomManager = new CanvasZoomManager();

// Export the internal HMI zoom manager for direct access
export const hmiZoomManager = zoomManager;
