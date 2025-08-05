// Digital Twin IDE - Component Detector Module
// Handles detection and scanning of SVG components on canvas

export class ComponentDetector {
    constructor(mapperCore) {
        this.mapperCore = mapperCore;
    }

    /**
     * Scan all elements on canvas and extract their properties
     */
    scanCanvasProperties() {
        const canvas = this.mapperCore.getCanvas();
        if (!canvas) return;

        console.log('[ComponentDetector] Canvas found for scanning:', canvas.id || canvas.tagName);

        // Clear existing mappings to prevent stale data
        this.mapperCore.clearMappings();

        // Enhanced component detection with multiple selectors
        console.log('[ComponentDetector] Canvas content debug:', {
            innerHTML: canvas.innerHTML.substring(0, 200) + '...',
            childElementCount: canvas.childElementCount,
            children: Array.from(canvas.children).map(c => ({ 
                tag: c.tagName, 
                id: c.id, 
                dataId: c.getAttribute('data-id') 
            }))
        });
        
        // Find components using multiple detection strategies
        const svgComponents = this.findComponents(canvas);
        
        console.log(`[ComponentDetector] Final component count: ${svgComponents.length}`);
        if (svgComponents.length > 0) {
            console.log('[ComponentDetector] Sample components:', 
                Array.from(svgComponents).slice(0, 3).map(el => ({
                    tag: el.tagName,
                    id: el.id,
                    dataId: el.getAttribute('data-id'),
                    classes: el.className
                }))
            );
        }
        
        // Process each found component
        svgComponents.forEach(svgElement => {
            this.processSvgComponent(svgElement);
        });
    }

    /**
     * Find components using multiple detection strategies
     * @param {Element} canvas - Canvas element to search within
     * @returns {NodeList} Found SVG components
     */
    findComponents(canvas) {
        // Try multiple selectors to find components
        let svgComponents = canvas.querySelectorAll('[data-id]');
        
        // If no components found with data-id, try alternative selectors
        if (svgComponents.length === 0) {
            console.log('[ComponentDetector] No [data-id] components found, trying alternatives...');
            
            // Try SVG elements with class draggable-component
            svgComponents = canvas.querySelectorAll('.draggable-component');
            console.log(`[ComponentDetector] Found ${svgComponents.length} .draggable-component elements`);
            
            // Try any SVG elements
            if (svgComponents.length === 0) {
                svgComponents = canvas.querySelectorAll('svg, g[id]');
                console.log(`[ComponentDetector] Found ${svgComponents.length} svg/g elements`);
            }
            
            // Try any child elements with some identifier
            if (svgComponents.length === 0) {
                svgComponents = canvas.querySelectorAll('*[id], *[class]');
                console.log(`[ComponentDetector] Found ${svgComponents.length} elements with id/class`);
            }
        }

        return svgComponents;
    }

    /**
     * Process a single SVG component element
     * @param {Element} svgElement - SVG element to process
     */
    processSvgComponent(svgElement) {
        // Skip if element is null or doesn't exist
        if (!svgElement) {
            console.warn(`[ComponentDetector] Skipping null or undefined element`);
            return;
        }
        
        const componentId = svgElement.getAttribute('data-id');
        
        if (!componentId) {
            console.warn(`[ComponentDetector] Skipping element without data-id:`, svgElement);
            return;
        }
        
        console.log(`[ComponentDetector] Processing component: ${componentId}`);
        
        // Get component data from ComponentManager if available
        let componentData = null;
        if (this.mapperCore.componentManager) {
            componentData = this.mapperCore.componentManager.getComponent(componentId);
        }
        
        // Extract properties from the SVG element
        const properties = this.extractElementPropertiesFromSvg(svgElement, componentData);
        
        // Store the mapped properties
        this.mapperCore.setMappedProperty(componentId, properties);
        
        // Add variables to the global map
        this.addVariablesToMap(componentId, properties);
        
        console.log(`[ComponentDetector] Mapped properties for ${componentId}:`, properties);
    }

