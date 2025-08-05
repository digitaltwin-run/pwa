/**
 * Declarative HMI Pattern Detection System - Solution 3
 * 
 * DECLARATIVE APPROACH:
 * - Pattern definitions via arrays: pattern.push(hmi.mouse.button.right.press.down)
 * - Variable capture: startx = hmi.mouse.position.x
 * - Spatial queries: gui.canvas.hasComponents.between(x1,y1,x2,y2)
 * - Automatic anomaly detection based on expected vs actual patterns
 * - Playwright integration for automated HMI event generation
 */

export class DeclarativeHMIDetector {
    constructor(sessionHash) {
        this.sessionHash = sessionHash;
        this.patterns = new Map();
        this.activeDetections = new Map();
        this.variables = new Map();
        this.detectionId = 0;
        this.startTime = Date.now();
        
        // HMI Event Registry
        this.hmi = this.createHMINamespace();
        this.gui = this.createGUINamespace();
        
        this.init();
    }

    init() {
        this.setupGlobalEventListeners();
        console.info('🎯 Declarative HMI Detector initialized');
    }

    /**
     * Create HMI namespace for declarative patterns
     */
    createHMINamespace() {
        const self = this;
        
        return {
            mouse: {
                button: {
                    left: {
                        press: {
                            down: () => ({ type: 'mouse.button.left.down', capturePosition: true }),
                            up: () => ({ type: 'mouse.button.left.up', capturePosition: true })
                        },
                        click: () => ({ type: 'mouse.button.left.click', capturePosition: true })
                    },
                    right: {
                        press: {
                            down: () => ({ type: 'mouse.button.right.down', capturePosition: true }),
                            up: () => ({ type: 'mouse.button.right.up', capturePosition: true })
                        },
                        click: () => ({ type: 'mouse.button.right.click', capturePosition: true })
                    }
                },
                move: () => ({ type: 'mouse.move', capturePosition: true, continuous: true }),
                position: {
                    get x() { return self.variables.get('mouse.x') || 0; },
                    get y() { return self.variables.get('mouse.y') || 0; }
                }
            },
            keyboard: {
                key: {
                    press: (key) => ({ type: 'keyboard.key.press', key: key }),
                    down: (key) => ({ type: 'keyboard.key.down', key: key }),
                    up: (key) => ({ type: 'keyboard.key.up', key: key })
                },
                combo: (keys) => ({ type: 'keyboard.combo', keys: keys })
            }
        };
    }

    /**
     * Create GUI namespace for UI state queries
     */
    createGUINamespace() {
        const self = this;
        
        return {
            canvas: {
                components: {
                    get selected() { 
                        return { type: 'gui.canvas.components.selected', query: true };
                    },
                    hasComponents: {
                        between: (x1, y1, x2, y2) => ({
                            type: 'gui.canvas.hasComponents.between',
                            query: true,
                            spatial: { x1, y1, x2, y2 }
                        }),
                        at: (x, y) => ({
                            type: 'gui.canvas.hasComponents.at',
                            query: true,
                            spatial: { x, y }
                        })
                    }
                },
                selection: {
                    get active() {
                        return { type: 'gui.canvas.selection.active', query: true };
                    },
                    get count() {
                        return { type: 'gui.canvas.selection.count', query: true };
                    }
                }
            },
            properties: {
                panel: {
                    get visible() {
                        return { type: 'gui.properties.panel.visible', query: true };
                    },
                    get activeTab() {
                        return { type: 'gui.properties.panel.activeTab', query: true };
                    }
                }
            }
        };
    }

    /**
     * Register declarative pattern
     */
    registerPattern(name, patternDefinition) {
        const pattern = {
            id: ++this.detectionId,
            name: name,
            steps: [],
            variables: new Map(),
            queries: [],
            timeout: 10000,
            registered: Date.now()
        };

        // Execute pattern definition to capture steps
        const originalPush = Array.prototype.push;
        let currentPattern = pattern;
        
        const patternArray = {
            push: (step) => {
                if (typeof step === 'function') {
                    step = step();
                }
                currentPattern.steps.push(step);
                return currentPattern.steps.length;
            }
        };

        // Execute the pattern definition
        try {
            patternDefinition.call(this, patternArray);
        } catch (error) {
            console.error('Pattern definition error:', error);
            return null;
        }

        this.patterns.set(pattern.id, pattern);
        console.info(`🎯 Registered pattern: ${name} (${pattern.steps.length} steps)`);
        
        return pattern.id;
    }

    /**
     * Start pattern detection
     */
    startDetection(patternId) {
        const pattern = this.patterns.get(patternId);
        if (!pattern) return false;

        const detection = {
            id: patternId,
            pattern: pattern,
            currentStep: 0,
            startTime: Date.now(),
            variables: new Map(),
            stepTimes: [],
            status: 'active'
        };

        this.activeDetections.set(patternId, detection);
        console.info(`🔍 Started detection: ${pattern.name}`);
        
        return true;
    }

