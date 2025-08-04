/**
 * Colors Manager - Handles color-related properties and operations
 */

import { normalizeColorValue } from '../utils/property-utils.js';

export class ColorsManager {
    constructor() {
        this.colorPresets = [
            { name: 'Red', value: '#ff0000' },
            { name: 'Green', value: '#008000' },
            { name: 'Blue', value: '#0000ff' },
            { name: 'Yellow', value: '#ffff00' },
            { name: 'Orange', value: '#ffa500' },
            { name: 'Purple', value: '#800080' },
            { name: 'Pink', value: '#ffc0cb' },
            { name: 'Cyan', value: '#00ffff' },
            { name: 'Magenta', value: '#ff00ff' },
            { name: 'Lime', value: '#00ff00' },
            { name: 'Black', value: '#000000' },
            { name: 'White', value: '#ffffff' },
            { name: 'Gray', value: '#808080' },
            { name: 'Light Gray', value: '#d3d3d3' },
            { name: 'Dark Gray', value: '#404040' }
        ];
    }

    /**
     * Generate colors section HTML for component properties
     * @param {SVGElement} svgElement - The SVG element
     * @returns {string} HTML string for colors section
     */
    generateColorsSection(svgElement) {
        if (!svgElement) return '';

        const currentColors = this.extractColorsFromElement(svgElement);
        
        return `
            <div class="property-group" style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 8px; font-size: 13px; color: #495057; font-weight: 500;" data-i18n="properties.fill">Kolor:</label>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <input type="color" value="${currentColors.fill || '#000000'}"
                           onchange="window.colorsManager?.updateElementColor('${svgElement.id}', 'fill', this.value)"
                           style="width: 40px; height: 30px; border: 2px solid #dee2e6; border-radius: 4px; cursor: pointer; padding: 0;">
                    <span style="font-size: 12px; color: #6c757d; font-family: monospace; background: #f8f9fa; padding: 4px 8px; border-radius: 3px; border: 1px solid #dee2e6;">${currentColors.fill || 'brak'}</span>
                </div>
            </div>
        `;
    }

    /**
     * Extract colors from SVG element
     * @param {SVGElement} svgElement - The SVG element
     * @returns {Object} Object containing color properties
     */
    extractColorsFromElement(svgElement) {
        const computedStyle = window.getComputedStyle(svgElement);
        
        return {
            fill: svgElement.getAttribute('fill') || computedStyle.fill || null,
            stroke: svgElement.getAttribute('stroke') || computedStyle.stroke || null,
            opacity: svgElement.getAttribute('opacity') || computedStyle.opacity || 1,
            stopColor: svgElement.getAttribute('stop-color') || null
        };
    }

    /**
     * Generate current colors display
     * @param {Object} colors - Current color object
     * @param {SVGElement} svgElement - The SVG element
     * @returns {string} HTML for current colors display
     */
    generateCurrentColorsDisplay(colors, svgElement) {
        let html = '';
        
        if (colors.fill && colors.fill !== 'none') {
            const normalizedFill = normalizeColorValue(colors.fill);
            html += `
                <div style="display: flex; align-items: center; background: #f8f9fa; padding: 4px 6px; border-radius: 3px; font-size: 10px;">
                    <div style="width: 16px; height: 16px; background: ${normalizedFill}; border: 1px solid #ddd; border-radius: 2px; margin-right: 4px;"></div>
                    <span>Fill: ${normalizedFill}</span>
                </div>
            `;
        }
        
        if (colors.stroke && colors.stroke !== 'none') {
            const normalizedStroke = normalizeColorValue(colors.stroke);
            html += `
                <div style="display: flex; align-items: center; background: #f8f9fa; padding: 4px 6px; border-radius: 3px; font-size: 10px;">
                    <div style="width: 16px; height: 16px; background: ${normalizedStroke}; border: 1px solid #ddd; border-radius: 2px; margin-right: 4px;"></div>
                    <span>Stroke: ${normalizedStroke}</span>
                </div>
            `;
        }
        
        if (!html) {
            html = '<span style="font-size: 10px; color: #666; font-style: italic;">No colors detected</span>';
        }
        
        return html;
    }

    /**
     * Generate color presets HTML
     * @param {SVGElement} svgElement - The SVG element
     * @returns {string} HTML for color presets
     */
    generateColorPresets(svgElement) {
        return this.colorPresets.map(preset => `
            <button onclick="window.colorsManager?.applyPresetColor('${svgElement.id}', '${preset.value}')"
                    style="width: 100%; height: 25px; background: ${preset.value}; border: 1px solid #ddd; border-radius: 2px; cursor: pointer; position: relative;"
                    title="${preset.name} (${preset.value})">
            </button>
        `).join('');
    }

    /**
     * Apply preset color to element
     * @param {string} elementId - Element ID
     * @param {string} colorValue - Color value to apply
     */
    applyPresetColor(elementId, colorValue) {
        const element = document.getElementById(elementId);
        if (element) {
            this.updateElementColor(elementId, 'fill', colorValue);
        }
    }

    /**
     * Apply custom color to element
     * @param {string} elementId - Element ID
     */
    applyCustomColor(elementId) {
        const colorInput = document.getElementById(`custom-color-${elementId}`);
        if (colorInput) {
            this.updateElementColor(elementId, 'fill', colorInput.value);
        }
    }

    /**
     * Update element color property
     * @param {string} elementId - Element ID
     * @param {string} property - Color property (fill, stroke, etc.)
     * @param {string} value - Color value
     */
    updateElementColor(elementId, property, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.setAttribute(property, value);
            
            // Trigger change event for property updates
            const event = new CustomEvent('colorChanged', {
                detail: { elementId, property, value }
            });
            document.dispatchEvent(event);
            
            console.log(`🎨 Updated ${property} to ${value} for element ${elementId}`);
        }
    }

    /**
     * Update element opacity
     * @param {string} elementId - Element ID
     * @param {number} opacity - Opacity value (0-1)
     */
    updateElementOpacity(elementId, opacity) {
        const element = document.getElementById(elementId);
        if (element) {
            element.setAttribute('opacity', opacity);
            console.log(`🎨 Updated opacity to ${opacity} for element ${elementId}`);
        }
    }

    /**
     * Reset element colors to defaults
     * @param {string} elementId - Element ID
     */
    resetElementColors(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.removeAttribute('fill');
            element.removeAttribute('stroke');
            element.removeAttribute('opacity');
            console.log(`🎨 Reset colors for element ${elementId}`);
            
            // Refresh the properties panel if available
            if (window.propertiesManager) {
                window.propertiesManager.refreshPropertiesPanel();
            }
        }
    }

    /**
     * Get color presets
     * @returns {Array} Array of color preset objects
     */
    getColorPresets() {
        return this.colorPresets;
    }
}
