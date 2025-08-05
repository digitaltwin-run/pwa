 /**
 * NATIVE JS GESTURE DETECTOR
 * Używa natywnych wzorców JS dla zaawansowanego wykrywania gestów
 * 
 * FEATURES:
 * - Mouse gestures (circle, line, zigzag)
 * - Multi-touch patterns  
 * - Sequence detection z generator functions
 * - Proxy-based dynamic event binding
 * - WeakMap metadata storage
 * - Performance-optimized z RAF
 */

// 🏗️ NATYWNE JS PATTERNS
const PRIVATE = Symbol('private');
const gestureMetadata = new WeakMap();
const eventSequences = new WeakMap();

/**
 * Native Gesture Detector - pure JS, zero dependencies
 */
export class NativeGestureDetector {
    constructor(target = document) {
        this[PRIVATE] = {
            target,
            patterns: new Map(),
            activeGestures: new Set(),
            rafId: null,
            touchHistory: [],
            mouseHistory: [],
            sequenceTimers: new Map()
        };

        // Proxy dla dynamic pattern registration
        return new Proxy(this, {
            get(target, prop) {
                if (prop.startsWith('detect')) {
                    return target.createDynamicDetector(prop);
                }
                return target[prop];
            }
        });
    }

    /**
     * 🎯 REJESTRACJA GESTÓW (fluent API)
     */
    gesture(name) {
        const gestureBuilder = {
            // Mouse gestures
            mouseCircle: (radius = 50, tolerance = 0.3) => {
                this.registerPattern(name, 'mouse_circle', { radius, tolerance });
                return gestureBuilder;
            },
            
            mouseZigzag: (minPoints = 4, amplitude = 30) => {
                this.registerPattern(name, 'mouse_zigzag', { minPoints, amplitude });
                return gestureBuilder;
            },
            
            mouseLine: (minLength = 100, maxDeviation = 20) => {
                this.registerPattern(name, 'mouse_line', { minLength, maxDeviation });
                return gestureBuilder;
            },

            // Multi-touch patterns
            pinch: (threshold = 0.2) => {
                this.registerPattern(name, 'pinch', { threshold });
                return gestureBuilder;
            },

            swipe: (direction, minDistance = 50, maxTime = 500) => {
                this.registerPattern(name, 'swipe', { direction, minDistance, maxTime });
                return gestureBuilder;
            },

            // Sequence patterns (generator-based)
            sequence: (...events) => {
                this.registerSequencePattern(name, events);
                return gestureBuilder;
            },

            // Custom pattern z funkcją
            custom: (detectionFn) => {
                this.registerPattern(name, 'custom', { detectionFn });
                return gestureBuilder;
            },

            // Event handler
            on: (callback) => {
                this.addGestureHandler(name, callback);
                return gestureBuilder;
            },

            // Warunki wykonania
            when: (condition) => {
                this.addGestureCondition(name, condition);
                return gestureBuilder;
            }
        };

        return gestureBuilder;
    }

    /**
     * 🎪 DYNAMIC DETECTOR CREATION (via Proxy)
     */
    createDynamicDetector(methodName) {
        // detectMouseCircle, detectSwipeLeft, etc.
        const patternType = methodName.replace('detect', '').toLowerCase();
        
        return (options = {}) => {
            const patternName = `dynamic_${patternType}_${Date.now()}`;
            this.registerPattern(patternName, patternType, options);
            return this.startDetection(patternName);
        };
    }

    /**
     * 📋 PATTERN REGISTRATION
     */
    registerPattern(name, type, options) {
        this[PRIVATE].patterns.set(name, {
            type,
            options,
            handlers: [],
            conditions: [],
            lastTriggered: 0,
            active: false
        });
    }

    /**
     * 🔄 SEQUENCE PATTERN (generator-based)
     */
    registerSequencePattern(name, eventSequence) {
        const sequenceGenerator = this.createSequenceGenerator(eventSequence);
        
        this.registerPattern(name, 'sequence', {
            generator: sequenceGenerator,
            currentStep: 0,
            timeout: 5000
        });
    }

    /**
     * Generator function dla sequence detection
     */
    *createSequenceGenerator(eventSequence) {
        for (const step of eventSequence) {
            const result = yield step;
            if (!result.matches) {
                return { success: false, step };
            }
        }
        return { success: true };
    }

