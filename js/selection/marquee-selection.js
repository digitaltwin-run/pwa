/**
 * Marquee Selection - Rectangle selection functionality
 * Extracted from canvas-selection-manager.js for better modularity
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
    }

    /**
     * Start selection box drawing
     */
    startSelectionBox(e) {
        if (!this.canvasElement) return;

        const rect = this.canvasElement.getBoundingClientRect();
        this.selectionStart = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };

        this.isSelecting = true;
        this.createSelectionBox();
        console.log('🎯 Started selection box at', this.selectionStart);
    }

    /**
     * Create visual selection box element
     */
    createSelectionBox() {
        if (!this.canvasElement) return;

        // Remove existing selection box
        this.removeSelectionBox();

        this.selectionBox = document.createElement('div');
        this.selectionBox.className = 'selection-box';
        this.selectionBox.style.cssText = `
            position: absolute;
            border: 2px dashed #007bff;
            background: rgba(0, 123, 255, 0.1);
            pointer-events: none;
            z-index: 1000;
            left: ${this.selectionStart.x}px;
            top: ${this.selectionStart.y}px;
            width: 0px;
            height: 0px;
        `;

        // Add to canvas container or create wrapper if needed
        const canvasContainer = this.canvasElement.parentElement;
        if (canvasContainer.style.position !== 'relative') {
            canvasContainer.style.position = 'relative';
        }
        canvasContainer.appendChild(this.selectionBox);
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
        console.log('🎯 Finalized selection box', rect);
    }

    /**
     * End selection box - clean up
     */
    endSelectionBox() {
        this.isSelecting = false;
        this.removeSelectionBox();
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
            console.log('🎯 Cancelled marquee selection');
        }
    }
}

// Create and export singleton instance
export const marqueeSelection = new MarqueeSelection();
export default marqueeSelection;
