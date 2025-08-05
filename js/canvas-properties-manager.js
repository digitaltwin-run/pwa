/**
 * Canvas Properties Manager - Handles SVG canvas properties (size, background, etc.)
 */
export class CanvasPropertiesManager {
    constructor() {
        this.canvasElement = null;
        this.defaultWidth = 800;
        this.defaultHeight = 600;
        this.backgroundColor = '#ffffff'; // Domyślny kolor tła
        
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

        // Get grid colors and small grid size from canvas attributes
        const mainGridColor = this.canvasElement.getAttribute('data-main-grid-color') || '#cccccc';
        const smallGridColor = this.canvasElement.getAttribute('data-small-grid-color') || '#e0e0e0';
        const smallGridSize = parseInt(this.canvasElement.getAttribute('data-small-grid-size')) || Math.floor(gridSize/5);

        return {
            width,
            height,
            viewBox,
            backgroundColor: this.backgroundColor, // Zwracamy rzeczywisty kolor tła
            gridVisible,
            gridSize,
            smallGridSize,
            mainGridColor,
            smallGridColor
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
        this.refreshPropertiesPanel();
    }

    /**
     * Set small grid size
     */
    setSmallGridSize(size) {
        const canvas = document.getElementById('svg-canvas');
        if (!canvas) return;
        
        // Store small grid size as custom property
        canvas.setAttribute('data-small-grid-size', size);
        
        const props = this.getCanvasProperties();
        this.updateGrid(props.width, props.height, props.gridSize, size);
        console.log(`📐 Small grid size set to: ${size}px`);
        this.refreshPropertiesPanel();
    }

    /**
     * Set main grid color
     */
    setMainGridColor(color) {
        const canvas = document.getElementById('svg-canvas');
        if (!canvas) return;
        
        canvas.setAttribute('data-main-grid-color', color);
        const props = this.getCanvasProperties();
        this.updateGrid(props.width, props.height, props.gridSize, props.smallGridSize, color, props.smallGridColor);
        console.log(`🎨 Main grid color set to: ${color}`);
        this.refreshPropertiesPanel();
    }

    /**
     * Set small grid color
     */
    setSmallGridColor(color) {
        const canvas = document.getElementById('svg-canvas');
        if (!canvas) return;
        
        canvas.setAttribute('data-small-grid-color', color);
        const props = this.getCanvasProperties();
        this.updateGrid(props.width, props.height, props.gridSize, props.smallGridSize, props.mainGridColor, color);
        console.log(`🎨 Small grid color set to: ${color}`);
        this.refreshPropertiesPanel();
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

                <!-- Canvas Background -->
                <div class="property-category mb-3">
                    <h6><i class="bi bi-palette"></i> <span data-i18n="properties.canvasBackground">Tło kanwy</span></h6>
                    <div class="row g-2 align-items-center">
                        <div class="col-6">
                            <label class="form-label small" data-i18n="properties.backgroundColor">Kolor tła</label>
                        </div>
                        <div class="col-6">
                            <input type="color" class="form-control form-control-sm form-control-color" 
                                   value="${props.backgroundColor}" title="Wybierz kolor tła kanwy"
                                   onchange="window.canvasPropertiesManager?.setBackgroundColor(this.value)">
                        </div>
                    </div>
                </div>

                <!-- Canvas Grid -->
                <div class="property-category mb-3">
                    <h6><i class="bi bi-grid-3x3"></i> <span data-i18n="properties.canvasGrid">Siatka</span></h6>
                    
                    <!-- Grid Visibility -->
                    <div class="row g-2 align-items-center mb-2">
                        <div class="col-6">
                            <label class="form-label small" data-i18n="properties.gridVisible">Pokaż siatkę</label>
                        </div>
                        <div class="col-6">
                            <input class="form-check-input" type="checkbox" id="gridVisible" 
                                   ${props.gridVisible ? 'checked' : ''}
                                   onchange="window.canvasPropertiesManager?.toggleGrid(this.checked)">
                        </div>
                    </div>
                    
                    <!-- Main Grid Size -->
                    <div class="row g-2 align-items-center mb-2">
                        <div class="col-6">
                            <label class="form-label small" data-i18n="properties.gridSize">Rozmiar dużej siatki</label>
                        </div>
                        <div class="col-6">
                            <input type="range" class="form-range form-range-sm" min="10" max="100" step="5" 
                                   value="${props.gridSize}" title="Rozmiar dużej siatki: ${props.gridSize}px"
                                   onchange="window.canvasPropertiesManager?.setGridSize(this.value)">
                            <small class="text-muted">${props.gridSize}px</small>
                        </div>
                    </div>
                    
                    <!-- Small Grid Size -->
                    <div class="row g-2 align-items-center mb-2">
                        <div class="col-6">
                            <label class="form-label small" data-i18n="properties.smallGridSize">Rozmiar małej siatki</label>
                        </div>
                        <div class="col-6">
                            <input type="range" class="form-range form-range-sm" min="2" max="20" step="1" 
                                   value="${props.smallGridSize || Math.floor(props.gridSize/5)}" 
                                   title="Rozmiar małej siatki: ${props.smallGridSize || Math.floor(props.gridSize/5)}px"
                                   onchange="window.canvasPropertiesManager?.setSmallGridSize(this.value)">
                            <small class="text-muted">${props.smallGridSize || Math.floor(props.gridSize/5)}px</small>
                        </div>
                    </div>
                    
                    <!-- Main Grid Color -->
                    <div class="row g-2 align-items-center mb-2">
                        <div class="col-6">
                            <label class="form-label small" data-i18n="properties.mainGridColor">Kolor dużej siatki</label>
                        </div>
                        <div class="col-6">
                            <input type="color" class="form-control form-control-sm form-control-color" 
                                   value="${props.mainGridColor || '#cccccc'}" 
                                   title="Kolor dużej siatki"
                                   onchange="window.canvasPropertiesManager?.setMainGridColor(this.value)">
                        </div>
                    </div>
                    
                    <!-- Small Grid Color -->
                    <div class="row g-2 align-items-center">
                        <div class="col-6">
                            <label class="form-label small" data-i18n="properties.smallGridColor">Kolor małej siatki</label>
                        </div>
                        <div class="col-6">
                            <input type="color" class="form-control form-control-sm form-control-color" 
                                   value="${props.smallGridColor || '#e0e0e0'}" 
                                   title="Kolor małej siatki"
                                   onchange="window.canvasPropertiesManager?.setSmallGridColor(this.value)">
                        </div>
                    </div>
                </div>

                <!-- Zoom Controls -->
                <div class="property-category mb-3">
                    <h6><i class="bi bi-zoom-in"></i> Zoom Canvas</h6>
                    <div class="zoom-controls-canvas">
                        <div class="row g-2 mb-2">
                            <div class="col-4">
                                <button class="btn btn-outline-dark btn-sm w-100" 
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
                                <button class="btn btn-outline-dark btn-sm w-100" 
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
     * Set canvas background color
     * @param {string} color - CSS color value (hex, rgb, etc.)
     */
    setBackgroundColor(color) {
        if (!color) return;
        
        console.log(`🎨 Setting canvas background color to: ${color}`);
        
        // Ustaw kolor w modelu wewnętrznym
        this.backgroundColor = color;
        
        // Aktualizuj tło wizualnie
        if (this.canvasElement) {
            // Najpierw usuń istniejący prostokąt tła, jeśli istnieje
            const existingBg = this.canvasElement.querySelector('.canvas-background');
            if (existingBg) {
                existingBg.remove();
                console.log('🗑️ Removed existing background');
            }
            
            // Utwórz nowy prostokąt tła
            const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            bgRect.setAttribute('class', 'canvas-background');
            bgRect.setAttribute('x', '0');
            bgRect.setAttribute('y', '0');
            bgRect.setAttribute('pointer-events', 'none'); // Aby nie przechwytywał zdarzeń myszy
            
            // Aktualizuj atrybuty tła
            const props = this.getCanvasProperties();
            bgRect.setAttribute('width', String(props.width));
            bgRect.setAttribute('height', String(props.height));
            bgRect.setAttribute('fill', color);
            
            // Wstaw jako pierwszy element (pod wszystkimi innymi elementami)
            this.canvasElement.insertBefore(bgRect, this.canvasElement.firstChild);
            
            console.log(`✅ Canvas background color updated to: ${color}`);
            console.log(`📐 Background rect size: ${props.width}x${props.height}`);
        } else {
            console.warn('❌ Canvas element not available for background update');
        }
        
        // Powiadom inne komponenty o zmianie kanwy
        this.notifyCanvasChange();
        
        // Odśwież panel właściwości
        setTimeout(() => {
            this.refreshPropertiesPanel();
        }, 50);
    }

    /**
     * Toggle grid visibility
     * @param {boolean} visible - Whether grid should be visible
     */
    toggleGrid(visible) {
        if (!this.canvasElement) return;
        
        const gridElement = this.canvasElement.querySelector('.grid');
        if (gridElement) {
            gridElement.style.display = visible ? 'block' : 'none';
            console.log(`🔳 Grid ${visible ? 'shown' : 'hidden'}`);
        }
        
        // Powiadom inne komponenty o zmianie kanwy
        this.notifyCanvasChange();
        
        // Odśwież panel właściwości
        setTimeout(() => {
            this.refreshPropertiesPanel();
        }, 50);
    }

    /**
     * Set grid size
     * @param {number} size - Grid size in pixels
     */
    setGridSize(size) {
        if (!this.canvasElement) return;
        
        const gridSize = parseInt(size);
        const gridElement = this.canvasElement.querySelector('.grid');
        
        if (gridElement) {
            // Usuń istniejące linie siatki
            gridElement.innerHTML = '';
            
            // Pobierz rozmiar canvas
            const props = this.getCanvasProperties();
            
            // Utwórz pionowe linie
            for (let x = 0; x <= props.width; x += gridSize) {
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', String(x));
                line.setAttribute('y1', '0');
                line.setAttribute('x2', String(x));
                line.setAttribute('y2', String(props.height));
                line.setAttribute('stroke', '#e0e0e0');
                line.setAttribute('stroke-width', '0.5');
                gridElement.appendChild(line);
            }
            
            // Utwórz poziome linie
            for (let y = 0; y <= props.height; y += gridSize) {
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', '0');
                line.setAttribute('y1', String(y));
                line.setAttribute('x2', String(props.width));
                line.setAttribute('y2', String(y));
                line.setAttribute('stroke', '#e0e0e0');
                line.setAttribute('stroke-width', '0.5');
                gridElement.appendChild(line);
            }
            
            console.log(`📏 Grid size updated to: ${gridSize}px`);
        }
        
        // Powiadom inne komponenty o zmianie kanwy
        this.notifyCanvasChange();
        
        // Odśwież panel właściwości
        setTimeout(() => {
            this.refreshPropertiesPanel();
        }, 50);
    }

    /**
     * Refresh properties panel
     */
    refreshPropertiesPanel() {
        const event = new CustomEvent('refresh-canvas-properties');
        document.dispatchEvent(event);
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
