// Digital Twin IDE - Properties Module

import { PropertiesManager as CorePropertiesManager } from './properties-core.js';

// Re-export the main class
export class PropertiesManager extends CorePropertiesManager {
    constructor(componentManager) {
        super(componentManager);
    }
}

// Global functions for HTML callbacks
window.updateParam = function(id, paramKey, value, type) {
    if (window.propertiesManager) {
        window.propertiesManager.updateParam(id, paramKey, value, type);
    }
};

window.updatePosition = function(id, coord, value) {
    if (window.propertiesManager) {
        window.propertiesManager.updatePosition(id, coord, value);
    }
};

window.addParameter = function(id) {
    if (window.propertiesManager) {
        window.propertiesManager.addParameter(id);
    }
};

window.removeComponent = function(id) {
    if (window.propertiesManager) {
        window.propertiesManager.removeComponent(id);
    }
};

window.editMetadataRaw = function(id) {
    if (window.propertiesManager) {
        window.propertiesManager.editMetadataRaw(id);
    }
};

window.addInteraction = function(id) {
    if (window.propertiesManager) {
        window.propertiesManager.addInteraction(id);
    }
};

window.updateInteraction = function(id, index, property, value) {
    if (window.propertiesManager) {
        window.propertiesManager.updateInteraction(id, index, property, value);
    }
};

window.removeInteraction = function(id, index) {
    if (window.propertiesManager) {
        window.propertiesManager.removeInteraction(id, index);
    }
};

window.updateSvgColor = function(selector, type, color) {
    if (window.propertiesManager) {
        window.propertiesManager.updateSvgColor(selector, type, color);
    }
};
