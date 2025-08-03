// Digital Twin IDE - Drag & Drop Module

import { gridManager } from './grid.js';

export class DragDropManager {
    constructor(componentManager, svgCanvas, workspace) {
        this.componentManager = componentManager;
        this.svgCanvas = svgCanvas;
        this.workspace = workspace;
        this.init();
    }

    init() {
        this.setupDragListeners();
        this.updateSvgSize();
        window.addEventListener('resize', () => this.updateSvgSize());
    }

    // Inicjalizacja rozmiarów SVG
    updateSvgSize() {
        const rect = this.workspace.getBoundingClientRect();
        this.svgCanvas.setAttribute('width', rect.width);
        this.svgCanvas.setAttribute('height', rect.height);
        this.svgCanvas.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);
    }

    setupDragListeners() {
        // Obsługa przeciągania komponentów z biblioteki
        document.getElementById("component-library").addEventListener("dragstart", (e) => {
            const target = e.target.closest(".component-button");
            if (target) {
                e.dataTransfer.setData("text/plain", target.dataset.svg);
                e.dataTransfer.effectAllowed = 'copy';
            }
        });

        // Obsługa upuszczania na canvas
        this.svgCanvas.addEventListener("dragover", (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            this.svgCanvas.classList.add('drag-over');
        });

        this.svgCanvas.addEventListener('dragleave', (e) => {
            // Sprawdź czy opuszczamy rzeczywiście canvas
            if (!this.svgCanvas.contains(e.relatedTarget)) {
                this.svgCanvas.classList.remove('drag-over');
            }
        });

        this.svgCanvas.addEventListener('drop', (e) => this.handleDrop(e));
    }

    async handleDrop(e) {
        e.preventDefault();
        this.svgCanvas.classList.remove('drag-over');

        const svgUrl = e.dataTransfer.getData("text/plain");
        if (!svgUrl) {
            console.error("Brak danych SVG podczas upuszczenia");
            return;
        }

        const canvasX = e.offsetX;
        const canvasY = e.offsetY;

        try {
            const svgElement = await this.loadSvgComponent(svgUrl);
            this.placeComponent(svgElement, canvasX, canvasY, svgUrl);
        } catch (error) {
            console.error("Błąd podczas dodawania komponentu:", error);
        }
    }

    async loadSvgComponent(svgUrl) {
        const response = await fetch(svgUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const svgText = await response.text();
        if (!svgText || (!svgText.trim().startsWith('<svg') && !svgText.trim().startsWith('<?xml'))) {
            throw new Error("Nieprawidłowy format SVG");
        }

        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgText, "image/svg+xml");

        // Sprawdź błędy parsowania
        const parserError = svgDoc.querySelector("parsererror");
        if (parserError) {
            throw new Error("Błąd parsowania SVG");
        }

        const svgElement = svgDoc.documentElement;
        if (!svgElement || svgElement.nodeName !== 'svg') {
            throw new Error("Nie znaleziono elementu SVG");
        }

        return svgElement;
    }

    placeComponent(svgElement, x, y, svgUrl) {
        // Generuj nowe ID
        const componentId = this.componentManager.generateComponentId();

        // Konfiguruj element SVG
        svgElement.setAttribute("data-id", componentId);
        svgElement.setAttribute("data-svg-url", svgUrl);
        svgElement.setAttribute("class", "draggable-component");
        svgElement.setAttribute("style", "cursor: move;");

        // Parse metadata from XML format and store in data-metadata
        const metadata = this.componentManager.parseXMLMetadata(svgElement);
        svgElement.setAttribute('data-metadata', JSON.stringify(metadata));

        // Ustaw rozmiar komponentu na rozmiar siatki (100x100px)
        const gridSize = gridManager.config.size;
        const width = gridSize;
        const height = gridSize;
        
        // Ustaw atrybuty width i height SVG
        svgElement.setAttribute("width", width);
        svgElement.setAttribute("height", height);
        
        // Oblicz pozycję z wyśrodkowaniem
        let finalX = x - width / 2;
        let finalY = y - height / 2;

        // Jeśli włączone przyciąganie do siatki, dostosuj pozycję
        if (gridManager.config.snapToGrid) {
            finalX = gridManager.snapToGrid(finalX);
            finalY = gridManager.snapToGrid(finalY);
        }

        // Ustaw pozycję elementu
        svgElement.setAttribute("x", finalX);
        svgElement.setAttribute("y", finalY);

        // Zapisz pozycję w metadanych
        metadata.position = { x: finalX, y: finalY };
        svgElement.setAttribute('data-metadata', JSON.stringify(metadata));

        // Dodaj do canvas
        this.svgCanvas.appendChild(svgElement);

        // Zarejestruj komponent w menedżerze
        this.componentManager.storeComponent(componentId, svgElement, svgUrl);

        // Dodaj funkcjonalność przeciągania
        this.makeDraggable(svgElement);

        console.log(`Dodano komponent ${componentId} na pozycji (${x}, ${y})`);
    }

    /**
     * Get current scale factor from SVG transform attribute
     * @param {SVGElement} svgElement - The SVG component
     * @returns {number} Current scale factor (default: 1.0)
     */
    getComponentScale(svgElement) {
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

    // Przeciąganie komponentów po planszy
    makeDraggable(svgElement) {
        let isDragging = false;
        let startX, startY, startElementX, startElementY;
        let moveListener, upListener;

        const onMouseMove = (e) => {
            if (!isDragging) return;

            // Get component's current scale to maintain cursor synchronization
            const currentScale = this.getComponentScale(svgElement);
            
            // Calculate raw mouse movement in screen pixels
            const rawDx = e.clientX - startX;
            const rawDy = e.clientY - startY;
            
            // For cursor-component sync, we need to account for scale
            // Scaled components visually move more than their x,y attributes suggest
            // So we normalize the movement to maintain 1:1 cursor tracking
            const normalizedDx = rawDx / currentScale;
            const normalizedDy = rawDy / currentScale;
            
            // Calculate target position using normalized movement
            let targetX = startElementX + normalizedDx;
            let targetY = startElementY + normalizedDy;

            // Apply grid snapping to maintain consistent grid alignment
            if (gridManager.config.snapToGrid) {
                targetX = gridManager.snapToGrid(targetX);
                targetY = gridManager.snapToGrid(targetY);
            }
            
            // Apply the final position (grid-snapped)
            svgElement.setAttribute('x', targetX);
            svgElement.setAttribute('y', targetY);

            // Update metadata with final grid-aligned position
            const metadata = JSON.parse(svgElement.getAttribute('data-metadata') || '{}');
            metadata.position = { x: targetX, y: targetY };
            svgElement.setAttribute('data-metadata', JSON.stringify(metadata));
        };

        const cleanup = () => {
            document.removeEventListener('mousemove', moveListener);
            document.removeEventListener('mouseup', upListener);
            svgElement.style.cursor = 'move'; // Reset cursor
        };

        const onMouseUp = (e) => {
            isDragging = false;
            cleanup();
            e.preventDefault();
        };

        svgElement.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return; // Only left mouse button

            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            startElementX = parseFloat(svgElement.getAttribute('x') || '0');
            startElementY = parseFloat(svgElement.getAttribute('y') || '0');

            // Set up event listeners
            moveListener = onMouseMove.bind(this);
            upListener = onMouseUp.bind(this);
            
            document.addEventListener('mousemove', moveListener);
            document.addEventListener('mouseup', upListener);

            // Update UI
            svgElement.style.cursor = 'grabbing';
            e.preventDefault(); // Prevent text selection while dragging
        });

        // Clean up when component is removed
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (Array.from(mutation.removedNodes).includes(svgElement)) {
                    cleanup();
                    observer.disconnect();
                }
            });
        });

        // Use the parent node of the SVG element for observation
        if (svgElement.parentNode) {
            observer.observe(svgElement.parentNode, { childList: true });
        }
    }
}
