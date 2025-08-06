/**
 * Event Bus
 * A simple pub/sub event bus for inter-component communication
 */

class EventBus {
  constructor() {
    this.events = new Map();
    this.debug = process.env.NODE_ENV === 'development';
  }

  /**
   * Subscribe to an event
   * @param {string} eventName - The name of the event to subscribe to
   * @param {Function} callback - The function to call when the event is emitted
   * @param {Object} [options] - Options for the subscription
   * @param {boolean} [options.once=false] - If true, the callback will be called at most once
   * @param {number} [options.priority=0] - Higher priority callbacks are called first
   * @returns {Function} A function to unsubscribe
   */
  on(eventName, callback, { once = false, priority = 0 } = {}) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }

    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }

    const eventHandlers = this.events.get(eventName);
    const handler = { callback, once, priority };
    
    // Insert in priority order (higher priority first)
    let i = 0;
    while (i < eventHandlers.length && eventHandlers[i].priority >= priority) {
      i++;
    }
    eventHandlers.splice(i, 0, handler);

    if (this.debug) {
      console.log(`[EventBus] Subscribed to ${eventName} (${eventHandlers.length} total handlers)`);
    }

    // Return unsubscribe function
    return () => this.off(eventName, callback);
  }

  /**
   * Subscribe to an event once
   * @param {string} eventName - The name of the event to subscribe to
   * @param {Function} callback - The function to call when the event is emitted
   * @param {Object} [options] - Options for the subscription
   * @param {number} [options.priority=0] - Higher priority callbacks are called first
   * @returns {Function} A function to unsubscribe
   */
  once(eventName, callback, { priority = 0 } = {}) {
    return this.on(eventName, callback, { once: true, priority });
  }

  /**
   * Unsubscribe from an event
   * @param {string} eventName - The name of the event to unsubscribe from
   * @param {Function} callback - The callback function to remove
   */
  off(eventName, callback) {
    if (!this.events.has(eventName)) return;

    const eventHandlers = this.events.get(eventName);
    const initialLength = eventHandlers.length;
    
    // Remove all instances of this callback
    for (let i = eventHandlers.length - 1; i >= 0; i--) {
      if (eventHandlers[i].callback === callback) {
        eventHandlers.splice(i, 1);
      }
    }

    if (this.debug && initialLength !== eventHandlers.length) {
      console.log(`[EventBus] Unsubscribed from ${eventName} (removed ${initialLength - eventHandlers.length} handlers)`);
    }

    // Clean up if no more handlers
    if (eventHandlers.length === 0) {
      this.events.delete(eventName);
    }
  }

  /**
   * Emit an event
   * @param {string} eventName - The name of the event to emit
   * @param {*} [data] - Data to pass to event handlers
   * @param {Object} [options] - Options for emitting
   * @param {boolean} [options.async=false] - If true, handlers are called asynchronously
   * @returns {Promise<Array>} A promise that resolves when all handlers have been called
   */
  emit(eventName, data = null, { async = false } = {}) {
    if (!this.events.has(eventName)) {
      if (this.debug) {
        console.log(`[EventBus] No subscribers for ${eventName}`);
      }
      return Promise.resolve([]);
    }

    const eventHandlers = [...this.events.get(eventName)];
    const results = [];

    if (this.debug) {
      console.groupCollapsed(`[EventBus] Emitting ${eventName} to ${eventHandlers.length} handlers`);
      console.log('Data:', data);
    }

    // Call handlers in order of priority (highest first)
    const callHandler = (handler) => {
      try {
        const result = handler.callback(data);
        results.push({ status: 'fulfilled', value: result });
        return result;
      } catch (error) {
        console.error(`[EventBus] Error in ${eventName} handler:`, error);
        results.push({ status: 'rejected', reason: error });
        return null;
      }
    };

    if (async) {
      // Call handlers asynchronously
      const promises = [];
      for (const handler of eventHandlers) {
        if (handler.once) {
          this.off(eventName, handler.callback);
        }
        
        if (async) {
          promises.push(
            Promise.resolve()
              .then(() => callHandler(handler))
              .catch(error => ({
                status: 'rejected',
                reason: error
              }))
          );
        } else {
          callHandler(handler);
        }
      }

      if (this.debug) {
        console.groupEnd();
      }

      return Promise.all(promises);
    }

    // Call handlers synchronously
    for (const handler of eventHandlers) {
      if (handler.once) {
        this.off(eventName, handler.callback);
      }
      callHandler(handler);
    }

    if (this.debug) {
      console.log('Results:', results);
      console.groupEnd();
    }

    return Promise.resolve(results);
  }

  /**
   * Get all event names with active subscriptions
   * @returns {string[]} Array of event names
   */
  getEventNames() {
    return Array.from(this.events.keys());
  }

  /**
   * Get all subscribers for an event
   * @param {string} eventName - The name of the event
   * @returns {Array} Array of subscriber information
   */
  getSubscribers(eventName) {
    if (!this.events.has(eventName)) return [];
    return this.events.get(eventName).map(handler => ({
      callback: handler.callback.name || 'anonymous',
      once: handler.once,
      priority: handler.priority
    }));
  }

  /**
   * Remove all event listeners
   * @param {string} [eventName] - Optional event name to clear, or clear all if not provided
   */
  clear(eventName) {
    if (eventName) {
      if (this.debug) {
        console.log(`[EventBus] Clearing all handlers for ${eventName}`);
      }
      this.events.delete(eventName);
    } else {
      if (this.debug) {
        console.log('[EventBus] Clearing all event handlers');
      }
      this.events.clear();
    }
  }

  /**
   * Enable or disable debug logging
   * @param {boolean} enabled - Whether to enable debug logging
   */
  setDebug(enabled) {
    this.debug = enabled;
    console.log(`[EventBus] Debug logging ${enabled ? 'enabled' : 'disabled'}`);
  }
}

// Create and export singleton instance
const eventBus = new EventBus();

// For debugging
if (typeof window !== 'undefined') {
  window.eventBus = eventBus;
}

export default eventBus;
