/**
 * APP.JS z NATYWNYMI GESTURE PATTERNS
 * Praktyczny przykład integracji NativeGestureDetector
 * 
 * NATIVE JS FEATURES:
 * ✅ Proxy-based dynamic gesture detection  
 * ✅ Generator functions dla sequences
 * ✅ WeakMap metadata storage
 * ✅ Symbol-based private properties
 * ✅ RAF-optimized performance
 * ✅ Fluent API patterns
 */

import { ComponentManager } from './component-manager.js';
import { DragDropManager } from './dragdrop.js';
import { PropertiesManager } from './properties-manager.js';
import { createAppFunctionRegistry } from './utils/app-function-registry.js';
import { createGestureDetector, commonGestures } from './utils/native-gesture-detector.js';

/**
 * Enhanced Digital Twin App z Native Gesture Support
 */
export class DigitalTwinApp {
    constructor() {
        // Standard managers
        this.componentManager = null;
        this.dragDropManager = null;
        this.propertiesManager = null;
        this.exportManager = null;
        
        // NOWE: Gesture & Registry system
        this.appRegistry = null;
        this.gestureDetector = null;
        
        // Private state using Symbol
        this[Symbol.for('appState')] = {
            gesturesActive: false,
            lastGesture: null,
            gestureSequence: []
        };

        console.info('🚀 DigitalTwinApp with Native Gestures');
    }

    async init() {
        await this.initializeManagers();
        
        // KLUCZOWE: Inicjalizacja gesture detection
        await this.initializeNativeGestures();
        await this.initializeAppRegistry();
        
        // Setup native event patterns
        this.setupNativeEventPatterns();
        
        console.info('✅ App ready with native gesture detection');
    }

    /**
     * 🎯 NATIVE GESTURE INITIALIZATION
     */
    async initializeNativeGestures() {
        const svgCanvas = document.getElementById('svg-canvas');
        
        // Create gesture detector z Proxy magic
        this.gestureDetector = createGestureDetector(svgCanvas);
        
        // 1. BASIC GESTURES z fluent API
        this.setupBasicGestures();
        
        // 2. ADVANCED GESTURES z custom logic
        this.setupAdvancedGestures();
        
        // 3. COMPONENT-SPECIFIC GESTURES
        this.setupComponentGestures();
        
        // 4. WORKFLOW GESTURES (multi-step)
        this.setupWorkflowGestures();
        
        // Start detection
        this.gestureDetector.startDetection();
        
        // Global access dla debugging
        window.gestureDetector = this.gestureDetector;
        
        console.info('🎮 Native gestures initialized');
    }

    /**
     * 🖱️ BASIC GESTURES SETUP
     */
    setupBasicGestures() {
        // CIRCLE DELETE (classic gesture)
        this.gestureDetector
            .gesture('circle_delete')
            .mouseCircle(60, 0.4)
            .when(() => this.getSelectedComponents().length > 0)
            .on((data) => {
                console.info('🔄 Circle delete gesture detected');
                this.deleteSelectedComponents();
                this.showGestureConfirmation('Components deleted', data.result.center);
            });

        // ZIGZAG MULTI-SELECT
        this.gestureDetector
            .gesture('zigzag_select')
            .mouseZigzag(4, 30)
            .on((data) => {
                console.info('⚡ Zigzag multi-select');
                this.selectComponentsInPath(data.result);
            });

        // LINE MOVE GESTURE
        this.gestureDetector
            .gesture('line_move')
            .mouseLine(80, 15)
            .when(() => this.getSelectedComponents().length === 1)
            .on((data) => {
                console.info('📏 Line move gesture');
                this.moveComponentByGesture(data.result);
            });

        // PINCH ZOOM (touch/trackpad)
        this.gestureDetector
            .gesture('pinch_zoom')
            .pinch(0.1)
            .on((data) => {
                console.info('🤏 Pinch zoom:', data.result.scale);
                if (this.canvasZoomManager) {
                    const zoomDelta = (data.result.scale - 1) * 0.5;
                    this.canvasZoomManager.zoomBy(zoomDelta);
                }
            });
    }

