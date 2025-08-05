/**
 * @file Main entry point for the HMI system
 * @module hmi
 */

import { GestureDetector } from './gestures/GestureDetector.js';
import { VoiceHMI } from './voice/VoiceHMI.js';
import { PatternDetectors } from './gestures/PatternDetectors.js';
import { inputManager } from './input/input-manager.js';

/**
 * Main HMI Manager class that combines gesture and voice control
 */
export class HMIManager {
  /**
   * Create a new HMI Manager
   * @param {HTMLElement} [target=document] - The target element for gesture detection
   * @param {Object} [options={}] - Configuration options
   */
  constructor(target = document, options = {}) {
    this.gestureDetector = new GestureDetector(target);
    this.voiceHMI = new VoiceHMI();
    this.inputManager = inputManager;
    this.multiModalGestures = new Map();
    this.debugMode = options.debug || false;
    
    this.setupEventListeners();
    this.initializeInputSystems(target, options);
  }

  /**
   * Initialize unified input systems
   * @private
   */
  async initializeInputSystems(target, options) {
    try {
      // Initialize the unified input manager
      await this.inputManager.init();
      
      // Set canvas reference if target is canvas
      if (target && target.tagName === 'svg') {
        this.inputManager.setReferences(target, window.app?.componentManager);
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
      this.inputManager.setReferences(e.detail.canvas, e.detail.componentManager);
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

// Factory function for easier instantiation
export const createHMI = (target = document, options = {}) => {
  return new HMIManager(target, options);
};

// Export everything for individual use
export { GestureDetector, VoiceHMI, PatternDetectors };

// Global access for non-module usage
if (typeof window !== 'undefined') {
  window.HMI = {
    HMIManager,
    GestureDetector,
    VoiceHMI,
    PatternDetectors,
    createHMI
  };
}
