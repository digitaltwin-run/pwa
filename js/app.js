/**
 * Digital Twin IDE - Main Application Module
 * 
 * This module initializes and coordinates all components of the Digital Twin IDE.
 * It manages the application lifecycle, event handling, and integration of various managers.
 */

import { ComponentManager } from './components.js';
import { DragDropManager } from './dragdrop.js';
import { PropertiesManager } from './properties.js';
import { ExportManager } from './export.js';
import { SimulationManager } from './simulation.js';
import { ConnectionManager } from './connections.js';
import { ActionManager } from './actions.js';
import { gridManager } from './grid.js';
import { InteractionsManager, extendComponentWithEvents } from './interactions.js';

/**
 * Main application class for Digital Twin IDE
 */
class DigitalTwinApp {
    /**
     * Initialize application properties
     */
    constructor() {
        this.componentManager = null;
        this.dragDropManager = null;
        this.propertiesManager = null;
        this.exportManager = null;
        this.simulationManager = null;
        this.connectionManager = null;
        this.actionManager = null;
        this.interactionsManager = null;
        this.config = {
            canvas: {
                grid: {
                    enabled: true,
                    size: 5,
                    color: '#e0e0e0',
                    snapToGrid: true
                }
            }
        };
    }

    /**
     * Initialize the application
     * @returns {Promise<void>}
     */
    async init() {
        // Get main DOM elements
        const svgCanvas = document.getElementById('svg-canvas');
        const workspace = document.getElementById('workspace');
        
        if (!svgCanvas || !workspace) {
            console.error('Required DOM elements not found');
            return;
        }

        try {
            // Load configuration
            await this.loadConfig();
            
            // Initialize Grid Manager
            gridManager.init(svgCanvas);
            gridManager.updateConfig(this.config.canvas.grid);
            
            // Initialize managers
            this.componentManager = new ComponentManager({
                snapToGrid: this.config.canvas.grid.snapToGrid,
                gridSize: this.config.canvas.grid.size
            });
            this.actionManager = new ActionManager(this.componentManager);
            
            // Set up cross-references
            this.componentManager.setActionManager(this.actionManager);
            
            this.dragDropManager = new DragDropManager(this.componentManager, svgCanvas, workspace);
            this.propertiesManager = new PropertiesManager(this.componentManager);
            this.exportManager = new ExportManager(this.componentManager, svgCanvas);
            this.simulationManager = new SimulationManager(this.componentManager);
            this.connectionManager = new ConnectionManager(this.componentManager, svgCanvas);
            this.interactionsManager = new InteractionsManager(this.componentManager, svgCanvas);

            // Expose managers globally for HTML calls
            window.componentManager = this.componentManager;
            window.propertiesManager = this.propertiesManager;
            window.exportManager = this.exportManager;
            window.simulationManager = this.simulationManager;
            window.connectionManager = this.connectionManager;
            window.interactionsManager = this.interactionsManager;

            // Load component library
            await this.componentManager.loadComponentLibrary();

            // Set up component interactions
            this.setupComponentInteractions();
        
            // Set up event listeners
            this.setupEventListeners();

            console.log('Digital Twin IDE initialized successfully');

        } catch (error) {
            console.error('Error initializing application:', error);
        }
    }

    /**
     * Set up interaction handlers for SVG components
     */
    setupComponentInteractions() {
        const svgCanvas = document.getElementById('svg-canvas');
        if (!svgCanvas) {
            console.error('SVG canvas not found');
            return;
        }

        // Delegated event handling for component clicks
        svgCanvas.addEventListener('click', (event) => {
            // Find the closest component element
            let target = event.target;
            while (target && target !== svgCanvas) {
                if (target.hasAttribute('data-component-id')) {
                    const componentId = target.getAttribute('data-component-id');
                    this.handleComponentClick(componentId, event);
                    break;
                }
                target = target.parentNode;
            }
        });

        // Add double-click for editing
        svgCanvas.addEventListener('dblclick', (event) => {
            let target = event.target;
            while (target && target !== svgCanvas) {
                if (target.hasAttribute('data-component-id')) {
                    const componentId = target.getAttribute('data-component-id');
                    this.propertiesManager.selectComponent(target);
                    break;
                }
                target = target.parentNode;
            }
        });

        console.log('Component interactions configured');
    }

    /**
     * Handle component click events
     * @param {string} componentId - ID of the clicked component
     * @param {Event} event - Click event object
     */
    async handleComponentClick(componentId, event) {
        if (!this.actionManager) return;

        const component = this.componentManager.getComponent(componentId);
        if (!component) return;

        // Prevent default if it's a button or interactive element
        if (component.type === 'button' || component.type === 'switch' || component.type === 'toggle') {
            event.preventDefault();
            event.stopPropagation();
        }

        // Toggle state for toggle components
        if (component.type === 'toggle') {
            const currentState = component.state?.on || false;
            this.componentManager.updateComponentState(componentId, { on: !currentState });
        }

        // Trigger click event actions
        await this.actionManager.triggerEvent(componentId, 'click');
    }

