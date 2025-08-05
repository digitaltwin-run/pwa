// Digital Twin IDE - Components Module

// Import components from JSON file
let COMPONENTS = [];

// Function to load components asynchronously
export async function loadComponents() {
    try {
        const response = await fetch('/components.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        COMPONENTS = data.components || [];
        console.log('Components loaded successfully:', COMPONENTS.length);
        return COMPONENTS;
    } catch (error) {
        console.error('Error loading components:', error);
        // Fallback to empty array if loading fails
        COMPONENTS = [];
        return [];
    }
}

// Export COMPONENTS as a getter to ensure it's always up to date
export function getComponents() {
    return COMPONENTS;
}

export class ComponentManager {
    constructor() {
        this.components = new Map();
        this.componentCounter = 0;
        this.selectedComponent = null;
        this.actionManager = null;
        this.stateListeners = new Map();
    }

    // Set the action manager instance
    setActionManager(actionManager) {
        this.actionManager = actionManager;
    }

    // Get component by ID
    getComponent(id) {
        return this.components.get(id);
    }

    // Wyzwól aktualizację komponentu
    triggerComponentUpdate(componentId) {
        const component = this.components.get(componentId);
        if (component && component.element) {
            // Wywołaj zdarzenie aktualizacji komponentu
            const event = new CustomEvent('component-updated', {
                detail: {
                    componentId: componentId,
                    element: component.element,
                    componentData: component
                }
            });
            document.dispatchEvent(event);
            
            // Wywołaj funkcję onUpdate, jeśli jest zdefiniowana
            if (typeof component.onUpdate === 'function') {
                component.onUpdate();
            }
        }
    }

    // Update component state and notify listeners
    updateComponentState(componentId, newState) {
        const component = this.components.get(componentId);
        if (!component) return;

        const oldState = { ...component.state };
        component.state = { ...component.state, ...newState };
        this.components.set(componentId, component);

        // Notify state change listeners
        this.notifyStateChange(componentId, component.state, oldState);

        // Update the component's visual representation
        this.updateComponentVisuals(componentId);
    }

    // Add a state change listener
    addStateListener(componentId, callback) {
        if (!this.stateListeners.has(componentId)) {
            this.stateListeners.set(componentId, new Set());
        }
        this.stateListeners.get(componentId).add(callback);
        return () => this.removeStateListener(componentId, callback);
    }

    // Remove a state change listener
    removeStateListener(componentId, callback) {
        const listeners = this.stateListeners.get(componentId);
        if (listeners) {
            listeners.delete(callback);
        }
    }

    // Notify all listeners of a state change
    notifyStateChange(componentId, newState, oldState) {
        const listeners = this.stateListeners.get(componentId);
        if (listeners) {
            listeners.forEach(callback => callback(newState, oldState));
        }
    }

    // Update component's visual representation based on state
    updateComponentVisuals(componentId) {
        const component = this.components.get(componentId);
        if (!component || !component.element) return;

        const svgElement = component.element.querySelector('svg') || component.element;
        if (!svgElement) return;

        // Apply state-based styles or transformations
        if (component.state) {
            // Example: Toggle active state
            if ('active' in component.state || 'on' in component.state) {
                const isActive = component.state.active || component.state.on;
                svgElement.classList.toggle('active', isActive);
            }

            // Example: Update text content for display components
            if (component.type === 'display' && component.state.text !== undefined) {
                const textElement = svgElement.querySelector('text, .display-text');
                if (textElement) {
                    textElement.textContent = component.state.text;
                }
            }
        }
    }

    // Załaduj komponenty do biblioteki z ikonami
    async loadComponentLibrary() {
        const componentLibrary = document.getElementById("component-library");
        if (!componentLibrary) {
            console.error("Element component-library nie został znaleziony");
            return;
        }

        componentLibrary.innerHTML = "<div class='loading'>Ładowanie komponentów...</div>";
        
        // Load components if not already loaded
        if (COMPONENTS.length === 0) {
            await loadComponents();
        }
        
        const components = getComponents();
        
        for (const comp of components) {
            try {
                const response = await fetch(comp.svg);
                if (!response.ok) {
                    console.warn(`Nie można załadować ${comp.svg}:`, response.status);
                    continue;
                }

                const svgText = await response.text();
                if (!svgText.trim()) {
                    console.warn(`Pusty plik SVG: ${comp.svg}`);
                    continue;
                }

                const parser = new DOMParser();
                const svgDoc = parser.parseFromString(svgText, "image/svg+xml");
                const parserError = svgDoc.querySelector("parsererror");

                if (parserError) {
                    console.warn(`Błąd parsowania SVG dla ${comp.svg}:`, parserError.textContent);
                    continue;
                }

                const svgElement = svgDoc.documentElement;
                if (!svgElement || svgElement.nodeName !== 'svg') {
                    console.warn(`Nieprawidłowy element SVG w ${comp.svg}`);
                    continue;
                }

                // Klon SVG dla ikony
                const iconSvg = svgElement.cloneNode(true);
                iconSvg.setAttribute('width', '36');
                iconSvg.setAttribute('height', '36');

                const button = document.createElement("button");
                button.className = "component-button";
                button.draggable = true;
                button.dataset.svg = comp.svg;
                button.dataset.componentId = comp.id;

                const span = document.createElement("span");
                span.textContent = comp.name;

                button.appendChild(iconSvg);
                button.appendChild(span);
                componentLibrary.appendChild(button);

            } catch (error) {
                console.error(`Błąd ładowania komponentu ${comp.svg}:`, error);
            }
        }
        
        // Emit components-loaded event to notify other managers
        const componentsLoadedEvent = new CustomEvent('components-loaded', {
            detail: {
                componentsCount: components.length,
                timestamp: new Date().toISOString()
            }
        });
        document.dispatchEvent(componentsLoadedEvent);
        console.log(`📋 Emitted components-loaded event: ${components.length} components`);
    }

    // Generuj nowe ID komponentu
    generateComponentId() {
        return `comp-${this.componentCounter++}`;
    }

    // Dodaj komponent do mapy
    storeComponent(id, element, svgUrl) {
        // Parse metadata from XML format
        const metadata = this.parseXMLMetadata(element);

        this.components.set(id, {
            id,
            element,
            svgUrl,
            metadata,
            properties: {}
        });
    }

    // Helper function to parse XML metadata from SVG element
    parseXMLMetadata(svgElement) {
        try {
            // First try data-metadata attribute (new format)
            const metadataAttr = svgElement.getAttribute('data-metadata');
            if (metadataAttr) {
                return JSON.parse(metadataAttr);
            }

            // Parse XML metadata element
            const metadataElement = svgElement.querySelector('metadata > component');
            if (metadataElement) {
                return this.convertXMLToJSON(metadataElement);
            }

            return { 
                parameters: {},
                colors: {}
            };
        } catch (e) {
            console.warn('Error parsing XML metadata:', e);
            return { 
                parameters: {},
                colors: {}
            };
        }
    }
    
    // Convert XML metadata to JSON format
    convertXMLToJSON(componentElement) {
        const metadata = {
            id: componentElement.getAttribute('id') || '',
            name: componentElement.getAttribute('name') || '',
            type: componentElement.getAttribute('type') || 'unknown',
            parameters: {},
            colors: {}
        };

        // Parse parameters
        const parametersElement = componentElement.querySelector('parameters');
        if (parametersElement) {
            for (const paramElement of parametersElement.children) {
                metadata.parameters[paramElement.tagName] = this.convertValue(paramElement.textContent.trim());
            }
        }

        // Parse colors
        const colorsElement = componentElement.querySelector('colors');
        if (colorsElement) {
            const colorElements = colorsElement.querySelectorAll('color');
            colorElements.forEach(colorElement => {
                const selector = colorElement.getAttribute('selector');
                if (!selector) return;

                if (!metadata.colors[selector]) {
                    metadata.colors[selector] = {};
                }

                // Get all attributes (fill, stroke, etc.)
                for (const attr of colorElement.attributes) {
                    if (attr.name !== 'selector') {
                        metadata.colors[selector][attr.name] = attr.value;
                    }
                }
            });
        }

        return metadata;
    }
    
    // Helper function to convert string values to appropriate types
    convertValue(value) {
        if (value === 'true') return true;
        if (value === 'false') return false;
        if (!isNaN(value) && value !== '') return Number(value);
        return value;
    }

    // Helper function to update XML metadata in SVG element
    updateXMLMetadata(svgElement, metadata) {
        // Store in data-metadata attribute for consistency
        svgElement.setAttribute('data-metadata', JSON.stringify(metadata));

        // Also update XML metadata element if it exists
        const metadataElement = svgElement.querySelector('metadata > component');
        if (!metadataElement) return;

        // Update parameters
        if (metadata.parameters) {
            let parametersElement = metadataElement.querySelector('parameters');
            if (!parametersElement) {
                parametersElement = document.createElementNS(null, 'parameters');
                metadataElement.appendChild(parametersElement);
            }

            for (const [key, value] of Object.entries(metadata.parameters)) {
                let paramElement = parametersElement.querySelector(key);
                if (!paramElement) {
                    paramElement = document.createElementNS(null, key);
                    parametersElement.appendChild(paramElement);
                }
                paramElement.textContent = value;
            }
        }

        // Update colors
        if (metadata.colors) {
            let colorsElement = metadataElement.querySelector('colors');
            if (!colorsElement) {
                colorsElement = document.createElementNS(null, 'colors');
                metadataElement.appendChild(colorsElement);
            }

            // Clear existing color elements
            while (colorsElement.firstChild) {
                colorsElement.removeChild(colorsElement.firstChild);
            }

            // Add updated color elements
            for (const [selector, colors] of Object.entries(metadata.colors)) {
                const colorElement = document.createElementNS(null, 'color');
                colorElement.setAttribute('selector', selector);
                
                for (const [type, value] of Object.entries(colors)) {
                    colorElement.setAttribute(type, value);
                }
                
                colorsElement.appendChild(colorElement);
            }
        }
    }

    // Pobierz wszystkie komponenty
    getAllComponents() {
        return Array.from(this.components.values());
    }

    // Ustaw wybrany komponent
    setSelectedComponent(component) {
        this.selectedComponent = component;
    }

    // Pobierz wybrany komponent
    getSelectedComponent() {
        return this.selectedComponent;
    }

    // Formatuj etykietę parametru
    formatLabel(key) {
        return key
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, s => s.toUpperCase())
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');
    }
}
