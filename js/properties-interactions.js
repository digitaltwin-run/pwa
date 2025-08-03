// Digital Twin IDE - Properties Interactions Module

import { PropertiesMapper } from './properties-mapper.js';

export class InteractionsManager {
    constructor(componentManager) {
        this.componentManager = componentManager;
        this.propertiesMapper = new PropertiesMapper(componentManager);
        
        // Automatycznie skanuj właściwości przy inicjalizacji
        this.refreshPropertiesMapping();
    }
    
    // Odśwież mapowanie właściwości
    refreshPropertiesMapping() {
        this.propertiesMapper.scanCanvasProperties();
    }

    // Generuj sekcję interakcji dla komponentu
    generateInteractionsSection(componentData) {
        if (!componentData || !componentData.element) return '';

        const interactions = this.getComponentInteractions(componentData.element);
        let html = '<div class="interactions-section" style="margin-top: 20px;">';
        html += '<h5>Interakcje:</h5>';

        interactions.forEach((interaction, index) => {
            html += `<div class="interaction" style="margin-bottom: 15px; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">`;
            html += `<h6>Interakcja ${index + 1}</h6>`;

            // Wybór zdarzenia
            html += `<label>Zdarzenie:</label>`;
            html += `<select onchange="updateInteraction('${componentData.id}', ${index}, 'event', this.value)">`;
            html += this.generateEventOptions(interaction.event, componentData.metadata?.type);
            html += `</select><br>`;

            // Wybór akcji
            html += `<label>Akcja:</label>`;
            html += `<select onchange="updateInteraction('${componentData.id}', ${index}, 'action', this.value)">`;
            html += `<option value="set" ${interaction.action === 'set' ? 'selected' : ''}>Ustaw wartość</option>`;
            html += `<option value="toggle" ${interaction.action === 'toggle' ? 'selected' : ''}>Przełącz</option>`;
            html += `<option value="increment" ${interaction.action === 'increment' ? 'selected' : ''}>Zwiększ</option>`;
            html += `<option value="decrement" ${interaction.action === 'decrement' ? 'selected' : ''}>Zmniejsz</option>`;
            html += `</select><br>`;

            // Komponent docelowy
            html += `<label>Komponent docelowy:</label>`;
            html += `<select onchange="updateInteraction('${componentData.id}', ${index}, 'target', this.value)">`;
            html += this.generateTargetOptions(interaction.target);
            html += `</select><br>`;

            // Właściwość/Zmienna
            html += `<label>Właściwość/Zmienna:</label>`;
            html += `<select onchange="updateInteraction('${componentData.id}', ${index}, 'property', this.value)">`;
            html += this.generatePropertyOptions(interaction.target, interaction.property, interaction.action);
            html += `</select><br>`;

            // Wartość
            html += `<label>Wartość:</label>`;
            const propertyType = this.getPropertyType(interaction.target, interaction.property);
            html += this.generateValueInput(componentData.id, index, interaction.value || '', propertyType);
            html += `<br>`;

            // Przycisk usuwania
            html += `<button onclick="removeInteraction('${componentData.id}', ${index})" 
                           style="background: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 3px;">
                       ❌ Usuń
                     </button>`;

            html += `</div>`;
        });

        // Przycisk dodawania nowej interakcji
        html += `<button onclick="addInteraction('${componentData.id}')" 
                       class="btn btn-primary" style="margin-top: 10px;">
                   ➕ Dodaj interakcję
                 </button>`;

        html += '</div>';
        return html;
    }

    // Generuj opcje dla zdarzeń w zależności od typu komponentu
    generateEventOptions(selectedEvent, componentType) {
        // Użyj mapowanych zdarzeń z properties mapper
        let events = [];
        
        // Znajdź komponent o danym typie w mapowanych właściwościach
        const mappedProperties = this.propertiesMapper.mappedProperties;
        let availableEvents = [];
        
        // Znajdź pierwszy komponent o danym typie i użyj jego zdarzeń
        for (const [componentId, properties] of mappedProperties) {
            if (properties.type === componentType) {
                availableEvents = properties.events;
                break;
            }
        }
        
        // Fallback do domyślnych zdarzeń jeśli nie znaleziono
        if (availableEvents.length === 0) {
            const defaultEvents = {
                'button': ['click', 'press', 'release', 'hover'],
                'switch': ['toggle', 'on', 'off', 'change'],
                'led': ['on', 'off', 'blink', 'change'],
                'sensor': ['change', 'threshold', 'update', 'alert'],
                'display': ['change', 'update', 'clear'],
                'gauge': ['change', 'min', 'max', 'threshold'],
                'motor': ['start', 'stop', 'change', 'speed'],
                'default': ['click', 'change', 'hover']
            };
            
            availableEvents = defaultEvents[componentType] || defaultEvents['default'];
        }

        let html = '<option value="">Wybierz zdarzenie</option>';
        availableEvents.forEach(eventValue => {
            const selected = eventValue === selectedEvent ? 'selected' : '';
            const eventLabel = this.getEventLabel(eventValue);
            html += `<option value="${eventValue}" ${selected}>${eventLabel}</option>`;
        });

        return html;
    }
    
