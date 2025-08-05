/**
 * @file Gesture detection and recognition
 * @module hmi/gestures/GestureDetector
 */

import { PatternDetectors } from './PatternDetectors.js';

/**
 * Default gesture configuration
 * @type {Object}
 */
const DEFAULT_CONFIG = {
  enabled: true,
  priority: 0,
  cooldown: 0,
  lastTriggered: 0,
  areaBounds: null,
  touchCount: 1,
  condition: null,
  callback: null,
  options: {}
};

/**
 * Handles gesture detection on a target element
 */
export class GestureDetector {
  /**
   * Create a new GestureDetector
   * @param {HTMLElement} target - The target element for gesture detection
   */
  constructor(target = document) {
    this.target = target;
    this.gestures = new Map();
    this.currentPoints = [];
    this.touchHistory = [];
    this.isDrawing = false;
    this.rafId = null;
    this.debug = false;
    
    this.setupEventListeners();
  }

  /**
   * Set up event listeners for mouse and touch events
   * @private
   */
  setupEventListeners() {
    // Mouse events
    this.target.addEventListener('mousedown', this.handleMouseDown);
    this.target.addEventListener('mousemove', this.handleMouseMove);
    this.target.addEventListener('mouseup', this.handleMouseUp);
    this.target.addEventListener('mouseleave', this.handleMouseUp);
    
    // Touch events
    this.target.addEventListener('touchstart', this.handleTouchStart, { passive: true });
    this.target.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    this.target.addEventListener('touchend', this.handleTouchEnd);
    this.target.addEventListener('touchcancel', this.handleTouchEnd);
  }

  // Event handlers with proper binding
  handleMouseDown = (e) => this.startDrawing(e);
  handleMouseMove = (e) => this.addPoint(e);
  handleMouseUp = (e) => this.stopDrawing(e);
  
  handleTouchStart = (e) => {
    e.preventDefault();
    if (e.touches.length === 1) {
      this.startDrawing(e.touches[0]);
    }
  };
  
  handleTouchMove = (e) => {
    e.preventDefault();
    if (e.touches.length === 1) {
      this.addPoint(e.touches[0]);
    }
  };
  
  handleTouchEnd = (e) => {
    e.preventDefault();
    this.stopDrawing(e.changedTouches[0] || {});
  };

  /**
   * Start tracking a new gesture
   * @private
   * @param {MouseEvent|Touch} e - The start event
   */
  startDrawing(e) {
    if (!e || !e.clientX || !e.clientY) return;
    
    this.isDrawing = true;
    this.currentPoints = [{
      x: e.clientX,
      y: e.clientY,
      timestamp: Date.now()
    }];
    
    if (this.debug) {
      console.log('🖱️ Started drawing at', this.currentPoints[0]);
    }
  }

  /**
   * Add a point to the current gesture
   * @private
   * @param {MouseEvent|Touch} e - The move event
   */
  addPoint(e) {
    if (!this.isDrawing || !e || !e.clientX || !e.clientY) return;
    
    this.currentPoints.push({
      x: e.clientX,
      y: e.clientY,
      timestamp: Date.now()
    });
    
    // Limit points to prevent memory issues
    if (this.currentPoints.length > 100) {
      this.currentPoints.shift();
    }
    
    // Update animation frame
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    this.rafId = requestAnimationFrame(() => {
      // Visual feedback or continuous gesture handling can go here
    });
  }

  /**
   * Stop tracking the current gesture and analyze it
   * @private
   * @param {MouseEvent|Touch} e - The end event
   */
  stopDrawing(e) {
    if (!this.isDrawing) return;
    
    this.isDrawing = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    
    if (this.currentPoints.length > 2) {
      this.analyzeGesture();
    }
    
    // Store the last gesture in history
    if (this.currentPoints.length > 0) {
      this.touchHistory = [...this.currentPoints];
      if (this.touchHistory.length > 10) {
        this.touchHistory = this.touchHistory.slice(-10);
      }
    }
    
    this.currentPoints = [];
  }

  /**
   * Analyze the current gesture against registered patterns
   * @private
   */
  analyzeGesture() {
    if (this.currentPoints.length < 3) return;
    
    // Sort gestures by priority (higher priority first)
    const sortedGestures = Array.from(this.gestures.entries())
      .filter(([_, config]) => config.enabled)
      .sort(([_, a], [__, b]) => (b.priority || 0) - (a.priority || 0));
    
    // Test all registered gestures
    for (const [name, config] of sortedGestures) {
      const detector = PatternDetectors[config.type];
      if (!detector) continue;
      
      // Check area bounds if specified
      if (config.areaBounds && !this.isInArea(this.currentPoints, config.areaBounds)) {
        continue;
      }
      
      // Check touch count for multi-touch gestures
      if (config.touchCount > 1 && this.touchHistory.length < config.touchCount) {
        continue;
      }
      
      // Check cooldown
      const now = Date.now();
      if (now - config.lastTriggered < (config.cooldown || 0)) {
        continue;
      }
      
      // Check condition if specified
      if (config.condition && !config.condition()) {
        continue;
      }
      
      // Detect the gesture
      let result;
      try {
        result = detector(this.currentPoints, config.options);
      } catch (error) {
        console.error(`Error in ${name} gesture detector:`, error);
        continue;
      }
      
      if (result && result.detected) {
        config.lastTriggered = now;
        
        if (this.debug) {
          console.log(`✅ Detected gesture: ${name}`, result);
        }
        
        // Execute the callback if provided
        if (typeof config.callback === 'function') {
          try {
            config.callback({
              name,
              type: config.type,
              result,
              points: [...this.currentPoints]
            });
          } catch (error) {
            console.error(`Error in ${name} gesture callback:`, error);
          }
        }
        
        break; // Stop after the first detected gesture
      }
    }
  }

