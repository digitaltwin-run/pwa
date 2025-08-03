// Digital Twin IDE - Properties Core Module

import { ColorManager } from './properties-colors.js';
import { MetadataManager } from './properties-metadata.js';
import { InteractionsManager } from './properties-interactions.js';

export class PropertiesManager {
    constructor(componentManager) {
        this.componentManager = componentManager;
        
        // Initialize sub-managers
        this.colorManager = new ColorManager(componentManager);
        this.metadataManager = new MetadataManager(componentManager);
        this.interactionsManager = new InteractionsManager(componentManager);
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
        html += this.generateParametersSection(componentData);
        
        // Sekcja kolorów SVG
        const colorsHtml = this.colorManager.generateColorsSection(svgElement);
        if (colorsHtml) {
            html += colorsHtml;
        }

        // Sekcja interakcji
        const interactionsHtml = this.interactionsManager.generateInteractionsSection(componentData);
        if (interactionsHtml) {
            html += interactionsHtml;
        }

        // Usuń komponent
        html += `
            <button onclick="removeComponent('${id}')" class="btn btn-danger" style="margin-top: 20px;">
                🗑️ Usuń komponent
            </button>
        `;

        // Edytuj metadane (raw JSON)
        html += `
            <button onclick="editMetadataRaw('${id}')" class="btn btn-secondary" style="margin-top: 10px;">
                📝 Edytuj metadane (JSON)
            </button>
        `;

        propertiesPanel.innerHTML = html;

        // Add event listener for add parameter button
        const addParamBtn = document.getElementById(`add-param-btn-${id}`);
        if (addParamBtn) {
            addParamBtn.addEventListener('click', () => this.addParameter(id));
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
}
