/**
 * HMI Touch Handler - Unified touch interaction management for mobile devices
 * @module hmi/input
 */

export class TouchHandler {
    constructor() {
        this.canvasElement = null;
        this.selectionCore = null;
        this.gestureDetector = null;
        
        this.activeTouches = new Map();
        this.touchStartTime = 0;
        this.lastTouchEnd = 0;
        this.tapThreshold = 300; // ms
        this.doubleTapThreshold = 300; // ms
        this.longPressThreshold = 500; // ms
        
        this.isLongPress = false;
        this.longPressTimer = null;
        
        this.eventHandlers = new Map();
    }

    /**
     * Initialize touch handler
     */
    init() {
        this.setupTouchListeners();
        console.log('👆 HMI Touch Handler initialized');
    }

    /**
     * Set references to other managers
     */
    setReferences(canvasElement, selectionCore, gestureDetector) {
        this.canvasElement = canvasElement;
        this.selectionCore = selectionCore;
        this.gestureDetector = gestureDetector;
    }

    /**
     * Setup touch event listeners
     */
    setupTouchListeners() {
        if (!this.canvasElement) return;

        this.canvasElement.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.canvasElement.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.canvasElement.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
        this.canvasElement.addEventListener('touchcancel', (e) => this.handleTouchCancel(e), { passive: false });
        
        console.log('👆 Touch event listeners attached');
    }

    /**
     * Handle touch start event
     */
    handleTouchStart(e) {
        // Prevent default to avoid mouse events
        e.preventDefault();
        
        this.touchStartTime = Date.now();
        this.isLongPress = false;

        // Store touch information
        for (let touch of e.changedTouches) {
            this.activeTouches.set(touch.identifier, {
                id: touch.identifier,
                startX: touch.clientX,
                startY: touch.clientY,
                currentX: touch.clientX,
                currentY: touch.clientY,
                startTime: this.touchStartTime,
                target: e.target
            });
        }

        // Start long press timer for single touch
        if (e.touches.length === 1) {
            this.startLongPressTimer(e.touches[0]);
        }

        // Handle multi-touch gestures
        if (e.touches.length === 2) {
            this.handleTwoFingerStart(e);
        }

        // Trigger custom event
        this.triggerEvent('touchstart', { 
            event: e, 
            touchCount: e.touches.length,
            touches: Array.from(e.touches)
        });

        console.log(`👆 Touch start: ${e.touches.length} fingers`);
    }

    /**
     * Handle touch move event
     */
    handleTouchMove(e) {
        e.preventDefault();

        // Update touch positions
        for (let touch of e.changedTouches) {
            const touchData = this.activeTouches.get(touch.identifier);
            if (touchData) {
                touchData.currentX = touch.clientX;
                touchData.currentY = touch.clientY;
            }
        }

        // Cancel long press if moved too much
        if (this.longPressTimer && this.hasTouchMovedSignificantly(e.touches[0])) {
            this.cancelLongPress();
        }

        // Handle multi-touch gestures
        if (e.touches.length === 2) {
            this.handleTwoFingerMove(e);
        }

        // Trigger custom event
        this.triggerEvent('touchmove', { 
            event: e, 
            touchCount: e.touches.length 
        });
    }

    /**
     * Handle touch end event
     */
    handleTouchEnd(e) {
        e.preventDefault();

        const now = Date.now();
        const touchDuration = now - this.touchStartTime;

        // Handle single tap
        if (e.touches.length === 0 && touchDuration < this.tapThreshold && !this.isLongPress) {
            this.handleTap(e);
        }

        // Check for double tap
        if (e.touches.length === 0) {
            const timeSinceLastTap = now - this.lastTouchEnd;
            if (timeSinceLastTap < this.doubleTapThreshold && touchDuration < this.tapThreshold) {
                this.handleDoubleTap(e);
            }
            this.lastTouchEnd = now;
        }

        // Clean up touch data
        for (let touch of e.changedTouches) {
            this.activeTouches.delete(touch.identifier);
        }

        this.cancelLongPress();

        // Trigger custom event
        this.triggerEvent('touchend', { 
            event: e, 
            duration: touchDuration,
            touchCount: e.touches.length 
        });

        console.log(`👆 Touch end: ${touchDuration}ms, remaining: ${e.touches.length}`);
    }

    /**
     * Handle touch cancel event
     */
    handleTouchCancel(e) {
        // Clean up all touch data
        for (let touch of e.changedTouches) {
            this.activeTouches.delete(touch.identifier);
        }

        this.cancelLongPress();

        // Trigger custom event
        this.triggerEvent('touchcancel', { event: e });

        console.log('👆 Touch cancelled');
    }

    /**
     * Handle single tap
     */
    handleTap(e) {
        // Convert to approximate click position
        const lastTouch = e.changedTouches[0];
        const component = this.getComponentFromTouch(lastTouch);

        if (component && this.selectionCore) {
            // Toggle selection on tap
            if (this.selectionCore.selectedComponents.has(component)) {
                this.selectionCore.deselectComponent(component);
            } else {
                this.selectionCore.clearSelection();
                this.selectionCore.selectComponent(component);
            }
        } else if (this.selectionCore) {
            // Tap on empty area clears selection
            this.selectionCore.clearSelection();
        }

        // Trigger custom event
        this.triggerEvent('tap', { 
            touch: lastTouch, 
            component: component 
        });

        console.log('👆 Single tap detected');
    }

