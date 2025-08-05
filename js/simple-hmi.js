/**
 * SIMPLIFIED HMI SYSTEM
 * 
 * A simple, debuggable HMI system for gesture and voice recognition
 * Replaces the complex HMI system with a straightforward approach
 * 
 * Features:
 * - Simple gesture detection (circle, swipe, zigzag)
 * - Voice commands (STT/TTS)
 * - Multi-modal interactions
 * - Easy debugging and testing
 * - No advanced JS patterns - just plain objects and functions
 */

// ====================================
// ADVANCED PATTERN DETECTORS - Pure Functions
// ====================================

const PatternDetectors = {
    // Basic circle detection
    circle: (points, options = {}) => {
        if (points.length < 8) return { detected: false };
        
        const { minRadius = 40, maxRadius = 200, tolerance = 0.3 } = options;
        
        // Calculate center point
        const center = {
            x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
            y: points.reduce((sum, p) => sum + p.y, 0) / points.length
        };
        
        // Calculate distances from center
        const distances = points.map(p => 
            Math.sqrt((p.x - center.x) ** 2 + (p.y - center.y) ** 2)
        );
        
        const avgRadius = distances.reduce((sum, d) => sum + d, 0) / distances.length;
        
        if (avgRadius < minRadius || avgRadius > maxRadius) {
            return { detected: false };
        }
        
        // Check if distances are reasonably consistent (circle-like)
        const variance = distances.reduce((sum, d) => sum + (d - avgRadius) ** 2, 0) / distances.length;
        const consistency = 1 - (Math.sqrt(variance) / avgRadius);
        
        return {
            detected: consistency > (1 - tolerance),
            confidence: consistency,
            radius: avgRadius,
            center: center,
            area: Math.PI * avgRadius ** 2
        };
    },
    
    // Enhanced swipe detection with multi-directional support
    swipe: (points, options = {}) => {
        if (points.length < 3) return { detected: false };
        
        const { minDistance = 50, maxTime = 500, direction = null } = options;
        const start = points[0];
        const end = points[points.length - 1];
        
        const distance = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2);
        const time = end.timestamp - start.timestamp;
        
        if (distance < minDistance || time > maxTime) {
            return { detected: false };
        }
        
        const angle = Math.atan2(end.y - start.y, end.x - start.x) * 180 / Math.PI;
        let detectedDirection = 'right';
        if (angle > 45 && angle <= 135) detectedDirection = 'down';
        else if (angle > 135 || angle <= -135) detectedDirection = 'left';
        else if (angle > -135 && angle <= -45) detectedDirection = 'up';
        
        // Check if specific direction was requested
        if (direction && direction !== detectedDirection) {
            return { detected: false };
        }
        
        return {
            detected: true,
            direction: detectedDirection,
            distance: distance,
            velocity: distance / time,
            angle: angle,
            duration: time
        };
    },
    
    // Enhanced zigzag with amplitude detection
    zigzag: (points, options = {}) => {
        if (points.length < 6) return { detected: false };
        
        const { minPoints = 4, amplitude = 30 } = options;
        
        let changes = 0;
        let maxAmplitude = 0;
        let totalAmplitude = 0;
        
        for (let i = 2; i < points.length; i++) {
            const p1 = points[i - 2];
            const p2 = points[i - 1];
            const p3 = points[i];
            
            // Calculate angle change
            const angle1 = Math.atan2(p2.y - p1.y, p2.x - p1.x);
            const angle2 = Math.atan2(p3.y - p2.y, p3.x - p2.x);
            const angleDiff = Math.abs(angle2 - angle1);
            
            if (angleDiff > Math.PI / 4) {
                changes++;
                const currentAmplitude = Math.sqrt((p2.x - ((p1.x + p3.x) / 2)) ** 2 + (p2.y - ((p1.y + p3.y) / 2)) ** 2);
                maxAmplitude = Math.max(maxAmplitude, currentAmplitude);
                totalAmplitude += currentAmplitude;
            }
        }
        
        const avgAmplitude = changes > 0 ? totalAmplitude / changes : 0;
        
        return {
            detected: changes >= minPoints && avgAmplitude >= amplitude,
            changes: changes,
            confidence: Math.min(changes / minPoints, 1),
            maxAmplitude: maxAmplitude,
            avgAmplitude: avgAmplitude
        };
    },
    
    // Line/stroke detection
    line: (points, options = {}) => {
        if (points.length < 3) return { detected: false };
        
        const { minLength = 50, maxDeviation = 20, straightness = 0.8 } = options;
        const start = points[0];
        const end = points[points.length - 1];
        
        const lineLength = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2);
        
        if (lineLength < minLength) {
            return { detected: false };
        }
        
        // Calculate deviation from straight line
        let totalDeviation = 0;
        let maxLineDeviation = 0;
        
        for (const point of points) {
            const deviation = pointToLineDistance(point, start, end);
            totalDeviation += deviation;
            maxLineDeviation = Math.max(maxLineDeviation, deviation);
        }
        
        const avgDeviation = totalDeviation / points.length;
        const straightnessScore = 1 - (avgDeviation / lineLength);
        
        return {
            detected: avgDeviation <= maxDeviation && straightnessScore >= straightness,
            length: lineLength,
            deviation: avgDeviation,
            maxDeviation: maxLineDeviation,
            straightness: straightnessScore,
            angle: Math.atan2(end.y - start.y, end.x - start.x) * 180 / Math.PI
        };
    },
    
    // Double tap detection
    doubleTap: (points, options = {}) => {
        const { maxDistance = 30, maxTime = 500 } = options;
        
        if (points.length < 2) return { detected: false };
        
        // Find potential tap points (points with minimal movement)
        const taps = [];
        let currentTap = [points[0]];
        
        for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            const distance = Math.sqrt((curr.x - prev.x) ** 2 + (curr.y - prev.y) ** 2);
            
            if (distance < 10) {
                currentTap.push(curr);
            } else {
                if (currentTap.length > 0) {
                    taps.push(currentTap);
                    currentTap = [curr];
                }
            }
        }
        
        if (currentTap.length > 0) taps.push(currentTap);
        
        // Check for double tap pattern
        if (taps.length >= 2) {
            const tap1Center = {
                x: taps[0].reduce((sum, p) => sum + p.x, 0) / taps[0].length,
                y: taps[0].reduce((sum, p) => sum + p.y, 0) / taps[0].length
            };
            const tap2Center = {
                x: taps[1].reduce((sum, p) => sum + p.x, 0) / taps[1].length,
                y: taps[1].reduce((sum, p) => sum + p.y, 0) / taps[1].length
            };
            
            const tapDistance = Math.sqrt((tap2Center.x - tap1Center.x) ** 2 + (tap2Center.y - tap1Center.y) ** 2);
            const timeGap = taps[1][0].timestamp - taps[0][taps[0].length - 1].timestamp;
            
            return {
                detected: tapDistance <= maxDistance && timeGap <= maxTime,
                distance: tapDistance,
                timeGap: timeGap,
                tapCount: taps.length
            };
        }
        
        return { detected: false };
    },
    
    // Pinch gesture (for touch)
    pinch: (touches, options = {}) => {
        if (touches.length < 2) return { detected: false };
        
        const { threshold = 0.2 } = options;
        const touch1 = touches[0];
        const touch2 = touches[1];
        
        const initialDistance = Math.sqrt(
            (touch1.start.x - touch2.start.x) ** 2 + (touch1.start.y - touch2.start.y) ** 2
        );
        const currentDistance = Math.sqrt(
            (touch1.current.x - touch2.current.x) ** 2 + (touch1.current.y - touch2.current.y) ** 2
        );
        
        const scale = currentDistance / initialDistance;
        const isPinch = Math.abs(scale - 1) >= threshold;
        
        return {
            detected: isPinch,
            scale: scale,
            isZoomIn: scale > 1,
            isZoomOut: scale < 1,
            center: {
                x: (touch1.current.x + touch2.current.x) / 2,
                y: (touch1.current.y + touch2.current.y) / 2
            }
        };
    },
    
    // Spiral detection
    spiral: (points, options = {}) => {
        if (points.length < 12) return { detected: false };
        
        const { minTurns = 1.5, tolerance = 0.3 } = options;
        
        // Calculate center
        const center = {
            x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
            y: points.reduce((sum, p) => sum + p.y, 0) / points.length
        };
        
        // Calculate angles from center
        const angles = points.map(p => Math.atan2(p.y - center.y, p.x - center.x));
        
        // Count angle changes (turns)
        let totalAngleChange = 0;
        for (let i = 1; i < angles.length; i++) {
            let angleDiff = angles[i] - angles[i - 1];
            // Normalize angle difference
            if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
            totalAngleChange += Math.abs(angleDiff);
        }
        
        const turns = totalAngleChange / (2 * Math.PI);
        
        return {
            detected: turns >= minTurns,
            turns: turns,
            center: center,
            confidence: Math.min(turns / minTurns, 1)
        };
    },
    
    // Custom pattern matcher
    custom: (points, options = {}) => {
        const { detectionFn } = options;
        if (!detectionFn || typeof detectionFn !== 'function') {
            return { detected: false };
        }
        
        try {
            return detectionFn(points, options);
        } catch (error) {
            console.error('Custom pattern detection error:', error);
            return { detected: false };
        }
    }
};