    /**
     * 🎯 MOUSE GESTURE DETECTION
     */
    detectMouseCircle(points, options) {
        const { radius, tolerance } = options;
        
        if (points.length < 8) return { matches: false };

        // Calculate center point
        const center = this.calculateCentroid(points);
        
        // Check if points form a circle
        let radiusSum = 0;
        let validPoints = 0;

        for (const point of points) {
            const distance = this.distance(point, center);
            if (Math.abs(distance - radius) <= radius * tolerance) {
                radiusSum += distance;
                validPoints++;
            }
        }

        const coverage = validPoints / points.length;
        const avgRadius = radiusSum / validPoints;

        return {
            matches: coverage >= 0.7,
            confidence: coverage,
            radius: avgRadius,
            center,
            metadata: { points: points.length, coverage }
        };
    }

    /**
     * 🌊 SWIPE DETECTION
     */
    detectSwipe(points, options) {
        const { direction, minDistance, maxTime } = options;
        
        if (points.length < 2) return { matches: false };

        const start = points[0];
        const end = points[points.length - 1];
        const distance = this.distance(start, end);
        const duration = end.timestamp - start.timestamp;

        if (distance < minDistance || duration > maxTime) {
            return { matches: false };
        }

        const angle = this.calculateAngle(start, end);
        const detectedDirection = this.angleToDirection(angle);

        return {
            matches: !direction || detectedDirection === direction,
            direction: detectedDirection,
            distance,
            duration,
            velocity: distance / duration,
            angle
        };
    }

    /**
     * 🤏 PINCH DETECTION
     */
    detectPinch(touches, options) {
        const { threshold } = options;
        
        if (touches.length !== 2) return { matches: false };

        const [touch1, touch2] = touches;
        const initialDistance = this.distance(touch1.start, touch2.start);
        const currentDistance = this.distance(touch1.current, touch2.current);
        
        const scale = currentDistance / initialDistance;
        const scaleChange = Math.abs(1 - scale);

        return {
            matches: scaleChange >= threshold,
            scale,
            scaleChange,
            isPinchIn: scale < 1,
            isPinchOut: scale > 1
        };
    }

    /**
     * 📐 ZIGZAG DETECTION
     */
    detectMouseZigzag(points, options) {
        const { minPoints, amplitude } = options;
        
        if (points.length < minPoints) return { matches: false };

        let changes = 0;
        let lastDirection = null;
        let totalAmplitude = 0;

        for (let i = 1; i < points.length - 1; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            const next = points[i + 1];

            const dir1 = curr.y - prev.y;
            const dir2 = next.y - curr.y;

            if (dir1 * dir2 < 0) { // Direction change
                changes++;
                totalAmplitude += Math.abs(curr.y - prev.y);
            }
        }

        const avgAmplitude = totalAmplitude / Math.max(changes, 1);

        return {
            matches: changes >= minPoints / 2 && avgAmplitude >= amplitude,
            changes,
            avgAmplitude,
            confidence: Math.min(changes / (minPoints / 2), 1)
        };
    }

    /**
     * 🚀 START DETECTION
     */
    startDetection(patternName = null) {
        const patterns = patternName ? 
            [this[PRIVATE].patterns.get(patternName)] : 
            Array.from(this[PRIVATE].patterns.values());

        // Native event listeners z passive: true dla performance
        this.setupNativeListeners();
        
        // RAF-based gesture analysis
        this.startAnalysisLoop();

        patterns.forEach(pattern => pattern.active = true);

        return {
            stop: () => this.stopDetection(patternName),
            pause: () => this.pauseDetection(patternName),
            resume: () => this.resumeDetection(patternName)
        };
    }

    /**
     * 🎮 NATIVE EVENT LISTENERS
     */
    setupNativeListeners() {
        const { target } = this[PRIVATE];

        // Mouse events z passive optimization
        const mouseEvents = {
            mousedown: (e) => this.handleMouseStart(e),
            mousemove: (e) => this.handleMouseMove(e),
            mouseup: (e) => this.handleMouseEnd(e),
            wheel: (e) => this.handleWheel(e)
        };

        // Touch events
        const touchEvents = {
            touchstart: (e) => this.handleTouchStart(e),
            touchmove: (e) => this.handleTouchMove(e),
            touchend: (e) => this.handleTouchEnd(e)
        };

        // Rejestracja z passive: true
        Object.entries({...mouseEvents, ...touchEvents}).forEach(([event, handler]) => {
            target.addEventListener(event, handler, { 
                passive: true, 
                capture: false 
            });
        });
    }

    /**
     * ⚡ RAF ANALYSIS LOOP
     */
    startAnalysisLoop() {
        const analyze = () => {
            this.analyzeActiveGestures();
            this[PRIVATE].rafId = requestAnimationFrame(analyze);
        };
        analyze();
    }

