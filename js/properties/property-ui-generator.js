/**
 * Property UI Generator - Handles HTML generation for property panels
 */

import { createValueInputByType, detectPropertyType } from '../utils/property-utils.js';

export class PropertyUIGenerator {
    constructor() {
        this.eventLabels = {
            'click': 'Kliknięcie',
            'doubleclick': 'Podwójne kliknięcie',
            'mousedown': 'Naciśnięcie myszy',
            'mouseup': 'Zwolnienie myszy',
            'mouseover': 'Najechanie myszą',
            'mouseout': 'Opuszczenie myszą',
            'focus': 'Uzyskanie fokusu',
            'blur': 'Utrata fokusu',
            'change': 'Zmiana wartości',
            'input': 'Wprowadzanie tekstu',
            'keydown': 'Naciśnięcie klawisza',
            'keyup': 'Zwolnienie klawisza',
            'press': 'Naciśnięcie',
            'release': 'Zwolnienie',
            'toggle': 'Przełączenie',
            'on': 'Włączenie',
            'off': 'Wyłączenie',
            'min': 'Minimum',
            'max': 'Maximum'
        };
    }

    /**
     * Generate properties HTML based on component type
     * @param {Object} componentData - Component data object
     * @param {Object} componentDef - Component definition
     * @returns {string} HTML string for properties
     */
    generateComponentProperties(componentData, componentDef) {
        if (!componentData || !componentDef) return '';
        
        const currentValues = componentData.metadata?.parameters || {};
        
        // Group properties by category
        const propertiesByCategory = {};
        componentDef.properties.forEach(prop => {
            if (!propertiesByCategory[prop.category]) {
                propertiesByCategory[prop.category] = [];
            }
            propertiesByCategory[prop.category].push(prop);
        });
        
        let html = '';
        
        // Generate HTML for each category
        Object.entries(propertiesByCategory).forEach(([category, properties]) => {
            html += `<div class="property-category" style="margin-bottom: 15px;">`;
            html += `<h5>${category}</h5>`;
            
            properties.forEach(prop => {
                const value = currentValues[prop.id] !== undefined ? currentValues[prop.id] : prop.default;
                const inputId = `prop-${componentData.id}-${prop.id}`;
                
                html += `<div class="form-group" style="margin-bottom: 10px;">`;
                html += `<label for="${inputId}" style="display: block; margin-bottom: 4px; font-size: 13px; color: #555;">${prop.name}</label>`;
                
                html += this.generateInputByType(prop.type, inputId, value, componentData.id, prop.id);
                html += `</div>`;
            });
            
            html += `</div>`;
        });
        
        return html;
    }

    /**
     * Generate input HTML based on property type
     * @param {string} type - Property type
     * @param {string} inputId - Input element ID
     * @param {any} value - Current value
     * @param {string} componentId - Component ID
     * @param {string} propId - Property ID
     * @returns {string} HTML string for input
     */
    generateInputByType(type, inputId, value, componentId, propId) {
        switch (type) {
            case 'boolean':
                return `
                    <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" id="${inputId}" 
                            ${value ? 'checked' : ''}
                            onchange="updateParam('${componentId}', '${propId}', this.checked, 'boolean')">
                    </div>
                `;
                
            case 'color':
                return `
                    <div style="display: flex; align-items: center;">
                        <input type="color" id="${inputId}" value="${value}" 
                            style="width: 60px; height: 30px; padding: 0; border: 1px solid #ddd;"
                            onchange="updateParam('${componentId}', '${propId}', this.value, 'color')">
                        <span style="margin-left: 8px; font-size: 12px; color: #666;">${value}</span>
                    </div>
                `;
                
            case 'range':
                return `
                    <div>
                        <input type="range" id="${inputId}" value="${value}" min="0" max="100" 
                            style="width: 100%;"
                            oninput="updateParam('${componentId}', '${propId}', this.value, 'range'); document.getElementById('${inputId}-value').textContent = this.value">
                        <div style="display: flex; justify-content: space-between; font-size: 12px; color: #666;">
                            <span>0</span>
                            <span id="${inputId}-value">${value}</span>
                            <span>100</span>
                        </div>
                    </div>
                `;
                
            case 'select':
                // This would need options passed in - simplified for now
                return `
                    <select id="${inputId}" style="width: 100%; padding: 4px; border: 1px solid #ddd;"
                        onchange="updateParam('${componentId}', '${propId}', this.value, 'select')">
                        <option value="${value}" selected>${value}</option>
                    </select>
                `;
                
            case 'number':
                return `
                    <input type="number" id="${inputId}" value="${value}" 
                        style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 3px;"
                        onchange="updateParam('${componentId}', '${propId}', this.value, 'number')">
                `;
                
            case 'text':
            default:
                return `
                    <input type="text" id="${inputId}" value="${value}" 
                        style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 3px;"
                        onchange="updateParam('${componentId}', '${propId}', this.value, 'text')">
                `;
        }
    }

