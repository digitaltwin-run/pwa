/**
 * HMI Canvas Properties UI - UI generation for canvas properties panel
 * Refactored from canvas-properties-manager.js
 * @module hmi/canvas
 */

export class CanvasPropertiesUI {
    constructor() {
        this.canvasCore = null;
        this.gridManager = null;
    }

    /**
     * Initialize canvas properties UI
     */
    init() {
        console.log('🎨 HMI Canvas Properties UI initialized');
    }

    /**
     * Set references to canvas core and grid manager
     */
    setReferences(canvasCore, gridManager) {
        this.canvasCore = canvasCore;
        this.gridManager = gridManager;
    }

    /**
     * Generate HTML for canvas properties panel
     */
    generateCanvasPropertiesHTML() {
        if (!this.canvasCore || !this.gridManager) {
            console.warn('❌ Cannot generate canvas properties HTML - missing references');
            return '<div class="alert alert-warning">Canvas properties not available</div>';
        }

        const canvasProps = this.canvasCore.getCanvasProperties();
        const gridProps = this.gridManager.getGridProperties();
        
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
                                   value="${canvasProps.width}" min="100" max="5000" step="10"
                                   onchange="window.hmi?.canvas?.core?.updateCanvasSize(parseInt(this.value), ${canvasProps.height})">
                        </div>
                        <div class="col-6">
                            <label class="form-label small">Wysokość (px)</label>
                            <input type="number" class="form-control form-control-sm" 
                                   value="${canvasProps.height}" min="100" max="5000" step="10"
                                   onchange="window.hmi?.canvas?.core?.updateCanvasSize(${canvasProps.width}, parseInt(this.value))">
                        </div>
                    </div>
                    <div class="mt-2">
                        <small class="text-muted">ViewBox: ${canvasProps.viewBox}</small>
                    </div>
                </div>

                <!-- Canvas Background -->
                <div class="property-category mb-3">
                    <h6><i class="bi bi-palette"></i> <span data-i18n="properties.canvasBackground">Tło kanwy</span></h6>
                    <div class="row g-2 align-items-center">
                        <div class="col-8">
                            <input type="color" class="form-control form-control-color" 
                                   value="${canvasProps.backgroundColor}" 
                                   onchange="window.hmi?.canvas?.core?.setBackgroundColor(this.value)"
                                   title="Wybierz kolor tła">
                        </div>
                        <div class="col-4">
                            <input type="text" class="form-control form-control-sm" 
                                   value="${canvasProps.backgroundColor}" 
                                   placeholder="#ffffff"
                                   onchange="window.hmi?.canvas?.core?.setBackgroundColor(this.value)">
                        </div>
                    </div>
                    <div class="mt-2">
                        <div class="color-palette-grid">
                            ${this.generateColorPalette()}
                        </div>
                    </div>
                </div>

                <!-- Grid Settings -->
                <div class="property-category mb-3">
                    <h6><i class="bi bi-grid"></i> Ustawienia siatki</h6>
                    <div class="row g-2 mb-2">
                        <div class="col-12">
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" 
                                       ${gridProps.gridVisible ? 'checked' : ''}
                                       onchange="window.hmi?.canvas?.grid?.toggleGrid(this.checked)">
                                <label class="form-check-label">Pokaż siatkę</label>
                            </div>
                        </div>
                    </div>
                    <div class="row g-2">
                        <div class="col-6">
                            <label class="form-label small">Rozmiar główny</label>
                            <input type="number" class="form-control form-control-sm" 
                                   value="${gridProps.gridSize}" min="1" max="100" step="1"
                                   onchange="window.hmi?.canvas?.grid?.setGridSize(parseInt(this.value))">
                        </div>
                        <div class="col-6">
                            <label class="form-label small">Rozmiar pomocniczy</label>
                            <input type="number" class="form-control form-control-sm" 
                                   value="${gridProps.smallGridSize}" min="0" max="50" step="1"
                                   onchange="window.hmi?.canvas?.grid?.setSmallGridSize(parseInt(this.value))">
                        </div>
                    </div>
                    <div class="row g-2 mt-2">
                        <div class="col-6">
                            <label class="form-label small">Kolor główny</label>
                            <input type="color" class="form-control form-control-color" 
                                   value="${gridProps.mainGridColor}" 
                                   onchange="window.hmi?.canvas?.grid?.setMainGridColor(this.value)">
                        </div>
                        <div class="col-6">
                            <label class="form-label small">Kolor pomocniczy</label>
                            <input type="color" class="form-control form-control-color" 
                                   value="${gridProps.smallGridColor}" 
                                   onchange="window.hmi?.canvas?.grid?.setSmallGridColor(this.value)">
                        </div>
                    </div>
                </div>

                <!-- Canvas Statistics -->
                <div class="property-category mb-3">
                    <h6><i class="bi bi-info-circle"></i> Statystyki kanwy</h6>
                    <div class="canvas-stats">
                        <div class="row text-center">
                            <div class="col-6">
                                <div class="stat-item">
                                    <div class="stat-value" id="canvas-components-count">0</div>
                                    <div class="stat-label small text-muted">Komponenty</div>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="stat-item">
                                    <div class="stat-value">${canvasProps.width}×${canvasProps.height}</div>
                                    <div class="stat-label small text-muted">Rozmiar</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Canvas Actions -->
                <div class="property-category">
                    <h6><i class="bi bi-tools"></i> Akcje kanwy</h6>
                    <div class="d-grid gap-2">
                        <button type="button" class="btn btn-outline-primary btn-sm" 
                                onclick="window.hmi?.canvas?.core?.exportCanvas()">
                            <i class="bi bi-download"></i> Eksportuj SVG
                        </button>
                        <button type="button" class="btn btn-outline-secondary btn-sm" 
                                onclick="window.hmi?.canvas?.core?.updateCanvasStats()">
                            <i class="bi bi-arrow-clockwise"></i> Odśwież statystyki
                        </button>
                    </div>
                </div>
            </div>

            <style>
                .canvas-properties-section .property-category {
                    background: #f8f9fa;
                    border-radius: 8px;
                    padding: 12px;
                    border: 1px solid #e9ecef;
                }
                .canvas-properties-section .property-category h6 {
                    color: #495057;
                    font-weight: 600;
                    margin-bottom: 8px;
                }
                .color-palette-grid {
                    display: grid;
                    grid-template-columns: repeat(8, 1fr);
                    gap: 4px;
                    margin-top: 8px;
                }
                .color-palette-item {
                    width: 24px;
                    height: 24px;
                    border-radius: 4px;
                    border: 1px solid #dee2e6;
                    cursor: pointer;
                    transition: transform 0.1s ease;
                }
                .color-palette-item:hover {
                    transform: scale(1.1);
                    border-color: #007bff;
                }
                .stat-item {
                    padding: 8px;
                    background: white;
                    border-radius: 6px;
                    border: 1px solid #e9ecef;
                }
                .stat-value {
                    font-size: 16px;
                    font-weight: 600;
                    color: #007bff;
                }
                .canvas-stats {
                    background: #f8f9fa;
                    border-radius: 6px;
                    padding: 8px;
                }
            </style>
        `;
    }

    /**
     * Generate color palette for quick color selection
     */
    generateColorPalette() {
        const colors = [
            '#ffffff', '#f8f9fa', '#e9ecef', '#dee2e6',
            '#adb5bd', '#6c757d', '#495057', '#343a40',
            '#007bff', '#6610f2', '#6f42c1', '#e83e8c',
            '#dc3545', '#fd7e14', '#ffc107', '#28a745',
            '#20c997', '#17a2b8', '#6c757d', '#343a40',
            '#f8d7da', '#d4edda', '#d1ecf1', '#ffeeba',
            '#f5c6cb', '#c3e6cb', '#bee5eb', '#fff3cd'
        ];

        return colors.map(color => 
            `<div class="color-palette-item" 
                  style="background-color: ${color}" 
                  title="${color}"
                  onclick="window.hmi?.canvas?.core?.setBackgroundColor('${color}')">
             </div>`
        ).join('');
    }

    /**
     * Update canvas statistics display
     */
    updateCanvasStatsDisplay(stats) {
        const componentCountElement = document.getElementById('canvas-components-count');
        if (componentCountElement && stats.components !== undefined) {
            componentCountElement.textContent = stats.components;
        }
    }

    /**
     * Refresh the entire properties panel
     */
    refreshPropertiesPanel() {
        const propertiesPanel = document.querySelector('.canvas-properties-section');
        if (propertiesPanel) {
            propertiesPanel.outerHTML = this.generateCanvasPropertiesHTML();
            console.log('🎨 Canvas properties panel refreshed');
        }
    }

    /**
     * Set up event listeners for canvas properties
     */
    setupEventListeners() {
        // Listen for canvas changes to update UI
        document.addEventListener('canvas-changed', () => {
            this.refreshPropertiesPanel();
        });

        // Listen for grid changes to update UI
        document.addEventListener('grid-changed', () => {
            this.refreshPropertiesPanel();
        });

        // Listen for canvas stats updates
        document.addEventListener('canvas-stats-updated', (event) => {
            this.updateCanvasStatsDisplay(event.detail);
        });

        // Listen for refresh requests
        document.addEventListener('refresh-canvas-properties', () => {
            this.refreshPropertiesPanel();
        });

        console.log('🎨 Canvas properties UI event listeners set up');
    }
}

// Create and export singleton instance
export const canvasPropertiesUI = new CanvasPropertiesUI();
export default canvasPropertiesUI;
