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

// Global interaction functions moved to ../interactions project

window.updateSvgColor = function(selector, type, color) {
    if (window.propertiesManager) {
        window.propertiesManager.updateSvgColor(selector, type, color);
    }
};

// Funkcje mapowania właściwości
window.refreshPropertiesMapping = function() {
    if (window.propertiesManager) {
        window.propertiesManager.refreshPropertiesMapping();
    }
};

window.exportPropertiesToJson = function() {
    if (window.propertiesManager) {
        const exported = window.propertiesManager.exportPropertiesToJson();
        console.log('Exported properties:', exported);
        
        // Stwórz i pobierz plik JSON
        const blob = new Blob([JSON.stringify(exported, null, 2)], 
            { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'canvas-properties.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        return exported;
    }
};

window.getAvailableVariables = function() {
    if (window.propertiesManager) {
        const variables = window.propertiesManager.getAvailableVariables();
        console.log('Available variables:', variables);
        return variables;
    }
};
