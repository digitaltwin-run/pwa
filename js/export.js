// Digital Twin IDE - Export/Import Module

export class ExportManager {
    constructor(componentManager, svgCanvas) {
        this.componentManager = componentManager;
        this.svgCanvas = svgCanvas;
    }

    // Eksportuj projekt jako .dtwin
    exportProject() {
        const projectData = {
            version: "1.0",
            timestamp: new Date().toISOString(),
            components: [],
            connections: []
        };

        // Zbierz wszystkie komponenty
        this.componentManager.getAllComponents().forEach(comp => {
            const element = comp.element;
            projectData.components.push({
                id: comp.id,
                svgUrl: element.getAttribute('data-svg-url'),
                x: parseFloat(element.getAttribute('x')) || 0,
                y: parseFloat(element.getAttribute('y')) || 0,
                width: parseFloat(element.getAttribute('width')) || 100,
                height: parseFloat(element.getAttribute('height')) || 100,
                metadata: comp.metadata,
                transform: element.getAttribute('transform') || ''
            });
        });

        // Zbierz połączenia (linie)
        const lines = this.svgCanvas.querySelectorAll('line[data-connection]');
        lines.forEach(line => {
            projectData.connections.push({
                from: line.getAttribute('data-from'),
                to: line.getAttribute('data-to'),
                x1: line.getAttribute('x1'),
                y1: line.getAttribute('y1'),
                x2: line.getAttribute('x2'),
                y2: line.getAttribute('y2')
            });
        });

        // Pobierz i zapisz
        const dataStr = JSON.stringify(projectData, null, 2);
        const blob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'digital-twin-project-' + new Date().toISOString().slice(0, 10) + '.dtwin';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log("Projekt wyeksportowany:", projectData);
    }

    // Importuj projekt z pliku .dtwin
    async importProject() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.dtwin,.json';

        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const text = await file.text();
                const projectData = JSON.parse(text);

                if (!projectData.version || !projectData.components) {
                    throw new Error("Nieprawidłowy format pliku projektu");
                }

                // Wyczyść obecny projekt
                this.clearProject();

                // Załaduj komponenty
                for (const compData of projectData.components) {
                    await this.loadComponent(compData);
                }

                // Załaduj połączenia
                if (projectData.connections) {
                    this.loadConnections(projectData.connections);
                }

