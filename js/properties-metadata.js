// Digital Twin IDE - Properties Metadata Module

export class MetadataManager {
    constructor(componentManager) {
        this.componentManager = componentManager;
    }

    // Aktualizuj metadane w SVG (używa atrybutów data-*)
    updateMetadataInSVG(svgElement, path, value) {
        if (!svgElement || !path) return;

        // Pobierz istniejące metadane
        const metadataAttr = svgElement.getAttribute('data-metadata');
        let metadata = {};
        
        try {
            if (metadataAttr) {
                metadata = JSON.parse(metadataAttr);
            }
        } catch (e) {
            console.error('Error parsing metadata:', e);
            metadata = {};
        }

        // Ustaw nową wartość używając notacji kropkowej
        this.setNestedProperty(metadata, path, value);

        // Zapisz zaktualizowane metadane
        svgElement.setAttribute('data-metadata', JSON.stringify(metadata));

        // Również zaktualizuj w pamięci komponentu
        const componentId = svgElement.getAttribute('data-id');
        if (componentId) {
            const componentData = this.componentManager.getComponent(componentId);
            if (componentData) {
                if (!componentData.metadata) componentData.metadata = {};
                this.setNestedProperty(componentData.metadata, path, value);
            }
        }

        console.log(`Updated metadata ${path} = ${value} for component ${componentId}`);
    }

    // Helper function to set nested property using dot notation
    setNestedProperty(obj, path, value) {
        const keys = path.split('.');
        let current = obj;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
                current[key] = {};
            }
            current = current[key];
        }
        
        const finalKey = keys[keys.length - 1];
        current[finalKey] = value;
    }

    // Funkcja do aplikowania parametrów do elementów SVG
    applyParameterToSVG(svgElement, path, value) {
        if (!svgElement || !path) return;

        const keys = path.split('.');
        
        // Jeśli parametr to pozycja (x, y)
        if (keys[0] === 'position') {
            const coord = keys[1];
            if (coord === 'x' || coord === 'y') {
                svgElement.setAttribute(coord, value);
            }
            return;
        }

        // Jeśli parametr to kolor
        if (keys[0] === 'colors') {
            const selector = keys[1];
            const type = keys[2];
            
            if (selector && type && (type === 'fill' || type === 'stroke')) {
                // Znajdź elementy pasujące do selektora
                let elements = [];
                if (selector.startsWith('.')) {
                    elements = svgElement.querySelectorAll(selector);
                } else {
                    elements = svgElement.getElementsByClassName(selector);
                }
                
                Array.from(elements).forEach(element => {
                    element.setAttribute(type, value);
                });
            }
            return;
        }

        // Dla innych parametrów, spróbuj znaleźć elementy z odpowiednimi atrybutami
        const paramName = keys[keys.length - 1];
        const paramElements = svgElement.querySelectorAll(`[data-param="${paramName}"]`);
        
        if (paramElements.length > 0) {
            Array.from(paramElements).forEach(element => {
                // Ustaw wartość w zależności od typu elementu
                if (element.tagName.toLowerCase() === 'text') {
                    element.textContent = value;
                } else if (element.hasAttribute('fill')) {
                    element.setAttribute('fill', value);
                } else if (element.hasAttribute('stroke')) {
                    element.setAttribute('stroke', value);
                }
            });
        }
    }

    // Edytuj metadane (raw JSON)
    editMetadataRaw(id) {
        const componentData = this.componentManager.getComponent(id);
        if (!componentData) return;

        const currentMetadata = componentData.metadata || {};
        const metadataJson = JSON.stringify(currentMetadata, null, 2);

        const newMetadata = prompt("Edytuj metadane komponentu (JSON):", metadataJson);
        if (newMetadata === null) return; // Użytkownik anulował

        try {
            const parsedMetadata = JSON.parse(newMetadata);
            
            // Zaktualizuj metadane w komponencie
            componentData.metadata = parsedMetadata;
            
            // Zaktualizuj metadane w SVG
            if (componentData.element) {
                this.updateMetadataInSVG(componentData.element, '', parsedMetadata);
            }
            
            // Odśwież panel właściwości
            if (window.propertiesManager) {
                window.propertiesManager.showProperties(componentData.element);
            }
            
        } catch (e) {
            alert("Błąd w formacie JSON: " + e.message);
        }
    }

    // Pobierz wszystkie metadane komponentu
    getComponentMetadata(componentId) {
        const componentData = this.componentManager.getComponent(componentId);
        if (!componentData) return null;

        return componentData.metadata || {};
    }

    // Ustaw metadane komponentu
    setComponentMetadata(componentId, metadata) {
        const componentData = this.componentManager.getComponent(componentId);
        if (!componentData) return false;

        componentData.metadata = metadata;

        // Zaktualizuj również w SVG
        if (componentData.element) {
            componentData.element.setAttribute('data-metadata', JSON.stringify(metadata));
        }

        return true;
    }

    // Zmerguj nowe metadane z istniejącymi
    mergeComponentMetadata(componentId, newMetadata) {
        const existingMetadata = this.getComponentMetadata(componentId) || {};
        const mergedMetadata = { ...existingMetadata, ...newMetadata };
        
        return this.setComponentMetadata(componentId, mergedMetadata);
    }

    // Usuń określone pole z metadanych
    removeMetadataField(componentId, fieldPath) {
        const metadata = this.getComponentMetadata(componentId);
        if (!metadata) return false;

        const keys = fieldPath.split('.');
        let current = metadata;

        // Znajdź obiekt zawierający pole do usunięcia
        for (let i = 0; i < keys.length - 1; i++) {
            if (!(keys[i] in current)) return false;
            current = current[keys[i]];
        }

        // Usuń pole
        const finalKey = keys[keys.length - 1];
        delete current[finalKey];

        // Zaktualizuj metadane
        return this.setComponentMetadata(componentId, metadata);
    }

    // Waliduj format metadanych
    validateMetadata(metadata) {
        if (!metadata || typeof metadata !== 'object') {
            return { valid: false, error: 'Metadata must be an object' };
        }

        // Sprawdź wymagane pola
        const requiredFields = ['parameters'];
        for (const field of requiredFields) {
            if (!(field in metadata)) {
                return { valid: false, error: `Missing required field: ${field}` };
            }
        }

        // Sprawdź strukturę parametrów
        if (metadata.parameters && typeof metadata.parameters !== 'object') {
            return { valid: false, error: 'Parameters must be an object' };
        }

        return { valid: true };
    }
}
