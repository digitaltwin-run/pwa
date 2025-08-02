// Digital Twin IDE - Drag & Drop Module

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

        // Inicjalizuj puste metadane
        let metadata = { parameters: {} };

        // Usuń wszystkie elementy metadata z SVG (zachowaj czystość)
        const metadataElements = svgElement.querySelectorAll('metadata, script[type="application/json"][class="metadata"]');
        metadataElements.forEach(element => element.remove());

        // Przechowuj metadane tylko w atrybutach data-*
        svgElement.setAttribute('data-metadata', JSON.stringify(metadata));

        // Ustaw pozycję
        const width = parseFloat(svgElement.getAttribute("width")) || 100;
        const height = parseFloat(svgElement.getAttribute("height")) || 100;

        const finalX = x - width / 2;
        const finalY = y - height / 2;

        svgElement.setAttribute("x", finalX);
        svgElement.setAttribute("y", finalY);

        // Zapisz pozycję w metadanych
        metadata.position = { x: finalX, y: finalY };
        svgElement.setAttribute('data-metadata', JSON.stringify(metadata));

        // Dodaj do canvas
        this.svgCanvas.appendChild(svgElement);

        // Zapisz w mapie komponentów
        this.componentManager.addComponent(componentId, {
            element: svgElement,
            metadata: metadata,
            id: componentId
        });

        // Dodaj funkcjonalność przeciągania
        this.makeDraggable(svgElement);

        console.log(`Dodano komponent ${componentId} na pozycji (${x}, ${y})`);
    }

    // Przeciąganie komponentów po planszy
    makeDraggable(svgElement) {
        let isDragging = false;
        let startX, startY, startElementX, startElementY;

        svgElement.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return; // Tylko lewy przycisk myszy

            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            startElementX = parseFloat(svgElement.getAttribute('x')) || 0;
            startElementY = parseFloat(svgElement.getAttribute('y')) || 0;

            svgElement.style.cursor = 'grabbing';
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            const newX = startElementX + deltaX;
            const newY = startElementY + deltaY;

            svgElement.setAttribute('x', newX);
            svgElement.setAttribute('y', newY);
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                svgElement.style.cursor = 'move';
            }
        });
    }
}