// Helper function for line distance calculation
function pointToLineDistance(point, lineStart, lineEnd) {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) return Math.sqrt(A * A + B * B);
    
    const param = dot / lenSq;
    let xx, yy;
    
    if (param < 0) {
        xx = lineStart.x;
        yy = lineStart.y;
    } else if (param > 1) {
        xx = lineEnd.x;
        yy = lineEnd.y;
    } else {
        xx = lineStart.x + param * C;
        yy = lineStart.y + param * D;
    }
    
    const dx = point.x - xx;
    const dy = point.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
}

// ====================================
// GESTURE DETECTOR
// ====================================

class GestureDetector {
    constructor(target = document) {
        this.target = target;
        this.gestures = new Map();
        this.currentPoints = [];
        this.isDrawing = false;
        this.rafId = null;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Mouse events
        this.target.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.target.addEventListener('mousemove', (e) => this.addPoint(e));
        this.target.addEventListener('mouseup', (e) => this.stopDrawing(e));
        
        // Touch events
        this.target.addEventListener('touchstart', (e) => this.startDrawing(e.touches[0]));
        this.target.addEventListener('touchmove', (e) => this.addPoint(e.touches[0]));
        this.target.addEventListener('touchend', (e) => this.stopDrawing(e));
    }
    
    startDrawing(e) {
        this.isDrawing = true;
        this.currentPoints = [{
            x: e.clientX,
            y: e.clientY,
            timestamp: Date.now()
        }];
    }
    
