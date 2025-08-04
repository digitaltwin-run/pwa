// Digital Twin IDE - Pump Component Module
// Provides the initialization and behavior functions for pump components

import { componentRegistry } from '../component-registry.js';

/**
 * Initialize a pump component with default state and behaviors
 * @param {Element} element - The pump SVG element
 * @param {string} id - The component ID
 */
export function initPump(element, id) {
    // Log initialization
    console.log(`[Pump] Initializing pump component with ID: ${id}`);
    
    // Initialize default state
    const state = {
        isOn: false,
        flowRate: 0,
        pressure: 0,
        temperature: 25,
        lastUpdated: Date.now()
    };
    
    // Store state on element for future reference
    element.pumpState = state;
    
    // Find important pump elements
    const pumpBody = element.querySelector('.pump-body') || element.querySelector('path');
    const statusIndicator = element.querySelector('.status-indicator');
    
    // Initialize visual state
    updatePumpVisuals(element);
    
    // Define pump methods on the element
    element.turnOn = () => turnOnPump(element);
    element.turnOff = () => turnOffPump(element);
    element.toggleState = () => togglePumpState(element);
    element.setFlowRate = (rate) => setPumpFlowRate(element, rate);
    element.setPressure = (pressure) => setPumpPressure(element, pressure);
    
    // Set click handler if not already set
    if (!element.hasAttribute('data-has-click-handler')) {
        element.addEventListener('click', () => {
            element.toggleState();
        });
        element.setAttribute('data-has-click-handler', 'true');
    }
    
    // Dispatch event that pump is ready
    const event = new CustomEvent('pump-ready', {
        bubbles: true,
        detail: { id, element }
    });
    element.dispatchEvent(event);
    
    return element;
}

/**
 * Update pump visual elements based on current state
 * @param {Element} element - The pump element
 */
export function updatePumpVisuals(element) {
    if (!element || !element.pumpState) return;
    
    const state = element.pumpState;
    const pumpBody = element.querySelector('.pump-body') || element.querySelector('path');
    const statusIndicator = element.querySelector('.status-indicator');
    
    // Update pump body color based on state
    if (pumpBody) {
        if (state.isOn) {
            pumpBody.setAttribute('fill', '#4CAF50');
            pumpBody.setAttribute('data-state', 'on');
        } else {
            pumpBody.setAttribute('fill', '#9E9E9E');
            pumpBody.setAttribute('data-state', 'off');
        }
    }
    
    // Update status indicator if exists
    if (statusIndicator) {
        statusIndicator.setAttribute('fill', state.isOn ? '#4CAF50' : '#F44336');
    }
}

/**
 * Turn on the pump
 * @param {Element} element - The pump element
 */
export function turnOnPump(element) {
    if (!element || !element.pumpState) return;
    
    element.pumpState.isOn = true;
    element.pumpState.lastUpdated = Date.now();
    updatePumpVisuals(element);
    
    // Dispatch pump state change event
    const event = new CustomEvent('pump-state-change', {
        bubbles: true,
        detail: {
            id: element.getAttribute('data-id'),
            state: { ...element.pumpState }
        }
    });
    element.dispatchEvent(event);
}

/**
 * Turn off the pump
 * @param {Element} element - The pump element
 */
export function turnOffPump(element) {
    if (!element || !element.pumpState) return;
    
    element.pumpState.isOn = false;
    element.pumpState.flowRate = 0;
    element.pumpState.lastUpdated = Date.now();
    updatePumpVisuals(element);
    
    // Dispatch pump state change event
    const event = new CustomEvent('pump-state-change', {
        bubbles: true,
        detail: {
            id: element.getAttribute('data-id'),
            state: { ...element.pumpState }
        }
    });
    element.dispatchEvent(event);
}

/**
 * Toggle the pump state between on and off
 * @param {Element} element - The pump element
 */
export function togglePumpState(element) {
    if (!element || !element.pumpState) return;
    
    if (element.pumpState.isOn) {
        turnOffPump(element);
    } else {
        turnOnPump(element);
    }
}

/**
 * Set the flow rate of the pump
 * @param {Element} element - The pump element
 * @param {number} rate - Flow rate value
 */
export function setPumpFlowRate(element, rate) {
    if (!element || !element.pumpState) return;
    
    element.pumpState.flowRate = Number(rate) || 0;
    element.pumpState.lastUpdated = Date.now();
    
    // Only update visuals if pump is on
    if (element.pumpState.isOn) {
        updatePumpVisuals(element);
    }
    
    // Dispatch pump state change event
    const event = new CustomEvent('pump-state-change', {
        bubbles: true,
        detail: {
            id: element.getAttribute('data-id'),
            state: { ...element.pumpState }
        }
    });
    element.dispatchEvent(event);
}

/**
 * Set the pressure of the pump
 * @param {Element} element - The pump element
 * @param {number} pressure - Pressure value
 */
export function setPumpPressure(element, pressure) {
    if (!element || !element.pumpState) return;
    
    element.pumpState.pressure = Number(pressure) || 0;
    element.pumpState.lastUpdated = Date.now();
    
    // Dispatch pump state change event
    const event = new CustomEvent('pump-state-change', {
        bubbles: true,
        detail: {
            id: element.getAttribute('data-id'),
            state: { ...element.pumpState }
        }
    });
    element.dispatchEvent(event);
}

// Register this component type with the component registry
componentRegistry.register('pump', initPump, {
    name: 'Pump',
    category: 'Fluid',
    description: 'A fluid pump component',
    parameters: ['isOn', 'flowRate', 'pressure', 'temperature'],
    events: ['click', 'pump-state-change', 'pump-ready'],
    actions: ['turnOn', 'turnOff', 'toggleState', 'setFlowRate', 'setPressure']
});

// Make the pump initializer globally accessible to support legacy code
// This fixes the 'initPump is not defined' error
window.initPump = initPump;
