// Digital Twin IDE - Components Module

// Lista komponentów – ścieżka, nazwa, opcjonalnie ikona (jeśli inna)
export const COMPONENTS = [
    { 
        svg: "components/motor.svg", 
        name: "Silnik", 
        id: "motor",
        defaultEvents: {
            click: [
                {
                    type: 'http-request',
                    params: {
                        method: 'POST',
                        url: 'http://localhost:3000/api/motor/toggle',
                        body: { action: 'toggle' }
                    }
                }
            ]
        }
    },
    { 
        svg: "components/led.svg", 
        name: "Diody LED", 
        id: "led",
        defaultState: { on: false, color: '#00ff00' }
    },
    { 
        svg: "components/switch.svg", 
        name: "Przełącznik", 
        id: "switch",
        defaultState: { on: false }
    },
    { 
        svg: "components/relay.svg", 
        name: "Przekaźnik", 
        id: "relay",
        defaultState: { active: false }
    },
    { 
        svg: "components/button.svg", 
        name: "Przycisk", 
        id: "button",
        defaultEvents: {
            click: [
                {
                    type: 'http-request',
                    params: {
                        method: 'POST',
                        url: 'http://localhost:3000/api/button/press',
                        body: { pressed: true }
                    }
                }
            ]
        }
    },
    { 
        svg: "components/knob.svg", 
        name: "Pokrętło", 
        id: "knob",
        defaultState: { value: 0, min: 0, max: 100 }
    },
    { 
        svg: "components/slider.svg", 
        name: "Suwak", 
        id: "slider",
        defaultState: { value: 50, min: 0, max: 100 }
    },
    { 
        svg: "components/gauge.svg", 
        name: "Miernik", 
        id: "gauge",
        defaultState: { value: 0, min: 0, max: 100, unit: '°C' }
    },
    { 
        svg: "components/counter.svg", 
        name: "Licznik", 
        id: "counter",
        defaultState: { value: 0 }
    },
    { 
        svg: "components/toggle.svg", 
        name: "Przełącznik suwakowy", 
        id: "toggle",
        defaultState: { on: false }
    },
    { 
        svg: "components/sensor.svg", 
        name: "Czujnik temperatury", 
        id: "temp-sensor",
        defaultState: { value: 22.5, unit: '°C' }
    },
    { 
        svg: "components/display.svg", 
        name: "Wyświetlacz", 
        id: "display",
        defaultState: { text: 'Ready', value: 0 }
    },
];

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

        componentLibrary.innerHTML = "";

        for (const comp of COMPONENTS) {
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

            return { parameters: {} };
        } catch (e) {
            console.warn('Error parsing metadata:', e);
            return { parameters: {} };
        }
    }

    // Helper function to convert XML metadata to JSON format
    convertXMLToJSON(componentElement) {
        const metadata = {
            id: componentElement.getAttribute('id'),
            name: componentElement.getAttribute('name'),
            type: componentElement.getAttribute('type'),
            parameters: {}
        };

        const parametersElement = componentElement.querySelector('parameters');
        if (parametersElement) {
            for (const child of parametersElement.children) {
                const value = child.textContent.trim();
                // Convert string values to appropriate types
                if (value === 'true') {
                    metadata.parameters[child.tagName] = true;
                } else if (value === 'false') {
                    metadata.parameters[child.tagName] = false;
                } else if (!isNaN(value) && value !== '') {
                    metadata.parameters[child.tagName] = Number(value);
                } else {
                    metadata.parameters[child.tagName] = value;
                }
            }
        }

        return metadata;
    }

    // Helper function to update XML metadata in SVG element
    updateXMLMetadata(svgElement, metadata) {
        // Store in data-metadata attribute for consistency
        svgElement.setAttribute('data-metadata', JSON.stringify(metadata));

        // Also update XML metadata element if it exists
        const metadataElement = svgElement.querySelector('metadata > component');
        if (metadataElement && metadata.parameters) {
            const parametersElement = metadataElement.querySelector('parameters');
            if (parametersElement) {
                for (const [key, value] of Object.entries(metadata.parameters)) {
                    const paramElement = parametersElement.querySelector(key);
                    if (paramElement) {
                        paramElement.textContent = value;
                    }
                }
            }
        }
    }

    // Pobierz komponent z mapy
    getComponent(id) {
        return this.components.get(id);
    }

    // Usuń komponent z mapy
    removeComponentFromMap(id) {
        return this.components.delete(id);
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
