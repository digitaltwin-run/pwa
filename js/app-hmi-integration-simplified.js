/**
 * SIMPLIFIED HMI INTEGRATION FOR MAIN APPLICATION
 * Lightweight version without external dependencies
 * Provides basic multi-modal gesture detection
 */

/**
 * 🎮 SIMPLIFIED MULTI-MODAL HMI INTEGRATION
 */
export class AppHMIIntegration {
    constructor() {
        this.keyboardState = new Map();
        this.gestureHistory = [];
        this.isActive = false;
        this.managers = {};
        
        console.info('🎮 Simplified HMI Integration initialized');
    }

    /**
     * 🚀 INITIALIZE SIMPLIFIED HMI
     */
    async init(appManagers) {
        console.info('🎮 Initializing simplified multi-modal HMI...');

        this.managers = appManagers;
        this.isActive = true;

        // Setup keyboard state tracking
        this.setupKeyboardTracking();
        
        // Setup basic gesture detection
        this.setupBasicGestures();

        console.info('✅ Simplified HMI integration ready');
        return this;
    }

    /**
     * ⌨️ KEYBOARD STATE TRACKING
     */
    setupKeyboardTracking() {
        document.addEventListener('keydown', (e) => {
            this.keyboardState.set(e.code, {
                pressed: true,
                timestamp: performance.now(),
                modifiers: {
                    ctrl: e.ctrlKey,
                    shift: e.shiftKey,
                    alt: e.altKey,
                    meta: e.metaKey
                }
            });
        });

        document.addEventListener('keyup', (e) => {
            this.keyboardState.set(e.code, {
                pressed: false,
                timestamp: performance.now()
            });
        });

        console.info('⌨️ Keyboard tracking enabled');
    }

    /**
     * 🎯 BASIC GESTURE DETECTION
     */
    setupBasicGestures() {
        const canvas = document.getElementById('svg-canvas');
        if (!canvas) {
            console.warn('⚠️ Canvas not found, gestures disabled');
            return;
        }

        let mouseHistory = [];
        let isDrawing = false;

        // Mouse tracking
        canvas.addEventListener('mousedown', (e) => {
            isDrawing = true;
            mouseHistory = [{
                x: e.clientX,
                y: e.clientY,
                timestamp: performance.now()
            }];
        });

        canvas.addEventListener('mousemove', (e) => {
            if (isDrawing) {
                mouseHistory.push({
                    x: e.clientX,
                    y: e.clientY,
                    timestamp: performance.now()
                });

                // Limit history for performance
                if (mouseHistory.length > 50) {
                    mouseHistory.shift();
                }
            }
        });

        canvas.addEventListener('mouseup', (e) => {
            if (isDrawing && mouseHistory.length > 5) {
                this.analyzeGesture(mouseHistory);
            }
            isDrawing = false;
            mouseHistory = [];
        });

        console.info('🎯 Basic gestures enabled');
    }

    /**
     * 🔍 ANALYZE GESTURE PATTERNS
     */
    analyzeGesture(points) {
        if (points.length < 5) return;

        // Simple circle detection
        const circle = this.detectSimpleCircle(points);
        if (circle.isCircle) {
            this.handleCircleGesture(circle);
            return;
        }

        // Simple line detection
        const line = this.detectSimpleLine(points);
        if (line.isLine) {
            this.handleLineGesture(line);
            return;
        }

        console.info('🎯 Gesture analyzed but no pattern matched');
    }

    /**
     * ⭕ SIMPLE CIRCLE DETECTION
     */
    detectSimpleCircle(points) {
        if (points.length < 10) return { isCircle: false };

        // Calculate center and average radius
        const center = this.calculateCentroid(points);
        const distances = points.map(p => this.distance(center, p));
        const avgRadius = distances.reduce((sum, d) => sum + d, 0) / distances.length;
        
        // Check if points form roughly circular pattern
        const radiusVariance = distances.reduce((sum, d) => sum + Math.pow(d - avgRadius, 2), 0) / distances.length;
        const tolerance = avgRadius * 0.3; // 30% tolerance
        
        const isCircle = radiusVariance < (tolerance * tolerance) && avgRadius > 20;

        return {
            isCircle,
            center,
            radius: avgRadius,
            confidence: isCircle ? Math.max(0, 1 - (radiusVariance / (tolerance * tolerance))) : 0
        };
    }

