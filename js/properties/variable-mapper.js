// Digital Twin IDE - Variable Mapper Module
// Handles variable mapping, metadata export, and component summaries

export class VariableMapper {
    constructor(mapperCore) {
        this.mapperCore = mapperCore;
    }

    /**
     * Add variables to the global map from component properties
     * @param {string} componentId - Component ID
     * @param {Object} properties - Component properties
     */
    addVariablesToMap(componentId, properties) {
        const variables = this.mapperCore.getAvailableVariables();
        
        console.log(`[VariableMapper] Adding variables for component: ${componentId}`);
        
        // Add component itself as a variable
        variables.set(componentId, {
            type: 'component',
            componentType: properties.type,
            description: `Component ${componentId} of type ${properties.type}`,
            properties: properties,
            lastUpdated: new Date().toISOString()
        });
        
        // Add component parameters as variables
        if (properties.parameters && Array.isArray(properties.parameters)) {
            properties.parameters.forEach(param => {
                const paramName = typeof param === 'object' ? param.name : param;
                const varKey = `${componentId}.${paramName}`;
                
                variables.set(varKey, {
                    type: 'parameter',
                    componentId: componentId,
                    parameter: paramName,
                    parameterType: typeof param === 'object' ? param.type : 'string',
                    writable: typeof param === 'object' ? param.writable : true,
                    value: typeof param === 'object' ? param.value : undefined,
                    description: `Parameter ${paramName} of component ${componentId}`
                });
            });
        }
        
        // Add component states as variables
        if (properties.states && Array.isArray(properties.states)) {
            properties.states.forEach(state => {
                const varKey = `${componentId}.${state.name}`;
                variables.set(varKey, {
                    type: 'state',
                    componentId: componentId,
                    state: state.name,
                    value: state.value,
                    stateType: state.type,
                    writable: state.writable,
                    description: `State ${state.name} of component ${componentId}`
                });
            });
        }
        
        // Add color variables
        if (properties.colors && Object.keys(properties.colors).length > 0) {
            Object.entries(properties.colors).forEach(([colorKey, colorValue]) => {
                const varKey = `${componentId}.${colorKey}`;
                variables.set(varKey, {
                    type: 'color',
                    componentId: componentId,
                    colorProperty: colorKey,
                    value: colorValue,
                    description: `Color property ${colorKey} of component ${componentId}`
                });
            });
        }
        
        // Add position variables
        if (properties.position) {
            ['x', 'y'].forEach(coord => {
                if (properties.position[coord] !== undefined) {
                    const varKey = `${componentId}.${coord}`;
                    variables.set(varKey, {
                        type: 'position',
                        componentId: componentId,
                        coordinate: coord,
                        value: properties.position[coord],
                        description: `${coord.toUpperCase()} position of component ${componentId}`
                    });
                }
            });
        }
        
        console.log(`[VariableMapper] Added ${variables.size} total variables (component ${componentId})`);
    }

    /**
     * Get variables available for specific action type
     * @param {string} actionType - Type of action (setValue, changeColor, etc.)
     * @returns {Array} Available variables for this action type
     */
    getVariablesForActionType(actionType) {
        const variables = this.mapperCore.getAvailableVariables();
        const filteredVariables = [];
        
        console.log(`[VariableMapper] Getting variables for action type: ${actionType}`);
        
        variables.forEach((variable, key) => {
            let isCompatible = false;
            
            switch (actionType) {
                case 'setValue':
                    isCompatible = variable.type === 'parameter' || variable.type === 'state';
                    break;
                case 'changeColor':
                    isCompatible = variable.type === 'color';
                    break;
                case 'move':
                    isCompatible = variable.type === 'position';
                    break;
                case 'trigger':
                    isCompatible = variable.type === 'component';
                    break;
                case 'condition':
                    isCompatible = ['parameter', 'state', 'position'].includes(variable.type);
                    break;
                default:
                    isCompatible = true; // All variables available for unknown action types
            }
            
            if (isCompatible) {
                filteredVariables.push({
                    key,
                    ...variable
                });
            }
        });
        
        console.log(`[VariableMapper] Found ${filteredVariables.length} compatible variables for ${actionType}`);
        return filteredVariables;
    }

    /**
     * Export mapped properties to metadata JSON
     * @returns {Object} Metadata JSON object
     */
    exportToMetadataJson() {
        const mappedProperties = this.mapperCore.getMappedProperties();
        const availableVariables = this.mapperCore.getAvailableVariables();
        
        const metadata = {
            exportTimestamp: new Date().toISOString(),
            version: '1.0',
            components: {},
            variables: {},
            summary: this.getComponentTypesSummary()
        };
        
        // Export component properties
        mappedProperties.forEach((properties, componentId) => {
            // Create a clean copy without DOM element reference
            const cleanProperties = {
                ...properties,
                element: undefined // Remove DOM reference for JSON export
            };
            metadata.components[componentId] = cleanProperties;
        });
        
        // Export variables
        availableVariables.forEach((variable, key) => {
            metadata.variables[key] = variable;
        });
        
        console.log(`[VariableMapper] Exported metadata for ${Object.keys(metadata.components).length} components and ${Object.keys(metadata.variables).length} variables`);
        
        return metadata;
    }

