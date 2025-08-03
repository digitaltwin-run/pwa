// Digital Twin IDE - Properties Core Module

import { ColorManager } from './properties-colors.js';
import { MetadataManager } from './properties-metadata.js';
import { InteractionsManager } from './properties-interactions.js';
import { PropertiesMapper } from './properties-mapper.js';
import { getComponentProperties } from './component-properties.js';

export class PropertiesManager {
    constructor(componentManager) {
        this.componentManager = componentManager;
        
        // Initialize sub-managers
        this.colorManager = new ColorManager(componentManager);
        this.metadataManager = new MetadataManager(componentManager);
        this.interactionsManager = new InteractionsManager(componentManager);
        this.propertiesMapper = new PropertiesMapper(componentManager);
        
        // Uruchom automatyczne odświeżanie mapowania
        this.propertiesMapper.setupAutoRefresh();
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

    // Generate properties HTML based on component type
    generateComponentProperties(componentData) {
        if (!componentData) return '';
        
        const componentType = componentData.metadata?.type || componentData.element?.getAttribute('data-type') || 'default';
        const componentDef = getComponentProperties(componentType);
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
                
                // Generate appropriate input based on type
                switch (prop.type) {
                    case 'boolean':
                        html += `
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="${inputId}" 
                                    ${value ? 'checked' : ''}
                                    onchange="updateParam('${componentData.id}', '${prop.id}', this.checked, 'boolean')">
                            </div>
                        `;
                        break;
                        
                    case 'color':
                        html += `
                            <div style="display: flex; align-items: center;">
                                <input type="color" id="${inputId}" value="${value}" 
                                    style="width: 60px; height: 30px; padding: 0; border: 1px solid #ddd;"
                                    onchange="updateParam('${componentData.id}', '${prop.id}', this.value, 'color')">
                                <span style="margin-left: 8px; font-family: monospace; font-size: 12px;">${value}</span>
                            </div>
                        `;
                        break;
                        
                    case 'range':
                        html += `
                            <div>
                                <input type="range" class="form-range" id="${inputId}" 
                                    min="${prop.min || 0}" max="${prop.max || 100}" step="${prop.step || 1}" 
                                    value="${value}" 
                                    oninput="document.getElementById('${inputId}-value').textContent = this.value + '${prop.unit || ''}'; updateParam('${componentData.id}', '${prop.id}', parseFloat(this.value), 'number');">
                                <div id="${inputId}-value" style="text-align: center; font-size: 12px; color: #666;">
                                    ${value}${prop.unit || ''}
                                </div>
                            </div>
                        `;
                        break;
                        
                    case 'select':
                        html += `
                            <select class="form-select form-select-sm" id="${inputId}" 
                                onchange="updateParam('${componentData.id}', '${prop.id}', this.value, 'text')">
                                ${prop.options.map(opt => 
                                    `<option value="${opt.value}" ${value === opt.value ? 'selected' : ''}>${opt.label}</option>`
                                ).join('')}
                            </select>
                        `;
                        break;
                        
                    default: // text, number, etc.
                        const inputType = prop.type === 'number' ? 'number' : 'text';
                        const step = inputType === 'number' ? 'step="any"' : '';
                        html += `
                            <input type="${inputType}" class="form-control form-control-sm" id="${inputId}" 
                                value="${value}" ${step}
                                onchange="updateParam('${componentData.id}', '${prop.id}', this.value, '${prop.type}')">
                        `;
                }
                
                html += `</div>`; // Close form-group
            });
            
