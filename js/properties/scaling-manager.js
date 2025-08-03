/**
 * Component Scaling Manager - Handles component zoom and scale operations
 */

import { generateZoomLevelOptions, getComponentBounds } from '../utils/property-utils.js';

export class ScalingManager {
    constructor() {
        this.zoomLevels = [
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

    /**
     * Generate component scale section HTML
     * @param {Object} componentData - Component data object
     * @returns {string} HTML string for scale section
     */
    generateComponentScaleSection(componentData) {
        if (!componentData || !componentData.element) return '';
        
        const scaleInfo = this.getComponentScaleInfo(componentData.element);
        const bounds = getComponentBounds(componentData.element);
        
        return `
            <div class="scale-section" style="margin-top: 15px; padding: 10px; border: 1px solid #e0e0e0; border-radius: 4px;">
                <h6 style="margin: 0 0 10px 0; color: #333;">🔍 Zoom & Scale</h6>
                
                <!-- Quick Scale Buttons -->
                <div style="margin-bottom: 10px;">
                    <label style="display: block; margin-bottom: 4px; font-size: 12px; color: #666;">Quick Scale:</label>
                    <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                        <button onclick="window.componentScaler?.scaleComponent('${componentData.id}', 0.5)" 
                                style="padding: 4px 8px; font-size: 11px; border: 1px solid #ddd; background: #f8f9fa; border-radius: 3px; cursor: pointer;">
                            50%
                        </button>
                        <button onclick="window.componentScaler?.scaleComponent('${componentData.id}', 1.0)" 
                                style="padding: 4px 8px; font-size: 11px; border: 1px solid #ddd; background: #f8f9fa; border-radius: 3px; cursor: pointer;">
                            100%
                        </button>
                        <button onclick="window.componentScaler?.scaleComponent('${componentData.id}', 1.5)" 
                                style="padding: 4px 8px; font-size: 11px; border: 1px solid #ddd; background: #f8f9fa; border-radius: 3px; cursor: pointer;">
                            150%
                        </button>
                        <button onclick="window.componentScaler?.scaleComponent('${componentData.id}', 2.0)" 
                                style="padding: 4px 8px; font-size: 11px; border: 1px solid #ddd; background: #f8f9fa; border-radius: 3px; cursor: pointer;">
                            200%
                        </button>
                    </div>
                </div>
                
                <!-- Scale Dropdown -->
                <div style="margin-bottom: 10px;">
                    <label style="display: block; margin-bottom: 4px; font-size: 12px; color: #666;">Precise Scale:</label>
                    <select onchange="window.componentScaler?.scaleComponent('${componentData.id}', this.value / 100)"
                            style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 3px; font-size: 12px;">
                        ${generateZoomLevelOptions(scaleInfo.percentage)}
                    </select>
                </div>
                
                <!-- Current Scale Info -->
                <div style="margin-bottom: 10px;">
                    <label style="display: block; margin-bottom: 4px; font-size: 12px; color: #666;">Current Scale:</label>
                    <div style="font-size: 11px; color: #555; background: #f8f9fa; padding: 4px; border-radius: 3px;">
                        📏 ${scaleInfo.displayText}
                    </div>
                </div>
                
                <!-- Dimensions Info -->
                <div style="margin-bottom: 10px;">
                    <label style="display: block; margin-bottom: 4px; font-size: 12px; color: #666;">Dimensions:</label>
                    <div style="font-size: 11px; color: #555; background: #f8f9fa; padding: 4px; border-radius: 3px;">
                        📐 Original: ${bounds.width.toFixed(0)}×${bounds.height.toFixed(0)}px<br>
                        📐 Scaled: ${scaleInfo.scaledDimensions}<br>
                        📍 Position: (${bounds.x.toFixed(0)}, ${bounds.y.toFixed(0)})
                    </div>
                </div>
                
                <!-- Reset Button -->
                <div style="margin-top: 10px;">
                    <button onclick="window.componentScaler?.resetComponentScale('${componentData.id}')"
                            style="width: 100%; padding: 6px; background: #6c757d; color: white; border: none; border-radius: 3px; font-size: 12px; cursor: pointer;">
                        🔄 Reset to Original Size
                    </button>
                </div>
                
                <!-- Technical Info -->
                <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #e0e0e0;">
                    <small style="color: #666; font-size: 10px;">
                        💡 Scale Factor: ${scaleInfo.scale.toFixed(2)}x<br>
                        SVG transform: scale(${scaleInfo.scale.toFixed(2)})
                    </small>
                </div>
            </div>
        `;
    }

    /**
     * Get component scale information
     * @param {SVGElement} svgElement - The SVG element
     * @returns {Object} Scale information object
     */
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

    /**
     * Get available zoom levels
     * @returns {Array} Array of zoom level objects
     */
    getZoomLevels() {
        return this.zoomLevels;
    }
}
