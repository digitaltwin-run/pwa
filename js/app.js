/**
 * Digital Twin IDE - Main Application Module
 * 
 * This module initializes and coordinates all components of the Digital Twin IDE.
 * It manages the application lifecycle, event handling, and integration of various managers.
 */

import { ComponentManager } from './components.js';
import { DragDropManager } from './dragdrop.js';
import { PropertiesManager } from './properties.js';
import { SimulationManager } from './simulation.js';
import { ConnectionManager } from './connections.js';
import { ExportManager } from './export.js';
import { ActionManager } from './actions.js';
import { PWAManager } from './pwa-manager.js';
import pwaConfig from '../config/pwa-config.js';
import { CollaborationManager } from './collaboration-manager.js';
import { I18nManager } from './i18n-manager.js';
import { ComponentScaler } from './component-scaler.js';
// Conditional imports for development tools
let TestingSystem, FunctionalTests, ErrorDetector;
try {
    // Only import if files exist (avoid MIME type errors)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        import('./error-detector.js').catch(e => console.log('Error detector not available'));
        import('./tests/interaction-bug-detector.js').catch(e => console.log('Interaction bug detector not available'));
    }
} catch (error) {
    console.log('Development tools not available:', error.message);
}

// Import testing system in development mode
let FunctionalTester = null;
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    import('../tests/functional-tests.js').then(module => {
        FunctionalTester = module.FunctionalTester;
        console.log('🧪 Development Mode: Testing system loaded');
        console.log('📋 Available commands:');
        console.log('  - runFunctionalTests() : Run all functional tests');
        console.log('  - exportTestReport() : Export test results to JSON');
        console.log('  - Open /tests/ui-tests.html for visual UI tests');
    }).catch(err => {
        console.log('ℹ️ Testing system not available (production mode)');
    });
}
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
        this.componentScaler = null;
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
            this.componentScaler = new ComponentScaler(this.componentManager);

            // Expose managers globally for HTML calls
            window.componentManager = this.componentManager;
            window.propertiesManager = this.propertiesManager;
            window.exportManager = this.exportManager;
            window.simulationManager = this.simulationManager;
            window.connectionManager = this.connectionManager;
            window.interactionsManager = this.interactionsManager;
            window.componentScaler = this.componentScaler;

            // Load component library
            await this.componentManager.loadComponentLibrary();

            // Set up component interactions
            this.setupComponentInteractions();
        
            // Set up event listeners
            this.setupEventListeners();

            console.log('🚀 Digital Twin IDE initialized successfully!');
            console.log('📚 Documentation available at: /docs/');
            console.log('🎨 Canvas ready for component design!');
            
            // Development mode information
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                console.log('\n🔧 DEVELOPMENT MODE ACTIVE');
                console.log('🧪 Testing: /tests/ui-tests.html');
                console.log('📊 Console: runFunctionalTests()');
                console.log('📝 Docs: /docs/TESTING_GUIDE.md');
            }
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
     * Update toolbar button text based on current language
     */
    updateToolbarTexts() {
        // Check if i18n manager is available and initialized
        if (!window.i18nManager || typeof window.i18nManager.t !== 'function') {
            console.warn('⚠️ I18n Manager not ready, skipping toolbar text update');
            return;
        }
        
        // Bind the context to prevent 'this' being undefined
        const t = window.i18nManager.t.bind(window.i18nManager);
        
        // Update toolbar buttons
        const exportBtn = document.getElementById('export-btn');
        if (exportBtn) exportBtn.textContent = t('ui.buttons.export');
        
        const importBtn = document.getElementById('import-btn');
        if (importBtn) importBtn.textContent = t('ui.buttons.import');
        
        const exportPngBtn = document.getElementById('export-png-btn');
        if (exportPngBtn) exportPngBtn.textContent = t('ui.buttons.export_png');
        
        const exportSvgBtn = document.getElementById('export-svg-btn');
        if (exportSvgBtn) exportSvgBtn.textContent = t('ui.buttons.export_svg');
        
        const connectionModeBtn = document.getElementById('connection-mode-btn');
        if (connectionModeBtn) {
            // Safely check if connectionManager is initialized
            const isConnectionMode = this.connectionManager && 
                                   typeof this.connectionManager.isConnectionMode !== 'undefined' 
                                   ? this.connectionManager.isConnectionMode 
                                   : false;
            
            connectionModeBtn.textContent = isConnectionMode 
                ? t('ui.buttons.cancel_connection') 
                : t('ui.buttons.connect_components');
        }
    }

    /**
     * Set up application event listeners
     */
    setupEventListeners() {
        // Listen for language changes
        document.addEventListener('languageChanged', () => {
            this.updateToolbarTexts();
            // Add other UI updates here when language changes
        });

        // Initial toolbar text update
        this.updateToolbarTexts();

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
                // Update button text after toggling mode
                this.updateToolbarTexts();
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
        // Check if Service Worker is enabled in config
        if (!pwaConfig.enableServiceWorker) {
            console.log('ℹ️ Service Worker disabled in config - skipping registration');
            return;
        }
        
        try {
            // Load configuration to determine service worker behavior
            const { configManager } = await import('./config-manager.js');
            await configManager.loadConfig();
            
            // Use configuration to determine if service worker should be enabled
            if (!configManager.shouldEnableServiceWorker()) {
                configManager.debugLog('serviceWorker', 'ServiceWorker registration skipped by configuration');
                
                // Unregister any existing service workers if disabled
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (let registration of registrations) {
                    configManager.debugLog('serviceWorker', 'Unregistering existing service worker:', registration.scope);
                    await registration.unregister();
                }
                return;
            }
            
            // Check protocol requirement (HTTPS in production)
            const isDev = configManager.isDevelopmentMode();
            const isSecure = window.location.protocol === 'https:' || isDev;
            
            if (isSecure) {
                const registration = await navigator.serviceWorker.register('/sw.js');
                configManager.debugLog('serviceWorker', 'ServiceWorker registration successful with scope:', registration.scope);
                return registration;
            } else {
                console.warn('ServiceWorker registration skipped: must be served over HTTPS in production');
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
