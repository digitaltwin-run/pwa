// Digital Twin IDE - Properties Interactions Module

import { PropertiesMapper } from './properties-mapper.js';
import { componentRegistry } from './component-registry.js';

export class PropertiesInteractionsManager {
    constructor(componentManager) {
        this.componentManager = componentManager;
        this.propertiesMapper = new PropertiesMapper(componentManager);
        
        // Automatically scan properties when initialized
        this.refreshPropertiesMapping();
        
        // Set up a mutation observer to detect changes to the canvas
        this.setupCanvasObserver();
    }
    
    // Refresh the properties mapping
    refreshPropertiesMapping() {
        this.propertiesMapper.scanCanvasProperties();
        console.log('[PropertiesInteractionsManager] Properties mapping refreshed');
    }

    // Set up canvas observer to detect component additions/removals
    setupCanvasObserver() {
        // Try to find the canvas element
        const canvas = document.getElementById('svg-canvas-container') || 
                       document.querySelector('.svg-canvas-container');
        
        if (!canvas) {
            console.warn('[PropertiesInteractionsManager] Canvas element not found, deferring observer setup');
            // Retry after a short delay
            setTimeout(() => this.setupCanvasObserver(), 1000);
            return;
        }
        
        // Create a mutation observer to watch for changes to the canvas
        const observer = new MutationObserver((mutations) => {
            let needsRefresh = false;
            
            for (const mutation of mutations) {
                // Check if nodes were added or removed
                if (mutation.type === 'childList' && 
                    (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0)) {
                    needsRefresh = true;
                    break;
                }
            }
            
            if (needsRefresh) {
                console.log('[PropertiesInteractionsManager] Canvas changed, refreshing properties mapping');
                this.refreshPropertiesMapping();
                
                // Refresh any open interaction panels
                this.refreshAllInteractionPanels();
            }
        });
        
        // Start observing the canvas for component changes
        observer.observe(canvas, { 
            childList: true, 
            subtree: true 
        });
        
        console.log('[PropertiesInteractionsManager] Canvas observer setup complete');
    }
    
    // Refresh all open interaction panels
    refreshAllInteractionPanels() {
        // Find all open property panels
        const propertyPanels = document.querySelectorAll('.properties-panel');
        if (!propertyPanels || propertyPanels.length === 0) return;
        
        propertyPanels.forEach(panel => {
            const componentId = panel.getAttribute('data-component-id');
            if (!componentId) return;
            
            const interactionsSection = panel.querySelector('.interactions-section');
            if (!interactionsSection) return;
            
            // Refresh the interactions section for this component
            const componentData = this.componentManager.getComponent(componentId);
            if (componentData) {
                const newHtml = this.generateInteractionsSection(componentData);
                interactionsSection.outerHTML = newHtml;
                console.log(`[PropertiesInteractionsManager] Refreshed interactions panel for ${componentId}`);
            }
        });
    }