    /**
     * 🧠 ADVANCED GESTURES z Dynamic Detection
     */
    setupAdvancedGestures() {
        // DYNAMIC GESTURE via Proxy (magic!)
        // gestureDetector.detectSwipeLeft() automatycznie tworzy pattern
        this.gestureDetector.detectSwipeLeft({
            minDistance: 100,
            maxTime: 300
        }).on((data) => {
            console.info('👈 Dynamic swipe left detected');
            this.navigateComponentList('previous');
        });

        // CUSTOM GESTURE z własną logiką
        this.gestureDetector
            .gesture('component_lasso')
            .custom((mouseHistory, touchHistory) => {
                // Custom detection logic
                if (mouseHistory.length < 10) return { matches: false };
                
                const path = mouseHistory.map(p => ({ x: p.x, y: p.y }));
                const boundingBox = this.calculateBoundingBox(path);
                const componentsInBox = this.getComponentsInArea(boundingBox);
                
                return {
                    matches: componentsInBox.length > 1,
                    components: componentsInBox,
                    boundingBox,
                    confidence: Math.min(componentsInBox.length / 5, 1)
                };
            })
            .on((data) => {
                console.info('🎯 Lasso selection:', data.result.components.length);
                this.selectComponents(data.result.components);
            });

        // SEQUENCE GESTURE z Generator Functions
        this.gestureDetector
            .gesture('export_sequence')
            .sequence(
                { type: 'swipe', direction: 'right' },
                { type: 'circle', radius: 40 },
                { type: 'swipe', direction: 'up' }
            )
            .on((data) => {
                console.info('📤 Export sequence completed');
                this.triggerExport();
            });
    }

    /**
     * 🧩 COMPONENT-SPECIFIC GESTURES
     */
    setupComponentGestures() {
        // COMPONENT ROTATE (circle on component)
        this.gestureDetector
            .gesture('component_rotate')
            .mouseCircle(30, 0.5)
            .when(() => {
                const selected = this.getSelectedComponents()[0];
                return selected && this.isRotatable(selected);
            })
            .on((data) => {
                const component = this.getSelectedComponents()[0];
                const rotationAngle = this.calculateRotationFromCircle(data.result);
                this.rotateComponent(component, rotationAngle);
                console.info('🔄 Component rotated by', rotationAngle);
            });

        // COMPONENT RESIZE (diagonal swipe)
        this.gestureDetector
            .gesture('component_resize')
            .swipe('diagonal', 50, 400)
            .when(() => this.getSelectedComponents().length === 1)
            .on((data) => {
                const component = this.getSelectedComponents()[0];
                const scale = 1 + (data.result.distance / 200);
                this.scaleComponent(component, scale);
                console.info('📏 Component resized to scale', scale);
            });
    }

    /**
     * 🔄 WORKFLOW GESTURES (multi-step sequences)
     */
    setupWorkflowGestures() {
        // COMPONENT CREATION WORKFLOW
        this.gestureDetector
            .gesture('create_pump_workflow')
            .sequence(
                { type: 'tap', area: 'component-palette' },
                { type: 'drag', direction: 'canvas' },
                { type: 'double_tap', area: 'properties-panel' }
            )
            .on((data) => {
                console.info('🏭 Pump creation workflow detected');
                this.trackWorkflowCompletion('pump_creation', data.result);
            });

        // CONNECTION WORKFLOW
        this.gestureDetector
            .gesture('connection_workflow')
            .sequence(
                { type: 'long_press', target: 'component' },
                { type: 'drag_to', target: 'component' },
                { type: 'release' }
            )
            .on((data) => {
                console.info('🔗 Connection workflow');
                this.completeConnectionWorkflow(data.result);
            });
    }

    /**
     * 🎪 FLUENT API dla App Functions Integration
     */
    setupNativeEventPatterns() {
        // Połączenie gesture detector z app registry
        this.gestureDetector
            .gesture('smart_export')
            .mouseCircle(100, 0.3)
            .when(() => this.componentManager.getComponents().length > 0)
            .on(async (data) => {
                // Trigger app function przez registry
                await this.appRegistry.triggerFunction('export_project', {
                    gestureData: data.result,
                    exportFormat: 'svg'
                });
            });

        // Multi-parameter gesture detection
        this.gestureDetector
            .gesture('canvas_properties')
            .custom((mouseHistory) => {
                const corners = this.detectCornerPattern(mouseHistory);
                const properties = this.extractCanvasProperties();
                
                return {
                    matches: corners.length === 4,
                    corners,
                    canvasSize: properties.size,
                    gridVisible: properties.grid.visible
                };
            })
            .on((data) => {
                this.showCanvasPropertiesPopup(data.result);
            });
    }

    /**
     * 🎯 HELPER METHODS dla Gesture Detection
     */
    getSelectedComponents() {
        return this.canvasSelectionManager?.getSelectedComponents() || [];
    }

