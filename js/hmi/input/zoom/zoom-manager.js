/**
 * Zoom Manager - Handles zooming and panning UI interactions for SVG canvases
 * @module hmi/input/zoom/zoom-manager
 */

export class ZoomManager {
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
        this.callbacks = {
            onZoomChange: null,
            onPanChange: null
        };
    }

    /**
     * Set references to canvas and container elements
     */
    setReferences(canvasElement, containerElement) {
        this.canvasElement = canvasElement;
        this.containerElement = containerElement || canvasElement?.parentElement;
        
        if (this.canvasElement) {
            this.setupEventListeners();
        }
    }

    /**
     * Set callback functions
     */
    setCallbacks(callbacks) {
        if (callbacks.onZoomChange) {
            this.callbacks.onZoomChange = callbacks.onZoomChange;
        }
        if (callbacks.onPanChange) {
            this.callbacks.onPanChange = callbacks.onPanChange;
        }
    }

    /**
     * Setup event listeners for zoom and pan
     */
    setupEventListeners() {
        if (!this.canvasElement) return;

        // Mouse wheel zoom
        document.addEventListener('wheel', (e) => {
            if (e.ctrlKey && this.canvasElement?.contains(e.target)) {
                e.preventDefault();
                
                const delta = e.deltaY > 0 ? -0.1 : 0.1;
                const rect = this.canvasElement.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                
                this.zoomAt(centerX, centerY, delta);
            }
        }, { passive: false });

        // Pan with middle mouse button or space + mouse
        document.addEventListener('mousedown', (e) => {
            if ((e.button === 1 || (e.button === 0 && e.shiftKey)) && 
                this.canvasElement?.contains(e.target)) {
                e.preventDefault();
                this.startPan(e.clientX, e.clientY);
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (this.isPanning) {
                e.preventDefault();
                this.updatePan(e.clientX, e.clientY);
            }
        });

        document.addEventListener('mouseup', (e) => {
            if (this.isPanning) {
                this.endPan();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            switch (e.key) {
                case '+':
                case '=':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        this.zoomIn();
                    }
                    break;
                case '-':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        this.zoomOut();
                    }
                    break;
                case '0':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        this.resetZoom();
                    }
                    break;
                case 'Home':
                    e.preventDefault();
                    this.fitToScreen();
                    break;
            }
        });
    }

    /**
     * Zoom in by fixed amount
     */
    zoomIn() {
        this.setZoom(this.zoomLevel + 0.2);
    }

    /**
     * Zoom out by fixed amount
     */
    zoomOut() {
        this.setZoom(this.zoomLevel - 0.2);
    }

    /**
     * Reset zoom to 100%
     */
    resetZoom() {
        this.setZoom(1.0);
        this.panX = 0;
        this.panY = 0;
        this.notifyChanges();
    }

    /**
     * Fit canvas to screen
     */
    fitToScreen() {
        if (!this.canvasElement || !this.containerElement) return;

        const containerRect = this.containerElement.getBoundingClientRect();
        const canvasRect = this.canvasElement.getBoundingClientRect();
        
        // Calculate the scale needed to fit the canvas within the container
        const scaleX = containerRect.width / (canvasRect.width / this.zoomLevel);
        const scaleY = containerRect.height / (canvasRect.height / this.zoomLevel);
        
        // Use the smaller scale to ensure the entire canvas is visible
        const newZoom = Math.min(scaleX, scaleY) * 0.9; // Add some padding
        
        this.setZoom(newZoom);
        this.panX = 0;
        this.panY = 0;
        this.notifyChanges();
    }

    /**
     * Zoom at specific point
     */
    zoomAt(clientX, clientY, delta) {
        if (!this.canvasElement) return;
        
        const rect = this.canvasElement.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        
        const oldZoom = this.zoomLevel;
        const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoomLevel + delta));
        
        if (newZoom !== oldZoom) {
            // Adjust pan to zoom towards mouse position
            const zoomRatio = newZoom / oldZoom;
            this.panX = x - (x - this.panX) * zoomRatio;
            this.panY = y - (y - this.panY) * zoomRatio;
            
            this.zoomLevel = newZoom;
            this.notifyChanges();
        }
    }

    /**
     * Set zoom level
     */
    setZoom(zoom) {
        const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
        if (newZoom !== this.zoomLevel) {
            this.zoomLevel = newZoom;
            this.notifyChanges();
        }
    }

    /**
     * Start panning
     */
    startPan(clientX, clientY) {
        this.isPanning = true;
        this.lastPanPoint = { x: clientX, y: clientY };
        if (this.canvasElement) {
            this.canvasElement.style.cursor = 'grabbing';
        }
    }

    /**
     * Update pan position
     */
    updatePan(clientX, clientY) {
        if (!this.isPanning) return;

        const deltaX = clientX - this.lastPanPoint.x;
        const deltaY = clientY - this.lastPanPoint.y;
        
        this.panX += deltaX;
        this.panY += deltaY;
        
        this.lastPanPoint = { x: clientX, y: clientY };
        this.notifyChanges();
    }

    /**
     * End panning
     */
    endPan() {
        this.isPanning = false;
        if (this.canvasElement) {
            this.canvasElement.style.cursor = '';
        }
    }

    /**
     * Notify about changes to zoom and pan
     */
    notifyChanges() {
        // Call callbacks if defined
        const zoomInfo = this.getZoomInfo();
        
        if (this.callbacks.onZoomChange) {
            this.callbacks.onZoomChange(zoomInfo);
        }

        if (this.callbacks.onPanChange) {
            this.callbacks.onPanChange({
                panX: this.panX,
                panY: this.panY
            });
        }
        
        // Dispatch custom event for other components to listen
        const event = new CustomEvent('canvas-zoom-changed', {
            detail: zoomInfo
        });
        document.dispatchEvent(event);
    }

    /**
     * Get current zoom percentage
     */
    getZoomPercentage() {
        return Math.round(this.zoomLevel * 100);
    }

    /**
     * Get current zoom info
     */
    getZoomInfo() {
        return {
            level: this.zoomLevel,
            percentage: this.getZoomPercentage(),
            panX: this.panX,
            panY: this.panY,
            minZoom: this.minZoom,
            maxZoom: this.maxZoom
        };
    }

    /**
     * Convert screen coordinates to canvas coordinates
     */
    screenToCanvas(screenX, screenY) {
        if (!this.canvasElement) return { x: screenX, y: screenY };

        const rect = this.canvasElement.getBoundingClientRect();
        const canvasX = (screenX - rect.left - this.panX) / this.zoomLevel;
        const canvasY = (screenY - rect.top - this.panY) / this.zoomLevel;
        
        return { x: canvasX, y: canvasY };
    }

    /**
     * Convert canvas coordinates to screen coordinates
     */
    canvasToScreen(canvasX, canvasY) {
        if (!this.canvasElement) return { x: canvasX, y: canvasY };

        const rect = this.canvasElement.getBoundingClientRect();
        const screenX = rect.left + canvasX * this.zoomLevel + this.panX;
        const screenY = rect.top + canvasY * this.zoomLevel + this.panY;
        
        return { x: screenX, y: screenY };
    }
}

// Create and export singleton instance
export const zoomManager = new ZoomManager();

// Default export for convenience
export default zoomManager;
