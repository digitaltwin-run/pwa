/**
 * Canvas Properties Manager - Handles SVG canvas properties (size, background, etc.)
 */
export class CanvasPropertiesManager {
    constructor() {
        this.canvasElement = null;
        this.defaultWidth = 800;
        this.defaultHeight = 600;
        
        this.init();
    }

    /**
     * Initialize canvas properties manager
     */
    init() {
        console.log('📐 Canvas Properties Manager initialized');
    }

    /**
     * Set reference to canvas element
     */
    setCanvas(canvasElement) {
        this.canvasElement = canvasElement;
    }

    /**
     * Get canvas properties
     */
    getCanvasProperties() {
        if (!this.canvasElement) {
            return {
                width: this.defaultWidth,
                height: this.defaultHeight,
                viewBox: `0 0 ${this.defaultWidth} ${this.defaultHeight}`,
                backgroundColor: '#ffffff',
                gridVisible: true,
                gridSize: 20
            };
        }

        const width = parseInt(this.canvasElement.getAttribute('width')) || this.defaultWidth;
        const height = parseInt(this.canvasElement.getAttribute('height')) || this.defaultHeight;
        const viewBox = this.canvasElement.getAttribute('viewBox') || `0 0 ${width} ${height}`;
        
        // Check if grid is visible
        const gridElement = this.canvasElement.querySelector('.grid');
        const gridVisible = gridElement ? gridElement.style.display !== 'none' : true;
        
        // Get grid size from first line spacing
        let gridSize = 20;
        const firstLine = this.canvasElement.querySelector('.grid line');
        if (firstLine) {
            const x1 = parseInt(firstLine.getAttribute('x1')) || 0;
            const x2 = parseInt(firstLine.getAttribute('x2')) || 20;
            gridSize = Math.abs(x2 - x1) || 20;
        }

        return {
            width,
            height,
            viewBox,
            backgroundColor: '#ffffff', // SVG doesn't have direct background, but we can simulate
            gridVisible,
            gridSize
        };
    }

    /**
     * Update canvas size
     */
    updateCanvasSize(width, height) {
        if (!this.canvasElement) return;

        // Update canvas attributes
        this.canvasElement.setAttribute('width', width);
        this.canvasElement.setAttribute('height', height);
        this.canvasElement.setAttribute('viewBox', `0 0 ${width} ${height}`);

        // Update grid if it exists
        this.updateGrid(width, height);

        // Notify other components about canvas change
        this.notifyCanvasChange();
        
        console.log(`📐 Canvas size updated: ${width}x${height}`);
    }