    /**
     * 📏 SIMPLE LINE DETECTION
     */
    detectSimpleLine(points) {
        if (points.length < 5) return { isLine: false };

        const start = points[0];
        const end = points[points.length - 1];
        const totalDistance = this.distance(start, end);
        
        if (totalDistance < 30) return { isLine: false };

        // Check if points roughly follow straight line
        let maxDeviation = 0;
        for (const point of points) {
            const deviation = this.pointToLineDistance(point, start, end);
            maxDeviation = Math.max(maxDeviation, deviation);
        }

        const isLine = maxDeviation < totalDistance * 0.2; // 20% tolerance

        return {
            isLine,
            start,
            end,
            distance: totalDistance,
            maxDeviation,
            confidence: isLine ? Math.max(0, 1 - (maxDeviation / (totalDistance * 0.2))) : 0
        };
    }

    /**
     * 🎪 GESTURE HANDLERS
     */
    handleCircleGesture(circle) {
        const modifiers = this.getCurrentModifiers();
        
        console.info('⭕ Circle gesture detected', { 
            radius: Math.round(circle.radius), 
            confidence: Math.round(circle.confidence * 100) + '%',
            modifiers 
        });

        // Enhanced delete with Ctrl
        if (modifiers.ctrl) {
            this.executeEnhancedDelete();
        }
        // Regular delete
        else if (this.hasSelectedComponents()) {
            this.executeRegularDelete();
        }
        // Show help
        else {
            this.showGestureHelp(circle.center);
        }
    }

    handleLineGesture(line) {
        const modifiers = this.getCurrentModifiers();
        
        console.info('📏 Line gesture detected', { 
            distance: Math.round(line.distance), 
            confidence: Math.round(line.confidence * 100) + '%',
            modifiers 
        });

        // Move gesture with selected components
        if (this.hasSelectedComponents()) {
            this.executeMoveGesture(line);
        }
        // Draw connection
        else if (modifiers.shift) {
            this.executeDrawConnection(line);
        }
    }

    /**
     * 🎬 ACTION EXECUTORS
     */
    executeEnhancedDelete() {
        console.info('🗑️ Enhanced delete (Ctrl+Circle)');
        const count = this.getSelectedComponentCount();
        
        if (count > 3) {
            if (confirm(`Delete ${count} components?`)) {
                this.managers.propertiesManager?.removeSelectedComponents?.();
            }
        } else {
            this.managers.propertiesManager?.removeSelectedComponents?.();
        }

        this.showNotification('Enhanced delete executed', 'success');
    }

    executeRegularDelete() {
        console.info('🗑️ Regular delete (Circle)');
        this.managers.propertiesManager?.removeSelectedComponents?.();
        this.showNotification('Components deleted', 'info');
    }

    executeMoveGesture(line) {
        console.info('➡️ Move gesture');
        const vector = {
            x: line.end.x - line.start.x,
            y: line.end.y - line.start.y
        };
        
        // Move selected components by vector
        const selected = this.getSelectedComponents();
        selected.forEach(component => {
            const currentTransform = component.getAttribute('transform') || '';
            const newTransform = this.updateTransform(currentTransform, vector);
            component.setAttribute('transform', newTransform);
        });

        this.showNotification(`Moved ${selected.length} components`, 'success');
    }

    /**
     * 🧠 HELPER METHODS
     */
    isKeyPressed(keyCode) {
        return this.keyboardState.get(keyCode)?.pressed === true;
    }