                console.log("Projekt zaimportowany:", projectData);
                alert("Projekt został pomyślnie zaimportowany!");

            } catch (error) {
                console.error("Błąd importu:", error);
                alert("Błąd podczas importowania projektu: " + error.message);
            }
        };

        input.click();
    }

    async loadComponent(compData) {
        try {
            const response = await fetch(compData.svgUrl);
            if (!response.ok) throw new Error('Nie można załadować ' + compData.svgUrl);

            const svgText = await response.text();
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(svgText, "image/svg+xml");
            const svgElement = svgDoc.documentElement;

            // Ustaw właściwości
            svgElement.setAttribute('x', compData.x);
            svgElement.setAttribute('y', compData.y);
            svgElement.setAttribute('width', compData.width);
            svgElement.setAttribute('height', compData.height);
            svgElement.setAttribute('data-svg-url', compData.svgUrl);

            if (compData.transform) {
                svgElement.setAttribute('transform', compData.transform);
            }

            // Ustaw metadane
            if (compData.metadata) {
                svgElement.setAttribute('data-metadata', JSON.stringify(compData.metadata));
            }

            // Dodaj do canvas
            svgElement.setAttribute('data-id', compData.id);
            svgElement.classList.add('draggable-component');
            this.svgCanvas.appendChild(svgElement);

            // Dodaj obsługę interakcji
            this.componentManager.initializeComponent(svgElement);
            console.log('Komponent załadowany: ' + compData.id);

        } catch (error) {
            console.error('Błąd ładowania komponentu ' + compData.id + ':', error);
        }
    }

    loadConnections(connections) {
        connections.forEach(conn => {
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute('x1', conn.x1);
            line.setAttribute('y1', conn.y1);
            line.setAttribute('x2', conn.x2);
            line.setAttribute('y2', conn.y2);
            line.setAttribute('stroke', 'black');
            line.setAttribute('stroke-width', '2');
            line.setAttribute('data-connection', 'true');
            line.setAttribute('data-from', conn.from);
            line.setAttribute('data-to', conn.to);

            this.svgCanvas.appendChild(line);
        });

        console.log('Połączenia załadowane: ' + connections.length);
    }

    clearProject() {
        // Usuń wszystkie komponenty
        const components = this.svgCanvas.querySelectorAll('[data-id]');
        components.forEach(comp => comp.remove());

        // Usuń wszystkie połączenia
        const connections = this.svgCanvas.querySelectorAll('[data-connection]');
        connections.forEach(conn => conn.remove());

        // Usuń inne elementy pomocnicze
        const helpers = this.svgCanvas.querySelectorAll('.helper, .resize-handle, .connector');
        helpers.forEach(helper => helper.remove());

        console.log("Projekt wyczyszczony");
    }

    // Eksportuj jako PNG
    exportAsPNG() {
        try {
            // Usuń tymczasowo niepotrzebne elementy z exportCanvas
            const exportCanvas = this.svgCanvas.cloneNode(true);
            const resizeHandles = exportCanvas.querySelectorAll('.resize-handle, .helper, .connector');
            resizeHandles.forEach(handle => handle.remove());

            // Konwertuj SVG na string
            const svgString = new XMLSerializer().serializeToString(exportCanvas);
            const img = new Image();

            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = exportCanvas.getAttribute('width') || 1200;
                canvas.height = exportCanvas.getAttribute('height') || 800;

                const ctx = canvas.getContext('2d');
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);

                const pngUrl = canvas.toDataURL('image/png');
                const a = document.createElement('a');
                a.href = pngUrl;
                a.download = 'digital-twin-' + new Date().toISOString().slice(0, 10) + '.png';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            };

            img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));

            console.log("PNG wyeksportowany");
        } catch (error) {
            console.error("Błąd eksportu PNG:", error);
            alert("Błąd podczas eksportu PNG: " + error.message);
        }
    }

    // Eksportuj jako SVG (zachowując skrypty inicjalizujące, ale bez interakcji)
    exportAsSVG() {
        try {
            // Stwórz kopię canvas do eksportu z głębokim klonowaniem
            const exportCanvas = this.svgCanvas.cloneNode(true);

            // Upewnij się, że wszystkie komponenty mają prawidłowe metadane i atrybuty
            this.preserveComponentMetadata(exportCanvas);

            // Usuń zaznaczenia i resize handles z eksportowanego SVG
            this.removeSelectionArtifacts(exportCanvas);
            
            // Preserve initialization scripts (needed for exported SVGs to function standalone)
            this.preserveComponentScripts(exportCanvas);

            // Interaction scripts removed (moved to /interactions project)

            // Generate SVG as string
            const serializer = new XMLSerializer();
            const svgString = serializer.serializeToString(exportCanvas);

            // Create download link
            const blob = new Blob([svgString], {type: 'image/svg+xml;charset=utf-8'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'digital-twin-' + new Date().toISOString().slice(0, 10) + '.svg';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            console.log('SVG exported successfully');
        } catch (error) {
            console.error('Error in export process:', error);
        }
    }
    
    /**
     * Preserve component metadata for SVG export
     * @param {SVGElement} exportCanvas - The export canvas
     */
    preserveComponentMetadata(exportCanvas) {
        try {
            // Find all components in original canvas
            const originalComponents = this.svgCanvas.querySelectorAll('[data-id]');
            
            originalComponents.forEach(originalElement => {
                const componentId = originalElement.getAttribute('data-id');
                const component = exportCanvas.querySelector('[data-id="' + componentId + '"]');
                
                if (!component) {
                    console.warn('Warning: Component ' + componentId + ' not found in export canvas');
                    return;
                }
                
                // Ensure metadata is preserved
                const metadataStr = originalElement.getAttribute('data-metadata');
                if (metadataStr) {
                    // Clone metadata to the exported component
                    component.setAttribute('data-metadata', metadataStr);
                    
                    // Preserve metadata without interactive visual updates
                }
                
                // Preserve other important attributes
                const preserveAttrs = ['data-svg-url', 'data-component-params', 'transform'];
                preserveAttrs.forEach(attr => {
                    const value = originalElement.getAttribute(attr);
                    if (value) {
                        component.setAttribute(attr, value);
                    }
                });
            });
        } catch (error) {
            console.error("Error preserving component metadata:", error);
        }
    }
    
    /**
     * Preserve component initialization scripts for SVG export
     * @param {SVGElement} exportCanvas - The export canvas
     */
    preserveComponentScripts(exportCanvas) {
        try {
            // Znajdź wszystkie komponenty w oryginalnym canvas
            const originalComponents = this.svgCanvas.querySelectorAll('[data-id]');
            
            originalComponents.forEach(originalElement => {
                const componentId = originalElement.getAttribute('data-id');
                const component = exportCanvas.querySelector('[data-id="' + componentId + '"]');
                
                if (!component) {
                    console.warn('Warning: Component ' + componentId + ' not found in export canvas');
                    return;
                }
                
                // Preserve <defs> containing <script> sections
                const originalScripts = originalElement.querySelectorAll('defs script');
                if (originalScripts.length > 0) {
                    console.log(`Found ${originalScripts.length} script(s) to preserve for component ${componentId}`);
                    
                    // Ensure target component has <defs> section
                    let defs = component.querySelector('defs');
                    if (!defs) {
                        defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
                        component.appendChild(defs);
                    }
                    
                    // Clone and append each script
                    originalScripts.forEach(script => {
                        const clonedScript = script.cloneNode(true);
                        defs.appendChild(clonedScript);
                    });
                }
            });
            
            // Add auto-init script after load for standalone operation
            const autoInitScript = document.createElementNS('http://www.w3.org/2000/svg', 'script');
            autoInitScript.textContent = `
                // Auto-initialize all components after SVG is loaded
                document.addEventListener('DOMContentLoaded', function() {
                    // Find all script elements in SVG and execute their initialization
                    const scripts = document.querySelectorAll('svg script');
                    scripts.forEach(script => {
                        // Script content is already executed via browser
                        console.log('Component script auto-initialized');
                    });
                });
            `;
            
            // Add to main SVG defs
            let mainDefs = exportCanvas.querySelector('defs');
            if (!mainDefs) {
                mainDefs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
                exportCanvas.appendChild(mainDefs);
            }
            mainDefs.appendChild(autoInitScript);
            
            console.log('Successfully preserved component initialization scripts for export');
        } catch (error) {
            console.error("Error preserving component scripts:", error);
        }
    }
    
    /**
     * Remove selection artifacts from exported SVG (highlights, resize handles, etc.)
     * @param {SVGElement} exportCanvas - The cloned canvas for export
     */
    removeSelectionArtifacts(exportCanvas) {
        try {
            // Remove component selection outlines (blue borders)
            const components = exportCanvas.querySelectorAll('[data-id]');
            components.forEach(component => {
                // Remove any inline outline styles
                component.style.outline = '';
                component.style.border = '';

                // Remove outline attributes if they exist
                component.removeAttribute('outline');
            });

            // Remove resize handles groups
            const resizeHandles = exportCanvas.querySelectorAll('.resize-handles, g.resize-handles');
            resizeHandles.forEach(handleGroup => {
                handleGroup.remove();
            });

            // Remove individual resize handles
            const handles = exportCanvas.querySelectorAll('.resize-handle');
            handles.forEach(handle => {
                handle.remove();
            });

            // Remove any selection rectangles or highlight elements
            const selectionElements = exportCanvas.querySelectorAll('[class*="selection"], [class*="highlight"], [class*="selected"]');
            selectionElements.forEach(element => {
                element.remove();
            });

            // Clean up any temporary CSS classes
            const tempClasses = ['selected', 'highlighted', 'dragging', 'resizing'];
            const allElements = exportCanvas.querySelectorAll('*');
            allElements.forEach(element => {
                tempClasses.forEach(className => {
                    element.classList.remove(className);
                });
            });

            console.log('Successfully removed selection artifacts from exported SVG');
        } catch (error) {
            console.error("Error removing selection artifacts:", error);
        }
    }
}

// Globalne funkcje dla wywołań z HTML
window.exportProject = function () {
    if (window.exportManager) {
        window.exportManager.exportProject();
    }
};

window.importProject = function () {
    if (window.exportManager) {
        window.exportManager.importProject();
    }
};

window.exportAsPNG = function () {
    if (window.exportManager) {
        window.exportManager.exportAsPNG();
    }
};

window.exportAsSVG = function () {
    if (window.exportManager) {
        window.exportManager.exportAsSVG();
    }
};
