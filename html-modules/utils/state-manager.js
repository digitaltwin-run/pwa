/**
 * State Manager
 * A simple state management utility with reactive updates
 */

class StateManager {
  constructor(initialState = {}) {
    this.state = new Proxy(initialState, this._createHandler());
    this.subscribers = new Map();
    this.middleware = [];
    this.debug = process.env.NODE_ENV === 'development';
    this.history = [];
    this.historyIndex = -1;
    this.historyLimit = 50; // Maximum number of states to keep in history
    this.timeTravelInProgress = false;
  }

  /**
   * Create a proxy handler for state changes
   * @private
   */
  _createHandler() {
    return {
      set: (target, property, value) => {
        const oldValue = target[property];
        
        // Only proceed if the value has actually changed
        if (JSON.stringify(oldValue) === JSON.stringify(value)) {
          return true;
        }
        
        // Apply middleware
        const newValue = this._applyMiddleware(property, value, oldValue);
        
        // Update the state
        target[property] = newValue;
        
        // Save to history if not in the middle of time travel
        if (!this.timeTravelInProgress) {
          this._addToHistory(property, oldValue, newValue);
        }
        
        // Notify subscribers
        this._notifySubscribers(property, newValue, oldValue);
        
        if (this.debug) {
          console.groupCollapsed(`[StateManager] State changed: ${property}`);
          console.log('Old value:', oldValue);
          console.log('New value:', newValue);
          console.trace('State change originated from:');
          console.groupEnd();
        }
        
        return true;
      },
      
      deleteProperty: (target, property) => {
        const oldValue = target[property];
        
        // Delete the property
        delete target[property];
        
        // Save to history if not in the middle of time travel
        if (!this.timeTravelInProgress) {
          this._addToHistory(property, oldValue, undefined, true);
        }
        
        // Notify subscribers
        this._notifySubscribers(property, undefined, oldValue, true);
        
        if (this.debug) {
          console.log(`[StateManager] Property deleted: ${property}`, oldValue);
        }
        
        return true;
      }
    };
  }
  
  /**
   * Apply middleware to state changes
   * @private
   */
  _applyMiddleware(property, newValue, oldValue) {
    return this.middleware.reduce((value, middleware) => {
      try {
        return middleware(property, value, oldValue, this.state) || value;
      } catch (error) {
        console.error(`[StateManager] Error in middleware for ${property}:`, error);
        return value;
      }
    }, newValue);
  }
  
  /**
   * Add a state change to the history
   * @private
   */
  _addToHistory(property, oldValue, newValue, isDelete = false) {
    // If we're not at the end of history, truncate the future history
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }
    
    // Add to history
    this.history.push({
      property,
      oldValue,
      newValue,
      timestamp: new Date().toISOString(),
      isDelete
    });
    
    // Update history index
    this.historyIndex = this.history.length - 1;
    
