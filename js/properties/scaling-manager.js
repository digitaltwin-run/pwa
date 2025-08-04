/**
 * Component Scaling Manager - Handles component zoom and scale operations
 */

import { generateZoomLevelOptions, getComponentBounds } from '../utils/property-utils.js';

export class ScalingManager {
    constructor() {
        this.zoomLevels = [
            { value: 0.5, label: '50%', percentage: 50 },
            { value: 1.0, label: '100% (Original)', percentage: 100 },
            { value: 1.5, label: '150%', percentage: 150 },
            { value: 2.0, label: '200%', percentage: 200 },
            { value: 2.5, label: '250%', percentage: 250 },
            { value: 3.0, label: '300%', percentage: 300 },
            { value: 3.5, label: '350%', percentage: 350 },
            { value: 4.0, label: '400%', percentage: 400 },
            { value: 4.5, label: '450%', percentage: 450 },
            { value: 5.0, label: '500%', percentage: 500 },
            { value: 5.5, label: '550%', percentage: 550 },
            { value: 6.0, label: '600% (Max)', percentage: 600 }
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
            <div class="scale-section" style="margin-top: 15px; padding: 15px; background: linear-gradient(145deg, #f8f9fa, #e9ecef); border: 1px solid #dee2e6; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <h6 style="margin: 0 0 12px 0; color: #495057; font-weight: 600; font-size: 14px; display: flex; align-items: center; gap: 6px;">🔍 <span>Skalowanie i powiększenie</span></h6>
                
                <!-- Quick Scale Buttons -->
                <div style="margin-bottom: 18px; background: #ffffff; padding: 12px; border-radius: 6px; border: 1px solid #e9ecef;">
                    <label style="display: block; margin-bottom: 10px; font-size: 13px; color: #495057; font-weight: 500;">Szybkie skalowanie:</label>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
                        <button onclick="window.componentScaler?.scaleComponent('${componentData.id}', 0.5)" 
                                style="padding: 8px 12px; font-size: 12px; font-weight: 500; border: 2px solid #dee2e6; background: linear-gradient(145deg, #ffffff, #f8f9fa); border-radius: 6px; cursor: pointer; transition: all 0.2s ease; color: #495057;">
                            50%
                        </button>
                        <button onclick="window.componentScaler?.scaleComponent('${componentData.id}', 1.0)" 
                                style="padding: 8px 12px; font-size: 12px; font-weight: 500; border: 2px solid #007bff; background: linear-gradient(145deg, #007bff, #0056b3); border-radius: 6px; cursor: pointer; transition: all 0.2s ease; color: white; box-shadow: 0 2px 4px rgba(0,123,255,0.3);">
                            100%
                        </button>
                        <button onclick="window.componentScaler?.scaleComponent('${componentData.id}', 2.0)" 
                                style="padding: 8px 12px; font-size: 12px; font-weight: 500; border: 2px solid #dee2e6; background: linear-gradient(145deg, #ffffff, #f8f9fa); border-radius: 6px; cursor: pointer; transition: all 0.2s ease; color: #495057;">
                            200%
                        </button>
                        <button onclick="window.componentScaler?.scaleComponent('${componentData.id}', 3.0)" 
                                style="padding: 8px 12px; font-size: 12px; font-weight: 500; border: 2px solid #dee2e6; background: linear-gradient(145deg, #ffffff, #f8f9fa); border-radius: 6px; cursor: pointer; transition: all 0.2s ease; color: #495057;">
                            300%
                        </button>
                        <button onclick="window.componentScaler?.scaleComponent('${componentData.id}', 4.0)" 
                                style="padding: 8px 12px; font-size: 12px; font-weight: 500; border: 2px solid #dee2e6; background: linear-gradient(145deg, #ffffff, #f8f9fa); border-radius: 6px; cursor: pointer; transition: all 0.2s ease; color: #495057;">
                            400%
                        </button>
                        <button onclick="window.componentScaler?.scaleComponent('${componentData.id}', 6.0)" 
                                style="padding: 8px 12px; font-size: 12px; font-weight: 500; border: 2px solid #dc3545; background: linear-gradient(145deg, #dc3545, #c82333); border-radius: 6px; cursor: pointer; transition: all 0.2s ease; color: white; box-shadow: 0 2px 4px rgba(220,53,69,0.3);">
                            600%
                        </button>
                    </div>
                </div>
                
                <!-- Scale Dropdown -->
                <div style="margin-bottom: 18px; background: #ffffff; padding: 12px; border-radius: 6px; border: 1px solid #e9ecef;">
                    <label style="display: block; margin-bottom: 10px; font-size: 13px; color: #495057; font-weight: 500;">Precyzyjne skalowanie:</label>
                    <select onchange="window.componentScaler?.scaleComponent('${componentData.id}', this.value / 100)"
                            style="width: 100%; padding: 8px 12px; border: 2px solid #dee2e6; border-radius: 6px; font-size: 12px; background: #ffffff; color: #495057; cursor: pointer;">
                        ${generateZoomLevelOptions(scaleInfo.percentage)}
                    </select>
                </div>
                
                <!-- Current Scale Info -->
                <div style="margin-bottom: 18px; background: #ffffff; padding: 12px; border-radius: 6px; border: 1px solid #e9ecef;">
                    <label style="display: block; margin-bottom: 10px; font-size: 13px; color: #495057; font-weight: 500;" data-i18n="properties.currentScale">Aktualne skalowanie:</label>
                    <div style="font-size: 12px; color: #495057; background: #f8f9fa; padding: 8px; border-radius: 4px; font-family: monospace; text-align: center; border: 1px solid #e9ecef;">
                        📏 ${scaleInfo.displayText}
                    </div>
                </div>
                
                <!-- Dimensions Info -->
                <div style="margin-bottom: 18px; background: #ffffff; padding: 12px; border-radius: 6px; border: 1px solid #e9ecef;">
                    <label style="display: block; margin-bottom: 10px; font-size: 13px; color: #495057; font-weight: 500;">Wymiary komponentu:</label>
                    <div style="font-size: 11px; color: #6c757d; background: #f8f9fa; padding: 8px; border-radius: 4px; border: 1px solid #e9ecef; line-height: 1.4;">
                        📐 <strong>Oryginał:</strong> ${bounds.width.toFixed(0)}×${bounds.height.toFixed(0)}px<br>
                        📐 <strong>Przeskalowany:</strong> ${scaleInfo.scaledDimensions}<br>
                        📍 <strong>Pozycja:</strong> (${bounds.x.toFixed(0)}, ${bounds.y.toFixed(0)})
                    </div>
                </div>
                
                <!-- Reset Button -->
                <div style="margin-bottom: 15px;">
                    <button onclick="window.componentScaler?.resetComponentScale('${componentData.id}')"
                            style="width: 100%; padding: 10px; background: linear-gradient(145deg, #6c757d, #5a6268); color: white; border: none; border-radius: 6px; font-size: 12px; font-weight: 500; cursor: pointer; box-shadow: 0 2px 4px rgba(108,117,125,0.3); transition: all 0.2s ease; display: flex; align-items: center; justify-content: center; gap: 6px;">
                        🔄 <span>Resetuj do oryginalnego rozmiaru</span>
                    </button>
                </div>
                
                <!-- Technical Info -->
                <div style="background: #ffffff; padding: 12px; border-radius: 6px; border: 1px solid #e9ecef;">
                    <label style="display: block; margin-bottom: 8px; font-size: 13px; color: #495057; font-weight: 500;">Informacje techniczne:</label>
                    <div style="font-size: 11px; color: #6c757d; background: #f8f9fa; padding: 8px; border-radius: 4px; border: 1px solid #e9ecef; line-height: 1.4; font-family: monospace;">
                        💡 <strong>Współczynnik skalowania:</strong> ${scaleInfo.scale.toFixed(2)}x<br>
                        🔧 <strong>Transform SVG:</strong> scale(${scaleInfo.scale.toFixed(2)})
                    </div>
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
