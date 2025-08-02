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
                const value = param.value !== undefined ? param.value : param.default || '';
                const type = param.type || 'text';

                html += `<label>${label}:</label>`;

                if (type === 'color') {
                    html += `<input type="color" value="${value}" onchange="updateParam('${id}', '${key}', this.value, '${type}')">`;
                } else if (type === 'range') {
                    const min = param.min || 0;
                    const max = param.max || 100;
                    html += `<input type="range" min="${min}" max="${max}" value="${value}" onchange="updateParam('${id}', '${key}', this.value, '${type}')">`;
                    html += `<span>${value}</span>`;
                } else if (type === 'select') {
                    html += `<select onchange="updateParam('${id}', '${key}', this.value, '${type}')">`;
                    if (param.options) {
                        param.options.forEach(option => {
                            const selected = option === value ? 'selected' : '';
                            html += `<option value="${option}" ${selected}>${option}</option>`;
                        });
                    }
                    html += '</select>';
                } else {
                    html += `<input type="${type}" value="${value}" onchange="updateParam('${id}', '${key}', this.value, '${type}')">`;
                }
            }
        }

        // Dodaj parametr
        html += `
            <button onclick="addParameter('${id}')" style="background: #27ae60; margin-top: 10px;">
                ➕ Dodaj parametr
            </button>
        `;

        // Usuń komponent
        html += `
            <button onclick="removeComponent('${id}')" style="background: #e74c3c; margin-top: 5px;">
                🗑️ Usuń komponent
            </button>
        `;

        // Edytuj metadane (zaawansowane)
        html += `
            <button onclick="editMetadataRaw('${id}')" style="background: #f39c12; margin-top: 5px;">
                ⚙️ Edytuj metadane
            </button>
        `;

        propertiesPanel.innerHTML = html;
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

        // Aktualizuj w metadanych
        if (!componentData.metadata.parameters) {
            componentData.metadata.parameters = {};
        }

        if (!componentData.metadata.parameters[paramKey]) {
            componentData.metadata.parameters[paramKey] = {};
        }

        componentData.metadata.parameters[paramKey].value = value;
        componentData.metadata.parameters[paramKey].type = type;

        // Aktualizuj metadane w SVG
        this.updateMetadataInSVG(componentData.element, `parameters.${paramKey}.value`, value);

        // Zastosuj wizualnie
        this.applyParameterToSVG(componentData.element, paramKey, value);

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

    // Aktualizuj metadane w SVG (używa atrybutów data-*)
    updateMetadataInSVG(svgElement, path, value) {
        // Pobierz obecne metadane z atrybutu data-metadata
        let metadata;
        try {
            // Pobierz metadane z elementu SVG
            const metadataStr = svgElement.getAttribute('data-metadata');
            metadata = metadataStr ? JSON.parse(metadataStr) : { parameters: {} };
        } catch (e) {
            console.warn("Błąd parsowania metadanych w updateMetadataInSVG:", e);
            metadata = { parameters: {} };
        }

        // Ustaw wartość w ścieżce
        const keys = path.split('.');
        let current = metadata;
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;

        // Zapisz zaktualizowane metadane w atrybucie (jedyne źródło prawdy)
        svgElement.setAttribute('data-metadata', JSON.stringify(metadata));
        
        // Zaktualizuj też dane w componentManager
        const componentId = svgElement.getAttribute('data-id');
        const componentData = this.componentManager.getComponent(componentId);
        if (componentData) {
            componentData.metadata = metadata;
        }
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
