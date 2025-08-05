/**
 * @file Main entry point for the HMI system
 * @module hmi
 */

import { GestureDetector } from './gestures/GestureDetector.js';
import { VoiceHMI } from './voice/VoiceHMI.js';
import { PatternDetectors } from './gestures/PatternDetectors.js';

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
    this.multiModalGestures = new Map();
    this.debugMode = options.debug || false;
    
    this.setupEventListeners();
  }

  /**
   * Set up event listeners for the HMI system
   * @private
   */
  setupEventListeners() {
    // Add any global event listeners here
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
    console.log('HMI Debug mode enabled');
  }

  // Lifecycle methods
  destroy() {
    this.gestureDetector.destroy();
    this.voiceHMI.destroy();
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