    /**
     * Extract properties from SVG element only
     * @param {Element} svgElement - SVG element to extract from  
     * @param {Object} componentData - Optional component data from manager
     * @returns {Object} Extracted properties
     */
    extractElementPropertiesFromSvg(svgElement, componentData = null) {
        const componentId = svgElement.getAttribute('data-id') || svgElement.id;
        
        console.log(`[ComponentDetector] Extracting properties from SVG for: ${componentId}`);
        
        // Basic extraction from SVG attributes and structure
        const properties = {
            id: componentId,
            type: this.detectComponentType(svgElement, componentData),
            attributes: this.extractSvgAttributes(svgElement),
            colors: this.extractColors(svgElement),
            position: this.extractPosition(svgElement),
            states: this.extractStates(componentData),
            interactions: this.extractInteractions(componentData),
            parameters: this.extractParameters(componentData),
            events: this.getAvailableEvents(svgElement),
            element: svgElement, // Store reference to DOM element
            lastUpdated: new Date().toISOString()
        };
        
        console.log(`[ComponentDetector] Extracted properties for ${componentId}:`, {
            type: properties.type,
            attributeCount: Object.keys(properties.attributes).length,
            colorCount: Object.keys(properties.colors).length,
            parameterCount: properties.parameters.length,
            eventCount: properties.events.length
        });
        
        return properties;
    }

    /**
     * Detect component type based on SVG and metadata
     * @param {Element} svgElement - SVG element
     * @param {Object} componentData - Component data from manager
     * @returns {string} Detected component type
     */
    detectComponentType(svgElement, componentData) {
        // First try to get type from component data
        if (componentData && componentData.metadata && componentData.metadata.type) {
            return componentData.metadata.type;
        }
        
        // Try data-type attribute
        const dataType = svgElement.getAttribute('data-type');
        if (dataType) return dataType;
        
        // Try to infer from class names
        const classList = svgElement.classList;
        for (let className of classList) {
            if (className.includes('pump')) return 'pump';
            if (className.includes('valve')) return 'valve';
            if (className.includes('sensor')) return 'sensor';
            if (className.includes('display')) return 'display';
            if (className.includes('led')) return 'led';
            if (className.includes('tank')) return 'tank';
            if (className.includes('pipe')) return 'pipe';
        }
        
        // Try to infer from ID
        const id = svgElement.id || svgElement.getAttribute('data-id') || '';
        const idLower = id.toLowerCase();
        if (idLower.includes('pump')) return 'pump';
        if (idLower.includes('valve')) return 'valve';
        if (idLower.includes('sensor')) return 'sensor';
        if (idLower.includes('display')) return 'display';
        if (idLower.includes('led')) return 'led';
        if (idLower.includes('tank')) return 'tank';
        if (idLower.includes('pipe')) return 'pipe';
        
        // Try to infer from SVG content
        const svgContent = svgElement.innerHTML || '';
        if (svgContent.includes('pump') || svgContent.includes('rotor')) return 'pump';
        if (svgContent.includes('valve') || svgContent.includes('gate')) return 'valve';
        if (svgContent.includes('sensor') || svgContent.includes('probe')) return 'sensor';
        if (svgContent.includes('display') || svgContent.includes('screen')) return 'display';
        if (svgContent.includes('led') || svgContent.includes('light')) return 'led';
        
        console.log(`[ComponentDetector] Could not determine type for component ${svgElement.id || 'unknown'}, using 'unknown'`);
        return 'unknown';
    }

    /**
     * Extract SVG attributes
     * @param {Element} svgElement - SVG element
     * @returns {Object} SVG attributes
     */
    extractSvgAttributes(svgElement) {
        const attributes = {};
        for (let attr of svgElement.attributes) {
            attributes[attr.name] = attr.value;
        }
        return attributes;
    }

    /**
     * Extract position from element
     * @param {Element} svgElement - SVG element
     * @returns {Object} Position data
     */
    extractPosition(svgElement) {
        return {
            x: parseFloat(svgElement.getAttribute('x')) || 0,
            y: parseFloat(svgElement.getAttribute('y')) || 0,
            transform: svgElement.getAttribute('transform') || ''
        };
    }

    /**
     * Extract colors from SVG element
     * @param {Element} svgElement - SVG element
     * @returns {Object} Color information
     */
    extractColors(svgElement) {
        const colors = {};
        
        // Get fill color
        const fill = svgElement.getAttribute('fill') || 
                     getComputedStyle(svgElement).fill;
        if (fill && fill !== 'none') colors.fill = fill;
        
        // Get stroke color
        const stroke = svgElement.getAttribute('stroke') ||
                       getComputedStyle(svgElement).stroke;
        if (stroke && stroke !== 'none') colors.stroke = stroke;
        
        // Look for colors in child elements
        const childElements = svgElement.querySelectorAll('*[fill], *[stroke]');
        childElements.forEach((child, index) => {
            const childFill = child.getAttribute('fill');
            const childStroke = child.getAttribute('stroke');
            
            if (childFill && childFill !== 'none') {
                colors[`child_${index}_fill`] = childFill;
            }
            if (childStroke && childStroke !== 'none') {
                colors[`child_${index}_stroke`] = childStroke;
            }
        });
        
        return colors;
    }

