/**
 * Property Utilities - Common helper functions for property management
 */

/**
 * Normalize color value for color input
 * @param {string} colorValue - The color value to normalize
 * @returns {string} Normalized hex color value
 */
export function normalizeColorValue(colorValue) {
    if (!colorValue) return '#000000';
    
    // If it's already a valid hex color, return it
    if (/^#[0-9A-F]{6}$/i.test(colorValue)) {
        return colorValue;
    }
    
    // Handle 3-character hex shorthand (#RGB)
    if (/^#[0-9A-F]{3}$/i.test(colorValue)) {
        const r = colorValue.charAt(1);
        const g = colorValue.charAt(2);
        const b = colorValue.charAt(3);
        return `#${r}${r}${g}${g}${b}${b}`;
    }
    
    // Handle named colors or other formats
    const colors = {
        'red': '#ff0000',
        'green': '#008000',
        'blue': '#0000ff',
        'yellow': '#ffff00',
        'orange': '#ffa500',
        'purple': '#800080',
        'black': '#000000',
        'white': '#ffffff',
        'gray': '#808080',
        'grey': '#808080'
    };
    
    const lowerColor = colorValue.toLowerCase();
    if (colors[lowerColor]) {
        return colors[lowerColor];
    }
    
    // Try to parse RGB/RGBA
    let rgbMatch = colorValue.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
        const r = parseInt(rgbMatch[1]).toString(16).padStart(2, '0');
        const g = parseInt(rgbMatch[2]).toString(16).padStart(2, '0');
        const b = parseInt(rgbMatch[3]).toString(16).padStart(2, '0');
        return `#${r}${g}${b}`;
    }
    
    // Try to parse RGB without parentheses
    rgbMatch = colorValue.match(/rgb\s*(\d+)\s*(\d+)\s*(\d+)/);
    if (rgbMatch) {
        const r = parseInt(rgbMatch[1]).toString(16).padStart(2, '0');
        const g = parseInt(rgbMatch[2]).toString(16).padStart(2, '0');
        const b = parseInt(rgbMatch[3]).toString(16).padStart(2, '0');
        return `#${r}${g}${b}`;
    }
    
    // Default fallback
    return '#000000';
}

/**
 * Detect property type from value
 * @param {any} value - The value to analyze
 * @returns {string} The detected type
 */
export function detectPropertyType(value) {
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    
    if (typeof value === 'string') {
        // Check for color values
        if (/^#[0-9A-F]{6}$/i.test(value) || 
            /^rgb\(/.test(value) || 
            /^(red|green|blue|yellow|orange|purple|black|white|gray|grey)$/i.test(value)) {
            return 'color';
        }
        
        // Check for numeric strings
        if (!isNaN(value) && !isNaN(parseFloat(value))) {
            return 'number';
        }
        
        // Check for boolean strings
        if (value === 'true' || value === 'false') {
            return 'boolean';
        }
    }
    
    return 'text';
}

/**
 * Parse component metadata from SVG element
 * @param {SVGElement} svgElement - The SVG element
 * @returns {Object} Parsed metadata object
 */
export function parseComponentMetadata(svgElement) {
    try {
        const metadataAttr = svgElement.getAttribute('data-metadata');
        if (metadataAttr) {
            return JSON.parse(metadataAttr);
        }
    } catch (error) {
        console.warn('Failed to parse component metadata:', error);
    }
    
    return {};
}

/**
 * Get component bounds from SVG element
 * @param {SVGElement} svgElement - The SVG element
 * @returns {Object} Bounds object with x, y, width, height
 */
export function getComponentBounds(svgElement) {
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

/**
 * Generate zoom level options for dropdown
 * @param {number} currentPercentage - Current zoom percentage
 * @returns {string} HTML options string
 */
export function generateZoomLevelOptions(currentPercentage) {
    const zoomLevels = [
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
    
    let options = '';
    zoomLevels.forEach(level => {
        const selected = Math.abs(level.percentage - currentPercentage) < 5 ? 'selected' : '';
        options += `<option value="${level.percentage}" ${selected}>${level.label}</option>`;
    });
    
    return options;
}

/**
 * Create value input by type
 * @param {string} sourceId - Source component ID
 * @param {number} interactionIndex - Interaction index
 * @param {string} type - Input type
 * @param {any} currentValue - Current value
 * @returns {string} HTML input string
 */
export function createValueInputByType(sourceId, interactionIndex, type, currentValue = '') {
    const inputId = `interaction-value-${sourceId}-${interactionIndex}`;
    
    switch (type) {
        case 'boolean':
            return `
                <select id="${inputId}" onchange="updateInteraction('${sourceId}', ${interactionIndex}, 'value', this.value)">
                    <option value="true" ${currentValue === 'true' || currentValue === true ? 'selected' : ''}>True</option>
                    <option value="false" ${currentValue === 'false' || currentValue === false ? 'selected' : ''}>False</option>
                </select>
            `;
            
        case 'number':
            return `
                <input type="number" id="${inputId}" value="${currentValue || 0}" 
                       onchange="updateInteraction('${sourceId}', ${interactionIndex}, 'value', this.value)"
                       style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 3px;">
            `;
            
        case 'color':
            const normalizedColor = normalizeColorValue(currentValue);
            return `
                <input type="color" id="${inputId}" value="${normalizedColor}"
                       onchange="updateInteraction('${sourceId}', ${interactionIndex}, 'value', this.value)"
                       style="width: 100%; height: 30px; padding: 0; border: 1px solid #ddd; border-radius: 3px;">
            `;
            
        case 'text':
        default:
            return `
                <input type="text" id="${inputId}" value="${currentValue || ''}"
                       onchange="updateInteraction('${sourceId}', ${interactionIndex}, 'value', this.value)"
                       style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 3px;">
            `;
    }
}
