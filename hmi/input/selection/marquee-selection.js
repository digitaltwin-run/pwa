/**
 * HMI Marquee Selection - Rectangle selection functionality
 * Migrated and enhanced from js/selection/marquee-selection.js
 * @module hmi/input/selection
 */

export class MarqueeSelection {
    constructor() {
        this.selectionBox = null;
        this.isSelecting = false;
        this.selectionStart = { x: 0, y: 0 };
        this.canvasElement = null;
        this.selectionCore = null;
    }

    /**
     * Set references to canvas and selection core
     */
    setReferences(canvasElement, selectionCore) {
        this.canvasElement = canvasElement;
        this.selectionCore = selectionCore;
        console.log('🟦 HMI Marquee Selection initialized');
    }

    /**
     * Start selection box drawing
     */
    startSelectionBox(e) {
        if (!this.canvasElement) {
            console.error('❌ Canvas element not set for marquee selection');
            return;
        }

        // Prevent if HMI gesture is active
        if (window.hmi && window.hmi.gestureDetector && window.hmi.gestureDetector.isDrawing) {
            console.log('⏸️ Skipping marquee - HMI gesture active');
            return;
        }

        const rect = this.canvasElement.getBoundingClientRect();
        this.selectionStart = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };

        this.isSelecting = true;
        this.createSelectionBox();
        console.log('🟦 Started HMI marquee selection at', this.selectionStart);
        
        // Add visual feedback
        document.body.style.cursor = 'crosshair';
    }

    /**
     * Create visual selection box element
     */
    createSelectionBox() {
        if (!this.canvasElement) {
            console.error('❌ Cannot create selection box - no canvas element');
            return;
        }

        // Remove existing selection box
        this.removeSelectionBox();

        this.selectionBox = document.createElement('div');
        this.selectionBox.className = 'hmi-marquee-selection-box';
        this.selectionBox.style.cssText = `
            position: absolute;
            border: 2px dashed #007bff;
            background: rgba(0, 123, 255, 0.15);
            pointer-events: none;
            z-index: 10000;
            border-radius: 2px;
            box-shadow: 0 2px 8px rgba(0, 123, 255, 0.3);
            left: ${this.selectionStart.x}px;
            top: ${this.selectionStart.y}px;
            width: 0px;
            height: 0px;
            transition: all 0.05s ease-out;
        `;

        // Add to canvas container or create wrapper if needed
        const canvasContainer = this.canvasElement.parentElement || document.body;
        if (canvasContainer.style.position !== 'relative' && canvasContainer !== document.body) {
            canvasContainer.style.position = 'relative';
        }
        canvasContainer.appendChild(this.selectionBox);
        
        console.log('🟦 Created HMI selection box element');
    }

    /**
     * Update selection box size and position
     */
    updateSelectionBox(e) {
        if (!this.isSelecting || !this.selectionBox || !this.canvasElement) return;

        const rect = this.canvasElement.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;

        const left = Math.min(this.selectionStart.x, currentX);
        const top = Math.min(this.selectionStart.y, currentY);
        const width = Math.abs(currentX - this.selectionStart.x);
        const height = Math.abs(currentY - this.selectionStart.y);

        this.selectionBox.style.left = `${left}px`;
        this.selectionBox.style.top = `${top}px`;
        this.selectionBox.style.width = `${width}px`;
        this.selectionBox.style.height = `${height}px`;
    }

    /**
     * Finalize selection box and select components within
     */
    finalizeSelectionBox() {
        if (!this.isSelecting || !this.selectionBox || !this.selectionCore) return;

        const rect = {
            left: parseInt(this.selectionBox.style.left),
            top: parseInt(this.selectionBox.style.top),
            right: parseInt(this.selectionBox.style.left) + parseInt(this.selectionBox.style.width),
            bottom: parseInt(this.selectionBox.style.top) + parseInt(this.selectionBox.style.height)
        };

        // Select components within the rectangle
        this.selectionCore.selectComponentsInRect(rect);

        this.endSelectionBox();
        console.log('🟦 Finalized HMI marquee selection', rect);
    }

    /**
     * End selection box - clean up
     */
    endSelectionBox() {
        this.isSelecting = false;
        this.removeSelectionBox();
        
        // Reset cursor
        document.body.style.cursor = '';
        console.log('🟦 Ended HMI marquee selection');
    }

    /**
     * Remove selection box element
     */
    removeSelectionBox() {
        if (this.selectionBox) {
            this.selectionBox.remove();
            this.selectionBox = null;
        }
    }

    /**
     * Handle mouse move for selection box
     */
    handleMouseMove(e) {
        if (this.isSelecting) {
            this.updateSelectionBox(e);
        }
    }

    /**
     * Handle mouse up for selection box
     */
    handleMouseUp(e) {
        if (this.isSelecting) {
            this.finalizeSelectionBox();
        }
    }

    /**
     * Check if marquee selection is active
     */
    isMarqueeActive() {
        return this.isSelecting;
    }

    /**
     * Cancel ongoing selection
     */
    cancelSelection() {
        if (this.isSelecting) {
            this.endSelectionBox();
            console.log('🟦 Cancelled HMI marquee selection');
        }
    }
}

// Create and export singleton instance
export const marqueeSelection = new MarqueeSelection();
export default marqueeSelection;
