/**
 * HMI Event Tracker - User Interaction Logging
 * Captures all user interactions and correlates them with application state
 * for anomaly detection and user journey analysis
 */

class HMIEventTracker {
    constructor(logger) {
        this.logger = logger;
        this.eventSequenceId = 0;
        this.activeGestures = new Map();
        this.lastMousePosition = { x: 0, y: 0 };
        this.selectionAttempts = [];
        this.init();
    }

    /**
     * Initialize HMI event tracking
     */
    init() {
        this.setupMouseTracking();
        this.setupClickTracking();
        this.setupKeyboardTracking();
        this.setupCanvasTracking();
        this.setupComponentTracking();
        
        console.info('🎯 HMI Event Tracker initialized');
    }

    /**
     * Generate unique event sequence ID
     */
    getNextEventId() {
        return ++this.eventSequenceId;
    }

    /**
     * Log HMI event with correlation data
     */
    logHMIEvent(eventType, eventData, expectedOutcome = null) {
        const hmiEvent = {
            eventId: this.getNextEventId(),
            timestamp: Date.now(),
            type: 'hmi_event',
            eventType: eventType,
            data: eventData,
            expectedOutcome: expectedOutcome,
            mousePosition: { ...this.lastMousePosition },
            activeGestures: Array.from(this.activeGestures.keys()),
            url: window.location.href,
            sessionHash: this.logger.sessionHash
        };

        // Send to logger immediately
        this.logger.captureLogEntry('hmi', [
            `🎯 HMI Event: ${eventType}`,
            JSON.stringify(hmiEvent, null, 2)
        ]);

        return hmiEvent;
    }

    /**
     * Setup mouse movement and position tracking
     */
    setupMouseTracking() {
        let mouseMoveTimeout;
        
        document.addEventListener('mousemove', (event) => {
            this.lastMousePosition = {
                x: event.clientX,
                y: event.clientY,
                elementTarget: event.target.tagName,
                elementId: event.target.id,
                elementClass: event.target.className
            };

            // Throttle mouse move logging (every 100ms max)
            clearTimeout(mouseMoveTimeout);
            mouseMoveTimeout = setTimeout(() => {
                this.logHMIEvent('mouse_move', {
                    position: this.lastMousePosition,
                    overElement: {
                        tag: event.target.tagName,
                        id: event.target.id,
                        class: event.target.className,
                        dataId: event.target.dataset.id
                    }
                });
            }, 100);
        });

        // Track mouse enter/leave on important elements
        const trackableSelectors = [
            '[data-id]',           // Components
            '.draggable-component', // Draggable components  
            '#svg-canvas',         // Canvas
            '.component-item',     // Sidebar items
            'button',              // All buttons
            'input',               // All inputs
            '.properties-panel'    // Properties panel
        ];

        trackableSelectors.forEach(selector => {
            document.addEventListener('mouseenter', (event) => {
                if (event.target && event.target.matches && event.target.matches(selector)) {
                    this.logHMIEvent('mouse_enter', {
                        element: {
                            selector: selector,
                            tag: event.target.tagName,
                            id: event.target.id,
                            class: event.target.className,
                            dataId: event.target.dataset?.id
                        }
                    });
                }
            }, true);

            document.addEventListener('mouseleave', (event) => {
                if (event.target && event.target.matches && event.target.matches(selector)) {
                    this.logHMIEvent('mouse_leave', {
                        element: {
                            selector: selector,
                            tag: event.target.tagName,
                            id: event.target.id,
                            class: event.target.className,
                            dataId: event.target.dataset?.id
                        }
                    });
                }
            }, true);
        });
    }

