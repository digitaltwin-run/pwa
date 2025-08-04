// Digital Twin IDE - Properties Core Module

import { ColorManager } from './properties-colors.js';
import { MetadataManager } from './properties-metadata.js';
// PropertiesInteractionsManager moved to ../interactions project
import { PropertiesMapper } from './properties-mapper.js';
import { getComponentProperties } from './component-properties.js';

// Import new modular components
import { ColorsManager } from './properties/colors-manager.js';
import { ScalingManager } from './properties/scaling-manager.js';
import { SVGTextManager } from './properties/svg-text-manager.js';
import { PropertyUIGenerator } from './properties/property-ui-generator.js';
import { normalizeColorValue, detectPropertyType, parseComponentMetadata, getComponentBounds } from './utils/property-utils.js';

export class PropertiesManager {
    constructor(componentManager) {
        this.componentManager = componentManager;

        // Initialize sub-managers
        this.colorManager = new ColorManager(componentManager);
        this.metadataManager = new MetadataManager(componentManager);
        // interactionsManager moved to ../interactions project
        this.propertiesMapper = new PropertiesMapper(componentManager);

        // Initialize new modular components
        this.colorsManager = new ColorsManager();
        this.scalingManager = new ScalingManager();
        this.svgTextManager = new SVGTextManager();
        this.propertyUIGenerator = new PropertyUIGenerator();

        // Make managers available globally for UI interactions
        window.colorsManager = this.colorsManager;
        window.scalingManager = this.scalingManager;
        window.svgTextManager = this.svgTextManager;

        // Uruchom automatyczne odświeżanie mapowania
        this.propertiesMapper.setupAutoRefresh();
    }

