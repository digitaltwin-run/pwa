// Digital Twin IDE - Main Application Module

import { ComponentManager } from './components.js';
import { DragDropManager } from './dragdrop.js';
import { PropertiesManager } from './properties.js';
import { ExportManager } from './export.js';
import { SimulationManager } from './simulation.js';
import { ConnectionManager } from './connections.js';

class DigitalTwinApp {
    constructor() {
        this.componentManager = null;
        this.dragDropManager = null;
        this.propertiesManager = null;
        this.exportManager = null;
        this.simulationManager = null;
        this.connectionManager = null;
    }

    async init() {
        // Pobierz główne elementy DOM
        const svgCanvas = document.getElementById('svg-canvas');
        const workspace = document.getElementById('workspace');
        
        if (!svgCanvas || !workspace) {
            console.error('Nie znaleziono wymaganych elementów DOM');
            return;
        }

        try {
            // Inicjalizuj managery
            this.componentManager = new ComponentManager();
            this.dragDropManager = new DragDropManager(this.componentManager, svgCanvas, workspace);
            this.propertiesManager = new PropertiesManager(this.componentManager);
            this.exportManager = new ExportManager(this.componentManager, svgCanvas);
            this.simulationManager = new SimulationManager(this.componentManager);
            this.connectionManager = new ConnectionManager(this.componentManager, svgCanvas);

            // Udostępnij managery globalnie dla wywołań z HTML
            window.componentManager = this.componentManager;
            window.propertiesManager = this.propertiesManager;
            window.exportManager = this.exportManager;
            window.simulationManager = this.simulationManager;
            window.connectionManager = this.connectionManager;

            // Załaduj bibliotekę komponentów
            await this.componentManager.loadComponentLibrary();

            // Dodaj obsługę interakcji dla komponentów
            this.setupComponentInteractions();
        
            // Skonfiguruj event listenery
            this.setupEventListeners();

            console.log('Digital Twin IDE zainicjowane pomyślnie');

        } catch (error) {
            console.error('Błąd podczas inicjalizacji aplikacji:', error);
        }
    }

    // Obsługa interakcji dla komponentów SVG
    setupComponentInteractions() {
        // Ta funkcja będzie obsługiwać interakcje z komponentami
        // Event listenery dla kliknięć są już skonfigurowane w setupEventListeners()
        console.log('Interakcje komponentów skonfigurowane');
    }

    setupEventListeners() {
        // Toolbar buttons
        document.getElementById('export-btn').addEventListener('click', () => {
            this.exportManager.exportProject();
        });
        
        document.getElementById('import-btn').addEventListener('click', () => {
            this.exportManager.importProject();
        });
        
        document.getElementById('export-png-btn').addEventListener('click', () => {
            this.exportManager.exportAsPNG();
        });
        
        document.getElementById('export-svg-btn').addEventListener('click', () => {
            this.exportManager.exportAsSVG();
        });
        
        document.getElementById('connection-mode-btn').addEventListener('click', () => {
            this.connectionManager.toggleConnectionMode();
        });
        
        // Simulation panel buttons
        document.getElementById('start-sim-btn').addEventListener('click', () => {
            this.simulationManager.startSimulation();
        });
        
        document.getElementById('stop-sim-btn').addEventListener('click', () => {
            this.simulationManager.stopSimulation();
        });

        // Kliknięcie w komponent na canvas
        document.getElementById('svg-canvas').addEventListener('click', (e) => {
            const component = e.target.closest('.draggable-component');
            
            if (component) {
                // Tryb łączenia vs normalny wybór
                if (this.connectionManager.isConnectionMode) {
                    this.connectionManager.startConnection(component);
                } else {
                    this.propertiesManager.selectComponent(component);
                }
            } else {
                // Kliknięcie w puste miejsce - odznacz komponent
                if (!this.connectionManager.isConnectionMode) {
                    this.propertiesManager.selectComponent(null);
                }
            }
        });

        // Obsługa zmiany rozmiaru okna
        window.addEventListener('resize', () => {
            this.dragDropManager.updateSvgSize();
        });

        // Obsługa klawiatury
        document.addEventListener('keydown', (e) => {
            // Delete - usuń wybrany komponent
            if (e.key === 'Delete' && this.componentManager.getSelectedComponent()) {
                const selectedId = this.componentManager.getSelectedComponent().getAttribute('data-id');
                this.propertiesManager.removeComponent(selectedId);
            }
            
            // Escape - wyjdź z trybu łączenia
            if (e.key === 'Escape' && this.connectionManager.isConnectionMode) {
                this.connectionManager.toggleConnectionMode();
            }
        });
    }
}

// Inicjalizuj aplikację po załadowaniu DOM
document.addEventListener('DOMContentLoaded', async () => {
    const app = new DigitalTwinApp();
    await app.init();
});

// Rejestruj Service Worker dla PWA
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').then(() => {
        console.log('Service Worker zarejestrowany');
    }).catch(error => {
        console.error('Błąd rejestracji Service Worker:', error);
    });
}