    // Generate interactions section for a component
    generateInteractionsSection(componentData) {
        if (!componentData || !componentData.element) return '';

        const interactions = this.getComponentInteractions(componentData.element);
        let html = '<div class="interactions-section" style="margin-top: 20px;">';
        html += '<h5>Interakcje:</h5>';

        interactions.forEach((interaction, index) => {
            html += `<div class="interaction" style="margin-bottom: 15px; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">`;
            html += `<h6>Interakcja ${index + 1}</h6>`;

            // Event selection
            html += `<label>Zdarzenie:</label>`;
            html += `<select onchange="window.propertiesManager.interactionsManager.updateInteraction('${componentData.id}', ${index}, 'event', this.value)">`;
            html += this.generateEventOptions(interaction.event, componentData.metadata?.type);
            html += `</select><br>`;

            // Action selection
            html += `<label>Akcja:</label>`;
            html += `<select onchange="window.propertiesManager.interactionsManager.updateInteraction('${componentData.id}', ${index}, 'action', this.value)">`;
            html += `<option value="set" ${interaction.action === 'set' ? 'selected' : ''}>Ustaw wartość</option>`;
            html += `<option value="toggle" ${interaction.action === 'toggle' ? 'selected' : ''}>Przełącz</option>`;
            html += `<option value="increment" ${interaction.action === 'increment' ? 'selected' : ''}>Zwiększ</option>`;
            html += `<option value="decrement" ${interaction.action === 'decrement' ? 'selected' : ''}>Zmniejsz</option>`;
            html += `</select><br>`;

            // Target component selection
            html += `<label>Komponent docelowy:</label>`;
            html += `<select 
                    onchange="window.propertiesManager.interactionsManager.updateInteraction('${componentData.id}', ${index}, 'target', this.value); window.propertiesManager.interactionsManager.populatePropertySelectForTarget('${componentData.id}', ${index}, this.value);"
                    data-interaction-index="${index}"
                    data-source-id="${componentData.id}"
                    class="target-select">`;
            html += this.generateTargetOptions(interaction.target);
            html += `</select><br>`;

            // Property/Variable selection
            html += `<label>Właściwość/Zmienna:</label>`;
            html += `<select 
                    onchange="window.propertiesManager.interactionsManager.updateInteraction('${componentData.id}', ${index}, 'property', this.value); window.propertiesManager.interactionsManager.setDefaultValueInputForProperty('${componentData.id}', ${index}, '${interaction.target || ''}', this.value);"
                    data-interaction-index="${index}"
                    data-source-id="${componentData.id}"
                    data-target-id="${interaction.target || ''}"
                    class="property-select">`;
            html += this.generatePropertyOptions(interaction.target, interaction.property, interaction.action);
            html += `</select><br>`;

            // Value input
            html += `<label>Wartość:</label>`;
            const propertyType = this.getPropertyType(interaction.target, interaction.property);
            html += `<div class="value-input-container" data-interaction-index="${index}" data-source-id="${componentData.id}">`;
            html += this.generateValueInput(componentData.id, index, interaction.value || '', propertyType, interaction.target, interaction.property);
            html += `</div><br>`;

            // Remove button
            html += `<button onclick="window.propertiesManager.interactionsManager.removeInteraction('${componentData.id}', ${index})" 
                           style="background: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 3px;">
                       ❌ Usuń
                     </button>`;

            html += `</div>`;
        });

        // Add new interaction button
        html += `<button onclick="window.propertiesManager.interactionsManager.addInteraction('${componentData.id}')" 
                       class="btn btn-primary" style="margin-top: 10px;">
                   ➕ Dodaj interakcję
                 </button>`;

        html += '</div>';
        return html;
    }

    // Generate options for events based on component type
    generateEventOptions(selectedEvent, componentType) {
        let options = [
            { value: 'click', label: 'Kliknięcie' },
            { value: 'mouseover', label: 'Najechanie myszą' },
            { value: 'mouseout', label: 'Opuszczenie myszą' }
        ];

        // Add component-specific events based on type and registry
        if (componentType) {
            const metadata = componentRegistry.getMetadata(componentType);
            if (metadata && metadata.events) {
                metadata.events.forEach(event => {
                    options.push({
                        value: event.value || event.name,
                        label: event.label || this.getEventLabel(event.value || event.name)
                    });
                });
            }
        }

        // Generate HTML options
        let html = '';
        options.forEach(option => {
            const selected = option.value === selectedEvent ? 'selected' : '';
            html += `<option value="${option.value}" ${selected}>${option.label}</option>`;
        });

        return html;
    }

    // Get readable label for an event
    getEventLabel(eventValue) {
        const eventLabels = {
            'click': 'Kliknięcie',
            'mouseover': 'Najechanie myszą',
            'mouseout': 'Opuszczenie myszą',
            'change': 'Zmiana wartości',
            'input': 'Wprowadzenie danych',
            'toggle': 'Przełączenie',
            'state-change': 'Zmiana stanu',
            'level-change': 'Zmiana poziomu',
            'pressure-change': 'Zmiana ciśnienia',
            'temperature-change': 'Zmiana temperatury',
            'flow-change': 'Zmiana przepływu'
        };

        return eventLabels[eventValue] || eventValue;
    }

    // Generate options for target component selection
    generateTargetOptions(selectedTargetId) {
        // Use mapped components from properties mapper
        const availableComponents = this.propertiesMapper.getAvailableTargetComponents();
        let html = '<option value="">Wybierz komponent</option>';

        availableComponents.forEach(comp => {
            const selected = comp.id === selectedTargetId ? 'selected' : '';
            const paramCount = comp.parameters ? comp.parameters.length : 0;
            const typeInfo = comp.type !== 'unknown' ? ` (${comp.type})` : '';
            
            html += `<option value="${comp.id}" ${selected}>${comp.name}${typeInfo} - ${paramCount} param.</option>`;
        });

        console.log(`[PropertiesInteractionsManager] Generated ${availableComponents.length} target options`);
        return html;
    }

