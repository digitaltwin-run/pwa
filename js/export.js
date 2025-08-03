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
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `digital-twin-project-${new Date().toISOString().slice(0,10)}.dtwin`;
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
            if (!response.ok) throw new Error(`Nie można załadować ${compData.svgUrl}`);

            const svgText = await response.text();
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(svgText, "image/svg+xml");
            const svgElement = svgDoc.documentElement;

            // Konfiguruj element
            svgElement.setAttribute("data-id", compData.id);
            svgElement.setAttribute("data-svg-url", compData.svgUrl);
            svgElement.setAttribute("class", "draggable-component");
            svgElement.setAttribute("style", "cursor: move;");
            svgElement.setAttribute("x", compData.x);
            svgElement.setAttribute("y", compData.y);
            svgElement.setAttribute("width", compData.width);
            svgElement.setAttribute("height", compData.height);
            
            if (compData.transform) {
                svgElement.setAttribute("transform", compData.transform);
            }

            // Zapisz metadane tylko w atrybucie data-metadata (bez elementów DOM)
            svgElement.setAttribute('data-metadata', JSON.stringify(compData.metadata || {}));

            // Dodaj do canvas i mapy
            this.svgCanvas.appendChild(svgElement);
            this.componentManager.addComponent(compData.id, {
                element: svgElement,
                metadata: compData.metadata || {},
                id: compData.id
            });

        } catch (error) {
            console.error(`Błąd ładowania komponentu ${compData.id}:`, error);
        }
    }

    loadConnections(connections) {
        connections.forEach(conn => {
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", conn.x1);
            line.setAttribute("y1", conn.y1);
            line.setAttribute("x2", conn.x2);
            line.setAttribute("y2", conn.y2);
            line.setAttribute("stroke", "#2c3e50");
            line.setAttribute("stroke-width", "2");
            line.setAttribute("marker-end", "url(#arrow)");
            line.setAttribute("data-connection", "true");
            line.setAttribute("data-from", conn.from);
            line.setAttribute("data-to", conn.to);
            
            this.svgCanvas.appendChild(line);
        });
    }

    clearProject() {
        // Usuń wszystkie komponenty z canvas
        const components = this.svgCanvas.querySelectorAll('.draggable-component');
        components.forEach(comp => comp.remove());

        // Usuń wszystkie połączenia
        const connections = this.svgCanvas.querySelectorAll('line[data-connection]');
        connections.forEach(conn => conn.remove());

        // Wyczyść mapę komponentów
        this.componentManager.components.clear();
        this.componentManager.componentCounter = 0;
        this.componentManager.setSelectedComponent(null);

        // Wyczyść panel właściwości
        const propertiesPanel = document.getElementById('properties-panel');
        if (propertiesPanel) {
            propertiesPanel.innerHTML = '<p>Wybierz komponent, aby edytować.</p>';
        }
    }

    // Eksportuj jako PNG
    async exportAsPNG() {
        try {
            const svgData = new XMLSerializer().serializeToString(this.svgCanvas);
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            
            const img = new Image();
            const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
            const url = URL.createObjectURL(svgBlob);
            
            img.onload = () => {
                canvas.width = img.width || 800;
                canvas.height = img.height || 600;
                ctx.fillStyle = "white";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                
                canvas.toBlob((blob) => {
                    const a = document.createElement("a");
                    a.href = URL.createObjectURL(blob);
                    a.download = `digital-twin-${new Date().toISOString().slice(0,10)}.png`;
                    a.click();
                    URL.revokeObjectURL(url);
                });
            };
            
            img.src = url;
        } catch (error) {
            console.error("Błąd eksportu PNG:", error);
            alert("Błąd podczas eksportu PNG");
        }
    }

    // Eksportuj jako SVG z zachowaniem skryptów i interakcji
    exportAsSVG() {
        try {
            // Stwórz kopię canvas do eksportu
            const exportCanvas = this.svgCanvas.cloneNode(true);
            
            // Dodaj niezbędne skrypty do obsługi interakcji
            const scriptElement = document.createElementNS("http://www.w3.org/2000/svg", "script");
            scriptElement.setAttribute("type", "text/javascript");
            
            // Kod JavaScript do obsługi interakcji w samodzielnym SVG
            const scriptContent = `
                // Inicjalizacja obsługi interakcji po załadowaniu SVG
                document.addEventListener('DOMContentLoaded', function() {
                    // Funkcja do obsługi interakcji między komponentami
                    function setupInteractions() {
                        // Znajdź wszystkie komponenty z interakcjami
                        const components = document.querySelectorAll('[data-id]');
                        components.forEach(component => {
                            const metadataElement = component.querySelector('metadata component');
                            if (!metadataElement) return;
                            
                            const interactionsElement = metadataElement.querySelector('interactions');
                            if (!interactionsElement) return;
                            
                            const bindingElements = interactionsElement.querySelectorAll('binding');
                            if (!bindingElements || bindingElements.length === 0) return;
                            
                            // Dodaj obsługę zdarzeń dla każdej interakcji
                            Array.from(bindingElements).forEach(binding => {
                                const targetId = binding.getAttribute('targetId');
                                const event = binding.getAttribute('event');
                                const action = binding.getAttribute('action');
                                const parameter = binding.getAttribute('parameter');
                                
                                if (!targetId || !event || !action) return;
                                
                                // Dodaj listener zdarzeń
                                component.addEventListener('click', function(e) {
                                    const targetElement = document.querySelector('[data-id="' + targetId + '"]');
                                    if (!targetElement) return;
                                    
                                    // Wywołaj akcję na elemencie docelowym
                                    if (action === 'start') {
                                        // Symulacja startu (np. dla silnika)
                                        const speedParam = targetElement.querySelector('metadata component parameters speed');
                                        if (speedParam) {
                                            speedParam.textContent = parameter || '100';
                                        }
                                        const isOnParam = targetElement.querySelector('metadata component parameters isOn');
                                        if (isOnParam) {
                                            isOnParam.textContent = 'true';
                                        }
                                    } else if (action === 'stop') {
                                        // Symulacja zatrzymania
                                        const isOnParam = targetElement.querySelector('metadata component parameters isOn');
                                        if (isOnParam) {
                                            isOnParam.textContent = 'false';
                                        }
                                    } else if (action === 'toggle') {
                                        // Przełączanie stanu
                                        const isOnParam = targetElement.querySelector('metadata component parameters isOn');
                                        if (isOnParam) {
                                            const currentState = isOnParam.textContent === 'true';
                                            isOnParam.textContent = (!currentState).toString();
                                        }
                                    }
                                    
                                    // Wywołaj skrypt animacji komponentu docelowego, jeśli istnieje
                                    const scriptElements = targetElement.querySelectorAll('script');
                                    scriptElements.forEach(script => {
                                        if (script.textContent && script.textContent.includes('function update')) {
                                            // Próba wywołania funkcji update
                                            try {
                                                const updateFn = new Function('element', script.textContent + '; update(element);');
                                                updateFn(targetElement);
                                            } catch (e) {
                                                console.error('Błąd wywołania skryptu animacji:', e);
                                            }
                                        }
                                    });
                                });
                            });
                        });
                    }
                    
                    // Uruchom obsługę interakcji
                    setupInteractions();
                    
                    // Uruchom skrypty animacji dla wszystkich komponentów
                    const components = document.querySelectorAll('[data-id]');
                    components.forEach(component => {
                        const scriptElements = component.querySelectorAll('script');
                        scriptElements.forEach(script => {
                            if (script.textContent && script.textContent.includes('function update')) {
                                try {
                                    const setupFn = new Function('element', script.textContent + '; if(typeof setup === "function") setup(element);');
                                    setupFn(component);
                                } catch (e) {
                                    console.error('Błąd uruchomienia skryptu animacji:', e);
                                }
                            }
                        });
                    });
                });
            `;
            
            scriptElement.textContent = scriptContent;
            exportCanvas.appendChild(scriptElement);
            
            // Eksportuj SVG z dołączonymi skryptami
            const svgData = new XMLSerializer().serializeToString(exportCanvas);
            const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement("a");
            a.href = url;
            a.download = `digital-twin-${new Date().toISOString().slice(0,10)}.svg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log("SVG wyeksportowany z obsługą interakcji i animacji");
        } catch (error) {
            console.error("Błąd eksportu SVG:", error);
            alert("Błąd podczas eksportu SVG: " + error.message);
        }
    }
}

// Globalne funkcje dla wywołań z HTML
window.exportProject = function() {
    if (window.exportManager) {
        window.exportManager.exportProject();
    }
};

window.importProject = function() {
    if (window.exportManager) {
        window.exportManager.importProject();
    }
};

window.exportAsPNG = function() {
    if (window.exportManager) {
        window.exportManager.exportAsPNG();
    }
};

window.exportAsSVG = function() {
    if (window.exportManager) {
        window.exportManager.exportAsSVG();
    }
};
