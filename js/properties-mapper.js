// Digital Twin IDE - Properties Mapper Module
// Automatyczne mapowanie właściwości z elementów SVG na canvie

export class PropertiesMapper {
    constructor(componentManager) {
        this.componentManager = componentManager;
        this.mappedProperties = new Map();
        this.availableVariables = new Map();
    }

    // Skanuj wszystkie elementy na canvie i wyciągnij ich właściwości
    scanCanvasProperties() {
        const canvas = document.getElementById('canvas');
        if (!canvas) return;

        this.mappedProperties.clear();
        this.availableVariables.clear();

        // Znajdź wszystkie komponenty SVG na canvie
        const svgComponents = canvas.querySelectorAll('[data-id]');
        
        svgComponents.forEach(svgElement => {
            const componentId = svgElement.getAttribute('data-id');
            // Pobieraj wszystko bezpośrednio z SVG
            const properties = this.extractElementPropertiesFromSvg(svgElement);
            this.mappedProperties.set(componentId, properties);
            // Dodaj zmienne do globalnej mapy zmiennych
            this.addVariablesToMap(componentId, properties);
        });
    }

    // NOWA METODA: Wyciągnij właściwości tylko z SVG
    extractElementPropertiesFromSvg(svgElement) {
        // Wyciągnij typ komponentu na podstawie klas lub heurystyki SVG
        const type = this.detectComponentType(svgElement, {});
        // Wyciągnij wszystkie atrybuty SVG
        const svgAttributes = this.extractSvgAttributes(svgElement);
        // Wyciągnij kolory
        const colors = this.extractColors(svgElement);
        // Wyciągnij pozycję
        const position = this.extractPosition(svgElement);
        // Wyciągnij zdarzenia
        const events = this.getAvailableEvents(svgElement);
        // Wyciągnij parametry z dataset oraz atrybutów
        const parameters = {};
        // Dodaj wszystkie data-* jako parametry
        Array.from(svgElement.attributes).forEach(attr => {
            if (attr.name.startsWith('data-') && attr.name !== 'data-id') {
                const key = attr.name.replace(/^data-/, '');
                parameters[key] = {
                    value: attr.value,
                    type: this.detectParameterType(key, attr.value),
                    writable: true,
                    readable: true
                };
            }
        });
        // Dodaj atrybuty SVG jako parametry (jeśli nie są data-)
        Object.entries(svgAttributes).forEach(([key, value]) => {
            if (!parameters[key]) {
                parameters[key] = {
                    value: value,
                    type: this.detectParameterType(key, value),
                    writable: true,
                    readable: true
                };
            }
        });
        // Wyciągnij stany (heurystycznie: parametry typu boolean lub "on", "active")
        const states = {};
        Object.entries(parameters).forEach(([key, param]) => {
            if (param.type === 'boolean' || key.toLowerCase().includes('on') || key.toLowerCase().includes('active')) {
                states[key] = param.value;
            }
        });
        // Zbuduj strukturę właściwości
        return {
            id: svgElement.getAttribute('data-id'),
            type,
            metadata: {},
            svgAttributes,
            parameters,
            events,
            states,
            colors,
            position,
            interactions: []
        };
    }

    // (pozostałe metody klasy PropertiesMapper poniżej, np. extractElementProperties itd.)


    // Wyciągnij właściwości z pojedynczego elementu SVG
    extractElementProperties(svgElement, componentData) {
        const properties = {
            id: svgElement.getAttribute('data-id'),
            type: this.detectComponentType(svgElement, componentData),
            metadata: componentData.metadata || {},
            svgAttributes: this.extractSvgAttributes(svgElement),
            parameters: this.extractParameters(componentData),
            events: this.getAvailableEvents(svgElement),
            states: this.extractStates(componentData),
            colors: this.extractColors(svgElement),
            position: this.extractPosition(svgElement),
            interactions: this.extractInteractions(componentData)
        };

        return properties;
    }

    // Wykryj typ komponentu na podstawie SVG i metadanych
    detectComponentType(svgElement, componentData) {
        // Sprawdź metadane
        if (componentData.metadata && componentData.metadata.type) {
            return componentData.metadata.type;
        }

        // Wykryj na podstawie klas CSS
        const classNames = svgElement.getAttribute('class') || '';
        if (classNames.includes('button')) return 'button';
        if (classNames.includes('led')) return 'led';
        if (classNames.includes('switch')) return 'switch';
        if (classNames.includes('sensor')) return 'sensor';
        if (classNames.includes('display')) return 'display';
        if (classNames.includes('gauge')) return 'gauge';
        if (classNames.includes('motor')) return 'motor';

        // Wykryj na podstawie elementów potomnych
        if (svgElement.querySelector('circle')) return 'button';
        if (svgElement.querySelector('rect')) return 'switch';
        if (svgElement.querySelector('text')) return 'display';

        return 'unknown';
    }