    addPoint(e) {
        if (!this.isDrawing) return;
        
        this.currentPoints.push({
            x: e.clientX,
            y: e.clientY,
            timestamp: Date.now()
        });
        
        // Limit points to prevent memory issues
        if (this.currentPoints.length > 100) {
            this.currentPoints.shift();
        }
    }
    
    stopDrawing(e) {
        if (!this.isDrawing) return;
        
        this.isDrawing = false;
        this.analyzeGesture();
    }
    
    analyzeGesture() {
        if (this.currentPoints.length < 3) return;
        
        // Sort gestures by priority (higher priority first)
        const sortedGestures = Array.from(this.gestures.entries())
            .filter(([_, config]) => config.enabled)
            .sort(([_, a], [__, b]) => (b.priority || 0) - (a.priority || 0));
        
        const detectedGestures = [];
        
        // Test all registered gestures
        for (const [name, config] of sortedGestures) {
            // Check area bounds if specified
            if (config.areaBounds && !this.isInArea(this.currentPoints, config.areaBounds)) {
                continue;
            }
            
            // Check touch count for multi-touch gestures
            if (config.touchCount > 1 && this.currentPoints.length < config.touchCount) {
                continue;
            }
            
            const detector = PatternDetectors[config.type];
            if (!detector) continue;
            
            let result;
            
            // Handle different gesture types
            if (config.type === 'sequence') {
                result = this.analyzeGestureSequence(name, config);
            } else if (config.type === 'pinch' && this.touchHistory.length >= 2) {
                result = detector(this.touchHistory, config.options);
            } else {
                result = detector(this.currentPoints, config.options);
            }
            
            if (result && result.detected) {
                // Check conditions
                if (config.condition && !config.condition()) continue;
                
                // Check cooldown
                const now = Date.now();
                if (now - config.lastTriggered < config.cooldown) continue;
                
                config.lastTriggered = now;
                
                const gestureData = {
                    name: name,
                    type: config.type,
                    result: result,
                    points: this.currentPoints,
                    timestamp: now,
                    priority: config.priority || 0
                };
                
                detectedGestures.push(gestureData);
                
                // For high-priority gestures, stop processing others
                if (config.priority > 5) {
                    break;
                }
            }
        }
        
        // Process detected gestures in priority order
        detectedGestures.forEach(gestureData => {
            const config = this.gestures.get(gestureData.name);
            
            // Trigger callback
            if (config.callback) {
                config.callback(gestureData);
            }
            
            // Dispatch event
            const event = new CustomEvent('gesturedetected', {
                detail: gestureData
            });
            this.target.dispatchEvent(event);
            
            // Debug logging
            if (window.hmiDebug) {
                console.log(`🎯 Gesture detected: ${gestureData.name} (${gestureData.type})`, gestureData);
            }
        });
        
        this.currentPoints = [];
    }
    
