// Digital Twin IDE - Property Extractor Module
// Handles extraction of detailed properties from components

export class PropertyExtractor {
    constructor() {
        // Static utility class - no state needed
    }

    /**
     * Extract element properties from SVG element and component data
     * @param {Element} svgElement - SVG element
     * @param {Object} componentData - Component data from manager
     * @returns {Promise<Object>} Extracted properties
     */
    static async extractElementProperties(svgElement, componentData) {
        const componentId = svgElement.getAttribute('data-id') || svgElement.id;
        
        console.log(`[PropertyExtractor] Extracting detailed properties for: ${componentId}`);
        
        try {
            // Get the component type asynchronously
            const componentType = await this.detectComponentType(svgElement, componentData);
            
            // Extract all properties in parallel where possible
            const [
                attributes, 
                parameters, 
                colors, 
                position, 
                states, 
                interactions, 
                events
            ] = await Promise.all([
                this.extractSvgAttributes(svgElement),
                this.extractParameters(componentData),
                this.extractColors(svgElement),
                this.extractPosition(svgElement),
                this.extractStates(componentData),
                this.extractInteractions(componentData),
                this.getAvailableEvents(svgElement)
            ]);
            
            return {
                id: componentId,
                type: componentType,
                attributes,
                parameters,
                colors,
                position,
                states,
                interactions,
                events,
                element: svgElement,
                lastUpdated: new Date().toISOString()
            };
            
        } catch (error) {
            console.error(`[PropertyExtractor] Error extracting properties for ${componentId}:`, error);
            
            // Return a minimal set of properties even if there's an error
            return {
                id: componentId,
                type: 'unknown',
                attributes: {},
                parameters: [],
                colors: {},
                position: { x: 0, y: 0 },
                states: [],
                interactions: [],
                events: [],
                element: svgElement,
                lastUpdated: new Date().toISOString(),
                error: error.message
            };
        }
    }

    /**
     * Detect component type based on SVG and metadata
     * @param {Element} svgElement - SVG element
     * @param {Object} componentData - Component data
     * @returns {Promise<string>} Component type
     */
    static async detectComponentType(svgElement, componentData) {
        // Priority 1: Explicit type in component data
        if (componentData?.metadata?.type) {
            return componentData.metadata.type;
        }
        
        // Priority 2: Data attribute on the element
        const dataType = svgElement.getAttribute('data-type');
        if (dataType) return dataType;
        
        // Priority 3: Class name and ID inference (asynchronous)
        try {
            const [classType, idType] = await Promise.all([
                this.inferTypeFromClasses(svgElement),
                this.inferTypeFromId(svgElement)
            ]);
            
            if (classType) return classType;
            if (idType) return idType;
            
            // Priority 4: Content-based inference (asynchronous)
            const contentType = await this.inferTypeFromContent(svgElement);
            if (contentType) return contentType;
            
            console.log(`[PropertyExtractor] Could not determine type for component, using 'unknown'`);
            return 'unknown';
            
        } catch (error) {
            console.error('[PropertyExtractor] Error detecting component type:', error);
            return 'unknown';
        }
    }