  /**
   * Check if points are within specified bounds
   * @private
   */
  isInArea(points, bounds) {
    if (!bounds || !points.length) return true;
    
    const { top = 0, right = window.innerWidth, bottom = window.innerHeight, left = 0 } = bounds;
    
    return points.every(point => {
      return point.x >= left && point.x <= right && point.y >= top && point.y <= bottom;
    });
  }

  // ===== Public API =====
  
  /**
   * Register a new gesture
   * @param {string} name - Name of the gesture
   * @returns {Object} Fluent API for gesture configuration
   */
  gesture(name) {
    if (!name || typeof name !== 'string') {
      throw new Error('Gesture name must be a non-empty string');
    }
    
    const self = this;
    
    // Create fluent API object
    const fluentApi = {
      // Set gesture type
      circle: (options = {}) => {
        self.registerGestureOnly(name, 'circle', options);
        return fluentApi;
      },
      swipe: (direction, options = {}) => {
        if (typeof direction === 'object') {
          options = direction;
          direction = null;
        }
        self.registerGestureOnly(name, 'swipe', { ...options, direction });
        return fluentApi;
      },
      
      // Configuration methods
      withTouches: (count) => {
        if (self.gestures.has(name)) {
          self.gestures.get(name).touchCount = Math.max(1, parseInt(count, 10) || 1);
        }
        return fluentApi;
      },
      
      inArea: (bounds) => {
        if (self.gestures.has(name)) {
          self.gestures.get(name).areaBounds = bounds;
        }
        return fluentApi;
      },
      
      when: (condition) => {
        if (typeof condition === 'function' && self.gestures.has(name)) {
          self.gestures.get(name).condition = condition;
        }
        return fluentApi;
      },
      
      on: (callback) => {
        if (typeof callback === 'function' && self.gestures.has(name)) {
          self.gestures.get(name).callback = callback;
        }
        return fluentApi;
      },
      
      cooldown: (ms) => {
        if (self.gestures.has(name)) {
          self.gestures.get(name).cooldown = Math.max(0, parseInt(ms, 10) || 0);
        }
        return fluentApi;
      },
      
      priority: (level) => {
        if (self.gestures.has(name)) {
          self.gestures.get(name).priority = parseInt(level, 10) || 0;
        }
        return fluentApi;
      },
      
      enable: () => {
        if (self.gestures.has(name)) {
          self.gestures.get(name).enabled = true;
        }
        return fluentApi;
      },
      
      disable: () => {
        if (self.gestures.has(name)) {
          self.gestures.get(name).enabled = false;
        }
        return fluentApi;
      }
    };
    
    return fluentApi;
  }

  /**
   * Register a gesture with the detector
   * @private
   */
  registerGesture(name, type, options = {}) {
    const config = { ...DEFAULT_CONFIG, ...options, type };
    this.gestures.set(name, config);
    
    // Return the gesture instance for method chaining
    return this.gesture(name);
  }

  /**
   * Register a gesture without returning fluent API (used internally)
   * @private
   */
  registerGestureOnly(name, type, options = {}) {
    const config = { ...DEFAULT_CONFIG, ...options, type };
    this.gestures.set(name, config);
  }

  /**
   * Remove all event listeners and clean up
   */
  destroy() {
    // Remove event listeners
    this.target.removeEventListener('mousedown', this.handleMouseDown);
    this.target.removeEventListener('mousemove', this.handleMouseMove);
    this.target.removeEventListener('mouseup', this.handleMouseUp);
    this.target.removeEventListener('mouseleave', this.handleMouseUp);
    
    this.target.removeEventListener('touchstart', this.handleTouchStart);
    this.target.removeEventListener('touchmove', this.handleTouchMove);
    this.target.removeEventListener('touchend', this.handleTouchEnd);
    this.target.removeEventListener('touchcancel', this.handleTouchEnd);
    
    // Clear any pending animation frames
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    
    // Clear data
    this.gestures.clear();
    this.currentPoints = [];
    this.touchHistory = [];
  }
}