    analyzeGestureSequence(name, config) {
        // Simplified sequence detection - would need more sophisticated implementation
        const sequence = config.options.sequence;
        if (!sequence || sequence.length === 0) return { detected: false };
        
        // For now, just detect the first gesture in the sequence
        const firstGestureType = sequence[0];
        const detector = PatternDetectors[firstGestureType];
        
        if (detector) {
            const result = detector(this.currentPoints, {});
            if (result.detected) {
                config.currentStep = (config.currentStep + 1) % sequence.length;
                return {
                    detected: config.currentStep === 0, // Complete sequence
                    sequenceStep: config.currentStep,
                    totalSteps: sequence.length
                };
            }
        }
        
        return { detected: false };
    }
    
    isInArea(points, bounds) {
        if (!bounds || points.length === 0) return true;
        
        const { x, y, width, height } = bounds;
        
        return points.every(point => 
            point.x >= x && point.x <= x + width &&
            point.y >= y && point.y <= y + height
        );
    }
    
    // Enhanced Fluent API for comprehensive gesture registration
    gesture(name) {
        const builder = {
            // Basic gestures
            circle: (options = {}) => {
                this.registerGesture(name, 'circle', options);
                return builder;
            },
            swipe: (direction, options = {}) => {
                this.registerGesture(name, 'swipe', { ...options, direction });
                return builder;
            },
            zigzag: (options = {}) => {
                this.registerGesture(name, 'zigzag', options);
                return builder;
            },
            line: (options = {}) => {
                this.registerGesture(name, 'line', options);
                return builder;
            },
            
            // Advanced gestures
            doubleTap: (options = {}) => {
                this.registerGesture(name, 'doubleTap', options);
                return builder;
            },
            pinch: (options = {}) => {
                this.registerGesture(name, 'pinch', options);
                return builder;
            },
            spiral: (options = {}) => {
                this.registerGesture(name, 'spiral', options);
                return builder;
            },
            
            // Custom gesture
            custom: (detectionFn, options = {}) => {
                this.registerGesture(name, 'custom', { ...options, detectionFn });
                return builder;
            },
            
            // Directional swipes (shortcuts)
            swipeUp: (options = {}) => {
                this.registerGesture(name, 'swipe', { ...options, direction: 'up' });
                return builder;
            },
            swipeDown: (options = {}) => {
                this.registerGesture(name, 'swipe', { ...options, direction: 'down' });
                return builder;
            },
            swipeLeft: (options = {}) => {
                this.registerGesture(name, 'swipe', { ...options, direction: 'left' });
                return builder;
            },
            swipeRight: (options = {}) => {
                this.registerGesture(name, 'swipe', { ...options, direction: 'right' });
                return builder;
            },
            
            // Gesture sequences and combinations
            sequence: (...gestureTypes) => {
                this.registerGestureSequence(name, gestureTypes);
                return builder;
            },
            
            // Conditional logic
            when: (condition) => {
                if (this.gestures.has(name)) {
                    this.gestures.get(name).condition = condition;
                }
                return builder;
            },
            
            // Event handlers
            on: (callback) => {
                if (this.gestures.has(name)) {
                    this.gestures.get(name).callback = callback;
                }
                return builder;
            },
            
            // Timing and constraints
            cooldown: (ms) => {
                if (this.gestures.has(name)) {
                    this.gestures.get(name).cooldown = ms;
                }
                return builder;
            },
            
            // Priority and conflict resolution
            priority: (level) => {
                if (this.gestures.has(name)) {
                    this.gestures.get(name).priority = level;
                }
                return builder;
            },
            
            // Area constraints
            inArea: (bounds) => {
                if (this.gestures.has(name)) {
                    this.gestures.get(name).areaBounds = bounds;
                }
                return builder;
            },
            
            // Multi-touch support
            withTouches: (count) => {
                if (this.gestures.has(name)) {
                    this.gestures.get(name).touchCount = count;
                }
                return builder;
            }
        };
        
        return builder;
    }
    