    /**
     * Extract states from component data
     * @param {Object} componentData - Component data
     * @returns {Array} Component states
     */
    extractStates(componentData) {
        if (!componentData || !componentData.states) return [];
        
        return Object.keys(componentData.states).map(state => ({
            name: state,
            value: componentData.states[state],
            type: typeof componentData.states[state]
        }));
    }

    /**
     * Extract interactions from component data
     * @param {Object} componentData - Component data
     * @returns {Array} Component interactions
     */
    extractInteractions(componentData) {
        if (!componentData || !componentData.interactions) return [];
        return componentData.interactions || [];
    }

    /**
     * Extract parameters from component data
     * @param {Object} componentData - Component data
     * @returns {Array} Component parameters
     */
    extractParameters(componentData) {
        if (!componentData) return [];
        
        const parameters = [];
        
        // Extract from metadata if available
        if (componentData.metadata && componentData.metadata.parameters) {
            // Ensure parameters is iterable (array or array-like)
            const metadataParams = componentData.metadata.parameters;
            if (Array.isArray(metadataParams)) {
                parameters.push(...metadataParams);
            } else if (typeof metadataParams === 'object' && metadataParams !== null) {
                // If it's an object, convert to array of key-value pairs
                Object.entries(metadataParams).forEach(([key, value]) => {
                    parameters.push({ name: key, value: value });
                });
            }
        }
        
        // Extract from component properties
        if (componentData.properties) {
            Object.keys(componentData.properties).forEach(key => {
                if (!parameters.includes(key)) {
                    parameters.push(key);
                }
            });
        }
        
        return parameters;
    }

    /**
     * Get available events for component
     * @param {Element} svgElement - SVG element
     * @returns {Array} Available events
     */
    getAvailableEvents(svgElement) {
        const standardEvents = ['click', 'mouseenter', 'mouseleave', 'change'];
        const componentEvents = [];
        
        // Check what events are already bound
        standardEvents.forEach(eventType => {
            if (svgElement[`on${eventType}`] || 
                svgElement.getAttribute(`on${eventType}`)) {
                componentEvents.push(eventType);
            }
        });
        
        // Add component-specific events based on type
        const componentType = this.detectComponentType(svgElement);
        switch (componentType) {
            case 'pump':
                componentEvents.push('start', 'stop', 'speedChange');
                break;
            case 'valve':
                componentEvents.push('open', 'close', 'toggle');
                break;
            case 'sensor':
                componentEvents.push('valueUpdate', 'threshold', 'alarm');
                break;
            case 'display':
                componentEvents.push('textUpdate', 'refresh');
                break;
            case 'led':
                componentEvents.push('on', 'off', 'blink', 'colorChange');
                break;
        }
        
        return [...new Set(componentEvents)]; // Remove duplicates
    }

    /**
     * Add variables to the global map
     * @param {string} componentId - Component ID
     * @param {Object} properties - Component properties
     */
    addVariablesToMap(componentId, properties) {
        const variables = this.mapperCore.getAvailableVariables();
        
        // Add component itself as a variable
        variables.set(`${componentId}`, {
            type: 'component',
            componentType: properties.type,
            description: `Component ${componentId} of type ${properties.type}`,
            properties: properties
        });
        
        // Add component parameters as variables
        properties.parameters.forEach(param => {
            const varKey = `${componentId}.${param}`;
            variables.set(varKey, {
                type: 'parameter',
                componentId: componentId,
                parameter: param,
                description: `Parameter ${param} of component ${componentId}`
            });
        });
        
        // Add component states as variables
        properties.states.forEach(state => {
            const varKey = `${componentId}.${state.name}`;
            variables.set(varKey, {
                type: 'state',
                componentId: componentId,
                state: state.name,
                value: state.value,
                description: `State ${state.name} of component ${componentId}`
            });
        });
        
        console.log(`[ComponentDetector] Added ${variables.size} variables for component ${componentId}`);
    }
}
