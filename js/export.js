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

    // Eksportuj jako SVG z zachowaniem skryptów i interakcji
    exportAsSVG() {
        try {
            // Stwórz kopię canvas do eksportu z głębokim klonowaniem
            const exportCanvas = this.svgCanvas.cloneNode(true);

            // Upewnij się, że wszystkie komponenty mają prawidłowe metadane i atrybuty
            this.preserveComponentMetadata(exportCanvas);

            // Usuń zaznaczenia i resize handles z eksportowanego SVG
            this.removeSelectionArtifacts(exportCanvas);

            // Dodaj niezbędne skrypty do obsługi interakcji
            const scriptElement = document.createElementNS("http://www.w3.org/2000/svg", "script");
            scriptElement.setAttribute("type", "text/javascript");

            // Kod JavaScript do obsługi interakcji w samodzielnym SVG - with safety checks and proper escaping
            const scriptContent = '// Inicjalizacja obsługi interakcji po załadowaniu SVG\n' +
                'document.addEventListener(\'DOMContentLoaded\', function() {\n' +
                '// Funkcja do obsługi interakcji między komponentami\n' +
                'function setupInteractions() {\n' +
                '    // Znajdź wszystkie komponenty z interakcjami\n' +
                '    const components = document.querySelectorAll(\'[data-id]\');\n' +
                '    components.forEach(component => {\n' +
                '        const metadataElement = component.querySelector(\'metadata component\');\n' +
                '        if (!metadataElement) return;\n' +
                '        \n' +
                '        // Parse interactions if present\n' +
                '        const interactionsElement = metadataElement.querySelector(\'interactions\');\n' +
                '        if (!interactionsElement) return;\n' +
            '        \n' +
            '        const bindingElements = interactionsElement.querySelectorAll(\'binding\');\n' +
            '        if (!bindingElements || bindingElements.length === 0) return;\n' +
            '        \n' +
            '        // Dodaj obsługę zdarzeń dla każdej interakcji\n' +
            '        Array.from(bindingElements).forEach(binding => {\n' +
            '            const targetId = binding.getAttribute(\'targetId\');\n' +
            '            const event = binding.getAttribute(\'event\');\n' +
            '            const action = binding.getAttribute(\'action\');\n' +
            '            const parameter = binding.getAttribute(\'parameter\');\n' +
            '            \n' +
            '            if (!targetId || !event || !action) return;\n' +
            '            \n' +
            '            // Dodaj listener zdarzeń\n' +
            '            component.addEventListener(\'click\', function(e) {\n' +
            '                const targetElement = document.querySelector(\'[data-id="\' + targetId + \'"]\');\n' +
            '                if (!targetElement) return;\n' +
            '                \n' +
            '                // Wywołaj akcję na elemencie docelowym\n' +
            '                if (action === \'start\') {\n' +
            '                    // Symulacja startu (np. dla silnika)\n' +
            '                    const speedParam = targetElement.querySelector(\'metadata component parameters speed\');\n' +
            '                    if (speedParam) {\n' +
            '                        speedParam.textContent = parameter || \'100\';\n' +
            '                    }\n' +
            '                    const isOnParam = targetElement.querySelector(\'metadata component parameters isOn\');\n' +
            '                    if (isOnParam) {\n' +
            '                        isOnParam.textContent = \'true\';\n' +
            '                    }\n' +
            '                } else if (action === \'stop\') {\n' +
            '                    // Symulacja zatrzymania\n' +
            '                    const isOnParam = targetElement.querySelector(\'metadata component parameters isOn\');\n' +
            '                    if (isOnParam) {\n' +
            '                        isOnParam.textContent = \'false\';\n' +
            '                    }\n' +
            '                } else if (action === \'toggle\') {\n' +
            '                    // Przełączanie stanu\n' +
            '                    const isOnParam = targetElement.querySelector(\'metadata component parameters isOn\');\n' +
            '                    if (isOnParam) {\n' +
            '                        const currentState = isOnParam.textContent === \'true\';\n' +
            '                        isOnParam.textContent = (!currentState).toString();\n' +
            '                    }\n' +
            '                }\n' +
            '                \n' +
            '                // Wywołaj skrypt animacji komponentu docelowego, jeśli istnieje\n' +
            '                const scriptElements = targetElement.querySelectorAll(\'script\');\n' +
            '                scriptElements.forEach(script => {\n' +
            '                    if (script.textContent && script.textContent.includes(\'function update\')) {\n' +
            '                        // Próba wywołania funkcji update - with safety measures\n' +
            '                        try {\n' +
            '                            // Safely extract and execute the script content\n' +
            '                            const safeScriptContent = script.textContent\n' +
            '                                .replace(/\\/\\/g, \'\\\\\\\\/\') // Escape forward slashes\n' +
            '                                .replace(/\\$/g, \'\\\\$\'); // Escape dollar signs\n' +
            '                            \n' +
            '                            // Create a safe wrapper around the execution\n' +
            '                            const updateFn = new Function(\'element\', \n' +
            '                                \'try { \' + safeScriptContent + \'; } catch(e) { console.warn("Script error:", e); }\' +\n' +
            '                                \'try { if(typeof update === "function") { update(element); } } catch(e) { console.warn("Update error:", e); }\'\n' +
            '                            );\n' +
            '                            \n' +
            '                            updateFn(targetElement);\n' +
            '                        } catch (e) {\n' +
            '                            console.error(\'Błąd wywołania skryptu animacji:\', e);\n' +
            '                        }\n' +
            '                    }\n' +
            '                });\n' +
            '            });\n' +
            '        });\n' +
            '    }\n' +
            '    \n' +
            '    // Uruchom obsługę interakcji\n' +
            '    setupInteractions();\n' +
            '    \n' +
            '    // Uruchom skrypty animacji dla wszystkich komponentów\n' +
            '    const components = document.querySelectorAll(\'[data-id]\');\n' +
            '    components.forEach(component => {\n' +
            '        const scriptElements = component.querySelectorAll(\'script\');\n' +
            '        scriptElements.forEach(script => {\n' +
            '            if (script.textContent) {\n' +
            '                try {\n' +
            '                    // Clean and sanitize script content to prevent syntax errors\n' +
            '                    let scriptContent = script.textContent;\n' +
            '                    \n' +
            '                    // Remove CDATA markers that can cause syntax errors\n' +
            '                    scriptContent = scriptContent.replace(/<!\\[CDATA\\[/g, \'\');\n' +
            '                    scriptContent = scriptContent.replace(/\\]\\]>/g, \'\');\n' +
            '                    \n' +
            '                    // Remove any XML artifacts\n' +
            '                    scriptContent = scriptContent.replace(/<\\?xml[^>]*>/g, \'\');\n' +
            '                    \n' +
            '                    // Trim whitespace\n' +
            '                    scriptContent = scriptContent.trim();\n' +
            '                    \n' +
            '                    // Skip empty scripts\n' +
            '                    if (!scriptContent) {\n' +
            '                        console.warn(\'Warning: Skipping empty script content\');\n' +
            '                        return;\n' +
            '                    }\n' +
            '                    \n' +
            '                    // Execute the script in component context\n' +
            '                    // Ensure no regex or syntax errors by properly escaping content\n' +
            '                    const safeScriptContent = scriptContent\n' +
            '                        .replace(/\\/g, \'\\\\/\') // Escape forward slashes for regex\n' +
            '                        .replace(/$/g, \'\\\\$\') // Escape dollar signs\n' +
            '                        .replace(/`/g, \'\\\\`\');  // Escape backticks\n' +
            '                    \n' +
            '                    // Create a safe wrapper around script execution\n' +
            '                    const scriptFn = new Function(\'component\', \n' +
            '                        \'// Bind this component context\\n\' +\n' +
            '                        \'const svgElement = component;\\n\' +\n' +
            '                        \'\\n\' +\n' +
            '                        \'// Execute the original script with safety measures\\n\' +\n' +
            '                        \'try {\\n\' +\n' +
            '                        \'  \' + safeScriptContent +\n' +
            '                        \'\\n} catch(e) { console.warn("Script execution error:", e); }\\n\' +\n' +
            '                        \'// Try to call any update functions if they exist\\n\' +\n' +
            '                        \'try { if(typeof updateMotor === "function") { updateMotor(svgElement); } } catch(e) {}\\n\' +\n' +
            '                        \'try { if(typeof updateLED === "function") { updateLED(svgElement); } } catch(e) {}\\n\' +\n' +
            '                        \'try { if(typeof update === "function") { update(svgElement); } } catch(e) {}\\n\' +\n' +
            '                        \'try { if(typeof initPump === "function") { initPump(svgElement); } } catch(e) {}\\n\' +\n' +
            '                        \'try { if(typeof initValve === "function") { initValve(svgElement); } } catch(e) {}\'\n' +
            '                    );\n' +
            '                    \n' +
            '                    scriptFn(component);\n' +
            '                    \n' +
            '                    console.log(\'Successfully initialized animation script for component:\', component.getAttribute(\'data-id\'));\n' +
            '                } catch (e) {\n' +
            '                    console.error(\'Error initializing animation script:\', e);\n' +
            '                }\n' +
            '            }\n' +
            '        });\n' +
            '    });\n' +
            '    \n' +
            '    // Add safety check for MutationObservers\n' +
            '    function safelyAddObserver(targetElement, config, callback) {\n' +
            '        if (!targetElement) {\n' +
            '            console.warn(\'Cannot add MutationObserver: Target element not found\');\n' +
            '            return null;\n' +
            '        }\n' +
            '        \n' +
            '        try {\n' +
            '            const observer = new MutationObserver(callback);\n' +
            '            observer.observe(targetElement, config);\n' +
            '            return observer;\n' +
            '        } catch (e) {\n' +
            '            console.error(\'Error setting up MutationObserver:\', e);\n' +
            '            return null;\n' +
            '        }\n' +
            '    }\n' +
            '    \n' +
            '    // Example of safely adding an observer\n' +
            '});\n' +
            // Set script content and append the script element to the SVG
            scriptElement.textContent = scriptContent;
            exportCanvas.appendChild(scriptElement);
        } catch (error) {
            console.error('Error in export process:', error);
        }
    }

    /**
     * Remove selection artifacts from exported SVG (highlights, resize handles, etc.)
     * @param {SVGElement} exportCanvas - The cloned canvas for export
     */
    removeSelectionArtifacts(exportCanvas) {

                // Remove CDATA markers that can cause syntax errors
                scriptContent = scriptContent.replace(/<!\\[CDATA\\[/g, '');
                                    scriptContent = scriptContent.replace(/\\]\\]>/g, '');

                // Remove any XML artifacts
                scriptContent = scriptContent.replace(/<\\?xml[^>]*>/g, '');

                // Trim whitespace
                scriptContent = scriptContent.trim();

                // Skip empty scripts
                if (!scriptContent) {
                    console.warn('Warning: Skipping empty script content');
                    return;
                }

                // Execute the script in component context
                // Ensure no regex or syntax errors by properly escaping content
                const safeScriptContent = scriptContent
                    .replace(/\//g, '\\/') // Escape forward slashes for regex
                    .replace(/\$/g, '\\$') // Escape dollar signs
                    .replace(/`/g, '\\`');  // Escape backticks

                // Create a safe wrapper around script execution
                const scriptFn = new Function('component',
                    '// Bind this component context\\n' +
                    'const svgElement = component;\\n' +
                    '\\n' +
                    '// Execute the original script with safety measures\\n' +
                    'try {\\n' +
                    '  ' + safeScriptContent +
                    '\\n} catch(e) { console.warn("Script execution error:", e); }\\n' +
                    '// Try to call any update functions if they exist\\n' +
                    'try { if(typeof updateMotor === "function") { updateMotor(svgElement); } } catch(e) {}\\n' +
                    'try { if(typeof updateLED === "function") { updateLED(svgElement); } } catch(e) {}\\n' +
                    'try { if(typeof update === "function") { update(svgElement); } } catch(e) {}\\n' +
                    'try { if(typeof initPump === "function") { initPump(svgElement); } } catch(e) {}\\n' +
                    'try { if(typeof initValve === "function") { initValve(svgElement); } } catch(e) {}'
                );

                scriptFn(component);

                console.log('Successfully initialized animation script for component:', component.getAttribute('data-id'));
            } catch (e) {
                console.error('Error initializing animation script:', e);
            }
        }
    });
});

