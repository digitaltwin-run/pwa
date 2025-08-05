/**
 * HMI Integration for Digital Twin PWA
 * Integrates the comprehensive HMI system with unified input management
 * @module hmi/integration
 */

import { HMIManager } from './index.js';
import { setupDigitalTwinGestures, setupVoiceCommands } from './gesture-integration.js';
import { inputManager } from './input/input-manager.js';

/**
 * Setup unified input system with app references
 */
async function setupUnifiedInputSystem(hmi, appInstance, svgCanvas) {
    try {
        // Set canvas and component manager references
        inputManager.setReferences(svgCanvas, appInstance.componentManager);
        
        // Set app instance reference for input manager
        appInstance.inputManager = inputManager;
        
        // Dispatch canvas-ready event for other systems
        const canvasReadyEvent = new CustomEvent('canvas-ready', {
            detail: {
                canvas: svgCanvas,
                componentManager: appInstance.componentManager
            }
        });
        document.dispatchEvent(canvasReadyEvent);
        
        console.log('🎮 Unified input system setup complete');
    } catch (error) {
        console.error('❌ Failed to setup unified input system:', error);
    }
}

/**
 * Integration function that connects the comprehensive HMI system with the main app
 * @param {Object} appInstance - The Digital Twin app instance
 * @returns {Promise<HMIManager>} The initialized HMI system
 */
export async function integrateHMIWithApp(appInstance) {
    console.info('🎮 Integrating comprehensive HMI system with unified input...');
    
    try {
        // Get the SVG canvas element
        const svgCanvas = document.getElementById('svg-canvas');
        if (!svgCanvas) {
            throw new Error('SVG canvas not found');
        }

        // Create HMI instance with debug enabled
        const hmi = new HMIManager(svgCanvas, { 
            debug: true, 
            voice: true,
            priority: 'gesture' // Prioritize gesture detection
        });

        // Initialize unified input system with app references
        await setupUnifiedInputSystem(hmi, appInstance, svgCanvas);

        // Setup gesture patterns for Digital Twin IDE
        setupDigitalTwinGestures(hmi, appInstance);

        // Setup voice commands if supported
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            setupVoiceCommands(hmi, appInstance);
        } else {
            console.warn('🎤 Speech recognition not supported in this browser');
        }

        // Enable debug mode
        hmi.enableDebug();

        // Make HMI globally accessible for debugging
        window.hmi = hmi;
        window.inputManager = inputManager;

        console.info('✅ Advanced HMI system with unified input integrated successfully!');
        console.info('🎮 Input systems status:', inputManager.getStatus());
        
        return hmi;
        
    } catch (error) {
        console.error('❌ Failed to integrate HMI system:', error);
        throw error;
    }
}

/**
 * Initialize HMI system for existing applications
 * @param {Object} appInstance - The app instance to integrate with
 * @returns {Promise<HMIManager>} The HMI system instance
 */
export async function initializeHMI(appInstance) {
    return await integrateHMIWithApp(appInstance);
}

export default integrateHMIWithApp;