    // Wyciągnij atrybuty SVG
    extractSvgAttributes(svgElement) {
        const attributes = {};
        Array.from(svgElement.attributes).forEach(attr => {
            if (!attr.name.startsWith('data-')) {
                attributes[attr.name] = attr.value;
            }
        });
        return attributes;
    }

    // Wyciągnij parametry komponentu
    extractParameters(componentData) {
        const parameters = {};
        
        if (componentData.metadata && componentData.metadata.parameters) {
            Object.entries(componentData.metadata.parameters).forEach(([key, value]) => {
                parameters[key] = {
                    value: value,
                    type: this.detectParameterType(key, value),
                    writable: this.isParameterWritable(key),
                    readable: true
                };
            });
        }

        return parameters;
    }

    // Wykryj typ parametru
    detectParameterType(key, value) {
        if (typeof value === 'boolean') return 'boolean';
        if (typeof value === 'number') return 'number';
        if (key.toLowerCase().includes('color')) return 'color';
        if (key.toLowerCase().includes('state') || key.toLowerCase().includes('on')) return 'boolean';
        if (key.toLowerCase().includes('value') || key.toLowerCase().includes('level')) return 'number';
        return 'string';
    }

    // Sprawdź czy parametr można modyfikować
    isParameterWritable(key) {
        const readOnlyParams = ['id', 'type', 'created', 'readonly'];
        return !readOnlyParams.includes(key.toLowerCase());
    }

    // Pobierz dostępne zdarzenia dla komponentu
    getAvailableEvents(svgElement) {
        const componentType = this.detectComponentType(svgElement, {});
        
        const eventMap = {
            'button': ['click', 'press', 'release', 'hover'],
            'switch': ['toggle', 'on', 'off', 'change'],
            'led': ['on', 'off', 'blink', 'change'],
            'sensor': ['change', 'threshold', 'update', 'alert'],
            'display': ['change', 'update', 'clear'],
            'gauge': ['change', 'min', 'max', 'threshold'],
            'motor': ['start', 'stop', 'change', 'speed'],
            'unknown': ['click', 'change']
        };

        return eventMap[componentType] || eventMap['unknown'];
    }

    // Wyciągnij stany komponentu
    extractStates(componentData) {
        const states = {};
        
        if (componentData.metadata && componentData.metadata.parameters) {
            Object.entries(componentData.metadata.parameters).forEach(([key, value]) => {
                if (key.toLowerCase().includes('state') || 
                    key.toLowerCase().includes('on') || 
                    key.toLowerCase().includes('active')) {
                    states[key] = value;
                }
            });
        }

        return states;
    }

    // Wyciągnij kolory z elementu SVG
    extractColors(svgElement) {
        const colors = {};
        
        // Sprawdź atrybuty fill i stroke
        const fill = svgElement.getAttribute('fill');
        const stroke = svgElement.getAttribute('stroke');
        
        if (fill && fill !== 'none') colors.fill = fill;
        if (stroke && stroke !== 'none') colors.stroke = stroke;

        // Sprawdź elementy potomne z kolorami
        const coloredElements = svgElement.querySelectorAll('[fill], [stroke]');
        coloredElements.forEach((el, index) => {
            const className = el.getAttribute('class') || `element-${index}`;
            const elFill = el.getAttribute('fill');
            const elStroke = el.getAttribute('stroke');
            
            if (elFill && elFill !== 'none') colors[`${className}-fill`] = elFill;
            if (elStroke && elStroke !== 'none') colors[`${className}-stroke`] = elStroke;
        });

        return colors;
    }

    // Wyciągnij pozycję elementu
    extractPosition(svgElement) {
        return {
            x: parseFloat(svgElement.getAttribute('x')) || 0,
            y: parseFloat(svgElement.getAttribute('y')) || 0,
            width: parseFloat(svgElement.getAttribute('width')) || 0,
            height: parseFloat(svgElement.getAttribute('height')) || 0
        };
    }

    // Wyciągnij istniejące interakcje
    extractInteractions(componentData) {
        if (componentData.metadata && componentData.metadata.interactions) {
            return componentData.metadata.interactions;
        }
        return [];
    }

