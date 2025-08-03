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
            html += this.generateValueInput(componentData.id, index, interaction.value || '', propertyType, interaction.target, interaction.property);
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
        
        // Pobierz mapowane właściwości komponentu
        const mappedProperties = this.propertiesMapper.mappedProperties;
        const componentData = mappedProperties.get(targetComponentId);
        
        if (!componentData || !componentData.parameters) {
            console.warn(`[InteractionsManager] No parameters found for component ${targetComponentId}`);
            return html;
        }
        
        // Generuj opcje na podstawie parametrów komponentu
        Object.entries(componentData.parameters).forEach(([paramName, paramData]) => {
            // Filtruj parametry na podstawie typu akcji
            let shouldInclude = false;
            
            switch (actionType) {
                case 'set':
                    shouldInclude = paramData.writable;
                    break;
                case 'get':
                case 'read':
                    shouldInclude = paramData.readable;
                    break;
                case 'toggle':
                    shouldInclude = paramData.writable && (paramData.type === 'boolean' || paramData.value === true || paramData.value === false);
                    break;
                default:
                    shouldInclude = paramData.writable;
            }
            
            if (shouldInclude) {
                const selected = paramName === selectedProperty ? 'selected' : '';
                const typeInfo = paramData.type ? ` (${paramData.type})` : '';
                const sourceInfo = paramData.source ? ` [${paramData.source}]` : '';
                const currentValue = paramData.value !== undefined ? ` = ${paramData.value}` : '';
                
                html += `<option value="${paramName}" ${selected}>${paramName}${typeInfo}${currentValue}${sourceInfo}</option>`;
            }
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
    generateValueInput(componentId, index, currentValue, propertyType, targetComponentId, propertyName) {
        const onChangeHandler = `updateInteraction('${componentId}', ${index}, 'value', this.value)`;
        
        switch (propertyType) {
            case 'boolean':
                // Użyj listy rozwijanej dla wartości boolean
                const booleanOptions = [
                    { value: 'true', label: 'Prawda (true)' },
                    { value: 'false', label: 'Fałsz (false)' }
                ];
                let booleanHtml = `<select onchange="${onChangeHandler}" style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 3px;">`;
                booleanOptions.forEach(option => {
                    const selected = (currentValue == option.value) ? 'selected' : '';
                    booleanHtml += `<option value="${option.value}" ${selected}>${option.label}</option>`;
                });
                booleanHtml += `</select>`;
                return booleanHtml;
                
            case 'number':
                // Lista rozwijana z predefiniowanymi wartościami liczbowymi plus pole custom
                let numberHtml = `<div style="display: flex; gap: 5px; align-items: center;">`;
                numberHtml += `<select onchange="if(this.value === 'custom') { this.nextElementSibling.style.display = 'block'; this.nextElementSibling.focus(); } else { ${onChangeHandler.replace('this.value', 'this.value')}; this.nextElementSibling.style.display = 'none'; }" style="flex: 1; padding: 4px; border: 1px solid #ddd; border-radius: 3px;">`;
                const numberPresets = [0, 1, 10, 50, 100, 200, 500, 1000];
                numberHtml += `<option value="custom">Własna wartość...</option>`;
                numberPresets.forEach(preset => {
                    const selected = (currentValue == preset) ? 'selected' : '';
                    numberHtml += `<option value="${preset}" ${selected}>${preset}</option>`;
                });
                numberHtml += `</select>`;
                numberHtml += `<input type="number" value="${currentValue || 0}" onchange="${onChangeHandler}" step="any" style="width: 80px; padding: 4px; border: 1px solid #ddd; border-radius: 3px; display: ${numberPresets.includes(parseInt(currentValue)) ? 'none' : 'block'};">`;
                numberHtml += `</div>`;
                return numberHtml;
                
            case 'color':
                // Lista predefiniowanych kolorów plus custom picker
                const colorPresets = [
                    { value: '#ff0000', label: 'Czerwony' },
                    { value: '#00ff00', label: 'Zielony' },
                    { value: '#0000ff', label: 'Niebieski' },
                    { value: '#ffff00', label: 'Żółty' },
                    { value: '#ff8000', label: 'Pomarańczowy' },
                    { value: '#800080', label: 'Fioletowy' },
                    { value: '#000000', label: 'Czarny' },
                    { value: '#ffffff', label: 'Biały' }
                ];
                let colorHtml = `<div style="display: flex; gap: 5px; align-items: center;">`;
                colorHtml += `<select onchange="if(this.value === 'custom') { this.nextElementSibling.style.display = 'block'; } else { ${onChangeHandler.replace('this.value', 'this.value')}; this.nextElementSibling.style.display = 'none'; }" style="flex: 1; padding: 4px; border: 1px solid #ddd; border-radius: 3px;">`;
                colorHtml += `<option value="custom">Własny kolor...</option>`;
                colorPresets.forEach(preset => {
                    const selected = (currentValue === preset.value) ? 'selected' : '';
                    colorHtml += `<option value="${preset.value}" ${selected}>${preset.label}</option>`;
                });
                colorHtml += `</select>`;
                const colorValue = currentValue || '#ffffff';
                const isCustomColor = !colorPresets.some(p => p.value === currentValue);
                colorHtml += `<input type="color" value="${colorValue}" onchange="${onChangeHandler}" style="width: 40px; height: 30px; padding: 0; border: 1px solid #ddd; border-radius: 3px; display: ${isCustomColor ? 'block' : 'none'};">`;
                colorHtml += `</div>`;
                return colorHtml;
                
            case 'range':
                // Slider z predefiniowanymi wartościami
                let rangeHtml = `<div style="display: flex; gap: 5px; align-items: center;">`;
                rangeHtml += `<select onchange="if(this.value === 'custom') { this.nextElementSibling.style.display = 'block'; } else { ${onChangeHandler.replace('this.value', 'this.value')}; this.nextElementSibling.style.display = 'none'; }" style="flex: 1; padding: 4px; border: 1px solid #ddd; border-radius: 3px;">`;
                const rangePresets = [0, 25, 50, 75, 100];
                rangeHtml += `<option value="custom">Własna wartość...</option>`;
                rangePresets.forEach(preset => {
                    const selected = (currentValue == preset) ? 'selected' : '';
                    rangeHtml += `<option value="${preset}" ${selected}>${preset}%</option>`;
                });
                rangeHtml += `</select>`;
                const isCustomRange = !rangePresets.includes(parseInt(currentValue));
                rangeHtml += `<input type="range" value="${currentValue || 50}" min="0" max="100" onchange="${onChangeHandler}" style="width: 100px; display: ${isCustomRange ? 'block' : 'none'};">`;
                rangeHtml += `</div>`;
                return rangeHtml;
                
            default:
                // Dla tekstu, sprawdź czy są predefiniowane wartości na podstawie nazwy parametru
                const textPresets = this.getTextPresetsForParameter(propertyName, targetComponentId);
                if (textPresets.length > 0) {
                    let textHtml = `<select onchange="if(this.value === 'custom') { this.nextElementSibling.style.display = 'block'; this.nextElementSibling.focus(); } else { ${onChangeHandler.replace('this.value', 'this.value')}; this.nextElementSibling.style.display = 'none'; }" style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 3px;">`;
                    textHtml += `<option value="custom">Własna wartość...</option>`;
                    textPresets.forEach(preset => {
                        const selected = (currentValue === preset) ? 'selected' : '';
                        textHtml += `<option value="${preset}" ${selected}>${preset}</option>`;
                    });
                    textHtml += `</select>`;
                    const isCustomText = !textPresets.includes(currentValue);
                    textHtml += `<input type="text" value="${currentValue || ''}" onchange="${onChangeHandler}" style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 3px; margin-top: 5px; display: ${isCustomText ? 'block' : 'none'};">`;
                    return textHtml;
                } else {
                    return `<input type="text" value="${currentValue || ''}" onchange="${onChangeHandler}" style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 3px;">`;
                }
        }
    }
    
    // Pobierz predefiniowane wartości tekstowe dla konkretnego parametru
    getTextPresetsForParameter(parameterName, componentId) {
        // Predefiniowane wartości na podstawie nazwy parametru
        const commonPresets = {
            'label': ['LED', 'Button', 'Motor', 'Sensor', 'Display'],
            'state': ['on', 'off', 'active', 'inactive', 'running', 'stopped'],
            'mode': ['auto', 'manual', 'test', 'debug'],
            'status': ['ok', 'error', 'warning', 'info'],
            'direction': ['up', 'down', 'left', 'right', 'clockwise', 'counterclockwise'],
            'speed': ['slow', 'medium', 'fast', 'stop'],
            'size': ['small', 'medium', 'large', 'xl'],
            'position': ['top', 'bottom', 'left', 'right', 'center']
        };
        
        // Sprawdź czy nazwa parametru pasuje do któregoś z predefiniowanych
        const lowerParamName = parameterName?.toLowerCase() || '';
        for (const [key, values] of Object.entries(commonPresets)) {
            if (lowerParamName.includes(key)) {
                return values;
            }
        }
        
        return [];
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
            
            // DYNAMIC PROPERTY SELECT POPULATION
            // When target component is selected, dynamically populate property select
            if (property === 'target' && value) {
                console.log('Target component changed to: ' + value);
                this.populatePropertySelectForTarget(id, index, value);
            }
            
            // When property is selected, auto-set default value input type
            if (property === 'property' && value) {
                console.log('Property changed to: ' + value);
                const targetId = interactions[index].target;
                if (targetId) {
                    this.setDefaultValueInputForProperty(id, index, targetId, value);
                }
            }
        }
    }
    
    // NEW METHOD: Populate property select for target component
    populatePropertySelectForTarget(sourceId, interactionIndex, targetId) {
        try {
            console.log('Populating properties for target: ' + targetId);
            
            // Get target component data
            const targetComponent = this.componentManager.getComponent(targetId);
            if (!targetComponent) {
                console.warn('Target component ' + targetId + ' not found');
                return;
            }
            
            // Get properties from PropertiesMapper
            const propertiesMapper = window.propertiesManager?.propertiesMapper;
            if (!propertiesMapper) {
                console.warn('PropertiesMapper not available');
                return;
            }
            
            const mappedProperties = propertiesMapper.mappedProperties.get(targetId);
            if (!mappedProperties || !mappedProperties.parameters) {
                console.warn('No mapped properties found for ' + targetId);
                return;
            }
            
            // Extract available properties/variables
            const availableProperties = Object.keys(mappedProperties.parameters);
            console.log('Available properties for ' + targetId + ':', availableProperties);
            
            // Find the property select element for this interaction
            const propertySelect = document.querySelector(
                `select[onchange*="updateInteraction('${sourceId}', ${interactionIndex}, 'property'"`
            );
            
            if (!propertySelect) {
                console.warn('Property select element not found');
                return;
            }
            
            // Clear existing options
            propertySelect.innerHTML = '<option value="">Wybierz właściwość</option>';
            
            // Add options for each available property
            availableProperties.forEach(propName => {
                const propValue = mappedProperties.parameters[propName];
                const propType = this.detectPropertyType(propValue);
                
                const option = document.createElement('option');
                option.value = propName;
                option.textContent = propName + ' (' + propType + ')';
                propertySelect.appendChild(option);
            });
            
            console.log('Populated ' + availableProperties.length + ' properties for ' + targetId);
            
        } catch (error) {
            console.error('Error populating property select:', error);
        }
    }
    
    // NEW METHOD: Set default value input based on property type
    setDefaultValueInputForProperty(sourceId, interactionIndex, targetId, propertyName) {
        try {
            console.log('Setting default value input for property: ' + propertyName);
            
            // Get target component properties
            const propertiesMapper = window.propertiesManager?.propertiesMapper;
            const mappedProperties = propertiesMapper?.mappedProperties.get(targetId);
            
            if (!mappedProperties || !mappedProperties.parameters) {
                console.warn('No properties found for ' + targetId);
                return;
            }
            
            const propertyValue = mappedProperties.parameters[propertyName];
            const propertyType = this.detectPropertyType(propertyValue);
            
            console.log('Property ' + propertyName + ': value=' + propertyValue + ', type=' + propertyType);
            
            // Find the value input element for this interaction
            const valueContainer = document.querySelector(
                `input[onchange*="updateInteraction('${sourceId}', ${interactionIndex}, 'value'"`
            )?.parentElement;
            
            if (!valueContainer) {
                console.warn('Value input container not found');
                return;
            }
            
            // Create appropriate input based on property type
            const newInput = this.createValueInputByType(sourceId, interactionIndex, propertyType, propertyValue);
            
            if (newInput) {
                // Replace existing input
                const oldInput = valueContainer.querySelector('input, select');
                if (oldInput) {
                    oldInput.replaceWith(newInput);
                    console.log('Updated value input to type: ' + propertyType);
                }
            }
            
        } catch (error) {
            console.error('Error setting default value input:', error);
        }
    }
    
    // NEW METHOD: Detect property type from value
    detectPropertyType(value) {
        if (value === null || value === undefined) return 'text';
        
        const stringValue = value.toString().toLowerCase();
        
        // Boolean detection
        if (stringValue === 'true' || stringValue === 'false') {
            return 'boolean';
        }
        
        // Number detection
        if (!isNaN(parseFloat(stringValue)) && isFinite(stringValue)) {
            return 'number';
        }
        
        // Color detection
        if (stringValue.startsWith('#') || stringValue.startsWith('rgb') || 
            ['red', 'green', 'blue', 'yellow', 'orange', 'purple', 'white', 'black'].includes(stringValue)) {
            return 'color';
        }
        
        // Enum detection (specific known values)
        if (['on', 'off', 'active', 'inactive', 'start', 'stop', 'high', 'low', 'open', 'closed'].includes(stringValue)) {
            return 'enum';
        }
        
        // Default to text
        return 'text';
    }
    
    // NEW METHOD: Create appropriate input element based on type
    createValueInputByType(sourceId, interactionIndex, type, currentValue) {
        const onChangeHandler = `updateInteraction('${sourceId}', ${interactionIndex}, 'value', this.value)`;
        
        switch (type) {
            case 'boolean': {
                const select = document.createElement('select');
                select.setAttribute('onchange', onChangeHandler);
                
                const optionTrue = document.createElement('option');
                optionTrue.value = 'true';
                optionTrue.textContent = 'True';
                optionTrue.selected = currentValue?.toString().toLowerCase() === 'true';
                
                const optionFalse = document.createElement('option');
                optionFalse.value = 'false';
                optionFalse.textContent = 'False';
                optionFalse.selected = currentValue?.toString().toLowerCase() === 'false';
                
                select.appendChild(optionTrue);
                select.appendChild(optionFalse);
                return select;
            }
            
            case 'number': {
                const input = document.createElement('input');
                input.type = 'number';
                input.value = currentValue || '0';
                input.setAttribute('onchange', onChangeHandler);
                input.step = 'any';
                return input;
            }
            
            case 'color': {
                const input = document.createElement('input');
                input.type = 'color';
                input.value = this.normalizeColorValue(currentValue) || '#000000';
                input.setAttribute('onchange', onChangeHandler);
                return input;
            }
            
            case 'enum': {
                const select = document.createElement('select');
                select.setAttribute('onchange', onChangeHandler);
                
                // Common enum values
                const enumValues = ['on', 'off', 'active', 'inactive', 'start', 'stop', 'high', 'low', 'open', 'closed'];
                
                enumValues.forEach(enumValue => {
                    const option = document.createElement('option');
                    option.value = enumValue;
                    option.textContent = enumValue.charAt(0).toUpperCase() + enumValue.slice(1);
                    option.selected = currentValue?.toString().toLowerCase() === enumValue;
                    select.appendChild(option);
                });
                
                return select;
            }
            
            default: // 'text'
                const input = document.createElement('input');
                input.type = 'text';
                input.value = currentValue || '';
                input.setAttribute('onchange', onChangeHandler);
                return input;
        }
    }
    
    // NEW METHOD: Normalize color value for color input
    normalizeColorValue(colorValue) {
        if (!colorValue) return '#000000';
        
        const stringValue = colorValue.toString().toLowerCase();
        
        // If already hex, return as is
        if (stringValue.startsWith('#')) {
            return stringValue;
        }
        
        // Color name to hex mapping
        const colorMap = {
            'red': '#ff0000',
            'green': '#00ff00',
            'blue': '#0000ff',
            'yellow': '#ffff00',
            'orange': '#ffa500',
            'purple': '#800080',
            'white': '#ffffff',
            'black': '#000000'
        };
        
        return colorMap[stringValue] || '#000000';
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