    /**
     * Setup click and selection tracking
     */
    setupClickTracking() {
        document.addEventListener('mousedown', (event) => {
            const clickData = {
                button: event.button,
                position: { x: event.clientX, y: event.clientY },
                target: {
                    tag: event.target.tagName,
                    id: event.target.id,
                    class: event.target.className,
                    dataId: event.target.dataset.id
                },
                modifiers: {
                    ctrl: event.ctrlKey,
                    shift: event.shiftKey,
                    alt: event.altKey
                }
            };

            // Predict expected outcome based on target
            let expectedOutcome = null;
            if (event.target.dataset.id) {
                expectedOutcome = 'component_selection';
            } else if (event.target.matches('#svg-canvas')) {
                expectedOutcome = 'canvas_click';
            } else if (event.target.matches('button')) {
                expectedOutcome = 'button_action';
            }

            this.logHMIEvent('mouse_down', clickData, expectedOutcome);

            // Track selection attempts
            if (expectedOutcome === 'component_selection') {
                this.trackSelectionAttempt(event.target.dataset.id, clickData);
            }
        });

        document.addEventListener('mouseup', (event) => {
            this.logHMIEvent('mouse_up', {
                button: event.button,
                position: { x: event.clientX, y: event.clientY },
                target: {
                    tag: event.target.tagName,
                    id: event.target.id,
                    class: event.target.className,
                    dataId: event.target.dataset.id
                }
            });
        });

        document.addEventListener('click', (event) => {
            this.logHMIEvent('click', {
                position: { x: event.clientX, y: event.clientY },
                target: {
                    tag: event.target.tagName,
                    id: event.target.id,
                    class: event.target.className,
                    dataId: event.target.dataset.id
                },
                expectedAction: this.predictClickAction(event.target)
            });
        });
    }

    /**
     * Setup keyboard interaction tracking
     */
    setupKeyboardTracking() {
        document.addEventListener('keydown', (event) => {
            this.logHMIEvent('key_down', {
                key: event.key,
                code: event.code,
                modifiers: {
                    ctrl: event.ctrlKey,
                    shift: event.shiftKey,
                    alt: event.altKey
                },
                activeElement: {
                    tag: document.activeElement.tagName,
                    id: document.activeElement.id,
                    class: document.activeElement.className
                },
                expectedAction: this.predictKeyAction(event)
            });
        });

        // Track special key combinations
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Delete' || event.key === 'Backspace') {
                this.logHMIEvent('delete_key', {
                    key: event.key,
                    expectedOutcome: 'component_deletion'
                });
            }
            
