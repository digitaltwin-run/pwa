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
            <div class="colors-section" style="margin-top: 15px; padding: 15px; background: linear-gradient(145deg, #f8f9fa, #e9ecef); border: 1px solid #dee2e6; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <h6 style="margin: 0 0 12px 0; color: #495057; font-weight: 600; font-size: 14px; display: flex; align-items: center; gap: 6px;">🎨 <span>Kolory</span></h6>
                
                <!-- Current Colors -->
                <div style="margin-bottom: 18px; background: #ffffff; padding: 12px; border-radius: 6px; border: 1px solid #e9ecef;">
                    <label style="display: block; margin-bottom: 8px; font-size: 13px; color: #495057; font-weight: 500;">Aktualne kolory:</label>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                        ${this.generateCurrentColorsDisplay(currentColors, svgElement)}
                    </div>
                </div>
                
                <!-- Color Presets -->
                <div style="margin-bottom: 18px; background: #ffffff; padding: 12px; border-radius: 6px; border: 1px solid #e9ecef;">
                    <label style="display: block; margin-bottom: 10px; font-size: 13px; color: #495057; font-weight: 500;">Szybkie kolory:</label>
                    <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px;">
                        ${this.generateColorPresets(svgElement)}
                    </div>
                </div>
                
                <!-- Custom Color Picker -->
                <div style="margin-bottom: 18px; background: #ffffff; padding: 12px; border-radius: 6px; border: 1px solid #e9ecef;">
                    <label style="display: block; margin-bottom: 10px; font-size: 13px; color: #495057; font-weight: 500;">Własny kolor:</label>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <input type="color" id="custom-color-${svgElement.id || 'element'}" 
                               value="#ff0000"
                               style="width: 50px; height: 35px; padding: 0; border: 2px solid #dee2e6; border-radius: 6px; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <button onclick="window.colorsManager?.applyCustomColor('${svgElement.id || 'element'}')"
                                style="padding: 8px 16px; background: linear-gradient(145deg, #007bff, #0056b3); color: white; border: none; border-radius: 6px; font-size: 12px; font-weight: 500; cursor: pointer; box-shadow: 0 2px 4px rgba(0,123,255,0.3); transition: all 0.2s ease;">
                            Zastosuj
                        </button>
                    </div>
                </div>
                
                <!-- Advanced Color Properties -->
                <div style="background: #ffffff; padding: 12px; border-radius: 6px; border: 1px solid #e9ecef; margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 12px; font-size: 13px; color: #495057; font-weight: 500;">Zaawansowane ustawienia:</label>
                    
                    <!-- Fill Color -->
                    <div style="margin-bottom: 12px; padding: 8px; background: #f8f9fa; border-radius: 4px; display: flex; align-items: center; justify-content: space-between;">
                        <span style="font-size: 12px; color: #495057; font-weight: 500;">Wypełnienie:</span>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <input type="color" value="${currentColors.fill || '#000000'}"
                                   onchange="window.colorsManager?.updateElementColor('${svgElement.id}', 'fill', this.value)"
                                   style="width: 35px; height: 25px; border: 2px solid #dee2e6; border-radius: 4px; cursor: pointer;">
                            <span style="font-size: 11px; color: #6c757d; font-family: monospace; background: #ffffff; padding: 2px 6px; border-radius: 3px; border: 1px solid #dee2e6;">${currentColors.fill || 'brak'}</span>
                        </div>
                    </div>
                    
                    <!-- Stroke Color -->
                    <div style="margin-bottom: 12px; padding: 8px; background: #f8f9fa; border-radius: 4px; display: flex; align-items: center; justify-content: space-between;">
                        <span style="font-size: 12px; color: #495057; font-weight: 500;">Obramowanie:</span>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <input type="color" value="${currentColors.stroke || '#000000'}"
                                   onchange="window.colorsManager?.updateElementColor('${svgElement.id}', 'stroke', this.value)"
                                   style="width: 35px; height: 25px; border: 2px solid #dee2e6; border-radius: 4px; cursor: pointer;">
                            <span style="font-size: 11px; color: #6c757d; font-family: monospace; background: #ffffff; padding: 2px 6px; border-radius: 3px; border: 1px solid #dee2e6;">${currentColors.stroke || 'brak'}</span>
                        </div>
                    </div>
                    
                    <!-- Opacity -->
                    <div style="margin-bottom: 0; padding: 8px; background: #f8f9fa; border-radius: 4px; display: flex; align-items: center; justify-content: space-between;">
                        <span style="font-size: 12px; color: #495057; font-weight: 500;">Przezroczystość:</span>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <input type="range" min="0" max="1" step="0.1" 
                                   value="${currentColors.opacity || 1}"
                                   onchange="window.colorsManager?.updateElementOpacity('${svgElement.id}', this.value)"
                                   style="width: 80px; accent-color: #007bff;">
                            <span style="font-size: 11px; color: #6c757d; font-family: monospace; background: #ffffff; padding: 2px 6px; border-radius: 3px; border: 1px solid #dee2e6; min-width: 35px; text-align: center;">${Math.round((currentColors.opacity || 1) * 100)}%</span>
                        </div>
                    </div>
                </div>
                
                <!-- Reset Button -->
                <div style="margin-top: 0;">
                    <button onclick="window.colorsManager?.resetElementColors('${svgElement.id}')"
                            style="width: 100%; padding: 10px; background: linear-gradient(145deg, #6c757d, #5a6268); color: white; border: none; border-radius: 6px; font-size: 12px; font-weight: 500; cursor: pointer; box-shadow: 0 2px 4px rgba(108,117,125,0.3); transition: all 0.2s ease; display: flex; align-items: center; justify-content: center; gap: 6px;">
                        🔄 <span>Resetuj kolory</span>
                    </button>
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