    /**
     * Generate parameters section HTML
     * @param {Object} componentData - Component data object
     * @returns {string} HTML string for parameters section
     */
    generateParametersSection(componentData) {
        if (!componentData || !componentData.element) return '';

        const params = componentData.metadata?.parameters || {};
        
        let html = '<div class="parameters-section" style="margin-top: 15px;">';
        html += '<h6>Parametry:</h6>';

        // Display existing parameters
        Object.entries(params).forEach(([key, value]) => {
            const type = detectPropertyType(value);
            html += `
                <div class="parameter-item" style="margin-bottom: 10px; display: flex; align-items: center;">
                    <label style="flex: 1; font-size: 12px;">${key}:</label>
                    ${createValueInputByType(componentData.id, 'param', type, value)}
                </div>
            `;
        });

        // Add parameter button
        html += `
            <button onclick="addParameter('${componentData.id}')" 
                    style="margin-top: 10px; padding: 5px 10px; background: #28a745; color: white; border: none; border-radius: 3px; font-size: 12px;">
                ➕ Dodaj parametr
            </button>
        `;

        html += '</div>';
        return html;
    }

    /**
     * Generate event options HTML
     * @param {string} selectedEvent - Currently selected event
     * @param {string} componentType - Component type
     * @returns {string} HTML options string
     */
    generateEventOptions(selectedEvent, componentType) {
        const commonEvents = ['click', 'doubleclick', 'mousedown', 'mouseup', 'mouseover', 'mouseout'];
        const specificEvents = {
            'button': ['press', 'release'],
            'switch': ['toggle', 'on', 'off'],
            'slider': ['change', 'min', 'max'],
            'knob': ['change', 'min', 'max'],
            'input': ['input', 'focus', 'blur', 'keydown', 'keyup']
        };

        let events = [...commonEvents];
        if (specificEvents[componentType]) {
            events = events.concat(specificEvents[componentType]);
        }

        let html = '';
        events.forEach(event => {
            const selected = event === selectedEvent ? 'selected' : '';
            const label = this.eventLabels[event] || event;
            html += `<option value="${event}" ${selected}>${label}</option>`;
        });

        return html;
    }

    /**
     * Get readable event label
     * @param {string} eventValue - Event value
     * @returns {string} Readable label
     */
    getEventLabel(eventValue) {
        return this.eventLabels[eventValue] || eventValue;
    }

    /**
     * Generate target component options
     * @param {string} selectedTargetId - Currently selected target ID
     * @param {Array} availableTargets - Available target components
     * @returns {string} HTML options string
     */
    generateTargetOptions(selectedTargetId, availableTargets = []) {
        let html = '<option value="">-- Wybierz komponent --</option>';
        
        availableTargets.forEach(target => {
            const selected = target.id === selectedTargetId ? 'selected' : '';
            const displayName = target.name || target.id;
            html += `<option value="${target.id}" ${selected}>${displayName}</option>`;
        });

        return html;
    }

    /**
     * Generate property options for a target component
     * @param {string} targetComponentId - Target component ID
     * @param {string} selectedProperty - Currently selected property
     * @param {string} actionType - Action type
     * @param {Object} targetComponent - Target component data
     * @returns {string} HTML options string
     */
    generatePropertyOptions(targetComponentId, selectedProperty, actionType, targetComponent) {
        if (!targetComponent) {
            return '<option value="">-- Brak właściwości --</option>';
        }

        let html = '<option value="">-- Wybierz właściwość --</option>';
        
        // Add parameters
        const params = targetComponent.parameters || {};
        Object.keys(params).forEach(param => {
            const selected = param === selectedProperty ? 'selected' : '';
            html += `<option value="${param}" ${selected}>${param}</option>`;
        });

        return html;
    }
}