    // Dodaj zmienne do globalnej mapy zmiennych
    addVariablesToMap(componentId, properties) {
        const componentName = properties.metadata.name || componentId;
        
        // Dodaj parametry jako zmienne
        Object.entries(properties.parameters).forEach(([paramName, paramData]) => {
            const variableName = `${componentName}.${paramName}`;
            this.availableVariables.set(variableName, {
                componentId: componentId,
                parameter: paramName,
                type: paramData.type,
                writable: paramData.writable,
                readable: paramData.readable,
                currentValue: paramData.value
            });
        });

        // Dodaj stany jako zmienne
        Object.entries(properties.states).forEach(([stateName, stateValue]) => {
            const variableName = `${componentName}.${stateName}`;
            this.availableVariables.set(variableName, {
                componentId: componentId,
                parameter: stateName,
                type: 'state',
                writable: true,
                readable: true,
                currentValue: stateValue
            });
        });

        // Dodaj kolory jako zmienne
        Object.entries(properties.colors).forEach(([colorName, colorValue]) => {
            const variableName = `${componentName}.${colorName}`;
            this.availableVariables.set(variableName, {
                componentId: componentId,
                parameter: colorName,
                type: 'color',
                writable: true,
                readable: true,
                currentValue: colorValue
            });
        });
    }

    // Eksportuj zmapowane właściwości do JSON
    exportToMetadataJson() {
        const metadata = {
            timestamp: new Date().toISOString(),
            components: Object.fromEntries(this.mappedProperties),
            variables: Object.fromEntries(this.availableVariables),
            summary: {
                totalComponents: this.mappedProperties.size,
                totalVariables: this.availableVariables.size,
                componentTypes: this.getComponentTypesSummary()
            }
        };

        return metadata;
    }

    // Pobierz podsumowanie typów komponentów
    getComponentTypesSummary() {
        const types = {};
        this.mappedProperties.forEach((props) => {
            types[props.type] = (types[props.type] || 0) + 1;
        });
        return types;
    }

    // Pobierz zmienne dostępne dla konkretnego typu akcji
    getVariablesForActionType(actionType) {
        const variables = [];
        
        this.availableVariables.forEach((varData, varName) => {
            switch (actionType) {
                case 'set':
                    if (varData.writable) {
                        variables.push({
                            name: varName,
                            type: varData.type,
                            componentId: varData.componentId,
                            parameter: varData.parameter
                        });
                    }
                    break;
                case 'get':
                case 'read':
                    if (varData.readable) {
                        variables.push({
                            name: varName,
                            type: varData.type,
                            componentId: varData.componentId,
                            parameter: varData.parameter
                        });
                    }
                    break;
                case 'toggle':
                    if (varData.type === 'boolean' && varData.writable) {
                        variables.push({
                            name: varName,
                            type: varData.type,
                            componentId: varData.componentId,
                            parameter: varData.parameter
                        });
                    }
                    break;
            }
        });

        return variables;
    }

    // Pobierz komponenty dostępne jako cele interakcji
    getAvailableTargetComponents() {
        const components = [];
        this.mappedProperties.forEach((props, id) => {
            // Heurystycznie pobierz nazwę komponentu z atrybutów SVG
            let name = id;
            if (props.svgAttributes) {
                name = props.svgAttributes['data-label'] ||
                       props.svgAttributes['data-name'] ||
                       props.svgAttributes['aria-label'] ||
                       props.svgAttributes['title'] ||
                       id;
            }
            components.push({
                id,
                name,
                type: props.type,
                parameters: Object.keys(props.parameters || {})
            });
        });
        console.log('[PropertiesMapper] getAvailableTargetComponents:', components);
        return components;
    }

    // Automatycznie odśwież mapowanie przy zmianie canvy
    setupAutoRefresh() {
        // Obserwuj zmiany w canvas
        const canvas = document.getElementById('canvas');
        if (canvas) {
            const observer = new MutationObserver((mutations) => {
                let shouldRefresh = false;
                
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList' || 
                        (mutation.type === 'attributes' && mutation.attributeName === 'data-id')) {
                        shouldRefresh = true;
                    }
                });

                if (shouldRefresh) {
                    console.log('Canvas changed, refreshing property mapping...');
                    this.scanCanvasProperties();
                }
            });

            observer.observe(canvas, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['data-id']
            });
            
            // Store the observer instance for potential cleanup
            this.canvasObserver = observer;
        }
    }
    
    // Cleanup method to disconnect observers
    cleanup() {
        if (this.canvasObserver) {
            this.canvasObserver.disconnect();
        }
    }
}