// Add safety check for MutationObservers
function safelyAddObserver(targetElement, config, callback) {
    if (!targetElement) {
        console.warn('Cannot add MutationObserver: Target element not found');
        return null;
    }

    try {
        const observer = new MutationObserver(callback);
        observer.observe(targetElement, config);
        return observer;
    } catch (e) {
        console.error('Error setting up MutationObserver:', e);
        return null;
    }
}

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

        // Update component visuals based on metadata
        try {
            const metadata = JSON.parse(metadataStr);

            // Update component label if it exists in metadata
            if (metadata.parameters && metadata.parameters.label) {
                const labelElements = component.querySelectorAll('.motor-label, .led-label, text[class*="label"]');
                labelElements.forEach(labelEl => {
                    labelEl.textContent = metadata.parameters.label;
                });

                // Also update metadata component label in SVG
                const metadataLabelEl = component.querySelector('metadata component parameters label');
                if (metadataLabelEl) {
                    metadataLabelEl.textContent = metadata.parameters.label;
                }
            }

            console.log('Preserved metadata for component ' + componentId + ': ' + (metadata.parameters?.label || 'unnamed'));
        } catch (e) {
            console.warn('Warning: Could not parse metadata for component ' + componentId + ':', e);
        }
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
} catch
(error)
{
    console.error("Error preserving component metadata:", error);
}
}

/**
 * Remove selection artifacts from exported SVG (highlights, resize handles, etc.)
 * @param {SVGElement} exportCanvas - The cloned canvas for export
 */
removeSelectionArtifacts(exportCanvas)
{
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