    // Generate options for properties/variables based on selected component and action
    generatePropertyOptions(targetComponentId, selectedProperty, actionType) {
        if (!targetComponentId) {
            return '<option value="">Wybierz najpierw komponent</option>';
        }

        const variables = this.propertiesMapper.getVariablesForActionType(targetComponentId, actionType);
        if (!variables || variables.length === 0) {
            return '<option value="">Brak dostępnych właściwości</option>';
        }

        let html = '<option value="">Wybierz właściwość</option>';
        variables.forEach(variable => {
            const selected = variable === selectedProperty ? 'selected' : '';
            html += `<option value="${variable}" ${selected}>${variable}</option>`;
        });

        return html;
    }

    // Get property type for a component and property
    getPropertyType(targetComponentId, propertyName) {
        if (!targetComponentId || !propertyName) return 'text';

        const targetComponent = this.componentManager.getComponent(targetComponentId);
        if (!targetComponent || !targetComponent.metadata || !targetComponent.metadata.parameters) {
            return 'text';
        }

        const value = targetComponent.metadata.parameters[propertyName];
        return this.detectPropertyType(value);
    }

    // Generate appropriate value input based on property type
    generateValueInput(componentId, index, currentValue, propertyType, targetComponentId, propertyName) {
        return this.createValueInputByType(componentId, index, propertyType, currentValue, targetComponentId, propertyName);
    }

    // Get text presets for a specific parameter
    getTextPresetsForParameter(parameterName, componentId) {
        const presets = {
            'color': ['red', 'green', 'blue', 'yellow', 'orange', 'purple', 'white', 'black', 'gray'],
            'level': ['0', '25', '50', '75', '100'],
            'state': ['on', 'off', 'active', 'inactive', 'running', 'stopped']
        };

        // Try to infer parameter type from name
        let type = '';
        if (parameterName.includes('color')) type = 'color';
        else if (parameterName.includes('level')) type = 'level';
        else if (parameterName.includes('state')) type = 'state';

        // Return appropriate presets or empty array
        return presets[type] || [];
    }

    // Get component interactions from metadata
    getComponentInteractions(svgElement) {
        if (!svgElement) return [];

        // Try to get interactions from metadata
        try {
            const metadataStr = svgElement.getAttribute('data-metadata');
            if (metadataStr) {
                const metadata = JSON.parse(metadataStr);
                if (metadata.interactions && Array.isArray(metadata.interactions)) {
                    return metadata.interactions;
                }
            }

            // Look for interactions in SVG metadata element
            const metadataElement = svgElement.querySelector('metadata component');
            if (metadataElement) {
                const interactionsElement = metadataElement.querySelector('interactions');
                if (interactionsElement) {
                    const interactions = [];
                    const interactionElements = interactionsElement.querySelectorAll('interaction');
                    
                    interactionElements.forEach(interactionEl => {
                        interactions.push({
                            event: interactionEl.getAttribute('event') || 'click',
                            action: interactionEl.getAttribute('action') || 'set',
                            target: interactionEl.getAttribute('target') || '',
                            property: interactionEl.getAttribute('property') || '',
                            value: interactionEl.getAttribute('value') || ''
                        });
                    });
                    
                    return interactions;
                }
            }
        } catch (error) {
            console.error('Error parsing component interactions:', error);
        }

        return [];
    }

    // Add new interaction to a component
    addInteraction(id) {
        const componentData = this.componentManager.getComponent(id);
        if (!componentData || !componentData.element) return;

        // Get current interactions
        const interactions = this.getComponentInteractions(componentData.element);

        // Add new default interaction
        interactions.push({
            event: 'click',
            action: 'set',
            target: '',
            property: '',
            value: ''
        });

        // Update interactions in metadata
        this.updateInteractionsInMetadata(id, interactions);

        // Refresh properties panel
        if (window.propertiesManager) {
            window.propertiesManager.showPropertiesForComponent(id);
        }
    }

    // Update a specific interaction
    updateInteraction(id, index, property, value) {
        const componentData = this.componentManager.getComponent(id);
        if (!componentData || !componentData.element) return;

        // Get current interactions
        const interactions = this.getComponentInteractions(componentData.element);
        if (index >= interactions.length) return;

        // Update the specific property
        interactions[index][property] = value;

        // Update interactions in metadata
        this.updateInteractionsInMetadata(id, interactions);

        console.log(`[PropertiesInteractionsManager] Updated interaction ${index} for component ${id}, set ${property} = ${value}`);
    }