    getCurrentModifiers() {
        const modifiers = {};
        for (const [key, state] of this.keyboardState) {
            if (state.pressed && state.modifiers) {
                Object.assign(modifiers, state.modifiers);
            }
        }
        return modifiers;
    }

    hasSelectedComponents() {
        return this.getSelectedComponents().length > 0;
    }

    getSelectedComponents() {
        return Array.from(document.querySelectorAll('.draggable-component.selected')) || [];
    }

    getSelectedComponentCount() {
        return this.getSelectedComponents().length;
    }

    calculateCentroid(points) {
        const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
        return { x: sum.x / points.length, y: sum.y / points.length };
    }

    distance(p1, p2) {
        return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
    }

    pointToLineDistance(point, lineStart, lineEnd) {
        const A = point.x - lineStart.x;
        const B = point.y - lineStart.y;
        const C = lineEnd.x - lineStart.x;
        const D = lineEnd.y - lineStart.y;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        
        if (lenSq === 0) return this.distance(point, lineStart);

        const param = dot / lenSq;
        const xx = lineStart.x + param * C;
        const yy = lineStart.y + param * D;

        return this.distance(point, { x: xx, y: yy });
    }

    updateTransform(currentTransform, vector) {
        // Simple transform update - just add translation
        const translateMatch = currentTransform.match(/translate\(([^)]+)\)/);
        
        if (translateMatch) {
            const [x, y] = translateMatch[1].split(',').map(Number);
            return currentTransform.replace(
                /translate\([^)]+\)/, 
                `translate(${x + vector.x}, ${y + vector.y})`
            );
        } else {
            return `translate(${vector.x}, ${vector.y}) ${currentTransform}`.trim();
        }
    }

    showNotification(message, type = 'info') {
        console.info(`📢 ${message}`);
        
        // Simple notification popup
        const notification = document.createElement('div');
        notification.className = `hmi-notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
            color: white;
            border-radius: 4px;
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        `;

        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    showGestureHelp(position) {
        console.info('❓ Showing gesture help');
        this.showNotification('Circle: Delete | Line: Move | Ctrl+Circle: Enhanced Delete', 'info');
    }

    /**
     * 📊 METRICS & DEBUG
     */
    getAdvancedMetrics() {
        return {
            isActive: this.isActive,
            keyboardState: this.keyboardState.size,
            gestureHistory: this.gestureHistory.length,
            selectedComponents: this.getSelectedComponentCount(),
            type: 'simplified'
        };
    }

    /**
     * 🧹 CLEANUP
     */
    destroy() {
        this.keyboardState.clear();
        this.gestureHistory = [];
        this.isActive = false;
        
        document.querySelectorAll('.hmi-notification').forEach(el => el.remove());
        
        console.info('🧹 Simplified HMI integration destroyed');
    }
}

/**
 * 🎯 SIMPLIFIED INTEGRATION FUNCTION
 */
export async function integrateHMIWithApp(appInstance) {
    console.info('🔄 Integrating simplified HMI system with main application...');
    
    const hmiIntegration = new AppHMIIntegration();
    
    const managers = {
        componentManager: appInstance.componentManager,
        propertiesManager: appInstance.propertiesManager,
        canvasSelectionManager: appInstance.canvasSelectionManager,
        actionManager: appInstance.actionManager,
        dragDropManager: appInstance.dragDropManager,
        exportManager: appInstance.exportManager
    };
    
    await hmiIntegration.init(managers);
    
    // Expose globally for debugging
    window.hmiIntegration = hmiIntegration;
    
    console.info('✅ Simplified HMI integration complete!');
    console.info('🎮 Available gestures:');
    console.info('  • Circle = Delete selected components');
    console.info('  • Ctrl + Circle = Enhanced delete with confirmation');
    console.info('  • Line = Move selected components');
    console.info('  • Shift + Line = Draw connection');
    
    return hmiIntegration;
}

export default AppHMIIntegration;
