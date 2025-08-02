// Digital Twin IDE - Components Module

// Lista komponentów – ścieżka, nazwa, opcjonalnie ikona (jeśli inna)
export const COMPONENTS = [
    { svg: "components/motor.svg", name: "Silnik", id: "motor" },
    { svg: "components/led.svg", name: "Diody LED", id: "led" },
    { svg: "components/switch.svg", name: "Przełącznik", id: "switch" },
    { svg: "components/relay.svg", name: "Przekaźnik", id: "relay" },
    { svg: "components/button.svg", name: "Przycisk", id: "button" },
    { svg: "components/knob.svg", name: "Pokrętło", id: "knob" },
    { svg: "components/slider.svg", name: "Suwak", id: "slider" },
    { svg: "components/gauge.svg", name: "Miernik", id: "gauge" },
    { svg: "components/counter.svg", name: "Licznik", id: "counter" },
    { svg: "components/toggle.svg", name: "Przycisk suwakowy", id: "toggle" },
    { svg: "components/sensor.svg", name: "Czujnik temperatury", id: "temp-sensor" },
    { svg: "components/display.svg", name: "Wyświetlacz", id: "display" },
];

export class ComponentManager {
    constructor() {
        this.components = new Map();
        this.componentCounter = 0;
        this.selectedComponent = null;
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
    addComponent(id, componentData) {
        this.components.set(id, componentData);
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
