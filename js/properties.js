// Digital Twin IDE - Properties Module

export class PropertiesManager {
    constructor(componentManager) {
        this.componentManager = componentManager;
    }

    // Wybór komponentu
    selectComponent(element) {
        // Usuń poprzednie zaznaczenie
        document.querySelectorAll('.draggable-component').forEach(comp => {
            comp.style.outline = '';
        });

        // Zaznacz nowy komponent
        if (element) {
            element.style.outline = '2px solid #3498db';
            this.componentManager.setSelectedComponent(element);
            this.showProperties(element);
        } else {
            this.componentManager.setSelectedComponent(null);
            this.clearProperties();
        }
    }

    // Pokaż właściwości komponentu
    showProperties(svgElement) {
        console.log('showProperties called with element:', svgElement);
        if (!svgElement) {
            console.log('No element provided to showProperties');
            return;
        }

        const propertiesPanel = document.getElementById('properties-panel');
        if (!propertiesPanel) return;

        const id = svgElement.getAttribute('data-id');
        const componentData = this.componentManager.getComponent(id);

        if (!componentData) {
            this.clearProperties();
            return;
        }

        let html = `<h4>Komponent: ${id}</h4>`;

        // Pozycja
        const x = parseFloat(svgElement.getAttribute('x')) || 0;
        const y = parseFloat(svgElement.getAttribute('y')) || 0;

        html += `
            <label>Pozycja X:</label>
            <input type="number" value="${x}" onchange="updatePosition('${id}', 'x', this.value)">
            <label>Pozycja Y:</label>
            <input type="number" value="${y}" onchange="updatePosition('${id}', 'y', this.value)">
        `;

        // Parametry z metadanych
        if (componentData.metadata && componentData.metadata.parameters) {
            html += '<h5>Parametry:</h5>';

            for (const [key, param] of Object.entries(componentData.metadata.parameters)) {
                const label = this.componentManager.formatLabel(key);
                // Fix: param is the direct value from XML, not an object with .value property
                const value = param !== undefined ? param : '';
                
                // Determine input type based on value type and key name
                let type = 'text';
                if (key.toLowerCase().includes('color')) {
                    type = 'color';
                } else if (typeof param === 'boolean') {
                    type = 'checkbox';
                } else if (typeof param === 'number') {
                    type = 'number';
                }

                html += `<label>${label}:</label>`;

                if (type === 'color') {
                    html += `<input type="color" value="${value}" onchange="updateParam('${id}', '${key}', this.value, '${type}')">`;
                } else if (type === 'checkbox') {
                    const checked = value ? 'checked' : '';
                    html += `<input type="checkbox" ${checked} onchange="updateParam('${id}', '${key}', this.checked, 'boolean')">`;
                } else if (type === 'number') {
                    html += `<input type="number" value="${value}" onchange="updateParam('${id}', '${key}', this.value, 'number')">`;
                } else {
                    html += `<input type="text" value="${value}" onchange="updateParam('${id}', '${key}', this.value, 'text')">`;
                }
            }
        }

        // Dodaj parametr
        html += `
            <button id="add-param-btn-${id}" class="btn btn-success" style="margin-top: 10px;">
                ➕ Dodaj parametr
            </button>
        `;
        
        // Sekcja interakcji (DSL)
        console.log('Calling generateInteractionsSection with componentData:', componentData);
        const interactionsHtml = this.generateInteractionsSection(componentData);
        console.log('Generated interactions HTML:', interactionsHtml);
        html += interactionsHtml;

        // Usuń komponent
        html += `
            <button id="remove-component-btn-${id}" class="btn btn-danger" style="margin-top: 5px;">
                🗑️ Usuń komponent
            </button>
        `;

        // Edytuj metadane (zaawansowane)
        html += `
            <button id="edit-metadata-btn-${id}" class="btn btn-warning" style="margin-top: 5px;">
                ⚙️ Edytuj metadane
            </button>
        `;

        propertiesPanel.innerHTML = html;
        
        // Dodaj event listenery po dodaniu HTML
        setTimeout(() => {
            const addParamBtn = document.getElementById(`add-param-btn-${id}`);
            const removeBtn = document.getElementById(`remove-component-btn-${id}`);
            const editBtn = document.getElementById(`edit-metadata-btn-${id}`);
            const addInteractionBtn = document.getElementById(`add-interaction-btn-${id}`);
            
            if (addParamBtn) {
                addParamBtn.addEventListener('click', () => this.addParameter(id));
            }
            
            if (removeBtn) {
                removeBtn.addEventListener('click', () => this.removeComponent(id));
            }
            
            if (editBtn) {
                editBtn.addEventListener('click', () => this.editMetadataRaw(id));
            }
            
            if (addInteractionBtn) {
                addInteractionBtn.addEventListener('click', () => this.addInteraction(id));
            }
        }, 0);
    }