    registerGesture(name, type, options = {}) {
        this.gestures.set(name, {
            type: type,
            options: options,
            condition: null,
            callback: null,
            cooldown: 300,
            lastTriggered: 0,
            priority: 0,
            areaBounds: null,
            touchCount: 1,
            enabled: true
        });
    }
    
    registerGestureSequence(name, gestureTypes) {
        this.gestures.set(name, {
            type: 'sequence',
            options: { sequence: gestureTypes },
            condition: null,
            callback: null,
            cooldown: 300,
            lastTriggered: 0,
            priority: 0,
            areaBounds: null,
            touchCount: 1,
            enabled: true,
            currentStep: 0,
            sequenceTimeout: 2000
        });
    }
    
    destroy() {
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
        }
        this.gestures.clear();
    }
}

// ====================================
// VOICE HMI - TTS and STT
// ====================================

class VoiceHMI {
    constructor() {
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.isListening = false;
        this.voiceCommands = new Map();
        this.ttsQueue = [];
        this.isProcessingTTS = false;
        
        this.setupSpeechRecognition();
    }
    
    setupSpeechRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('Speech Recognition not supported');
            return;
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'pl-PL';
        
        this.recognition.onresult = (event) => {
            const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
            
            if (event.results[event.results.length - 1].isFinal) {
                this.processVoiceCommand(transcript);
            }
        };
        
        this.recognition.onerror = (event) => {
            console.warn('Speech recognition error:', event.error);
        };
    }
    
    processVoiceCommand(transcript) {
        this.voiceCommands.forEach((config, pattern) => {
            const match = transcript.match(pattern);
            if (match) {
                if (config.callback) {
                    config.callback({
                        transcript: transcript,
                        match: match,
                        command: config.name
                    });
                }
            }
        });
    }
    
    // Voice command registration
    command(name, pattern) {
        const builder = {
            on: (callback) => {
                this.voiceCommands.set(pattern, {
                    name: name,
                    callback: callback
                });
                return builder;
            },
            speak: (text, options = {}) => {
                this.voiceCommands.set(pattern, {
                    name: name,
                    callback: (data) => {
                        if (this.voiceCommands.get(pattern).originalCallback) {
                            this.voiceCommands.get(pattern).originalCallback(data);
                        }
                        this.speak(text, options);
                    }
                });
                return builder;
            }
        };
        
        return builder;
    }
    
    startListening() {
        if (this.recognition && !this.isListening) {
            this.recognition.start();
            this.isListening = true;
        }
    }
    
    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.isListening = false;
        }
    }
    
    speak(text, options = {}) {
        const utterance = new SpeechSynthesisUtterance(text);
        
        utterance.rate = options.rate || 1.0;
        utterance.pitch = options.pitch || 1.0;
        utterance.volume = options.volume || 1.0;
        utterance.lang = options.lang || 'pl-PL';
        
        if (options.queue) {
            this.ttsQueue.push(utterance);
            this.processTTSQueue();
        } else {
            this.synthesis.speak(utterance);
        }
    }
    
    processTTSQueue() {
        if (this.isProcessingTTS || this.ttsQueue.length === 0) return;
        
        this.isProcessingTTS = true;
        const utterance = this.ttsQueue.shift();
        
        utterance.onend = () => {
            this.isProcessingTTS = false;
            this.processTTSQueue();
        };
        
        this.synthesis.speak(utterance);
    }
}

