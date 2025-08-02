// Lista komponentów – ścieżka, nazwa, opcjonalnie ikona (jeśli inna)
const COMPONENTS = [
    { svg: "components/sensor.svg", name: "Czujnik", id: "sensor" },
    { svg: "components/motor.svg", name: "Silnik", id: "motor" },
    { svg: "components/led.svg", name: "Diody LED", id: "led" },
    { svg: "components/switch.svg", name: "Przełącznik", id: "switch" },
    { svg: "components/relay.svg", name: "Przekaźnik", id: "relay" },
    { svg: "components/button.svg", name: "Przycisk", id: "button" },
    { svg: "components/sensor.svg", name: "Czujnik temperatury", id: "temp-sensor" },
    { svg: "components/display.svg", name: "Wyświetlacz", id: "display" },
];

// Mapa przechowująca instancje komponentów
const components = new Map();
let componentCounter = 0;
let isConnectionMode = false;
let connectionStart = null;
let selectedComponent = null;
let simulationInterval = null;

// Pobierz kontener SVG
const svgCanvas = document.getElementById('svg-canvas');
const workspace = document.getElementById('workspace');

// Inicjalizacja rozmiarów SVG
function updateSvgSize() {
    const rect = workspace.getBoundingClientRect();
    svgCanvas.setAttribute('width', rect.width);
    svgCanvas.setAttribute('height', rect.height);
    svgCanvas.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);
}

// Aktualizuj rozmiar przy zmianie okna
window.addEventListener('resize', updateSvgSize);
updateSvgSize();

function formatLabel(key) {
    return key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, s => s.toUpperCase())
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');
}