            if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
                this.logHMIEvent('copy_key', {
                    expectedOutcome: 'component_copy'
                });
            }
            
            if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
                this.logHMIEvent('paste_key', {
                    expectedOutcome: 'component_paste'
                });
            }
        });
    }

    /**
     * Setup canvas-specific tracking
     */
    setupCanvasTracking() {
        const canvas = document.getElementById('svg-canvas');
        if (!canvas) return;

        // Track drag operations
        let dragStart = null;
        
        canvas.addEventListener('mousedown', (event) => {
            dragStart = {
                x: event.clientX,
                y: event.clientY,
                timestamp: Date.now(),
                target: event.target
            };
            
            this.logHMIEvent('canvas_drag_start', {
                startPosition: dragStart,
                expectedOutcome: 'component_move_or_selection'
            });
        });

        canvas.addEventListener('mousemove', (event) => {
            if (dragStart && event.buttons > 0) {
                const dragDistance = Math.sqrt(
                    Math.pow(event.clientX - dragStart.x, 2) + 
                    Math.pow(event.clientY - dragStart.y, 2)
                );
                
                if (dragDistance > 5) { // Only log significant drags
                    this.logHMIEvent('canvas_drag_move', {
                        startPosition: dragStart,
                        currentPosition: { x: event.clientX, y: event.clientY },
                        distance: dragDistance,
                        expectedOutcome: 'component_position_change'
                    });
                }
            }
        });

        canvas.addEventListener('mouseup', (event) => {
            if (dragStart) {
                const dragEnd = {
                    x: event.clientX,
                    y: event.clientY,
                    timestamp: Date.now()
                };
                
                const totalDistance = Math.sqrt(
                    Math.pow(dragEnd.x - dragStart.x, 2) + 
                    Math.pow(dragEnd.y - dragStart.y, 2)
                );
                
                this.logHMIEvent('canvas_drag_end', {
                    startPosition: dragStart,
                    endPosition: dragEnd,
                    totalDistance: totalDistance,
                    duration: dragEnd.timestamp - dragStart.timestamp,
                    expectedOutcome: totalDistance > 10 ? 'component_moved' : 'selection_only'
                });
                
                dragStart = null;
            }
        });
    }

    /**
     * Setup component interaction tracking
     */
    setupComponentTracking() {
        // Listen for custom component events
        document.addEventListener('component-added', (event) => {
            this.logHMIEvent('component_added', {
                componentId: event.detail.componentId,
                componentType: event.detail.componentType,
                position: event.detail.position,
                source: 'system_event'
            });
        });

        document.addEventListener('canvas-selection-changed', (event) => {
            this.logHMIEvent('selection_changed', {
                selectedComponents: event.detail.selectedComponents?.map(c => c.dataset?.id) || [],
                selectionCount: event.detail.selectedComponents?.length || 0,
                source: 'system_event'
            });
        });

        document.addEventListener('component-property-changed', (event) => {
            this.logHMIEvent('property_changed', {
                componentId: event.detail.componentId,
                property: event.detail.property,
                oldValue: event.detail.oldValue,
                newValue: event.detail.newValue,
                source: 'system_event'
            });
        });
    }

    /**
     * Track selection attempts and their outcomes
     */
    trackSelectionAttempt(componentId, clickData) {
        const attempt = {
            attemptId: this.getNextEventId(),
            timestamp: Date.now(),
            componentId: componentId,
            clickData: clickData,
            resolved: false
        };

        this.selectionAttempts.push(attempt);

        // Set timeout to check if selection was successful
        setTimeout(() => {
            this.verifySelectionAttempt(attempt);
        }, 500); // Give 500ms for selection to complete
    }

    /**
     * Verify if selection attempt was successful
     */
    verifySelectionAttempt(attempt) {
        // Check if component is now selected
        const component = document.querySelector(`[data-id="${attempt.componentId}"]`);
        const isSelected = component?.classList.contains('selected') || false;
        
        attempt.resolved = true;
        attempt.outcome = isSelected ? 'success' : 'failed';
        
        this.logHMIEvent('selection_attempt_result', {
            attemptId: attempt.attemptId,
            componentId: attempt.componentId,
            outcome: attempt.outcome,
            isSelected: isSelected,
            anomaly: !isSelected ? 'selection_failed' : null
        });
    }

    /**
     * Predict expected action from click target
     */
    predictClickAction(target) {
        if (target.dataset.id) return 'select_component';
        if (target.matches('button')) return 'button_click';
        if (target.matches('input')) return 'input_focus';
        if (target.matches('#svg-canvas')) return 'canvas_click';
        return 'unknown';
    }

    /**
     * Predict expected action from key event
     */
    predictKeyAction(event) {
        if (event.key === 'Delete') return 'delete_selected';
        if (event.key === 'Escape') return 'clear_selection';
        if (event.ctrlKey && event.key === 'c') return 'copy_selected';
        if (event.ctrlKey && event.key === 'v') return 'paste_components';
        if (event.ctrlKey && event.key === 'a') return 'select_all';
        return 'unknown';
    }

    /**
     * Get current HMI state for anomaly detection
     */
    getCurrentHMIState() {
        return {
            mousePosition: this.lastMousePosition,
            activeGestures: Array.from(this.activeGestures.keys()),
            pendingSelectionAttempts: this.selectionAttempts.filter(a => !a.resolved).length,
            recentSelectionAttempts: this.selectionAttempts.slice(-10)
        };
    }
}

export default HMIEventTracker;