    /**
     * Get summary of component types
     * @returns {Object} Component types summary
     */
    getComponentTypesSummary() {
        const mappedProperties = this.mapperCore.getMappedProperties();
        const summary = {};
        
        mappedProperties.forEach((properties) => {
            const type = properties.type || 'unknown';
            if (!summary[type]) {
                summary[type] = {
                    count: 0,
                    components: []
                };
            }
            summary[type].count++;
            summary[type].components.push(properties.id);
        });
        
        console.log(`[VariableMapper] Component types summary:`, summary);
        return summary;
    }

    /**
     * Get available target components for interactions
     * @returns {Array} Available target components
     */
    getAvailableTargetComponents() {
        const mappedProperties = this.mapperCore.getMappedProperties();
        const components = [];
        
        mappedProperties.forEach((properties, componentId) => {
            // Extract heuristic name
            let name = this.extractHeuristicName(properties);
            
            // Fallback to ID if no good name found
            if (!name || name === componentId) {
                name = `Component ${componentId}`;
            }
            
            // Extract parameters for interaction targeting
            const parameters = this.extractComponentParameters(properties);
            
            components.push({
                id: componentId,
                name: name,
                type: properties.type || 'unknown',
                parameters: parameters
            });
        });
        
        console.log(`[VariableMapper] Available target components: ${components.length}`, components);
        return components;
    }

    /**
     * Extract heuristic name from component properties
     * @param {Object} properties - Component properties
     * @returns {string} Extracted name
     */
    extractHeuristicName(properties) {
        // Try various sources for a good component name
        const nameSources = [
            properties.attributes?.['data-label'],
            properties.attributes?.['data-name'],
            properties.attributes?.['aria-label'],
            properties.attributes?.['title'],
            properties.id
        ];
        
        for (let nameSource of nameSources) {
            if (nameSource && typeof nameSource === 'string' && nameSource.trim()) {
                return nameSource.trim();
            }
        }
        
        // Try to extract from text content if available
        if (properties.element) {
            const textElements = properties.element.querySelectorAll('text, tspan');
            if (textElements.length > 0) {
                const textContent = Array.from(textElements)
                    .map(el => el.textContent.trim())
                    .filter(text => text.length > 0)
                    .join(' ');
                
                if (textContent) {
                    return textContent.substring(0, 50); // Limit length
                }
            }
        }
        
        return properties.id; // Final fallback
    }

    /**
     * Extract component parameters as array of keys
     * @param {Object} properties - Component properties
     * @returns {Array} Parameter names
     */
    extractComponentParameters(properties) {
        const parameters = [];
        
        // From parameters array
        if (properties.parameters && Array.isArray(properties.parameters)) {
            properties.parameters.forEach(param => {
                const paramName = typeof param === 'object' ? param.name : param;
                if (paramName && !parameters.includes(paramName)) {
                    parameters.push(paramName);
                }
            });
        }
        
        // From states
        if (properties.states && Array.isArray(properties.states)) {
            properties.states.forEach(state => {
                if (state.name && !parameters.includes(state.name)) {
                    parameters.push(state.name);
                }
            });
        }
        
        // From colors
        if (properties.colors && typeof properties.colors === 'object') {
            Object.keys(properties.colors).forEach(colorKey => {
                if (!parameters.includes(colorKey)) {
                    parameters.push(colorKey);
                }
            });
        }
        
        // Standard parameters
        const standardParams = ['x', 'y', 'visible', 'enabled'];
        standardParams.forEach(param => {
            if (!parameters.includes(param)) {
                parameters.push(param);
            }
        });
        
        return parameters;
    }

    /**
     * Clear all variables from the map
     */
    clearVariables() {
        const variables = this.mapperCore.getAvailableVariables();
        variables.clear();
        console.log('[VariableMapper] Cleared all variables');
    }

    /**
     * Get variable by key
     * @param {string} key - Variable key
     * @returns {Object|null} Variable data or null
     */
    getVariable(key) {
        const variables = this.mapperCore.getAvailableVariables();
        return variables.get(key) || null;
    }

    /**
     * Get all variables as array
     * @returns {Array} All variables
     */
    getAllVariables() {
        const variables = this.mapperCore.getAvailableVariables();
        const result = [];
        
        variables.forEach((variable, key) => {
            result.push({
                key,
                ...variable
            });
        });
        
        return result;
    }

    /**
     * Get variables by type
     * @param {string} type - Variable type (component, parameter, state, color, position)
     * @returns {Array} Variables of specified type
     */
    getVariablesByType(type) {
        const variables = this.mapperCore.getAvailableVariables();
        const result = [];
        
        variables.forEach((variable, key) => {
            if (variable.type === type) {
                result.push({
                    key,
                    ...variable
                });
            }
        });
        
        return result;
    }

    /**
     * Get variables by component ID
     * @param {string} componentId - Component ID
     * @returns {Array} Variables for specified component
     */
    getVariablesByComponent(componentId) {
        const variables = this.mapperCore.getAvailableVariables();
        const result = [];
        
        variables.forEach((variable, key) => {
            if (variable.componentId === componentId || key === componentId) {
                result.push({
                    key,
                    ...variable
                });
            }
        });
        
        return result;
    }
}
