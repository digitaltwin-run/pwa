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

        // Ustaw pozycję z uwzględnieniem siatki
        const width = parseFloat(svgElement.getAttribute("width")) || 100;
        const height = parseFloat(svgElement.getAttribute("height")) || 100;

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

    // Przeciąganie komponentów po planszy
    makeDraggable(svgElement) {
        let isDragging = false;
        let startX, startY, startElementX, startElementY;
        let moveListener, upListener;

        const onMouseMove = (e) => {
            if (!isDragging) return;

            // Calculate movement
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            // Calculate new position
            let newX = startElementX + dx;
            let newY = startElementY + dy;

            // Snap to grid if enabled
            if (gridManager.config.snapToGrid) {
                newX = gridManager.snapToGrid(newX);
                newY = gridManager.snapToGrid(newY);
            }

            // Apply new position
            svgElement.setAttribute('x', newX);
            svgElement.setAttribute('y', newY);

            // Update metadata
            const metadata = JSON.parse(svgElement.getAttribute('data-metadata') || '{}');
            metadata.position = { x: newX, y: newY };
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