// ====================================
// MAIN HMI MANAGER
// ====================================

class HMIManager {
    constructor(target = document) {
        this.gestureDetector = new GestureDetector(target);
        this.voiceHMI = new VoiceHMI();
        this.multiModalGestures = new Map();
        this.debugMode = false;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Forward gesture events
        this.gestureDetector.target.addEventListener('gesturedetected', (e) => {
            if (this.debugMode) {
                console.log('Gesture detected:', e.detail);
            }
        });
    }
    
    // Simple API for gesture registration
    gesture(name) {
        return this.gestureDetector.gesture(name);
    }
    
    // Simple API for voice commands
    voice(name, pattern) {
        return this.voiceHMI.command(name, pattern);
    }
    
    // Multi-modal gestures (voice + gesture)
    multiModalGesture(name) {
        const builder = {
            whenSaying: (pattern) => {
                if (!this.multiModalGestures.has(name)) {
                    this.multiModalGestures.set(name, {});
                }
                this.multiModalGestures.get(name).voicePattern = pattern;
                return builder;
            },
            whileGesturing: (gestureType, options = {}) => {
                if (!this.multiModalGestures.has(name)) {
                    this.multiModalGestures.set(name, {});
                }
                this.multiModalGestures.get(name).gestureType = gestureType;
                this.multiModalGestures.get(name).gestureOptions = options;
                return builder;
            },
            then: (callback) => {
                // Register both voice and gesture handlers
                const config = this.multiModalGestures.get(name);
                if (config && config.voicePattern && config.gestureType) {
                    // This is simplified - in real implementation you'd need timing coordination
                    this.voice(name + '_voice', config.voicePattern).on(callback);
                    this.gesture(name + '_gesture')[config.gestureType](config.gestureOptions).on(callback);
                }
                return builder;
            }
        };
        
        return builder;
    }
    
    // Debug and testing
    enableDebug() {
        this.debugMode = true;
        
        // Global debug access
        window.hmi = this;
        window.hmiDebug = {
            triggerGesture: (name) => {
                const event = new CustomEvent('gesturedetected', {
                    detail: { name: name, type: 'manual', result: { detected: true } }
                });
                this.gestureDetector.target.dispatchEvent(event);
            },
            getGestures: () => Array.from(this.gestureDetector.gestures.keys()),
            getVoiceCommands: () => Array.from(this.voiceHMI.voiceCommands.keys()),
            startVoice: () => this.voiceHMI.startListening(),
            stopVoice: () => this.voiceHMI.stopListening(),
            speak: (text) => this.voiceHMI.speak(text)
        };
        
        console.log('HMI Debug mode enabled. Use window.hmiDebug for testing.');
    }
    
    getMetrics() {
        return {
            gestures: this.gestureDetector.gestures.size,
            voiceCommands: this.voiceHMI.voiceCommands.size,
            multiModal: this.multiModalGestures.size,
            voiceListening: this.voiceHMI.isListening
        };
    }
    
    destroy() {
        this.gestureDetector.destroy();
        this.voiceHMI.stopListening();
        this.multiModalGestures.clear();
        
        delete window.hmi;
        delete window.hmiDebug;
    }
}

// ====================================
// EXPORT AND FACTORY
// ====================================

// Factory function for easy creation
function createHMI(target = document, options = {}) {
    const hmi = new HMIManager(target);
    
    if (options.debug) {
        hmi.enableDebug();
    }
    
    if (options.voice) {
        hmi.voiceHMI.startListening();
    }
    
    return hmi;
}

// Export for ES6 modules
export { HMIManager, GestureDetector, VoiceHMI, PatternDetectors, createHMI };

// Global access for non-module usage
if (typeof window !== 'undefined') {
    window.SimpleHMI = { HMIManager, GestureDetector, VoiceHMI, PatternDetectors, createHMI };
}