    /**
     * Process incoming event against active detections
     */
    processEvent(eventType, eventData) {
        // Update mouse position variables
        if (eventData.clientX !== undefined) {
            this.variables.set('mouse.x', eventData.clientX);
            this.variables.set('mouse.y', eventData.clientY);
        }

        // Check all active detections
        this.activeDetections.forEach((detection, detectionId) => {
            this.checkPatternStep(detection, eventType, eventData);
        });
    }

    /**
     * Check if event matches current pattern step
     */
    checkPatternStep(detection, eventType, eventData) {
        const currentStep = detection.pattern.steps[detection.currentStep];
        if (!currentStep) return;

        const matches = this.eventMatchesStep(eventType, eventData, currentStep);
        
        if (matches) {
            detection.stepTimes.push(Date.now() - detection.startTime);
            
            // Capture variables if needed
            if (currentStep.capturePosition && eventData.clientX !== undefined) {
                detection.variables.set(`step${detection.currentStep}_x`, eventData.clientX);
                detection.variables.set(`step${detection.currentStep}_y`, eventData.clientY);
            }

            detection.currentStep++;
            
            console.info(`🔍 Pattern step ${detection.currentStep}/${detection.pattern.steps.length} matched: ${currentStep.type}`);

            // Pattern completed?
            if (detection.currentStep >= detection.pattern.steps.length) {
                this.completeDetection(detection, 'success');
            }
        }

        // Check for timeout
        if (Date.now() - detection.startTime > detection.pattern.timeout) {
            this.completeDetection(detection, 'timeout');
        }
    }

    /**
     * Check if event matches pattern step
     */
    eventMatchesStep(eventType, eventData, step) {
        if (step.query) {
            // Handle GUI queries
            return this.evaluateGUIQuery(step);
        }

        // Handle direct event matching
        return eventType === step.type;
    }

    /**
     * Evaluate GUI state queries
     */
    evaluateGUIQuery(step) {
        switch (step.type) {
            case 'gui.canvas.components.selected':
                return document.querySelectorAll('[data-id].selected').length > 0;
                
            case 'gui.canvas.hasComponents.between':
                return this.hasComponentsBetween(
                    step.spatial.x1, step.spatial.y1,
                    step.spatial.x2, step.spatial.y2
                );
                
            case 'gui.canvas.selection.count':
                return document.querySelectorAll('[data-id].selected').length;
                
            default:
                return false;
        }
    }

    /**
     * Check if components exist between coordinates
     */
    hasComponentsBetween(x1, y1, x2, y2) {
        const components = document.querySelectorAll('[data-id]');
        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        const minY = Math.min(y1, y2);
        const maxY = Math.max(y1, y2);

        for (let component of components) {
            const rect = component.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            if (centerX >= minX && centerX <= maxX && 
                centerY >= minY && centerY <= maxY) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Complete pattern detection
     */
    completeDetection(detection, status) {
        detection.status = status;
        detection.endTime = Date.now();
        detection.duration = detection.endTime - detection.startTime;

        const result = {
            patternName: detection.pattern.name,
            status: status,
            duration: detection.duration,
            steps: detection.stepTimes,
            variables: Object.fromEntries(detection.variables),
            timestamp: detection.endTime
        };

        console.info(`${status === 'success' ? '✅' : '❌'} Pattern ${detection.pattern.name}: ${status} (${detection.duration}ms)`);

        // Send to backend for analysis
        this.sendDetectionResult(result);

        // Clean up
        this.activeDetections.delete(detection.id);
    }

    /**
     * Setup global event listeners
     */
    setupGlobalEventListeners() {
        // Mouse events
        document.addEventListener('mousedown', (e) => {
            const eventType = e.button === 0 ? 'mouse.button.left.down' : 'mouse.button.right.down';
            this.processEvent(eventType, e);
        });

        document.addEventListener('mouseup', (e) => {
            const eventType = e.button === 0 ? 'mouse.button.left.up' : 'mouse.button.right.up';
            this.processEvent(eventType, e);
        });

        document.addEventListener('mousemove', (e) => {
            this.processEvent('mouse.move', e);
        });

        document.addEventListener('click', (e) => {
            this.processEvent('mouse.button.left.click', e);
        });

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            this.processEvent('keyboard.key.down', { key: e.key, ctrlKey: e.ctrlKey, shiftKey: e.shiftKey });
        });

        document.addEventListener('keyup', (e) => {
            this.processEvent('keyboard.key.up', { key: e.key });
        });
    }

    /**
     * Send detection result to backend
     */
    async sendDetectionResult(result) {
        try {
            await fetch('http://localhost:5006/pattern-detections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionHash: this.sessionHash,
                    detection: result
                })
            });
        } catch (error) {
            // Silent fail
        }
    }

    /**
     * Get detection summary
     */
    getDetectionSummary() {
        const active = Array.from(this.activeDetections.values());
        const patterns = Array.from(this.patterns.values());
        
        return {
            totalPatterns: patterns.length,
            activeDetections: active.length,
            currentVariables: Object.fromEntries(this.variables),
            activePatterns: active.map(d => ({
                name: d.pattern.name,
                currentStep: d.currentStep,
                totalSteps: d.pattern.steps.length,
                progress: Math.round((d.currentStep / d.pattern.steps.length) * 100)
            }))
        };
    }
}

export default DeclarativeHMIDetector;