    /**
     * Update grid pattern
     */
    updateGrid(width, height, gridSize = null) {
        if (!this.canvasElement) return;

        const grid = this.canvasElement.querySelector('.grid');
        if (!grid) return;

        const currentGridSize = gridSize || this.getCanvasProperties().gridSize;
        
        // Clear existing grid lines
        grid.innerHTML = '';

        // Create vertical lines
        for (let x = 0; x <= width; x += currentGridSize) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x);
            line.setAttribute('y1', 0);
            line.setAttribute('x2', x);
            line.setAttribute('y2', height);
            line.setAttribute('stroke', '#e0e0e0');
            line.setAttribute('stroke-width', '1');
            grid.appendChild(line);
        }

        // Create horizontal lines
        for (let y = 0; y <= height; y += currentGridSize) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', 0);
            line.setAttribute('y1', y);
            line.setAttribute('x2', width);
            line.setAttribute('y2', y);
            line.setAttribute('stroke', '#e0e0e0');
            line.setAttribute('stroke-width', '1');
            grid.appendChild(line);
        }
    }

    /**
     * Toggle grid visibility
     */
    toggleGrid() {
        if (!this.canvasElement) return;

        const grid = this.canvasElement.querySelector('.grid');
        if (!grid) return;

        const isVisible = grid.style.display !== 'none';
        grid.style.display = isVisible ? 'none' : 'block';
        
        console.log(`📐 Grid ${isVisible ? 'hidden' : 'shown'}`);
        return !isVisible;
    }

    /**
     * Set grid size
     */
    setGridSize(size) {
        const props = this.getCanvasProperties();
        this.updateGrid(props.width, props.height, size);
        console.log(`📐 Grid size set to: ${size}px`);
    }

    /**
     * Generate HTML for canvas properties panel
     */
    generateCanvasPropertiesHTML() {
        const props = this.getCanvasProperties();
        
        return `
            <div class="canvas-properties-section">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h4 class="mb-0">🎨 Canvas SVG</h4>
                    <span class="badge bg-primary">Płótno</span>
                </div>
                
                <!-- Canvas Size -->
                <div class="property-category mb-3">
                    <h6><i class="bi bi-aspect-ratio"></i> Rozmiar płótna</h6>
                    <div class="row g-2">
                        <div class="col-6">
                            <label class="form-label small">Szerokość (px)</label>
                            <input type="number" class="form-control form-control-sm" 
                                   value="${props.width}" min="100" max="5000" step="10"
                                   onchange="window.canvasPropertiesManager?.updateCanvasSize(parseInt(this.value), ${props.height})">
                        </div>
                        <div class="col-6">
                            <label class="form-label small">Wysokość (px)</label>
                            <input type="number" class="form-control form-control-sm" 
                                   value="${props.height}" min="100" max="5000" step="10"
                                   onchange="window.canvasPropertiesManager?.updateCanvasSize(${props.width}, parseInt(this.value))">
                        </div>
                    </div>
                    <div class="mt-2">
                        <small class="text-muted">ViewBox: ${props.viewBox}</small>
                    </div>
                </div>

                <!-- Grid Settings -->
                <div class="property-category mb-3">
                    <h6><i class="bi bi-grid"></i> Siatka</h6>
                    <div class="row g-2 align-items-center">
                        <div class="col-6">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="grid-visible" 
                                       ${props.gridVisible ? 'checked' : ''}
                                       onchange="window.canvasPropertiesManager?.toggleGrid()">
                                <label class="form-check-label small" for="grid-visible">
                                    Widoczna siatka
                                </label>
                            </div>
                        </div>
                        <div class="col-6">
                            <label class="form-label small">Rozmiar siatki</label>
                            <input type="number" class="form-control form-control-sm" 
                                   value="${props.gridSize}" min="5" max="100" step="5"
                                   onchange="window.canvasPropertiesManager?.setGridSize(parseInt(this.value))">
                        </div>
                    </div>
                </div>

                <!-- Zoom Controls -->
                <div class="property-category mb-3">
                    <h6><i class="bi bi-zoom-in"></i> Zoom Canvas</h6>
                    <div class="zoom-controls-canvas">
                        <div class="row g-2 mb-2">
                            <div class="col-4">
                                <button class="btn btn-outline-secondary btn-sm w-100" 
                                        onclick="window.canvasZoomManager?.zoomOut()" title="Pomniejsz">
                                    <i class="bi bi-zoom-out"></i>
                                </button>
                            </div>
                            <div class="col-4">
                                <button class="btn btn-outline-primary btn-sm w-100" 
                                        onclick="window.canvasZoomManager?.resetZoom()" title="Reset 100%">
                                    100%
                                </button>
                            </div>
                            <div class="col-4">
                                <button class="btn btn-outline-secondary btn-sm w-100" 
                                        onclick="window.canvasZoomManager?.zoomIn()" title="Powiększ">
                                    <i class="bi bi-zoom-in"></i>
                                </button>
                            </div>
                        </div>
                        <div class="row g-2">
                            <div class="col-6">
                                <button class="btn btn-outline-info btn-sm w-100" 
                                        onclick="window.canvasZoomManager?.fitToScreen()" title="Dopasuj do ekranu">
                                    <i class="bi bi-arrows-fullscreen"></i> Dopasuj
                                </button>
                            </div>
                            <div class="col-6">
                                <div class="text-center">
                                    <small class="text-muted" id="zoom-level-display">100%</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Canvas Info -->
                <div class="mt-3 small text-muted">
                    <div><strong>Komponenty:</strong> <span id="canvas-component-count">0</span></div>
                    <div><strong>Zaznaczone:</strong> <span id="canvas-selected-count">0</span></div>
                    <div><strong>Typ:</strong> SVG Canvas</div>
                </div>

                <!-- Quick Actions -->
                <div class="d-grid gap-2 mt-3">
                    <button class="btn btn-outline-warning btn-sm" onclick="window.canvasSelectionManager?.clearAllSelections()">
                        <i class="bi bi-x-circle"></i> Odznacz wszystko
                    </button>
                    <button class="btn btn-outline-danger btn-sm" onclick="window.canvasSelectionManager?.deleteSelected()">
                        <i class="bi bi-trash"></i> Usuń zaznaczone
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Notify other components about canvas changes
     */
    notifyCanvasChange() {
        const event = new CustomEvent('canvasPropertiesChanged', {
            detail: this.getCanvasProperties()
        });
        document.dispatchEvent(event);
        
        // Update component count in UI
        this.updateCanvasStats();
    }

    /**
     * Update canvas statistics in UI
     */
    updateCanvasStats() {
        // Update component count
        const componentCountEl = document.getElementById('canvas-component-count');
        if (componentCountEl && window.componentManager) {
            const components = window.componentManager.getAllComponents();
            componentCountEl.textContent = components.length;
        }

        // Update selected count
        const selectedCountEl = document.getElementById('canvas-selected-count');
        if (selectedCountEl && window.canvasSelectionManager) {
            selectedCountEl.textContent = window.canvasSelectionManager.selectedComponents.size;
        }

        // Update zoom level display
        const zoomLevelEl = document.getElementById('zoom-level-display');
        if (zoomLevelEl && window.canvasZoomManager) {
            zoomLevelEl.textContent = window.canvasZoomManager.getZoomPercentage() + '%';
        }
    }

    /**
     * Export canvas as SVG
     */
    exportCanvas() {
        if (!this.canvasElement) return null;
        
        const serializer = new XMLSerializer();
        return serializer.serializeToString(this.canvasElement);
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
}

// Export singleton instance
export const canvasPropertiesManager = new CanvasPropertiesManager();