    /**
     * Set up application event listeners
     */
    setupEventListeners() {
        // Toolbar buttons
        const exportBtn = document.getElementById('export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportManager.exportProject();
            });
        }
        
        const importBtn = document.getElementById('import-btn');
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                this.exportManager.importProject();
            });
        }
        
        const exportPngBtn = document.getElementById('export-png-btn');
        if (exportPngBtn) {
            exportPngBtn.addEventListener('click', () => {
                this.exportManager.exportAsPNG();
            });
        }
        
        const exportSvgBtn = document.getElementById('export-svg-btn');
        if (exportSvgBtn) {
            exportSvgBtn.addEventListener('click', () => {
                this.exportManager.exportAsSVG();
            });
        }
        
        const connectionModeBtn = document.getElementById('connection-mode-btn');
        if (connectionModeBtn) {
            connectionModeBtn.addEventListener('click', () => {
                this.connectionManager.toggleConnectionMode();
            });
        }
        
        // Simulation panel buttons
        const startSimBtn = document.getElementById('start-sim-btn');
        if (startSimBtn) {
            startSimBtn.addEventListener('click', () => {
                this.simulationManager.startSimulation();
            });
        }
        
        const stopSimBtn = document.getElementById('stop-sim-btn');
        if (stopSimBtn) {
            stopSimBtn.addEventListener('click', () => {
                this.simulationManager.stopSimulation();
            });
        }

        // Canvas click handler for component selection
        const svgCanvas = document.getElementById('svg-canvas');
        if (svgCanvas) {
            svgCanvas.addEventListener('click', (e) => {
                // Skip if we're handling this via component interactions
                if (e.target.hasAttribute('data-component-id') || 
                    e.target.closest('[data-component-id]')) {
                    return;
                }
                
                const component = e.target.closest('.draggable-component');
                
                if (component) {
                    // Connection mode vs normal selection
                    if (this.connectionManager.isConnectionMode) {
                        this.connectionManager.startConnection(component);
                    } else {
                        this.propertiesManager.selectComponent(component);
                    }
                } else {
                    // Click on empty space - deselect component
                    if (!this.connectionManager.isConnectionMode) {
                        this.propertiesManager.selectComponent(null);
                    }
                }
            });
        }

        // Window resize handler
        window.addEventListener('resize', () => {
            if (this.dragDropManager) {
                this.dragDropManager.updateSvgSize();
            }
        });

        // Keyboard handler
        document.addEventListener('keydown', (e) => {
            // Delete - remove selected component
            if (e.key === 'Delete' && this.componentManager) {
                const selectedComponent = this.componentManager.getSelectedComponent();
                if (selectedComponent && this.propertiesManager) {
                    const selectedId = selectedComponent.getAttribute('data-id');
                    if (selectedId) {
                        this.propertiesManager.removeComponent(selectedId);
                    }
                }
            }
            
            // Escape - exit connection mode
            if (e.key === 'Escape' && this.connectionManager && this.connectionManager.isConnectionMode) {
                this.connectionManager.toggleConnectionMode();
            }
        });
    }

    /**
     * Load configuration from config.json
     * @returns {Promise<void>}
     */
    async loadConfig() {
        try {
            const response = await fetch('/config.json');
            if (response.ok) {
                const config = await response.json();
                this.config = {
                    ...this.config,
                    ...config
                };
                console.log('Configuration loaded:', this.config);
            }
        } catch (error) {
            console.warn('Failed to load config.json, using defaults', error);
        }
    }

    /**
     * Get grid configuration
     * @returns {Object} Grid configuration
     */
    getGridConfig() {
        return this.config.canvas.grid;
    }

    /**
     * Update grid configuration
     * @param {Object} newConfig - New grid configuration
     */
    updateGridConfig(newConfig) {
        this.config.canvas.grid = {
            ...this.config.canvas.grid,
            ...newConfig
        };
        gridManager.updateConfig(this.config.canvas.grid);
    }
}

// Initialize application after DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Add global error handler
    window.addEventListener('error', (event) => {
        console.error('Global error:', event.error);
        // You could show a user-friendly error message here
    });

    // Initialize the app
    const app = new DigitalTwinApp();
    window.app = app; // Make app accessible globally
    await app.init();
});

// Register Service Worker for PWA in production
const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
        try {
            // Check if we're in a secure context (https or localhost)
            const isLocalhost = window.location.hostname === 'localhost' || 
                             window.location.hostname === '127.0.0.1';
            
            if (window.location.protocol === 'https:' || isLocalhost) {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
                return registration;
            } else {
                console.warn('ServiceWorker registration skipped: must be served over HTTPS or localhost');
            }
        } catch (error) {
            console.warn('ServiceWorker registration failed: ', error);
        }
    } else {
        console.warn('Service workers are not supported in this browser.');
    }
};

// Register Service Worker in all environments
// (The registerServiceWorker function already includes proper environment checks)
registerServiceWorker();
