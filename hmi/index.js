/**
 * @file Main entry point for the HMI system
 * @module hmi
 */

import { GestureDetector } from './gestures/GestureDetector.js';
import { VoiceHMI } from './voice/VoiceHMI.js';
import { PatternDetectors } from './gestures/PatternDetectors.js';
import { inputManager } from './input/input-manager.js';
import { canvasZoomManager } from './canvas-zoom.js';
import { canvasSelectionManager } from './canvas-selection.js';

/**
 * Main HMI Manager class that combines gesture and voice control
 */
export class HMIManager {
  /**
   * Create a new HMI Manager
   * @param {HTMLElement} [target=document] - The target element for gesture detection
   * @param {Object} [options={}] - Configuration options
   * @param {boolean} [options.debug=false] - Enable debug mode
   * @param {Object} [options.componentManager] - Reference to a component manager
   * @param {boolean} [options.autoInit=true] - Automatically initialize input systems
   */
  constructor(target = document, options = {}) {
    this.gestureDetector = new GestureDetector(target);
    this.voiceHMI = new VoiceHMI();
    this.inputManager = inputManager;
    this.multiModalGestures = new Map();
    this.debugMode = options.debug || false;
    this.target = target;
    this.options = options;
    
    this.setupEventListeners();
    
    // Allow delayed initialization
    if (options.autoInit !== false) {
      this.initializeInputSystems(target, options);
    }
  }

  /**
   * Initialize unified input systems
   * @private
   * @param {HTMLElement} target - The target element for input detection
   * @param {Object} options - Configuration options
   * @param {Object} [options.componentManager] - Optional component manager reference
   */
  async initializeInputSystems(target, options) {
    try {
      // Initialize the unified input manager
      await this.inputManager.init();
      
      // Store reference to canvas/SVG element and component manager if provided
      if (target) {
        const componentManager = options.componentManager || null;
        this.inputManager.setReferences(target, componentManager);
      }
      
      console.log('🎮 HMI input systems initialized');
    } catch (error) {
      console.error('❌ Failed to initialize HMI input systems:', error);
    }
  }

  /**
   * Set up event listeners for the HMI system
   * @private
   */
  setupEventListeners() {
    // Listen for canvas ready events
    document.addEventListener('canvas-ready', (e) => {
      if (e.detail && e.detail.canvas) {
        this.inputManager.setReferences(
          e.detail.canvas, 
          e.detail.componentManager || null
        );
      }
    });
    
    // Add any other global event listeners here
  }

  // Gesture registration
  gesture(name) {
    return this.gestureDetector.gesture(name);
  }

  // Voice command registration
  voice(name, pattern) {
    return this.voiceHMI.command(name, pattern);
  }

  // Multi-modal gesture registration
  multiModalGesture(name) {
    const gesture = {
      whenSaying: (pattern) => {
        this.voiceHMI.command(name, pattern);
        return {
          whileGesturing: (gestureType, options) => ({
            then: (callback) => {
              this.multiModalGestures.set(name, { gestureType, callback });
            }
          })
        };
      }
    };
    return gesture;
  }

  // Debug methods
  enableDebug() {
    this.debugMode = true;
    this.gestureDetector.debug = true;
    this.voiceHMI.debug = true;
    this.inputManager.toggleDebug();
    console.log('🎮 HMI Debug mode enabled (unified system)');
  }

  // Lifecycle methods
  destroy() {
    this.gestureDetector.destroy();
    this.voiceHMI.destroy();
    this.inputManager.destroy();
    console.log('🎮 HMI system destroyed (unified)');
  }
}

/**
 * Factory function for creating an HMI instance
 * @param {HTMLElement} [target=document] - The target element for gesture detection
 * @param {Object} [options={}] - Configuration options
 * @returns {HMIManager} A new HMI manager instance
 */
export const createHMI = (target = document, options = {}) => {
  return new HMIManager(target, options);
};

// Create main HMI instance for global use
const hmi = createHMI();

// Export everything for individual use
export { 
  GestureDetector, 
  VoiceHMI, 
  PatternDetectors, 
  canvasZoomManager, 
  canvasSelectionManager,
  hmi // Export named hmi instance
};

/**
 * Expose the HMI system globally when in browser context
 * @namespace HMI
 */
if (typeof window !== 'undefined') {
  // Create namespace without overriding existing properties
  window.HMI = Object.assign(window.HMI || {}, {
    HMIManager,
    GestureDetector,
    VoiceHMI,
    PatternDetectors,
    createHMI,
    version: '2.0.0'
  });
}
