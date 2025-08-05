/**
 * Digital Twin IDE - Main Application Module
 * 
 * This module initializes and coordinates all components of the Digital Twin IDE.
 * It manages the application lifecycle, event handling, and integration of various managers.
 */

import { ComponentManager } from './components.js';
import { DragDropManager } from './hmi/input/dragdrop-manager.js';
import { PropertiesManager } from './properties.js';
import { PropertiesMapper } from './properties-mapper.js';
import { SimulationManager } from './simulation.js';
import { ConnectionManager } from './connections.js';
import { ExportManager } from './export.js';
import { ActionManager } from './actions.js';
import { PWAManager } from './pwa-manager.js';
import pwaConfig from '../config/pwa-config.js';
import { CollaborationManager } from './collaboration-manager.js';
import { I18nManager } from './i18n-manager.js';
import { ComponentScaler } from './component-scaler.js';
import { CanvasSelectionManager, canvasSelectionManager } from './canvas-selection-manager.js';
import { CanvasZoomManager } from './canvas-zoom-manager.js';
import { CanvasPropertiesManager } from './canvas-properties-manager.js';
import { ComponentsColumnManager } from './components-column-manager.js';
// loadHTMLModules - removed as file doesn't exist
import { integrateHMIWithApp } from './hmi/app-hmi-integration-new.js';
import { SelectionListManager } from './properties/selection-list-manager.js';
import './utils/advanced-logger.js'; // Advanced JSON logging & error analysis
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
// InteractionsManager moved to ../interactions project

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
        this.canvasSelectionManager = canvasSelectionManager; // Using the imported instance
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
            // Initialize i18n first
            console.log('🌐 Initializing i18n...');
            // Use existing global i18n manager (auto-initialized in i18n-manager.js)
            if (!window.i18nManager || !window.i18nManager.isInitialized) {
                console.log('🌐 Waiting for i18n manager to initialize...');
                // Wait for auto-initialization to complete
                await new Promise(resolve => {
                    const checkInit = () => {
                        if (window.i18nManager && window.i18nManager.isInitialized) {
                            resolve();
                        } else {
                            setTimeout(checkInit, 50);
                        }
                    };
                    checkInit();
                });
            }
            console.log('✅ i18n initialized');
            
            // Load configuration
            await this.loadConfig();
            
            // Initialize Grid Manager
            gridManager.init(svgCanvas);
            gridManager.updateConfig(this.config.canvas.grid);
            
            // Initialize managers
            console.log('🔧 Creating ComponentManager...');
            this.componentManager = new ComponentManager({
                snapToGrid: this.config.canvas.grid.snapToGrid,
                gridSize: this.config.canvas.grid.size
            });
            console.log('✅ ComponentManager created');
            this.actionManager = new ActionManager(this.componentManager);
            console.log('✅ ActionManager created');
            
            // Set up cross-references
            this.componentManager.setActionManager(this.actionManager);
            
            this.dragDropManager = new DragDropManager(this.componentManager, svgCanvas, workspace);
            console.log('🔧 Creating PropertiesManager...');
            this.propertiesManager = new PropertiesManager(this.componentManager);
            console.log('✅ PropertiesManager created');
            console.log('🔧 Creating PropertiesMapper...');
            this.propertiesMapper = new PropertiesMapper();
            console.log('✅ PropertiesMapper created');
            this.exportManager = new ExportManager(this.componentManager, svgCanvas);
            this.simulationManager = new SimulationManager(this.componentManager);
            this.connectionManager = new ConnectionManager(this.componentManager, svgCanvas);
            // interactionsManager moved to ../interactions project
            this.componentScaler = new ComponentScaler(this.componentManager);

            // Expose managers globally for HTML calls
            console.log('🌍 Exposing managers globally...');
            window.componentManager = this.componentManager;
            window.propertiesManager = this.propertiesManager;
            window.propertiesMapper = this.propertiesMapper;
            window.exportManager = this.exportManager;
            
            // Verify global exposure with detailed debugging
            const globalManagersStatus = {
                componentManager: !!window.componentManager,
                propertiesManager: !!window.propertiesManager,
                propertiesMapper: !!window.propertiesMapper,
                exportManager: !!window.exportManager
            };
            console.log('✅ Managers exposed globally:', globalManagersStatus);
            
            // Additional verification to ensure they persist
            setTimeout(() => {
                const persistenceCheck = {
                    componentManager: !!window.componentManager,
                    propertiesManager: !!window.propertiesManager,
                    propertiesMapper: !!window.propertiesMapper,
                    exportManager: !!window.exportManager
                };
                console.log('🔍 Global managers persistence check (500ms later):', persistenceCheck);
                
                // Set flag to indicate managers are ready
                window.globalManagersReady = true;
                document.dispatchEvent(new CustomEvent('globalManagersReady', {
                    detail: persistenceCheck
                }));
            }, 500);
            window.simulationManager = this.simulationManager;
            window.connectionManager = this.connectionManager;
            // window.interactionsManager moved to ../interactions project
            window.componentScaler = this.componentScaler;
            window.actionManager = this.actionManager; // Expose actionManager for interactions
            window.canvasSelectionManager = this.canvasSelectionManager; // Expose canvas selection manager

            // Initialize canvas managers with references
            this.canvasSelectionManager.setReferences(svgCanvas, this.componentManager);
            
            // Create instances of canvas managers
            const canvasZoomManager = new CanvasZoomManager();
            const canvasPropertiesManager = new CanvasPropertiesManager();
            
            // Initialize canvas managers with references
            canvasZoomManager.setReferences(svgCanvas, workspace);
            canvasPropertiesManager.setCanvas(svgCanvas);
            
            // Initialize components column manager
            this.componentsColumnManager = new ComponentsColumnManager();
            this.componentsColumnManager.setReferences(this.componentManager, this.canvasSelectionManager);
            
            // Expose new canvas managers globally
            window.canvasZoomManager = canvasZoomManager;
            window.canvasPropertiesManager = canvasPropertiesManager;
            window.componentsColumnManager = this.componentsColumnManager;
            
            // Dispatch canvas-ready event for selection manager
            const canvasReadyEvent = new CustomEvent('canvas-ready', {
                detail: {
                    canvas: svgCanvas,
                    componentManager: this.componentManager
                }
            });
            document.dispatchEvent(canvasReadyEvent);

            // Load component library
            await this.componentManager.loadComponentLibrary();

            // Component interactions now handled by interactions project
        
            // Set up advanced HMI system (replaces traditional event listeners)
            await this.setupHMISystem();

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
     * Update toolbar button text based on current language
     */
    updateToolbarTexts() {
        // Ensure i18n is available
        if (!window.i18nManager || typeof window.i18nManager.t !== 'function') {
            console.warn('i18nManager not available for translations');
            return;
        }
        
        const t = window.i18nManager.t.bind(window.i18nManager);
        
        // Update all elements with data-i18n attribute
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (key) {
                try {
                    const translation = t(key);
                    if (translation !== key) { // Only update if we got a translation
                        if (element.tagName === 'INPUT' && element.type === 'text') {
                            element.placeholder = translation;
                        } else if (element.tagName === 'INPUT' && element.type === 'button') {
                            element.value = translation;
                        } else {
                            element.textContent = translation;
                        }
                    }
                } catch (error) {
                    console.warn(`Failed to translate key: ${key}`, error);
                }
            }
        });
        
        // Update title if it has a data-i18n attribute
        const titleElement = document.querySelector('title[data-i18n]');
        if (titleElement) {
            const titleKey = titleElement.getAttribute('data-i18n');
            if (titleKey) {
                document.title = t(titleKey);
            }
        }
        
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
     * Set up advanced HMI system with multi-modal gesture detection
     * Replaces traditional event listeners with context-aware gesture patterns
     */
    async setupHMISystem() {
        console.info('🎮 Initializing advanced HMI system...');
        
        try {
            // Initialize multi-modal HMI integration
            this.hmiIntegration = await integrateHMIWithApp(this);
            
            // Expose HMI globally for debugging
            window.hmiIntegration = this.hmiIntegration;
            
            console.info('✅ Advanced HMI system initialized successfully!');
            console.info('🎯 Multi-modal gestures active:');
            console.info('  • Ctrl + Circle = Enhanced delete');
            console.info('  • Shift + Drag = Multi-select');
            console.info('  • Alt + Circle = Advanced properties');
            console.info('  • Ctrl+S → Circle → Tap = Save workflow');
            
        } catch (error) {
            console.error('❌ Failed to initialize HMI system:', error);
            // Fallback to traditional event listeners
            this.setupEventListeners();
        }
    }

    /**
     * LEGACY: Traditional event listeners (fallback only)
     * Most functionality is now handled by the advanced HMI system
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
                    // Click on empty canvas - show canvas properties
                    if (!this.connectionManager.isConnectionMode) {
                        // Clear component selection
                        this.propertiesManager.selectComponent(null);
                        // Show canvas properties instead
                        this.propertiesManager.showCanvasProperties();
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
    console.log('🎯 DOMContentLoaded event fired - starting app initialization...');
    
    // Add global error handler
    window.addEventListener('error', (event) => {
        console.error('Global error:', event.error);
        // You could show a user-friendly error message here
    });

    // Initialize the app
    console.log('🏗️ Creating DigitalTwinApp instance...');
    const app = new DigitalTwinApp();
    window.app = app; // Make app accessible globally
    console.log('✅ DigitalTwinApp instance created, calling init()...');
    
    try {
        await app.init();
        console.log('🎉 App initialization completed successfully!');
    } catch (error) {
        console.error('💥 App initialization failed:', error);
    }
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
