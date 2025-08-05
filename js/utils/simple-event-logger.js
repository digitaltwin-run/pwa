/**
 * Simple Event-Based Logger - Solution 1
 * 
 * HIGH-LEVEL APPROACH:
 * - Simple event names: user.click, component.select, component.move
 * - Generic object references: component-123, canvas, properties-panel  
 * - Minimal parameters: only essential context
 * - Details saved separately for debugging
 */

export class SimpleEventLogger {
    constructor(sessionHash) {
        this.sessionHash = sessionHash;
        this.events = [];
        this.eventId = 0;
        this.startTime = Date.now();
        
        // Simplified event types
        this.eventTypes = {
            // User actions
            USER_CLICK: 'user.click',
            USER_DRAG: 'user.drag', 
            USER_KEY: 'user.key',
            
            // Component events  
            COMPONENT_SELECT: 'component.select',
            COMPONENT_MOVE: 'component.move',
            COMPONENT_CREATE: 'component.create',
            COMPONENT_DELETE: 'component.delete',
            
            // System events
            SYSTEM_READY: 'system.ready',
            SYSTEM_ERROR: 'system.error',
            
            // Workflow events
            WORKFLOW_START: 'workflow.start',
            WORKFLOW_SUCCESS: 'workflow.success', 
            WORKFLOW_FAILED: 'workflow.failed'
        };
        
        this.init();
    }

    init() {
        this.setupSimpleTracking();
        console.info('📝 Simple Event Logger initialized');
    }

    /**
     * Log simple high-level event
     */
    logEvent(eventType, target, outcome = 'pending', context = {}) {
        const event = {
            id: ++this.eventId,
            time: Date.now() - this.startTime,
            type: eventType,
            target: this.simplifyTarget(target),
            outcome: outcome,
            context: this.simplifyContext(context),
            session: this.sessionHash
        };

        this.events.push(event);
        this.sendToBackend(event);
        
        // Only log important events to console to avoid spam
        if (this.isImportantEvent(eventType)) {
            console.info(`📝 ${eventType} → ${target} = ${outcome}`);
        }
    }

    /**
     * Simplify target to generic reference
     */
    simplifyTarget(target) {
        if (typeof target === 'string') return target;
        
        if (target?.dataset?.id) {
            return `component-${target.dataset.id}`;
        }
        
        if (target?.id === 'svg-canvas') {
            return 'canvas';
        }
        
        if (target?.className?.includes('properties-panel')) {
            return 'properties-panel';
        }
        
        if (target?.tagName === 'BUTTON') {
            return `button-${target.textContent?.slice(0, 10) || 'unknown'}`;
        }
        
        return target?.tagName?.toLowerCase() || 'unknown';
    }

    /**
     * Simplify context to essential info only
     */
    simplifyContext(context) {
        const simple = {};
        
        // Only keep essential context
        if (context.position) {
            simple.moved = context.position.distance > 10 ? 'yes' : 'no';
        }
        
        if (context.key) {
            simple.key = context.key;
        }
        
        if (context.count !== undefined) {
            simple.count = context.count;
        }
        
        if (context.error) {
            simple.error = context.error.slice(0, 50);
        }
        
        return simple;
    }

    /**
     * Check if event is important enough to log to console
     */
    isImportantEvent(eventType) {
        const important = [
            this.eventTypes.COMPONENT_SELECT,
            this.eventTypes.COMPONENT_MOVE,
            this.eventTypes.COMPONENT_CREATE,
            this.eventTypes.SYSTEM_ERROR,
            this.eventTypes.WORKFLOW_FAILED
        ];
        return important.includes(eventType);
    }

    /**
     * Setup simple event tracking
     */
    setupSimpleTracking() {
        // Track clicks with simplified logging
        document.addEventListener('click', (e) => {
            this.logEvent(this.eventTypes.USER_CLICK, e.target, 'success');
            
            // Detect component selection
            if (e.target?.dataset?.id) {
                this.logEvent(this.eventTypes.COMPONENT_SELECT, e.target, 'pending');
                
                // Check if actually selected after delay
                setTimeout(() => {
                    const isSelected = e.target.classList.contains('selected');
                    this.logEvent(this.eventTypes.COMPONENT_SELECT, e.target, 
                        isSelected ? 'success' : 'failed');
                }, 200);
            }
        });

        // Track keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'c') {
                this.logEvent(this.eventTypes.USER_KEY, 'copy', 'success');
                this.logEvent(this.eventTypes.WORKFLOW_START, 'copy-workflow', 'pending');
            }
            
            if (e.ctrlKey && e.key === 'v') {
                this.logEvent(this.eventTypes.USER_KEY, 'paste', 'success');
                
                // Check if component created after paste
                const beforeCount = document.querySelectorAll('[data-id]').length;
                setTimeout(() => {
                    const afterCount = document.querySelectorAll('[data-id]').length;
                    if (afterCount > beforeCount) {
                        this.logEvent(this.eventTypes.COMPONENT_CREATE, 'canvas', 'success', 
                            { count: afterCount - beforeCount });
                        this.logEvent(this.eventTypes.WORKFLOW_SUCCESS, 'copy-workflow', 'success');
                    } else {
                        this.logEvent(this.eventTypes.WORKFLOW_FAILED, 'copy-workflow', 'failed');
                    }
                }, 500);
            }
            
            if (e.key === 'Delete') {
                this.logEvent(this.eventTypes.USER_KEY, 'delete', 'success');
                this.logEvent(this.eventTypes.WORKFLOW_START, 'delete-workflow', 'pending');
            }
        });

        // Track system errors
        window.addEventListener('error', (e) => {
            this.logEvent(this.eventTypes.SYSTEM_ERROR, 'javascript', 'failed', 
                { error: e.message });
        });

        // Track custom events
        document.addEventListener('component-added', (e) => {
            this.logEvent(this.eventTypes.COMPONENT_CREATE, 'canvas', 'success');
        });

        document.addEventListener('canvas-selection-changed', (e) => {
            const count = e.detail?.selectedComponents?.length || 0;
            this.logEvent(this.eventTypes.COMPONENT_SELECT, 'canvas', 'success', { count });
        });
    }

    /**
     * Send to backend (throttled to avoid performance impact)
     */
    async sendToBackend(event) {
        // Throttle backend calls to avoid performance impact
        if (!this.backendQueue) {
            this.backendQueue = [];
            setTimeout(() => this.flushBackendQueue(), 1000); // Send every 1 second
        }
        
        this.backendQueue.push(event);
    }

    async flushBackendQueue() {
        if (this.backendQueue?.length > 0) {
            try {
                await fetch('http://localhost:5006/simple-events', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sessionHash: this.sessionHash,
                        events: this.backendQueue
                    })
                });
            } catch (error) {
                // Silent fail to avoid console spam
            }
            
            this.backendQueue = null;
        }
    }

    /**
     * Get simplified event summary for testing
     */
    getEventSummary(timeWindow = 5000) {
        const recent = this.events.filter(e => 
            Date.now() - this.startTime - e.time < timeWindow
        );
        
        return {
            total: recent.length,
            successes: recent.filter(e => e.outcome === 'success').length,
            failures: recent.filter(e => e.outcome === 'failed').length,
            pending: recent.filter(e => e.outcome === 'pending').length,
            workflows: recent.filter(e => e.type.includes('workflow')),
            lastEvents: recent.slice(-5)
        };
    }
}

export default SimpleEventLogger;