    // Pobierz czytelną etykietę dla zdarzenia
    getEventLabel(eventValue) {
        const eventLabels = {
            'click': 'Kliknięcie',
            'press': 'Naciśnięcie',
            'release': 'Zwolnienie', 
            'hover': 'Najechanie',
            'change': 'Zmiana',
            'toggle': 'Przełączenie',
            'on': 'Włączenie',
            'off': 'Wyłączenie',
            'blink': 'Miganie',
            'threshold': 'Przekroczenie progu',
            'update': 'Aktualizacja wartości',
            'alert': 'Alarm',
            'clear': 'Wyczyść',
            'min': 'Minimum',
            'max': 'Maksimum',
            'start': 'Start',
            'stop': 'Stop',
            'speed': 'Zmiana prędkości'
        };
        
        return eventLabels[eventValue] || eventValue;
    }

    // Generuj opcje dla wyboru komponentu docelowego
    generateTargetOptions(selectedTargetId) {
        // Użyj mapowaných komponentów z properties mapper
        const availableComponents = this.propertiesMapper.getAvailableTargetComponents();
        let html = '<option value="">Wybierz komponent</option>';

        availableComponents.forEach(comp => {
            const selected = comp.id === selectedTargetId ? 'selected' : '';
            const paramCount = comp.parameters.length;
            const typeInfo = comp.type !== 'unknown' ? ` (${comp.type})` : '';
            
            html += `<option value="${comp.id}" ${selected}>${comp.name}${typeInfo} - ${paramCount} param.</option>`;
        });

        return html;
    }
    
    // Generuj opcje dla właściwości/zmiennych na podstawie wybranego komponentu i akcji
    generatePropertyOptions(targetComponentId, selectedProperty, actionType) {
        let html = '<option value="">Wybierz właściwość</option>';
        
        if (!targetComponentId) {
            return html;
        }
        
        // Pobierz dostępne zmienne dla danego typu akcji
        const availableVariables = this.propertiesMapper.getVariablesForActionType(actionType || 'set');
        
        // Filtruj zmienne dla wybranego komponentu
        const componentVariables = availableVariables.filter(variable => 
            variable.componentId === targetComponentId
        );
        
        componentVariables.forEach(variable => {
            const selected = variable.parameter === selectedProperty ? 'selected' : '';
            const typeInfo = variable.type ? ` (${variable.type})` : '';
            html += `<option value="${variable.parameter}" ${selected}>${variable.parameter}${typeInfo}</option>`;
        });
        
        return html;
    }
    
    // Pobierz typ właściwości dla danego komponentu i właściwości
    getPropertyType(targetComponentId, propertyName) {
        if (!targetComponentId || !propertyName) {
            return 'string';
        }
        
        const mappedProperties = this.propertiesMapper.mappedProperties;
        const componentProps = mappedProperties.get(targetComponentId);
        
        if (componentProps && componentProps.parameters && componentProps.parameters[propertyName]) {
            return componentProps.parameters[propertyName].type;
        }
        
        // Sprawdź w kolorach
        if (componentProps && componentProps.colors && componentProps.colors[propertyName]) {
            return 'color';
        }
        
        // Sprawdź w stanach
        if (componentProps && componentProps.states && componentProps.states[propertyName] !== undefined) {
            return typeof componentProps.states[propertyName] === 'boolean' ? 'boolean' : 'string';
        }
        
        return 'string';
    }
    
    // Generuj odpowiednie pole wprowadzania wartości na podstawie typu właściwości
    generateValueInput(componentId, index, currentValue, propertyType) {
        const onChangeHandler = `updateInteraction('${componentId}', ${index}, 'value', this.value)`;
        
        switch (propertyType) {
            case 'boolean':
                const checked = currentValue === 'true' || currentValue === true ? 'checked' : '';
                return `<input type="checkbox" ${checked} onchange="updateInteraction('${componentId}', ${index}, 'value', this.checked.toString())">`;
                
            case 'number':
                return `<input type="number" value="${currentValue}" onchange="${onChangeHandler}" step="any">`;
                
            case 'color':
                const colorValue = currentValue || '#ffffff';
                return `<input type="color" value="${colorValue}" onchange="${onChangeHandler}">`;
                
            case 'range':
                return `<input type="range" value="${currentValue || 50}" min="0" max="100" onchange="${onChangeHandler}">`;
                
            default:
                return `<input type="text" value="${currentValue}" onchange="${onChangeHandler}">`;
        }
    }