    // Limit history size
    if (this.history.length > this.historyLimit) {
      this.history.shift();
      this.historyIndex--;
    }
  }
  
  /**
   * Notify subscribers about a state change
   * @private
   */
  _notifySubscribers(property, newValue, oldValue, isDelete = false) {
    if (!this.subscribers.has(property)) return;
    
    const subscribers = this.subscribers.get(property);
    
    subscribers.forEach(({ callback, componentId }) => {
      try {
        callback(newValue, oldValue, isDelete);
      } catch (error) {
        console.error(
          `[StateManager] Error in subscriber for ${property}${componentId ? ` (component: ${componentId})` : ''}:`,
          error
        );
      }
    });
  }

  /**
   * Get the current state or a specific property
   * @param {string} [property] - Optional property to get
   * @returns {*} The current state or the value of the specified property
   */
  get(property) {
    if (property === undefined) {
      return { ...this.state };
    }
    return this.state[property];
  }

  /**
   * Set a state property
   * @param {string|Object} property - Property name or object of properties to set
   * @param {*} [value] - Value to set (if property is a string)
   */
  set(property, value) {
    if (typeof property === 'object' && property !== null) {
      // Batch update multiple properties
      Object.entries(property).forEach(([key, val]) => {
        this.state[key] = val;
      });
    } else if (typeof property === 'string') {
      this.state[property] = value;
    }
  }

  /**
   * Subscribe to state changes
   * @param {string|string[]} properties - Property or array of properties to subscribe to
   * @param {Function} callback - Function to call when the state changes
   * @param {string} [componentId] - Optional component ID for debugging
   * @returns {Function} Function to unsubscribe
   */
  subscribe(properties, callback, componentId) {
    if (!Array.isArray(properties)) {
      properties = [properties];
    }
    
    const unsubscribeFns = [];
    
    properties.forEach(property => {
      if (!this.subscribers.has(property)) {
        this.subscribers.set(property, new Set());
      }
      
      const subscriber = { callback, componentId };
      this.subscribers.get(property).add(subscriber);
      
      if (this.debug) {
        console.log(`[StateManager] New subscription to ${property}${componentId ? ` from ${componentId}` : ''}`);
      }
      
      // Immediately call the callback with the current value
      try {
        callback(this.state[property], undefined, false);
      } catch (error) {
        console.error(
          `[StateManager] Error in initial subscription callback for ${property}`,
          error
        );
      }
      
      // Create unsubscribe function for this property
      const unsubscribe = () => {
        if (this.subscribers.has(property)) {
          this.subscribers.get(property).delete(subscriber);
          
          if (this.subscribers.get(property).size === 0) {
            this.subscribers.delete(property);
          }
          
          if (this.debug) {
            console.log(`[StateManager] Unsubscribed from ${property}${componentId ? ` (component: ${componentId})` : ''}`);
          }
        }
      };
      
      unsubscribeFns.push(unsubscribe);
    });
    
    // Return a function to unsubscribe from all properties
    return () => {
      unsubscribeFns.forEach(unsubscribe => unsubscribe());
    };
  }

  /**
   * Add middleware to the state manager
   * @param {Function} middleware - Middleware function
   */
  use(middleware) {
    if (typeof middleware !== 'function') {
      throw new Error('Middleware must be a function');
    }
    
    this.middleware.push(middleware);
    return this;
  }

  /**
   * Time travel to a previous state
   * @param {number} steps - Number of steps to go back (negative) or forward (positive)
   * @returns {boolean} True if time travel was successful
   */
  timeTravel(steps) {
    if (steps === 0 || this.history.length === 0) return false;
    
    const targetIndex = this.historyIndex + steps;
    
    // Bounds checking
    if (targetIndex < -1 || targetIndex >= this.history.length) {
      return false;
    }
    
    this.timeTravelInProgress = true;
    
    try {
      if (steps < 0) {
        // Going back in time
        for (let i = this.historyIndex; i > targetIndex; i--) {
          const { property, oldValue, isDelete } = this.history[i];
          
          if (isDelete) {
            // If the action was a delete, restore the old value
            this.state[property] = oldValue;
          } else if (oldValue === undefined) {
            // If the property was added, delete it
            delete this.state[property];
          } else {
            // Otherwise, restore the old value
            this.state[property] = oldValue;
          }
        }
      } else {
        // Going forward in time
        for (let i = this.historyIndex + 1; i <= targetIndex; i++) {
          const { property, newValue, isDelete } = this.history[i];
          
          if (isDelete) {
            delete this.state[property];
          } else {
            this.state[property] = newValue;
          }
        }
      }
      
      this.historyIndex = targetIndex;
      return true;
    } catch (error) {
      console.error('[StateManager] Error during time travel:', error);
      return false;
    } finally {
      this.timeTravelInProgress = false;
    }
  }

  /**
   * Reset the state to its initial value
   * @param {Object} [newInitialState] - Optional new initial state
   */
  reset(newInitialState) {
    if (newInitialState) {
      this.state = new Proxy(newInitialState, this._createHandler());
    } else {
      // Reset to empty state
      const initialState = {};
      this.state = new Proxy(initialState, this._createHandler());
    }
    
    // Clear history and subscribers
    this.history = [];
    this.historyIndex = -1;
    this.subscribers.clear();
    
    if (this.debug) {
      console.log('[StateManager] State has been reset');
    }
  }

  /**
   * Enable or disable debug logging
   * @param {boolean} enabled - Whether to enable debug logging
   */
  setDebug(enabled) {
    this.debug = enabled;
    console.log(`[StateManager] Debug logging ${enabled ? 'enabled' : 'disabled'}`);
  }
}

// Create and export singleton instance
const stateManager = new StateManager();

// For debugging
if (typeof window !== 'undefined') {
  window.stateManager = stateManager;
}

export default stateManager;