    /**
     * Handle double tap
     */
    handleDoubleTap(e) {
        const lastTouch = e.changedTouches[0];
        const component = this.getComponentFromTouch(lastTouch);

        // Trigger custom event for double tap (e.g., open properties)
        this.triggerEvent('doubletap', { 
            touch: lastTouch, 
            component: component 
        });

        console.log('👆 Double tap detected');
    }

    /**
     * Start long press timer
     */
    startLongPressTimer(touch) {
        this.longPressTimer = setTimeout(() => {
            this.handleLongPress(touch);
        }, this.longPressThreshold);
    }

    /**
     * Handle long press
     */
    handleLongPress(touch) {
        this.isLongPress = true;
        
        const component = this.getComponentFromTouch(touch);

        // Trigger custom event for long press (e.g., context menu)
        this.triggerEvent('longpress', { 
            touch: touch, 
            component: component,
            position: { x: touch.clientX, y: touch.clientY }
        });

        console.log('👆 Long press detected');
    }

    /**
     * Cancel long press timer
     */
    cancelLongPress() {
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
    }

    /**
     * Check if touch has moved significantly
     */
    hasTouchMovedSignificantly(touch) {
        const touchData = this.activeTouches.get(touch.identifier);
        if (!touchData) return false;

        const distance = Math.sqrt(
            Math.pow(touch.clientX - touchData.startX, 2) +
            Math.pow(touch.clientY - touchData.startY, 2)
        );

        return distance > 10; // 10 pixel threshold
    }

    /**
     * Handle two finger gesture start
     */
    handleTwoFingerStart(e) {
        const touches = Array.from(e.touches);
        if (touches.length !== 2) return;

        const distance = this.getTouchDistance(touches[0], touches[1]);
        this.initialPinchDistance = distance;

        console.log('👆 Two finger gesture started');
    }

    /**
     * Handle two finger gesture move (pinch/zoom)
     */
    handleTwoFingerMove(e) {
        const touches = Array.from(e.touches);
        if (touches.length !== 2 || !this.initialPinchDistance) return;

        const currentDistance = this.getTouchDistance(touches[0], touches[1]);
        const scaleFactor = currentDistance / this.initialPinchDistance;

        // Trigger zoom event
        this.triggerEvent('pinch', { 
            scaleFactor: scaleFactor,
            center: this.getTouchCenter(touches[0], touches[1])
        });
    }

    /**
     * Get distance between two touches
     */
    getTouchDistance(touch1, touch2) {
        return Math.sqrt(
            Math.pow(touch2.clientX - touch1.clientX, 2) +
            Math.pow(touch2.clientY - touch1.clientY, 2)
        );
    }

    /**
     * Get center point between two touches
     */
    getTouchCenter(touch1, touch2) {
        return {
            x: (touch1.clientX + touch2.clientX) / 2,
            y: (touch1.clientY + touch2.clientY) / 2
        };
    }

    /**
     * Get component from touch event
     */
    getComponentFromTouch(touch) {
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        if (!element) return null;

        if (this.selectionCore) {
            // Use existing method from selection core
            const fakeEvent = { target: element };
            return this.selectionCore.getComponentFromEvent(fakeEvent);
        }

        // Fallback implementation
        let current = element;
        while (current && current !== this.canvasElement) {
            if (current.hasAttribute && current.hasAttribute('data-id')) {
                return current;
            }
            current = current.parentElement;
        }
        return null;
    }

    /**
     * Register event handler
     */
    on(eventType, handler) {
        if (!this.eventHandlers.has(eventType)) {
            this.eventHandlers.set(eventType, new Set());
        }
        this.eventHandlers.get(eventType).add(handler);
        
        return () => this.off(eventType, handler);
    }

    /**
     * Unregister event handler
     */
    off(eventType, handler) {
        const handlers = this.eventHandlers.get(eventType);
        if (handlers) {
            handlers.delete(handler);
        }
    }

    /**
     * Trigger custom event
     */
    triggerEvent(eventType, data) {
        const handlers = this.eventHandlers.get(eventType);
        if (handlers) {
            handlers.forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`🔴 Touch handler error (${eventType}):`, error);
                }
            });
        }
    }

    /**
     * Destroy touch handler
     */
    destroy() {
        if (this.canvasElement) {
            this.canvasElement.removeEventListener('touchstart', this.handleTouchStart);
            this.canvasElement.removeEventListener('touchmove', this.handleTouchMove);
            this.canvasElement.removeEventListener('touchend', this.handleTouchEnd);
            this.canvasElement.removeEventListener('touchcancel', this.handleTouchCancel);
        }

        this.cancelLongPress();
        this.activeTouches.clear();
        this.eventHandlers.clear();

        console.log('👆 HMI Touch Handler destroyed');
    }
}

// Create and export singleton instance
export const touchHandler = new TouchHandler();
export default touchHandler;