    // Pobierz interakcje z metadanych komponentu
    getComponentInteractions(svgElement) {
        if (!svgElement) return [];

        try {
            const metadataAttr = svgElement.getAttribute('data-metadata');
            if (metadataAttr) {
                const metadata = JSON.parse(metadataAttr);
                return metadata.interactions || [];
            }

            // Fallback: sprawdź XML metadata
            const metadataElement = svgElement.querySelector('metadata component');
            if (metadataElement) {
                const interactionsElement = metadataElement.querySelector('interactions');
                if (interactionsElement) {
                    const interactions = [];
                    Array.from(interactionsElement.children).forEach(interactionEl => {
                        interactions.push({
                            event: interactionEl.getAttribute('event') || '',
                            action: interactionEl.getAttribute('action') || '',
                            target: interactionEl.getAttribute('target') || '',
                            property: interactionEl.getAttribute('property') || '',
                            value: interactionEl.getAttribute('value') || ''
                        });
                    });
                    return interactions;
                }
            }
        } catch (e) {
            console.error('Error parsing interactions metadata:', e);
        }

        return [];
    }

    // Dodaj nową interakcję do komponentu
    addInteraction(id) {
        const componentData = this.componentManager.getComponent(id);
        if (!componentData) return;

        const interactions = this.getComponentInteractions(componentData.element);
        interactions.push({
            event: '',
            action: 'set',
            target: '',
            property: '',
            value: ''
        });

        this.updateInteractionsInMetadata(id, interactions);

        // Odśwież panel właściwości
        if (window.propertiesManager) {
            window.propertiesManager.showProperties(componentData.element);
        }
    }

    // Aktualizuj interakcję komponentu
    updateInteraction(id, index, property, value) {
        const componentData = this.componentManager.getComponent(id);
        if (!componentData) return;

        const interactions = this.getComponentInteractions(componentData.element);
        if (index >= 0 && index < interactions.length) {
            interactions[index][property] = value;
            this.updateInteractionsInMetadata(id, interactions);
        }
    }

    // Usuń interakcję z komponentu
    removeInteraction(id, index) {
        const componentData = this.componentManager.getComponent(id);
        if (!componentData) return;

        const interactions = this.getComponentInteractions(componentData.element);
        if (index >= 0 && index < interactions.length) {
            interactions.splice(index, 1);
            this.updateInteractionsInMetadata(id, interactions);

            // Odśwież panel właściwości
            if (window.propertiesManager) {
                window.propertiesManager.showProperties(componentData.element);
            }
        }
    }

    // Aktualizuj interakcje w metadanych komponentu
    updateInteractionsInMetadata(componentId, interactions) {
        const componentData = this.componentManager.getComponent(componentId);
        if (!componentData || !componentData.element) return;

        const svgElement = componentData.element;

        // Aktualizuj w data-metadata
        const metadataAttr = svgElement.getAttribute('data-metadata');
        let metadata = {};
        
        try {
            if (metadataAttr) {
                metadata = JSON.parse(metadataAttr);
            }
        } catch (e) {
            console.error('Error parsing metadata:', e);
        }

        metadata.interactions = interactions;
        svgElement.setAttribute('data-metadata', JSON.stringify(metadata));

        // Aktualizuj w pamięci komponentu
        if (!componentData.metadata) componentData.metadata = {};
        componentData.metadata.interactions = interactions;

        // Aktualizuj XML metadata jeśli istnieje
        const metadataElement = svgElement.querySelector('metadata component');
        if (metadataElement) {
            let interactionsElement = metadataElement.querySelector('interactions');
            if (!interactionsElement) {
                interactionsElement = document.createElementNS(null, 'interactions');
                metadataElement.appendChild(interactionsElement);
            }

            // Wyczyść istniejące interakcje
            while (interactionsElement.firstChild) {
                interactionsElement.removeChild(interactionsElement.firstChild);
            }

            // Dodaj nowe interakcje
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

    // Wykonaj interakcję
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

    // Ustaw właściwość komponentu
    setComponentProperty(component, property, value) {
        if (!component.metadata) component.metadata = {};
        if (!component.metadata.parameters) component.metadata.parameters = {};

        component.metadata.parameters[property] = value;

        // Zaktualizuj w SVG
        if (component.element && window.propertiesManager?.metadataManager) {
            window.propertiesManager.metadataManager.applyParameterToSVG(
                component.element, 
                `parameters.${property}`, 
                value
            );
        }
    }

    // Przełącz właściwość boolean komponentu
    toggleComponentProperty(component, property) {
        if (!component.metadata) component.metadata = {};
        if (!component.metadata.parameters) component.metadata.parameters = {};

        const currentValue = component.metadata.parameters[property];
        const newValue = !currentValue;
        
        this.setComponentProperty(component, property, newValue);
    }

    // Zwiększ/zmniejsz właściwość liczbową komponentu
    incrementComponentProperty(component, property, increment) {
        if (!component.metadata) component.metadata = {};
        if (!component.metadata.parameters) component.metadata.parameters = {};

        const currentValue = parseFloat(component.metadata.parameters[property]) || 0;
        const newValue = currentValue + increment;
        
        this.setComponentProperty(component, property, newValue);
    }
}