    clearProperties() {
        const propertiesPanel = document.getElementById('properties-panel');
        if (propertiesPanel) {
            propertiesPanel.innerHTML = '<p>Wybierz komponent, aby edytować.</p>';
        }
    }

    // Aktualizuj parametr komponentu
    updateParam(id, paramKey, value, type) {
        const componentData = this.componentManager.getComponent(id);
        if (!componentData) return;

        // Convert value to appropriate type
        let convertedValue = value;
        if (type === 'boolean') {
            convertedValue = value === true || value === 'true';
        } else if (type === 'number') {
            convertedValue = parseFloat(value) || 0;
        }

        // Aktualizuj w metadanych (direct value, not .value property)
        if (!componentData.metadata.parameters) {
            componentData.metadata.parameters = {};
        }

        componentData.metadata.parameters[paramKey] = convertedValue;

        // Aktualizuj metadane w SVG (direct path)
        this.updateMetadataInSVG(componentData.element, `parameters.${paramKey}`, convertedValue);

        // Zastosuj wizualnie
        this.applyParameterToSVG(componentData.element, paramKey, convertedValue);

        // Odśwież panel właściwości
        this.showProperties(componentData.element);
    }

    // Aktualizuj pozycję komponentu
    updatePosition(id, coord, value) {
        const componentData = this.componentManager.getComponent(id);
        if (!componentData) return;

        const numValue = parseFloat(value) || 0;
        componentData.element.setAttribute(coord, numValue);

        // Aktualizuj metadane
        if (!componentData.metadata.position) {
            componentData.metadata.position = {};
        }
        componentData.metadata.position[coord] = numValue;

        this.updateMetadataInSVG(componentData.element, `position.${coord}`, numValue);
    }

    // Dodaj nowy parametr
    addParameter(id) {
        const paramName = prompt("Nazwa parametru:");
        if (!paramName) return;

        const paramType = prompt("Typ parametru (text/color/range/select):", "text");
        const defaultValue = prompt("Wartość domyślna:", "");

        const componentData = this.componentManager.getComponent(id);
        if (!componentData) return;

        if (!componentData.metadata.parameters) {
            componentData.metadata.parameters = {};
        }

        componentData.metadata.parameters[paramName] = {
            type: paramType,
            default: defaultValue,
            value: defaultValue
        };

        this.updateMetadataInSVG(componentData.element, `parameters.${paramName}`, {
            type: paramType,
            default: defaultValue,
            value: defaultValue
        });

        this.showProperties(componentData.element);
    }

    // Generuj sekcję interakcji dla komponentu
    generateInteractionsSection(componentData) {
        console.log('generateInteractionsSection called with:', componentData);
        if (!componentData || !componentData.element) {
            console.log('No componentData or element, returning empty string');
            return '';
        }
        
        const id = componentData.element.getAttribute('data-id');
        let html = '';
        
        // Pobierz interakcje z metadanych
        const interactions = this.getComponentInteractions(componentData.element);
        console.log('Found interactions:', interactions);
        
        html += '<h5>Interakcje:</h5>';
        
        if (interactions && interactions.length > 0) {
            html += '<div class="interactions-list">';
            
            interactions.forEach((binding, index) => {
                html += `
                    <div class="interaction-item" style="margin-bottom: 10px; padding: 5px; border: 1px solid #ddd; border-radius: 4px;">
                        <div>
                            <label>Cel:</label>
                            <select onchange="updateInteraction('${id}', ${index}, 'targetId', this.value)">
                                ${this.generateTargetOptions(binding.targetId)}
                            </select>
                        </div>
                        <div>
                            <label>Zdarzenie:</label>
                            <select onchange="updateInteraction('${id}', ${index}, 'event', this.value)">
                                ${this.generateEventOptions(binding.event, componentData.metadata.type)}
                            </select>
                        </div>
                        <div>
                            <label>Akcja:</label>
                            <input type="text" value="${binding.action || ''}" 
                                onchange="updateInteraction('${id}', ${index}, 'action', this.value)">
                        </div>
                        <button class="btn btn-sm btn-danger" 
                            onclick="removeInteraction('${id}', ${index})" style="margin-top: 5px;">
                            🗑️ Usuń
                        </button>
                    </div>
                `;
            });
            
            html += '</div>';
        } else {
            html += '<p>Brak zdefiniowanych interakcji.</p>';
        }
        
        html += `
            <button id="add-interaction-btn-${id}" class="btn btn-primary" style="margin-top: 10px;">
                ➕ Dodaj interakcję
            </button>
        `;
        
        return html;
    }
    
