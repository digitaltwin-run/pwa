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
// PATTERN DETECTORS - Pure Functions
// ====================================

const PatternDetectors = {
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
            center: center
        };
    },
    
    swipe: (points, options = {}) => {
        if (points.length < 3) return { detected: false };
        
        const { minDistance = 50, maxTime = 500 } = options;
        const start = points[0];
        const end = points[points.length - 1];
        
        const distance = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2);
        const time = end.timestamp - start.timestamp;
        
        if (distance < minDistance || time > maxTime) {
            return { detected: false };
        }
        
        const angle = Math.atan2(end.y - start.y, end.x - start.x) * 180 / Math.PI;
        let direction = 'right';
        if (angle > 45 && angle <= 135) direction = 'down';
        else if (angle > 135 || angle <= -135) direction = 'left';
        else if (angle > -135 && angle <= -45) direction = 'up';
        
        return {
            detected: true,
            direction: direction,
            distance: distance,
            velocity: distance / time,
            angle: angle
        };
    },
    
    zigzag: (points, options = {}) => {
        if (points.length < 6) return { detected: false };
        
        const { minPoints = 4, amplitude = 30 } = options;
        
        // Find direction changes
        let changes = 0;
        let lastDirection = null;
        
        for (let i = 1; i < points.length - 1; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            const next = points[i + 1];
            
            const angle1 = Math.atan2(curr.y - prev.y, curr.x - prev.x);
            const angle2 = Math.atan2(next.y - curr.y, next.x - curr.x);
            
            const angleDiff = Math.abs(angle2 - angle1);
            
            if (angleDiff > Math.PI / 4) { // 45 degrees
                changes++;
            }
        }
        
        return {
            detected: changes >= minPoints,
            changes: changes,
            confidence: Math.min(changes / minPoints, 1)
        };
    }
};

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
        
        // Test all registered gestures
        this.gestures.forEach((config, name) => {
            const detector = PatternDetectors[config.type];
            if (!detector) return;
            
            const result = detector(this.currentPoints, config.options);
            
            if (result.detected) {
                // Check conditions
                if (config.condition && !config.condition()) return;
                
                // Check cooldown
                const now = Date.now();
                if (now - config.lastTriggered < config.cooldown) return;
                
                config.lastTriggered = now;
                
                // Trigger callback
                if (config.callback) {
                    config.callback({
                        name: name,
                        type: config.type,
                        result: result,
                        points: this.currentPoints
                    });
                }
                
                // Dispatch event
                const event = new CustomEvent('gesturedetected', {
                    detail: {
                        name: name,
                        type: config.type,
                        result: result
                    }
                });
                this.target.dispatchEvent(event);
            }
        });
        
        this.currentPoints = [];
    }
    
    // Fluent API for gesture registration
    gesture(name) {
        const builder = {
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
            when: (condition) => {
                if (this.gestures.has(name)) {
                    this.gestures.get(name).condition = condition;
                }
                return builder;
            },
            on: (callback) => {
                if (this.gestures.has(name)) {
                    this.gestures.get(name).callback = callback;
                }
                return builder;
            },
            cooldown: (ms) => {
                if (this.gestures.has(name)) {
                    this.gestures.get(name).cooldown = ms;
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
            lastTriggered: 0
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