    /**
     * Get component types from manifest
     * @returns {Promise<Array<string>>} Array of component types
     */
    static async getComponentTypes() {
        // Default component types as fallback
        const defaultTypes = ['pump', 'valve', 'sensor', 'display', 'led', 'tank', 'pipe'];
        
        try {
            const response = await fetch('/js/components/manifest.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const manifest = await response.json();
            if (manifest.components && Array.isArray(manifest.components)) {
                return manifest.components.map(comp => comp.type);
            }
        } catch (error) {
            console.warn('[PropertyExtractor] Error loading component types from manifest, using defaults:', error);
        }
        
        return defaultTypes;
    }
    
    /**
     * Infer component type from CSS classes
     * @param {Element} svgElement - SVG element
     * @returns {Promise<string|null>} Inferred type or null
     */
    static async inferTypeFromClasses(svgElement) {
        try {
            const componentTypes = await this.getComponentTypes();
            
            for (let className of svgElement.classList) {
                const lowerClassName = className.toLowerCase();
                for (let type of componentTypes) {
                    if (lowerClassName.includes(type)) {
                        return type;
                    }
                }
            }
        } catch (error) {
            console.warn('[PropertyExtractor] Error inferring type from classes:', error);
        }
        
        return null;
    }

    /**
     * Infer component type from ID
     * @param {Element} svgElement - SVG element
     * @returns {Promise<string|null>} Inferred type or null
     */
    static async inferTypeFromId(svgElement) {
        const id = (svgElement.id || svgElement.getAttribute('data-id') || '').toLowerCase();
        
        try {
            const componentTypes = await this.getComponentTypes();
            
            for (let type of componentTypes) {
                if (id.includes(type)) {
                    return type;
                }
            }
        } catch (error) {
            console.warn('[PropertyExtractor] Error inferring type from ID:', error);
        }
        
        return null;
    }

    /**
     * Get component type patterns from manifest
     * @returns {Promise<Object>} Type patterns object
     */
    static async getTypePatterns() {
        // Default patterns in case manifest loading fails
        const defaultPatterns = {
            'pump': ['pump', 'rotor', 'impeller'],
            'valve': ['valve', 'gate', 'flow'],
            'sensor': ['sensor', 'probe', 'measure'],
            'display': ['display', 'screen', 'monitor'],
            'led': ['led', 'light', 'indicator'],
            'tank': ['tank', 'container', 'reservoir'],
            'pipe': ['pipe', 'line', 'conduit']
        };
        
        try {
            const response = await fetch('/js/components/manifest.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const manifest = await response.json();
            
            if (!manifest.components) {
                return defaultPatterns;
            }
            
            // Build patterns from manifest components
            const patterns = {};
            
            manifest.components.forEach(component => {
                if (component.type) {
                    // Use keywords from manifest if available, otherwise use component type as a pattern
                    const keywords = component.keywords || [component.type];
                    patterns[component.type] = Array.isArray(keywords) ? 
                        keywords : [keywords];
                }
            });
            
            // Merge with default patterns to ensure all types are covered
            return { ...defaultPatterns, ...patterns };
            
        } catch (error) {
            console.warn('[PropertyExtractor] Error loading component patterns from manifest, using defaults:', error);
            return defaultPatterns;
        }
    }
    
    /**
     * Infer component type from SVG content
     * @param {Element} svgElement - SVG element
     * @returns {Promise<string|null>} Inferred type or null
     */
    static async inferTypeFromContent(svgElement) {
        const content = (svgElement.innerHTML || '').toLowerCase();
        const typePatterns = await this.getTypePatterns();
        
        for (let [type, patterns] of Object.entries(typePatterns)) {
            if (patterns.some(pattern => content.includes(pattern))) {
                return type;
            }
        }
        return null;
    }

    /**
     * Extract SVG attributes
     * @param {Element} svgElement - SVG element
     * @returns {Object} Attributes object
     */
    static extractSvgAttributes(svgElement) {
        const attributes = {};
        Array.from(svgElement.attributes).forEach(attr => {
            attributes[attr.name] = attr.value;
        });
        return attributes;
    }

    /**
     * Extract component parameters
     * @param {Object} componentData - Component data
     * @returns {Array} Parameters array
     */
    static extractParameters(componentData) {
        if (!componentData) return [];
        
        const parameters = [];
        const parameterSources = [];
        
        // From metadata parameters
        if (componentData.metadata?.parameters) {
            parameterSources.push(...componentData.metadata.parameters);
        }
        
        // From component properties
        if (componentData.properties) {
            parameterSources.push(...Object.keys(componentData.properties));
        }
        
        // From states
        if (componentData.states) {
            parameterSources.push(...Object.keys(componentData.states));
        }
        
        // Create parameter objects with metadata
        parameterSources.forEach(param => {
            if (!parameters.find(p => p.name === param)) {
                parameters.push({
                    name: param,
                    type: this.detectParameterType(param, componentData),
                    writable: this.isParameterWritable(param),
                    value: this.getParameterValue(param, componentData)
                });
            }
        });
        
        return parameters;
    }

    /**
     * Detect parameter type
     * @param {string} key - Parameter key
     * @param {Object} componentData - Component data
     * @returns {string} Parameter type
     */
    static detectParameterType(key, componentData) {
        // Check actual value type first
        const value = this.getParameterValue(key, componentData);
        if (value !== undefined) {
            return typeof value;
        }
        
        // Infer from key name
        const keyLower = key.toLowerCase();
        if (keyLower.includes('color') || keyLower.includes('fill') || keyLower.includes('stroke')) return 'color';
        if (keyLower.includes('size') || keyLower.includes('width') || keyLower.includes('height')) return 'number';
        if (keyLower.includes('enable') || keyLower.includes('visible') || keyLower.includes('active')) return 'boolean';
        if (keyLower.includes('text') || keyLower.includes('label') || keyLower.includes('name')) return 'string';
        
        return 'string'; // Default
    }

    /**
     * Get parameter value from component data
     * @param {string} key - Parameter key
     * @param {Object} componentData - Component data
     * @returns {any} Parameter value
     */
    static getParameterValue(key, componentData) {
        if (!componentData) return undefined;
        
        // Try properties first
        if (componentData.properties && componentData.properties[key] !== undefined) {
            return componentData.properties[key];
        }
        
        // Try states
        if (componentData.states && componentData.states[key] !== undefined) {
            return componentData.states[key];
        }
        
        // Try metadata
        if (componentData.metadata && componentData.metadata[key] !== undefined) {
            return componentData.metadata[key];
        }
        
        return undefined;
    }

    /**
     * Check if parameter is writable
     * @param {string} key - Parameter key
     * @returns {boolean} Whether parameter can be modified
     */
    static isParameterWritable(key) {
        const readOnlyParams = ['id', 'type', 'element', 'lastUpdated', 'timestamp'];
        return !readOnlyParams.includes(key.toLowerCase());
    }

    /**
     * Get available events for component
     * @param {Element} svgElement - SVG element
     * @returns {Array} Available events
     */
    static getAvailableEvents(svgElement) {
        const standardEvents = ['click', 'mouseenter', 'mouseleave', 'dblclick', 'contextmenu'];
        const boundEvents = [];
        
        // Check for bound events
        standardEvents.forEach(eventType => {
            if (svgElement[`on${eventType}`] || svgElement.getAttribute(`on${eventType}`)) {
                boundEvents.push({
                    type: eventType,
                    bound: true,
                    handler: svgElement[`on${eventType}`] || svgElement.getAttribute(`on${eventType}`)
                });
            } else {
                boundEvents.push({
                    type: eventType,
                    bound: false,
                    handler: null
                });
            }
        });
        
        // Add component-specific events
        const componentSpecificEvents = this.getComponentSpecificEvents(svgElement);
        boundEvents.push(...componentSpecificEvents);
        
        return boundEvents;
    }

    /**
     * Get component-specific events based on detected type
     * @param {Element} svgElement - SVG element
     * @returns {Array} Component-specific events
     */
    static getComponentSpecificEvents(svgElement) {
        const componentType = this.detectComponentType(svgElement);
        const events = [];
        
        const componentEventMap = {
            'pump': ['start', 'stop', 'speedChange', 'directionChange'],
            'valve': ['open', 'close', 'toggle', 'positionChange'],
            'sensor': ['valueUpdate', 'threshold', 'alarm', 'calibrate'],
            'display': ['textUpdate', 'refresh', 'clear', 'modeChange'],
            'led': ['on', 'off', 'blink', 'colorChange', 'brightnessChange']
        };
        
        const componentEvents = componentEventMap[componentType] || [];
        componentEvents.forEach(eventType => {
            events.push({
                type: eventType,
                bound: false,
                handler: null,
                componentSpecific: true
            });
        });
        
        return events;
    }

    /**
     * Extract states from component data
     * @param {Object} componentData - Component data
     * @returns {Array} States array
     */
    static extractStates(componentData) {
        if (!componentData?.states) return [];
        
        return Object.entries(componentData.states).map(([name, value]) => ({
            name,
            value,
            type: typeof value,
            writable: this.isParameterWritable(name)
        }));
    }

    /**
     * Extract interactions from component data
     * @param {Object} componentData - Component data
     * @returns {Array} Interactions array
     */
    static extractInteractions(componentData) {
        if (!componentData?.interactions) return [];
        
        return Array.isArray(componentData.interactions) 
            ? componentData.interactions 
            : Object.entries(componentData.interactions).map(([key, value]) => ({
                name: key,
                ...value
            }));
    }

    /**
     * Extract colors from SVG element
     * @param {Element} svgElement - SVG element
     * @returns {Object} Colors object
     */
    static extractColors(svgElement) {
        const colors = {};
        
        // Direct element colors
        this.extractElementColors(svgElement, colors, 'main');
        
        // Child element colors
        const coloredChildren = svgElement.querySelectorAll('*[fill], *[stroke], *[color]');
        coloredChildren.forEach((child, index) => {
            this.extractElementColors(child, colors, `child_${index}`);
        });
        
        return colors;
    }

    /**
     * Extract colors from a single element
     * @param {Element} element - Element to extract colors from
     * @param {Object} colors - Colors object to populate
     * @param {string} prefix - Prefix for color keys
     */
    static extractElementColors(element, colors, prefix) {
        const fill = element.getAttribute('fill') || getComputedStyle(element).fill;
        const stroke = element.getAttribute('stroke') || getComputedStyle(element).stroke;
        const color = element.getAttribute('color') || getComputedStyle(element).color;
        
        if (fill && fill !== 'none' && fill !== 'inherit') {
            colors[`${prefix}_fill`] = fill;
        }
        if (stroke && stroke !== 'none' && stroke !== 'inherit') {
            colors[`${prefix}_stroke`] = stroke;
        }
        if (color && color !== 'inherit') {
            colors[`${prefix}_color`] = color;
        }
    }

    /**
     * Extract position from element
     * @param {Element} svgElement - SVG element
     * @returns {Object} Position data
     */
    static extractPosition(svgElement) {
        const transform = svgElement.getAttribute('transform') || '';
        const bbox = svgElement.getBBox ? svgElement.getBBox() : null;
        
        return {
            x: parseFloat(svgElement.getAttribute('x')) || 0,
            y: parseFloat(svgElement.getAttribute('y')) || 0,
            transform,
            bbox: bbox ? {
                x: bbox.x,
                y: bbox.y,
                width: bbox.width,
                height: bbox.height
            } : null
        };
    }
}