    // Generuj opcje dla zdarzeń w zależności od typu komponentu
    generateEventOptions(selectedEvent, componentType) {
        const events = {
            'button': ['press', 'release', 'toggle'],
            'switch': ['on', 'off', 'toggle'],
            'slider': ['change', 'min', 'max'],
            'knob': ['change', 'min', 'max'],
            'default': ['change']
        };
        
        const eventList = events[componentType] || events.default;
        
        return eventList.map(event => {
            const selected = event === selectedEvent ? 'selected' : '';
            return `<option value="${event}" ${selected}>${event}</option>`;
        }).join('');
    }
    
    // Generuj opcje dla wyboru komponentu docelowego
    generateTargetOptions(selectedTargetId) {
        // Pobierz wszystkie komponenty z canvy
        const components = this.componentManager.getAllComponents();
        
        // Dodaj pustą opcję na początku
        let options = '<option value="">-- Wybierz komponent --</option>';
        
        // Dodaj opcje dla każdego komponentu
        if (components && components.length > 0) {
            components.forEach(comp => {
                if (comp && comp.element) {
                    // Zawsze używaj data-id jako identyfikatora komponentu
                    const compId = comp.element.getAttribute('data-id');
                    const compType = comp.metadata && comp.metadata.type ? comp.metadata.type : 'unknown';
                    const compLabel = comp.metadata && comp.metadata.parameters && comp.metadata.parameters.label ? 
                        comp.metadata.parameters.label : compId;
                    
                    const selected = compId === selectedTargetId ? 'selected' : '';
                    options += `<option value="${compId}" ${selected}>${compLabel} (${compType}: ${compId})</option>`;
                }
            });
        }
        
        return options;
    }
    
    // Pobierz interakcje z metadanych komponentu
    getComponentInteractions(svgElement) {
        console.log('getComponentInteractions called with:', svgElement);
        if (!svgElement) {
            console.log('No svgElement, returning empty array');
            return [];
        }
        
        const metadataElement = svgElement.querySelector('metadata component');
        console.log('metadataElement:', metadataElement);
        if (!metadataElement) {
            console.log('No metadataElement, returning empty array');
            return [];
        }
        
        const interactionsElement = metadataElement.querySelector('interactions');
        if (!interactionsElement) return [];
        
        const bindingElements = interactionsElement.querySelectorAll('binding');
        if (!bindingElements || bindingElements.length === 0) return [];
        
        return Array.from(bindingElements).map(binding => ({
            targetId: binding.getAttribute('targetId') || '',
            event: binding.getAttribute('event') || '',
            action: binding.getAttribute('action') || '',
            parameter: binding.getAttribute('parameter') || ''
        }));
    }
    
    // Dodaj nową interakcję do komponentu
    addInteraction(id) {
        const componentData = this.componentManager.getComponent(id);
        if (!componentData || !componentData.element) return;
        
        const svgElement = componentData.element;
        const metadataElement = svgElement.querySelector('metadata component');
        if (!metadataElement) return;
        
        let interactionsElement = metadataElement.querySelector('interactions');
        if (!interactionsElement) {
            interactionsElement = document.createElementNS(null, 'interactions');
            metadataElement.appendChild(interactionsElement);
        }
        
        // Utwórz nowy element binding
        const bindingElement = document.createElementNS(null, 'binding');
        bindingElement.setAttribute('targetId', '');
        bindingElement.setAttribute('event', 'change');
        bindingElement.setAttribute('action', '');
        
        interactionsElement.appendChild(bindingElement);
        
        // Odśwież panel właściwości
        this.showProperties(svgElement);
    }
    