            html += `</div>`; // Close property-category
        });
        
        return html;
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
        
        // Get component type from metadata or element
        const componentType = componentData.metadata?.type || componentData.element?.getAttribute('data-type') || 'default';
        const componentDef = getComponentProperties(componentType);
        
        // Start building the properties panel HTML
        let html = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h4 class="mb-0">${componentDef.icon || '📦'} ${componentDef.name}</h4>
                <span class="badge bg-secondary">${componentType}</span>
            </div>
            <div class="mb-3">
                <label class="form-label">ID komponentu</label>
                <div class="input-group input-group-sm">
                    <input type="text" class="form-control" value="${id}" readonly>
                    <button class="btn btn-outline-secondary" type="button" onclick="navigator.clipboard.writeText('${id}')">
                        Kopiuj
                    </button>
                </div>
            </div>
        `;
        
        // Add component-specific properties
        html += this.generateComponentProperties(componentData);
        
        // Add position controls
        html += `
            <div class="property-category" style="margin-top: 20px;">
                <h5>Pozycja</h5>
                <div class="row g-2">
                    <div class="col-6">
                        <label class="form-label small">X</label>
                        <input type="number" class="form-control form-control-sm" 
                            value="${parseInt(svgElement.getAttribute('x') || 0)}" 
                            onchange="updatePosition('${id}', 'x', this.value)">
                    </div>
                    <div class="col-6">
                        <label class="form-label small">Y</label>
                        <input type="number" class="form-control form-control-sm" 
                            value="${parseInt(svgElement.getAttribute('y') || 0)}" 
                            onchange="updatePosition('${id}', 'y', this.value)">
                    </div>
                </div>
            </div>
        `;
        
        // Odśwież mapowanie właściwości przed pokazaniem panelu
        this.propertiesMapper.scanCanvasProperties();
        
        // Sekcja kolorów SVG
        const colorsHtml = this.colorManager.generateColorsSection(svgElement);
        if (colorsHtml) {
            html += colorsHtml;
        }
        
        // Add interactions section
        html += this.interactionsManager.generateInteractionsSection(componentData);
        
        // Add delete button
        html += `
            <div class="d-grid gap-2 mt-3">
                <button class="btn btn-danger btn-sm" onclick="removeComponent('${id}')">
                    <i class="bi bi-trash"></i> Usuń komponent
                </button>
            </div>
            
            <div class="mt-3 small text-muted">
                <div>ID: <code>${id}</code></div>
                <div>Typ: <code>${componentType}</code></div>
            </div>
        `;
        
        // Set the HTML and add event listeners
        propertiesPanel.innerHTML = html;
        
        // Initialize any dynamic controls if needed
        this.initializePropertyControls(componentData);
    }
    
    // Initialize any dynamic property controls
    initializePropertyControls(componentData) {
        // Add event listener for add parameter button if it exists
        const addParamBtn = document.getElementById(`add-param-btn-${componentData.id}`);
        if (addParamBtn) {
            addParamBtn.addEventListener('click', () => this.addParameter(componentData.id));
        }
    }

    clearProperties() {
        const propertiesPanel = document.getElementById('properties-panel');
        if (propertiesPanel) {
            propertiesPanel.innerHTML = '<p>Wybierz komponent aby zobaczyć właściwości</p>';
        }
    }

    // Aktualizuj parametr komponentu
    updateParam(id, paramKey, value, type) {
        const componentData = this.componentManager.getComponent(id);
        if (!componentData) return;

        // Konwersja typu
        let convertedValue = value;
        if (type === 'number') {
            convertedValue = Number(value);
        } else if (type === 'boolean') {
            convertedValue = Boolean(value);
        }

        // Zaktualizuj metadane w pamięci
        if (!componentData.metadata.parameters) {
            componentData.metadata.parameters = {};
        }
        componentData.metadata.parameters[paramKey] = convertedValue;

        // Zaktualizuj w SVG
        this.metadataManager.updateMetadataInSVG(componentData.element, `parameters.${paramKey}`, convertedValue);
        
        // Aplikuj do SVG
        this.metadataManager.applyParameterToSVG(componentData.element, `parameters.${paramKey}`, convertedValue);
        
        console.log(`Updated parameter ${paramKey} = ${convertedValue} for component ${id}`);
    }

    // Aktualizuj pozycję komponentu
    updatePosition(id, coord, value) {
        const componentData = this.componentManager.getComponent(id);
        if (!componentData) return;

        const numericValue = parseFloat(value) || 0;

        // Zaktualizuj pozycję w SVG
        componentData.element.setAttribute(coord, numericValue);

        // Zaktualizuj metadane
        this.metadataManager.updateMetadataInSVG(componentData.element, `position.${coord}`, numericValue);
        
        console.log(`Updated ${coord} position to ${numericValue} for component ${id}`);
    }

    // Dodaj nowy parametr
    addParameter(id) {
        const paramName = prompt("Nazwa parametru:");
        if (!paramName || paramName.trim() === '') return;

        const paramValue = prompt("Wartość parametru:") || '';
        
        this.updateParam(id, paramName.trim(), paramValue, 'text');
        
        // Odśwież panel właściwości
        const componentData = this.componentManager.getComponent(id);
        if (componentData) {
            this.showProperties(componentData.element);
        }
    }

    // Generuj sekcję parametrów
    generateParametersSection(componentData) {
        let html = '';
        
        if (componentData.metadata && componentData.metadata.parameters) {
            html += '<h5>Parametry:</h5>';

            for (const [key, param] of Object.entries(componentData.metadata.parameters)) {
                const label = this.componentManager.formatLabel(key);
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
                    html += `<input type="color" value="${value}" onchange="updateParam('${componentData.id}', '${key}', this.value, '${type}')">`;
                } else if (type === 'checkbox') {
                    const checked = value ? 'checked' : '';
                    html += `<input type="checkbox" ${checked} onchange="updateParam('${componentData.id}', '${key}', this.checked, 'boolean')">`;
                } else if (type === 'number') {
                    html += `<input type="number" value="${value}" onchange="updateParam('${componentData.id}', '${key}', this.value, 'number')">`;
                } else {
                    html += `<input type="text" value="${value}" onchange="updateParam('${componentData.id}', '${key}', this.value, 'text')">`;
                }
            }
        }
        
        // Dodaj parametr
        html += `
            <button id="add-param-btn-${componentData.id}" class="btn btn-success" style="margin-top: 10px;">
                ➕ Dodaj parametr
            </button>
        `;
        
        return html;
    }

    // Usuń komponent
    removeComponent(id) {
        const componentData = this.componentManager.getComponent(id);
        if (!componentData) return;

        if (confirm(`Czy na pewno chcesz usunąć komponent ${id}?`)) {
            // Usuń element z DOM
            if (componentData.element && componentData.element.parentNode) {
                componentData.element.parentNode.removeChild(componentData.element);
            }

            // Usuń z mapy komponentów
            this.componentManager.components.delete(id);

            // Wyczyść panel właściwości jeśli to był wybrany komponent
            const selectedComponent = this.componentManager.getSelectedComponent();
            if (selectedComponent && selectedComponent.element === componentData.element) {
                this.componentManager.setSelectedComponent(null);
                this.clearProperties();
            }

            console.log(`Component ${id} removed`);
        }
    }

    // Deleguj metody do odpowiednich menedżerów
    generateColorsSection(svgElement) {
        return this.colorManager.generateColorsSection(svgElement);
    }

    updateSvgColor(selector, type, color) {
        return this.colorManager.updateSvgColor(selector, type, color);
    }

    generateInteractionsSection(componentData) {
        return this.interactionsManager.generateInteractionsSection(componentData);
    }

    addInteraction(id) {
        return this.interactionsManager.addInteraction(id);
    }

    updateInteraction(id, index, property, value) {
        return this.interactionsManager.updateInteraction(id, index, property, value);
    }

    removeInteraction(id, index) {
        return this.interactionsManager.removeInteraction(id, index);
    }

    editMetadataRaw(id) {
        return this.metadataManager.editMetadataRaw(id);
    }
    
    // Eksportuj zmapowane właściwości do JSON
    exportPropertiesToJson() {
        return this.propertiesMapper.exportToMetadataJson();
    }
    
    // Pobierz dostępne zmienne dla systemów zewnętrznych
    getAvailableVariables() {
        return this.propertiesMapper.availableVariables;
    }
    
    // Pobierz komponenty dostępne jako cele interakcji
    getAvailableTargetComponents() {
        return this.propertiesMapper.getAvailableTargetComponents();
    }
    
    // Ręczne odświeżenie mapowania właściwości
    refreshPropertiesMapping() {
        this.propertiesMapper.scanCanvasProperties();
        console.log('Properties mapping refreshed:', {
            components: this.propertiesMapper.mappedProperties.size,
            variables: this.propertiesMapper.availableVariables.size
        });
    }
}