    // Populate property select for target component
    populatePropertySelectForTarget(sourceId, interactionIndex, targetId) {
        console.log(`[PropertiesInteractionsManager] Populating properties for target ${targetId}`);
        
        // Find the property select element
        const propertySelect = document.querySelector(`.property-select[data-source-id="${sourceId}"][data-interaction-index="${interactionIndex}"]`);
        if (!propertySelect) return;
        
        // Update the data-target-id attribute
        propertySelect.setAttribute('data-target-id', targetId);
        
        // Get the current action type
        const actionSelect = propertySelect.closest('.interaction').querySelector('select');
        const actionType = actionSelect ? actionSelect.value : 'set';
        
        // Generate new options
        const options = this.generatePropertyOptions(targetId, '', actionType);
        propertySelect.innerHTML = options;
        
        // Trigger change event to update the value input
        propertySelect.dispatchEvent(new Event('change'));
    }

    // Set default value input based on property type
    setDefaultValueInputForProperty(sourceId, interactionIndex, targetId, propertyName) {
        if (!targetId || !propertyName) return;
        
        // Get the property type
        const propertyType = this.getPropertyType(targetId, propertyName);
        
        // Find the value input container
        const container = document.querySelector(`.value-input-container[data-source-id="${sourceId}"][data-interaction-index="${interactionIndex}"]`);
        if (!container) return;
        
        // Generate the appropriate input
        const html = this.createValueInputByType(sourceId, interactionIndex, propertyType, '', targetId, propertyName);
        container.innerHTML = html;
        
        console.log(`[PropertiesInteractionsManager] Created ${propertyType} input for ${propertyName}`);
    }

    // Detect property type from value
    detectPropertyType(value) {
        if (value === undefined || value === null) return 'text';
        
        // Check if it's a boolean
        if (typeof value === 'boolean' || value === 'true' || value === 'false') {
            return 'boolean';
        }
        
        // Check if it's a number
        if (!isNaN(Number(value))) {
            return 'number';
        }
        
        // Check if it's a color
        if (/^#[0-9A-F]{3,6}$/i.test(value) || 
            /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/i.test(value) ||
            /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/i.test(value) ||
            ['red', 'green', 'blue', 'yellow', 'white', 'black'].includes(value)) {
            return 'color';
        }
        
        // Default to text
        return 'text';
    }

    // Create appropriate input element based on type
    createValueInputByType(sourceId, interactionIndex, type, currentValue, targetId, propertyName) {
        const onChange = `window.propertiesManager.interactionsManager.updateInteraction('${sourceId}', ${interactionIndex}, 'value', this.value)`;
        
        switch (type) {
            case 'boolean':
                const isChecked = currentValue === true || currentValue === 'true';
                return `<input type="checkbox" ${isChecked ? 'checked' : ''} 
                        onchange="${onChange}" value="true" />`;
                
            case 'number':
                return `<input type="number" value="${currentValue || 0}" 
                        onchange="${onChange}" onkeyup="${onChange}" class="form-control" />`;
                
            case 'color':
                const normalizedColor = this.normalizeColorValue(currentValue);
                return `<input type="color" value="${normalizedColor}" 
                        onchange="${onChange}" class="form-control" />`;
                
            case 'select':
                // Get presets if available
                const presets = this.getTextPresetsForParameter(propertyName, targetId);
                if (presets && presets.length > 0) {
                    let html = `<select onchange="${onChange}" class="form-control">`;
                    presets.forEach(preset => {
                        const selected = preset === currentValue ? 'selected' : '';
                        html += `<option value="${preset}" ${selected}>${preset}</option>`;
                    });
                    html += '</select>';
                    return html;
                }
                // Fall through to text if no presets
                
            case 'text':
            default:
                return `<input type="text" value="${currentValue || ''}" 
                        onchange="${onChange}" onkeyup="${onChange}" class="form-control" />`;
        }
    }

    // Normalize color value for color input
    normalizeColorValue(colorValue) {
        if (!colorValue) return '#000000';
        
        // Convert named colors to hex
        const namedColors = {
            'red': '#ff0000',
            'green': '#00ff00',
            'blue': '#0000ff',
            'yellow': '#ffff00',
            'white': '#ffffff',
            'black': '#000000',
            'purple': '#800080',
            'orange': '#ffa500',
            'gray': '#808080'
        };
        
        if (namedColors[colorValue.toLowerCase()]) {
            return namedColors[colorValue.toLowerCase()];
        }
        
        // If it's already a hex color, ensure it's in the right format
        if (colorValue.startsWith('#')) {
            // Convert 3-digit hex to 6-digit
            if (colorValue.length === 4) {
                return `#${colorValue[1]}${colorValue[1]}${colorValue[2]}${colorValue[2]}${colorValue[3]}${colorValue[3]}`;
            }
            // Return as is if it's already a 6-digit hex
            return colorValue;
        }
        
        // Default
        return '#000000';
    }