    /**
     * 🧠 GESTURE ANALYSIS
     */
    analyzeActiveGestures() {
        const { patterns, mouseHistory, touchHistory } = this[PRIVATE];

        patterns.forEach((pattern, name) => {
            if (!pattern.active) return;

            let result = { matches: false };

            switch (pattern.type) {
                case 'mouse_circle':
                    result = this.detectMouseCircle(mouseHistory, pattern.options);
                    break;
                case 'mouse_zigzag':
                    result = this.detectMouseZigzag(mouseHistory, pattern.options);
                    break;
                case 'swipe':
                    result = this.detectSwipe(mouseHistory, pattern.options);
                    break;
                case 'pinch':
                    result = this.detectPinch(touchHistory, pattern.options);
                    break;
                case 'custom':
                    result = pattern.options.detectionFn(mouseHistory, touchHistory);
                    break;
                case 'sequence':
                    result = this.analyzeSequence(pattern, name);
                    break;
            }

            if (result.matches && this.checkConditions(pattern)) {
                this.triggerGesture(name, result);
            }
        });
    }

    /**
     * 🎯 TRIGGER GESTURE
     */
    triggerGesture(name, result) {
        const pattern = this[PRIVATE].patterns.get(name);
        const now = performance.now();

        // Cooldown check
        if (now - pattern.lastTriggered < 100) return;

        pattern.lastTriggered = now;

        // Call handlers
        pattern.handlers.forEach(handler => {
            try {
                handler({
                    name,
                    type: pattern.type,
                    result,
                    timestamp: now,
                    target: this[PRIVATE].target
                });
            } catch (error) {
                console.error(`Gesture handler error for ${name}:`, error);
            }
        });

        // Dispatch custom event
        this[PRIVATE].target.dispatchEvent(new CustomEvent('gesturedetected', {
            detail: { name, result, timestamp: now }
        }));
    }

    /**
     * 🔧 HELPER METHODS
     */
    distance(p1, p2) {
        return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
    }

    calculateCentroid(points) {
        const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
        return { x: sum.x / points.length, y: sum.y / points.length };
    }

    calculateAngle(start, end) {
        return Math.atan2(end.y - start.y, end.x - start.x) * 180 / Math.PI;
    }

    angleToDirection(angle) {
        const normalized = ((angle % 360) + 360) % 360;
        if (normalized < 45 || normalized >= 315) return 'right';
        if (normalized < 135) return 'down';
        if (normalized < 225) return 'left';
        return 'up';
    }

    addGestureHandler(name, callback) {
        const pattern = this[PRIVATE].patterns.get(name);
        if (pattern) pattern.handlers.push(callback);
    }

    addGestureCondition(name, condition) {
        const pattern = this[PRIVATE].patterns.get(name);
        if (pattern) pattern.conditions.push(condition);
    }

    checkConditions(pattern) {
        return pattern.conditions.every(condition => condition());
    }

    // Event handlers
    handleMouseStart(e) {
        this[PRIVATE].mouseHistory = [{
            x: e.clientX, y: e.clientY, 
            timestamp: performance.now(),
            pressure: e.pressure || 1
        }];
    }

    handleMouseMove(e) {
        if (this[PRIVATE].mouseHistory.length > 0) {
            this[PRIVATE].mouseHistory.push({
                x: e.clientX, y: e.clientY,
                timestamp: performance.now(),
                pressure: e.pressure || 1
            });

            // Limit history size dla performance
            if (this[PRIVATE].mouseHistory.length > 100) {
                this[PRIVATE].mouseHistory.shift();
            }
        }
    }

    handleMouseEnd(e) {
        // Analysis jest handled w RAF loop
    }

    // ... touch handlers podobnie

    /**
     * 🧹 CLEANUP
     */
    destroy() {
        if (this[PRIVATE].rafId) {
            cancelAnimationFrame(this[PRIVATE].rafId);
        }
        
        this[PRIVATE].patterns.clear();
        this[PRIVATE].activeGestures.clear();
    }
}

/**
 * 🎪 FACTORY FUNCTIONS dla łatwego użycia
 */
export function createGestureDetector(target) {
    return new NativeGestureDetector(target);
}

export function detectMouseGestures(target = document) {
    return createGestureDetector(target);
}

// PREDEFINIOWANE GESTURE PATTERNS
export const commonGestures = {
    circleClockwise: (detector) => detector
        .gesture('circle_cw')
        .mouseCircle(50, 0.3)
        .when(() => true),

    swipeLeft: (detector) => detector
        .gesture('swipe_left')
        .swipe('left', 100, 500),

    zigzagDelete: (detector) => detector
        .gesture('zigzag_delete')
        .mouseZigzag(6, 25)
        .when(() => document.querySelector('.selected-component')),

    pinchZoom: (detector) => detector
        .gesture('pinch_zoom')
        .pinch(0.1)
};

export default { NativeGestureDetector, createGestureDetector, commonGestures };