    // Aktualizuj interakcję komponentu
    updateInteraction(id, index, property, value) {
        const componentData = this.componentManager.getComponent(id);
        if (!componentData || !componentData.element) return;
        
        const svgElement = componentData.element;
        const metadataElement = svgElement.querySelector('metadata component');
        if (!metadataElement) return;
        
        const interactionsElement = metadataElement.querySelector('interactions');
        if (!interactionsElement) return;
        
        const bindingElements = interactionsElement.querySelectorAll('binding');
        if (!bindingElements || index >= bindingElements.length) return;
        
        const bindingElement = bindingElements[index];
        bindingElement.setAttribute(property, value);
        
        // Odśwież panel właściwości
        this.showProperties(svgElement);
    }
    
    // Usuń interakcję z komponentu
    removeInteraction(id, index) {
        const componentData = this.componentManager.getComponent(id);
        if (!componentData || !componentData.element) return;
        
        const svgElement = componentData.element;
        const metadataElement = svgElement.querySelector('metadata component');
        if (!metadataElement) return;
        
        const interactionsElement = metadataElement.querySelector('interactions');
        if (!interactionsElement) return;
        
        const bindingElements = interactionsElement.querySelectorAll('binding');
        if (!bindingElements || index >= bindingElements.length) return;
        
        const bindingElement = bindingElements[index];
        interactionsElement.removeChild(bindingElement);
        
        // Odśwież panel właściwości
        this.showProperties(svgElement);
    }
    
    // Aktualizuj metadane w SVG (używa atrybutów data-*)
    updateMetadataInSVG(svgElement, path, value) {
        // Pobierz obecne metadane z atrybutu data-metadata
        let metadata;
        try {
            const metadataStr = svgElement.getAttribute('data-metadata');
            if (metadataStr) {
                metadata = JSON.parse(metadataStr);
            } else {
                // Fallback do XML metadata
                metadata = this.componentManager.parseXMLMetadata(svgElement);
            }
        } catch (e) {
            console.warn('Error parsing metadata:', e);
            metadata = { parameters: {} };
        }

        // Zaktualizuj wartość w metadanych
        this.setNestedProperty(metadata, path, value);

        // Zapisz zaktualizowane metadane używając helper function
        this.componentManager.updateXMLMetadata(svgElement, metadata);

        // Zaktualizuj cache komponentu w menedżerze
        const componentId = svgElement.getAttribute('data-id');
        const componentData = this.componentManager.getComponent(componentId);
        if (componentData) {
            componentData.metadata = metadata;
        }
    }

    // Helper function to set nested property using dot notation
    setNestedProperty(obj, path, value) {
        const keys = path.split('.');
        let current = obj;
        
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = value;
    }

    // Funkcja do aplikowania parametrów do elementów SVG
    applyParameterToSVG(svgElement, path, value) {
        // Specjalne przypadki dla różnych komponentów i parametrów
        if (path.includes('parameters.')) {
            const paramName = path.split('.')[1]; // np. parameters.color -> color

            // Wybierz odpowiednie elementy SVG
            switch (paramName) {
                case 'label':
                    const labelElement = svgElement.querySelector('.led-label, .button-label, .switch-label, .gauge-label, .counter-value, .slider-label');
                    if (labelElement) labelElement.textContent = value;
                    break;
                case 'color':
                    const colorElement = svgElement.querySelector('.led-core, .button-surface, .switch-handle, .gauge-needle');
                    if (colorElement) colorElement.setAttribute('fill', value);
                    break;
                case 'isOn':
                case 'state':
                    // Zaimplementuj zachowanie zależne od stanu (dla LED, przełączników)
                    break;
                // Dodaj obsługę innych parametrów
            }
        }
    }

    // Usuń komponent
    removeComponent(id) {
        if (!confirm("Czy na pewno chcesz usunąć ten komponent?")) return;

        const componentData = this.componentManager.getComponent(id);
        if (componentData && componentData.element) {
            componentData.element.remove();
        }

        this.componentManager.removeComponentFromMap(id);
        this.clearProperties();
    }

    // Edytuj metadane (raw JSON)
    editMetadataRaw(id) {
        const componentData = this.componentManager.getComponent(id);
        if (!componentData) return;

        const currentMetadata = JSON.stringify(componentData.metadata, null, 2);
        const newMetadata = prompt("Edytuj metadane (JSON):", currentMetadata);

        if (newMetadata === null) return;

        try {
            const parsed = JSON.parse(newMetadata);
            componentData.metadata = parsed;

            this.updateMetadataInSVG(componentData.element, '', parsed);
            this.showProperties(componentData.element);
        } catch (error) {
            alert("Nieprawidłowy format JSON: " + error.message);
        }
    }
}

// Globalne funkcje dla wywołań z HTML
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