    // Remove interaction from a component
    removeInteraction(id, index) {
        const componentData = this.componentManager.getComponent(id);
        if (!componentData || !componentData.element) return;

        // Get current interactions
        const interactions = this.getComponentInteractions(componentData.element);
        if (index >= interactions.length) return;

        // Remove the interaction
        interactions.splice(index, 1);

        // Update interactions in metadata
        this.updateInteractionsInMetadata(id, interactions);

        // Refresh properties panel
        if (window.propertiesManager) {
            window.propertiesManager.showPropertiesForComponent(id);
        }
    }

    // Update interactions in component metadata
    updateInteractionsInMetadata(componentId, interactions) {
        const componentData = this.componentManager.getComponent(componentId);
        if (!componentData || !componentData.element) return;

        const svgElement = componentData.element;

        // Update in data-metadata attribute
        let metadata = {};
        try {
            const metadataStr = svgElement.getAttribute('data-metadata');
            if (metadataStr) {
                metadata = JSON.parse(metadataStr);
            }
        } catch (error) {
            console.error('Error parsing metadata:', error);
        }

        metadata.interactions = interactions;
        svgElement.setAttribute('data-metadata', JSON.stringify(metadata));

        // Update in memory component data
        if (!componentData.metadata) componentData.metadata = {};
        componentData.metadata.interactions = interactions;

        // Update XML metadata if it exists
        const metadataElement = svgElement.querySelector('metadata component');
        if (metadataElement) {
            let interactionsElement = metadataElement.querySelector('interactions');
            if (!interactionsElement) {
                interactionsElement = document.createElementNS(null, 'interactions');
                metadataElement.appendChild(interactionsElement);
            }

            // Clear existing interactions
            while (interactionsElement.firstChild) {
                interactionsElement.removeChild(interactionsElement.firstChild);
            }

            // Add new interactions
            interactions.forEach(interaction => {
                const interactionEl = document.createElementNS(null, 'interaction');
                interactionEl.setAttribute('event', interaction.event);
                interactionEl.setAttribute('action', interaction.action);
                interactionEl.setAttribute('target', interaction.target);
                interactionEl.setAttribute('property', interaction.property);
                interactionEl.setAttribute('value', interaction.value);
                interactionsElement.appendChild(interactionEl);
            });
        }
    }

    // Execute interaction
    executeInteraction(interaction, sourceComponent) {
        if (!interaction.target || !interaction.action) return;

        const targetComponent = this.componentManager.getComponent(interaction.target);
        if (!targetComponent) return;

        const { action, property, value } = interaction;

        switch (action) {
            case 'set':
                this.setComponentProperty(targetComponent, property, value);
                break;
            case 'toggle':
                this.toggleComponentProperty(targetComponent, property);
                break;
            case 'increment':
                this.incrementComponentProperty(targetComponent, property, parseFloat(value) || 1);
                break;
            case 'decrement':
                this.incrementComponentProperty(targetComponent, property, -(parseFloat(value) || 1));
                break;
        }
    }

    // Set component property
    setComponentProperty(component, property, value) {
        if (!component.metadata) component.metadata = {};
        if (!component.metadata.parameters) component.metadata.parameters = {};

        component.metadata.parameters[property] = value;

        // Update in SVG
        if (component.element && window.propertiesManager?.metadataManager) {
            window.propertiesManager.metadataManager.applyParameterToSVG(
                component.element, 
                `parameters.${property}`, 
                value
            );
        }
    }

    // Toggle boolean component property
    toggleComponentProperty(component, property) {
        if (!component.metadata) component.metadata = {};
        if (!component.metadata.parameters) component.metadata.parameters = {};

        const currentValue = component.metadata.parameters[property];
        const newValue = currentValue === true || currentValue === 'true' ? false : true;
        
        this.setComponentProperty(component, property, newValue);
    }

    // Increment/decrement numeric component property
    incrementComponentProperty(component, property, increment) {
        if (!component.metadata) component.metadata = {};
        if (!component.metadata.parameters) component.metadata.parameters = {};

        const currentValue = parseFloat(component.metadata.parameters[property]) || 0;
        const newValue = currentValue + increment;
        
        this.setComponentProperty(component, property, newValue);
    }
}