    deleteSelectedComponents() {
        const selected = this.getSelectedComponents();
        selected.forEach(comp => this.componentManager.removeComponent(comp.dataset.id));
        this.canvasSelectionManager.clearSelection();
    }

    selectComponentsInPath(gestureResult) {
        const path = gestureResult.path || [];
        const components = this.getComponentsInPath(path);
        this.canvasSelectionManager.setSelection(components);
    }

    moveComponentByGesture(lineResult) {
        const [selected] = this.getSelectedComponents();
        if (!selected) return;

        const moveVector = {
            x: lineResult.endPoint.x - lineResult.startPoint.x,
            y: lineResult.endPoint.y - lineResult.startPoint.y
        };

        this.moveComponent(selected, moveVector);
    }

    calculateBoundingBox(path) {
        const xs = path.map(p => p.x);
        const ys = path.map(p => p.y);
        return {
            left: Math.min(...xs),
            right: Math.max(...xs),
            top: Math.min(...ys),
            bottom: Math.max(...ys)
        };
    }

    getComponentsInArea(boundingBox) {
        const components = Array.from(document.querySelectorAll('.draggable-component'));
        return components.filter(comp => {
            const rect = comp.getBoundingClientRect();
            return rect.left >= boundingBox.left && 
                   rect.right <= boundingBox.right &&
                   rect.top >= boundingBox.top && 
                   rect.bottom <= boundingBox.bottom;
        });
    }

    showGestureConfirmation(message, position) {
        const popup = document.createElement('div');
        popup.className = 'gesture-confirmation';
        popup.textContent = message;
        popup.style.cssText = `
            position: fixed;
            left: ${position.x}px;
            top: ${position.y}px;
            background: rgba(0,255,0,0.8);
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            pointer-events: none;
            z-index: 10000;
            animation: fadeOut 2s forwards;
        `;

        document.body.appendChild(popup);
        setTimeout(() => popup.remove(), 2000);
    }

    /**
     * 📊 GESTURE ANALYTICS & MONITORING
     */
    getGestureAnalytics() {
        const state = this[Symbol.for('appState')];
        return {
            gesturesActive: state.gesturesActive,
            lastGesture: state.lastGesture,
            totalGestures: state.gestureSequence.length,
            recentGestures: state.gestureSequence.slice(-10),
            performance: this.gestureDetector?.getPerformanceMetrics()
        };
    }

    /**
     * 🎮 CONSOLE COMMANDS dla testowania
     */
    enableGestureDebugging() {
        window.toggleGestures = (enabled) => {
            if (enabled) {
                this.gestureDetector.startDetection();
            } else {
                this.gestureDetector.stopDetection();
            }
            console.info(`Gestures ${enabled ? 'enabled' : 'disabled'}`);
        };

        window.gestureStats = () => this.getGestureAnalytics();
        
        window.testGesture = (name) => {
            console.info(`Testing gesture: ${name}`);
            // Simulate gesture dla testing
        };

        console.info('🎮 Gesture debugging enabled. Try:');
        console.info('  toggleGestures(true/false)');
        console.info('  gestureStats()');
        console.info('  testGesture("circle_delete")');
    }

    /**
     * 🧹 CLEANUP
     */
    destroy() {
        this.gestureDetector?.destroy();
        this.appRegistry?.stopAppFunctionMonitoring();
        
        // Clear private state
        delete this[Symbol.for('appState')];
    }
}

/**
 * 🚀 USAGE EXAMPLES
 */
export const examples = {
    basicUsage: `
// 1. BASIC SETUP
const app = new DigitalTwinApp();
await app.init();

// 2. GESTURES READY!
// Circle na component = delete
// Zigzag = multi-select  
// Line = move component
// Pinch = zoom
`,

    advancedUsage: `
// 3. DYNAMIC GESTURES (via Proxy)
app.gestureDetector.detectSwipeRight().on(data => {
    console.log('Swipe right detected!', data);
});

// 4. CUSTOM GESTURES
app.gestureDetector
    .gesture('my_gesture')
    .custom((mouseHistory) => ({
        matches: mouseHistory.length > 20,
        confidence: 0.8
    }))
    .on(data => console.log('Custom gesture!'));
`,

    nativeFeatures: `
// 5. NATIVE JS FEATURES:
// ✅ Proxy dla dynamic methods
// ✅ Symbols dla private state  
// ✅ WeakMaps dla metadata
// ✅ Generators dla sequences
// ✅ RAF dla performance
// ✅ Fluent API patterns
`
};

export default DigitalTwinApp;