    // Wybór komponentu
    selectComponent(element) {
        // Usuń poprzednie zaznaczenie i resize handles
        document.querySelectorAll('.draggable-component').forEach(comp => {
            comp.style.outline = '';
            // Remove resize handles from previously selected component
            if (window.componentResizer) {
                window.componentResizer.disableResizing(comp);
            }
        });

        // Zaznacz nowy komponent
        if (element) {
            element.style.outline = '2px solid #3498db';
            this.componentManager.setSelectedComponent(element);
            this.showProperties(element);

            // Enable interactive resize handles for selected component
            if (window.componentResizer) {
                window.componentResizer.enableResizing(element);
            }
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

        // Group properties by category (excluding ALL text-related properties - handled by SVGTextManager)
        const propertiesByCategory = {};
        componentDef.properties.forEach(prop => {
            // Skip ALL text properties - they are handled by SVGTextManager with advanced features
            if (prop.category === 'text' || prop.category === 'texts' ||
                prop.type === 'text-content' || prop.type === 'text' ||
                prop.id === 'label' || prop.name === 'Etykieta') {
                return;
            }

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

        // Add component-specific properties (excluding text properties - handled separately)
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

        // Add component scale/zoom section
        html += this.generateComponentScaleSection(componentData);

        // Add parameters section
        const parametersHtml = this.generateParametersSection(componentData);
        if (parametersHtml) {
            html += parametersHtml;
        }

        // Sekcja edycji tekstów SVG (zastępuje duplicate z generateComponentProperties)
        const textEditHtml = this.svgTextManager.generateTextSection(svgElement, componentData);
        if (textEditHtml) {
            html += textEditHtml;
        }

        // Odśwież mapowanie właściwości przed pokazaniem panelu
        this.propertiesMapper.scanCanvasProperties();

        // Sekcja kolorów SVG
        const colorsHtml = this.colorManager.generateColorsSection(svgElement);
        if (colorsHtml) {
            html += colorsHtml;
        }

        // Interactions section moved to ../interactions project
        // Component selection list moved to dedicated components column

        // Add delete button
        html += `
            <div class="d-grid gap-2 mt-3">
                <button class="btn btn-danger btn-sm" onclick="removeComponent('${id}')" data-i18n="properties.removeComponent">
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
            html += '<h5 data-i18n="properties.parameters">Parametry:</h5>';

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
            <button id="add-param-btn-${componentData.id}" class="btn btn-success" style="margin-top: 10px;" data-i18n="properties.addParameter">
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

    // Generuj sekcję właściwości komponentu
    generateComponentProperties(componentData) {
        let html = '';

        // Add SVG text editing section
        // html += this.svgTextManager.generateTextSection(componentData.element);

        // Add color section (minimized)
        html += this.colorsManager.generateColorsSection(componentData.element);

        return html;
    }

    // Generuj sekcję zoom/scale z zachowaniem proporcji
    generateComponentScaleSection(componentData) {
        if (!componentData || !componentData.element) return '';

        const scaleInfo = this.getComponentScaleInfo(componentData.element);
        const zoomLevels = this.getZoomLevels();

        return `
            <div class="property-section">
                <h6><i class="bi bi-zoom-in"></i> Component Scale/Zoom</h6>
                
                <!-- Current Scale Display -->
                <div class="mb-3 p-2 bg-light rounded">
                    <div class="row">
                        <div class="col-6">
                            <small class="text-muted">Current Scale:</small><br>
                            <strong>${scaleInfo.displayText}</strong>
                        </div>
                        <div class="col-6 text-end">
                            <small class="text-muted">Dimensions:</small><br>
                            <small>${scaleInfo.scaledDimensions}</small>
                            ${scaleInfo.scale !== 1.0 ? `<br><small class="text-muted">Original: ${scaleInfo.originalDimensions}</small>` : ''}
                        </div>
                    </div>
                </div>
                
                <!-- Scale Controls -->
                <div class="row g-2 mb-2">
                    <div class="col-12">
                        <label class="form-label small">Scale (% of original size)</label>
                        <div class="input-group input-group-sm">
                            <button class="btn btn-outline-secondary" type="button" 
                                    onclick="zoomComponent('${componentData.id}', 'out')">
                                <i class="bi bi-zoom-out"></i>
                            </button>
                            <input type="range" class="form-range" 
                                   min="10" max="500" step="25" 
                                   value="${scaleInfo.percentage}" 
                                   id="scale-slider-${componentData.id}"
                                   style="flex: 1; margin: 0 10px; align-self: center;"
                                   oninput="setComponentScalePercentage('${componentData.id}', this.value); document.getElementById('scale-input-${componentData.id}').value = this.value + '%'">
                            <button class="btn btn-outline-secondary" type="button" 
                                    onclick="zoomComponent('${componentData.id}', 'in')">
                                <i class="bi bi-zoom-in"></i>
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Precise Scale Input -->
                <div class="row g-2 mb-2">
                    <div class="col-8">
                        <div class="input-group input-group-sm">
                            <input type="text" class="form-control" 
                                   id="scale-input-${componentData.id}"
                                   value="${scaleInfo.percentage}%" 
                                   placeholder="150%"
                                   onchange="setComponentScalePercentage('${componentData.id}', parseInt(this.value))">
                            <button class="btn btn-outline-primary" type="button" 
                                    onclick="resetComponentScale('${componentData.id}')">
                                Reset 100%
                            </button>
                        </div>
                    </div>
                    <div class="col-4">
                        <select class="form-select form-select-sm" 
                                onchange="setComponentScalePercentage('${componentData.id}', this.value)">
                            ${this.generateZoomLevelOptions(scaleInfo.percentage)}
                        </select>
                    </div>
                </div>
                
                <!-- Quick Zoom Buttons - Compact -->
                <div class="scale-buttons-grid">
                    <button class="scale-btn" onclick="setComponentScalePercentage('${componentData.id}', 50)">50%</button>
                    <button class="scale-btn ${scaleInfo.isOriginalSize ? 'active' : ''}" onclick="setComponentScalePercentage('${componentData.id}', 100)">100%</button>
                    <button class="scale-btn" onclick="setComponentScalePercentage('${componentData.id}', 150)">150%</button>
                    <button class="scale-btn" onclick="setComponentScalePercentage('${componentData.id}', 200)">200%</button>
                </div>
                
                <div class="text-center mt-2">
                    <small class="text-muted">
                        <i class="bi bi-aspect-ratio"></i> Aspect ratio preserved | 
                        SVG transform: scale(${scaleInfo.scale.toFixed(2)})
                    </small>
                </div>
            </div>
        `;
    }

    // Generuj opcje zoom levels dla dropdown
    generateZoomLevelOptions(currentPercentage) {
        const zoomLevels = this.getZoomLevels();
        let options = '';

        zoomLevels.forEach(level => {
            const selected = Math.abs(level.percentage - currentPercentage) < 5 ? 'selected' : '';
            options += `<option value="${level.percentage}" ${selected}>${level.label}</option>`;
        });

        return options;
    }

    // Pobierz dostępne poziomy zoom
    getZoomLevels() {
        return [
            { value: 0.25, label: '25%', percentage: 25 },
            { value: 0.5, label: '50%', percentage: 50 },
            { value: 0.75, label: '75%', percentage: 75 },
            { value: 1.0, label: '100% (Original)', percentage: 100 },
            { value: 1.25, label: '125%', percentage: 125 },
            { value: 1.5, label: '150%', percentage: 150 },
            { value: 2.0, label: '200%', percentage: 200 },
            { value: 2.5, label: '250%', percentage: 250 },
            { value: 3.0, label: '300%', percentage: 300 },
            { value: 4.0, label: '400%', percentage: 400 },
            { value: 5.0, label: '500% (Max)', percentage: 500 }
        ];
    }

    // Pobierz informacje o skali komponentu
    getComponentScaleInfo(svgElement) {
        if (!window.componentScaler) {
            return {
                scale: 1.0,
                percentage: 100,
                displayText: '100% (1.00x)',
                isOriginalSize: true,
                scaledDimensions: '50×50px',
                originalDimensions: '50×50px'
            };
        }
        return window.componentScaler.getScaleInfo(svgElement);
    }

    // Pobierz wymiary komponentu
    getComponentBounds(svgElement) {
        try {
            const bbox = svgElement.getBBox();
            const x = parseFloat(svgElement.getAttribute('x')) || bbox.x;
            const y = parseFloat(svgElement.getAttribute('y')) || bbox.y;
            const width = parseFloat(svgElement.getAttribute('width')) || bbox.width;
            const height = parseFloat(svgElement.getAttribute('height')) || bbox.height;
            return { x, y, width, height };
        } catch (error) {
            return { x: 0, y: 0, width: 50, height: 50 };
        }
    }

    updateSvgColor(selector, type, color) {
        return this.colorManager.updateSvgColor(selector, type, color);
    }

    // Interaction methods moved to ../interactions project

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
