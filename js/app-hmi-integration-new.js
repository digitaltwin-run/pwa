/**
 * COMPREHENSIVE HMI INTEGRATION
 * Uses the advanced HMI system from js/hmi/ folder with 15+ gesture patterns
 */

import { createHMI } from './hmi/index.js';
import { setupDigitalTwinGestures } from './digital-twin-gestures.js';

/**
 * Integration function that connects the new Simple HMI system with the main app
 */
export async function integrateHMIWithApp(appInstance) {
    console.info('🔄 Integrating NEW simplified HMI system with main application...');
    
    try {
        // Create the new HMI system
        const hmi = createHMI(document.getElementById('svg-canvas'), {
            debug: true,
            voice: false  // Start with voice disabled, can be enabled later
        });

        // Set up gesture patterns for the Digital Twin IDE
        setupDigitalTwinGestures(hmi, appInstance);
        
        // Set up voice commands if available
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            setupVoiceCommands(hmi, appInstance);
        }

        // Expose globally for debugging
        window.hmi = hmi;
        
        console.info('✅ NEW simplified HMI integration complete!');
        console.info('🎮 Available gestures:');
        console.info('  • Circle = Delete selected components');
        console.info('  • Swipe Right = Save project');
        console.info('  • Swipe Left = Undo action');
        console.info('  • Zigzag = Show component properties');
        console.info('🎤 Voice commands (if enabled):');
        console.info('  • "zapisz" / "save" = Save project');
        console.info('  • "usuń" / "delete" = Delete selection');
        console.info('  • "właściwości" / "properties" = Show properties');
        
        return hmi;
    } catch (error) {
        console.error('❌ Failed to integrate HMI system:', error);
        throw error;
    }
}

/**

    console.info('✅ Comprehensive gesture patterns configured:');
    console.info('   🗑️  Delete: Circle, Double-tap');
    console.info('   💾  File: Save (→), Export (↓)');
    console.info('   ↩️  History: Undo (←), Redo (↑)');
    console.info('   🔧  Components: Properties (zigzag), Copy (line), Scale (spiral)');
    console.info('   🎯  Selection: Select all (large circle), Clear (small circle)');
    console.info('   ⊞  Canvas: Grid toggle (cross), Zoom (pinch)');
    console.info('   🔗  Advanced: Quick delete (spiral+circle), Connect (diagonal line)');
}

/**
 * Set up voice commands for Digital Twin IDE
 */
function setupVoiceCommands(hmi, appInstance) {
    // Save command
    hmi.voice('save', /(?:zapisz|save)/i)
        .on((data) => {
            console.log('🎤 Voice save command:', data.transcript);
            executeSave(appInstance);
        })
        .speak('Zapisuję projekt');

    // Delete command
    hmi.voice('delete', /(?:usuń|delete)/i)
        .on((data) => {
            console.log('🎤 Voice delete command:', data.transcript);
            if (hasSelectedComponents(appInstance)) {
                executeDelete(appInstance);
            } else {
                hmi.voiceHMI.speak('Nie ma zaznaczonych komponentów');
            }
        });

    // Properties command
    hmi.voice('properties', /(?:właściwości|properties)/i)
        .on((data) => {
            console.log('🎤 Voice properties command:', data.transcript);
            showProperties(appInstance);
        })
        .speak('Pokazuję właściwości');

    // Help command
    hmi.voice('help', /(?:pomoc|help)/i)
        .on((data) => {
            console.log('🎤 Voice help command:', data.transcript);
            showGestureHelp();
        })
        .speak('Dostępne gesty: okrąg aby usunąć, przeciągnij w prawo aby zapisać, zygzak aby pokazać właściwości');

    // Start voice recognition
    hmi.voiceHMI.startListening();
    console.info('🎤 Voice commands enabled');
}

/**
 * Helper functions for checking app state and executing actions
 */
export function hasSelectedComponents(appInstance) {
    // Check if any components are currently selected
    return appInstance && 
           appInstance.canvasSelectionManager && 
           appInstance.canvasSelectionManager.selectedComponents && 
           appInstance.canvasSelectionManager.selectedComponents.size > 0;
}

// === DELETE OPERATIONS ===
export function executeDelete(appInstance, force = false) {
    if (!appInstance) return;
    
    try {
        if (appInstance.actionManager) {
            appInstance.actionManager.executeAction('deleteSelected');
        } else if (appInstance.canvasSelectionManager) {
            // Fallback: direct deletion
            const selected = Array.from(appInstance.canvasSelectionManager.selectedComponents);
            selected.forEach(element => {
                if (element && element.parentNode) {
                    element.parentNode.removeChild(element);
                }
            });
            appInstance.canvasSelectionManager.clearSelection();
        }
        
        // Show notification
        showNotification('🗑️ Usunięto komponenty', 'success');
    } catch (error) {
        console.error('Delete operation failed:', error);
        showNotification('❌ Błąd podczas usuwania', 'error');
    }
}

// === FILE OPERATIONS ===
export function executeSave(appInstance) {
    if (!appInstance) return;
    
    try {
        if (appInstance.actionManager) {
            appInstance.actionManager.executeAction('save');
        } else {
            // Fallback: trigger save event
            document.dispatchEvent(new CustomEvent('project-save'));
        }
        
        showNotification('💾 Projekt zapisany', 'success');
    } catch (error) {
        console.error('Save operation failed:', error);
        showNotification('❌ Błąd podczas zapisywania', 'error');
    }
}

export function executeUndo(appInstance) {
    if (!appInstance) return;
    
    try {
        if (appInstance.actionManager) {
            appInstance.actionManager.executeAction('undo');
        } else {
            // Fallback: trigger undo event
            document.dispatchEvent(new CustomEvent('action-undo'));
        }
        
        showNotification('↩️ Cofnięto akcję', 'info');
    } catch (error) {
        console.error('Undo operation failed:', error);
        showNotification('❌ Błąd podczas cofania', 'error');
    }
}

export function executeRedo(appInstance) {
    if (!appInstance) return;
    
    try {
        if (appInstance.actionManager) {
            appInstance.actionManager.executeAction('redo');
        } else {
            // Fallback: trigger redo event
            document.dispatchEvent(new CustomEvent('action-redo'));
        }
        
        showNotification('↪️ Powtórzono akcję', 'info');
    } catch (error) {
        console.error('Redo operation failed:', error);
        showNotification('❌ Błąd podczas powtarzania', 'error');
    }
}

export function executeExport(appInstance) {
    if (!appInstance) return;
    
    try {
        if (appInstance.exportManager) {
            appInstance.exportManager.exportProject();
        } else if (appInstance.actionManager) {
            appInstance.actionManager.executeAction('export');
        } else {
            // Fallback: trigger export event
            document.dispatchEvent(new CustomEvent('project-export'));
        }
        
        showNotification('📤 Eksport rozpoczęty', 'info');
    } catch (error) {
        console.error('Export operation failed:', error);
        showNotification('❌ Błąd podczas eksportu', 'error');
    }
}

export function executeCopy(appInstance) {
    if (!appInstance || !hasSelectedComponents(appInstance)) return;
    
    try {
        if (appInstance.actionManager) {
            appInstance.actionManager.executeAction('copy');
        } else {
            // Fallback: copy selected elements
            const selected = Array.from(appInstance.canvasSelectionManager.selectedComponents);
            const copiedData = selected.map(el => el.outerHTML);
            window.copiedElements = copiedData;
        }
        
        showNotification('📋 Skopiowano komponenty', 'success');
    } catch (error) {
        console.error('Copy operation failed:', error);
        showNotification('❌ Błąd podczas kopiowania', 'error');
    }
}

export function executeScale(appInstance, scaleFactor = 1.0) {
    if (!appInstance || !hasSelectedComponents(appInstance)) return;
    
    try {
        const selected = Array.from(appInstance.canvasSelectionManager.selectedComponents);
        
        selected.forEach(element => {
            const currentTransform = element.getAttribute('transform') || '';
            const scaleMatch = currentTransform.match(/scale\(([^)]+)\)/);
            const currentScale = scaleMatch ? parseFloat(scaleMatch[1]) : 1.0;
            const newScale = Math.max(0.1, Math.min(5.0, currentScale * scaleFactor));
            
            // Apply new scale
            const newTransform = currentTransform.replace(/scale\([^)]+\)/, '') + ` scale(${newScale})`;
            element.setAttribute('transform', newTransform.trim());
        });
        
        const action = scaleFactor > 1 ? 'Powiększono' : 'Zmniejszono';
        showNotification(`🔄 ${action} komponenty`, 'success');
    } catch (error) {
        console.error('Scale operation failed:', error);
        showNotification('❌ Błąd podczas skalowania', 'error');
    }
}

export function executeSelectAll(appInstance) {
    if (!appInstance) return;
    
    try {
        if (appInstance.canvasSelectionManager) {
            const allElements = document.querySelectorAll('#canvas g[data-component-type]');
            allElements.forEach(element => {
                appInstance.canvasSelectionManager.addToSelection(element);
            });
        }
        
        showNotification('🎯 Zaznaczono wszystkie komponenty', 'info');
    } catch (error) {
        console.error('Select all failed:', error);
        showNotification('❌ Błąd zaznaczania', 'error');
    }
}

export function executeClearSelection(appInstance) {
    if (!appInstance) return;
    
    try {
        if (appInstance.canvasSelectionManager) {
            appInstance.canvasSelectionManager.clearSelection();
        }
        
        showNotification('🚫 Wyczyszczono zaznaczenie', 'info');
    } catch (error) {
        console.error('Clear selection failed:', error);
        showNotification('❌ Błąd czyszczenia zaznaczenia', 'error');
    }
}

export function executeToggleGrid(appInstance) {
    if (!appInstance) return;
    
    try {
        if (appInstance.canvasPropertiesManager) {
            appInstance.canvasPropertiesManager.toggleGrid();
        } else {
            // Fallback: toggle grid visibility
            const grid = document.querySelector('#canvas defs pattern, #canvas .grid');
            if (grid) {
                const isVisible = grid.style.display !== 'none';
                grid.style.display = isVisible ? 'none' : 'block';
            }
        }
        
        showNotification('⊞ Przełączono siatkę', 'info');
    } catch (error) {
        console.error('Toggle grid failed:', error);
        showNotification('❌ Błąd przełączania siatki', 'error');
    }
}

export function executeZoom(appInstance, scaleFactor) {
    if (!appInstance) return;
    
    try {
        if (appInstance.canvasPropertiesManager) {
            const currentZoom = appInstance.canvasPropertiesManager.zoomLevel || 1.0;
            const newZoom = Math.max(0.1, Math.min(5.0, currentZoom * scaleFactor));
            appInstance.canvasPropertiesManager.setZoom(newZoom);
        } else {
            // Fallback: apply zoom to canvas transform
            const canvas = document.querySelector('#canvas');
            if (canvas) {
                const currentTransform = canvas.getAttribute('transform') || '';
                const scaleMatch = currentTransform.match(/scale\(([^)]+)\)/);
                const currentScale = scaleMatch ? parseFloat(scaleMatch[1]) : 1.0;
                const newScale = Math.max(0.1, Math.min(5.0, currentScale * scaleFactor));
                
                const newTransform = currentTransform.replace(/scale\([^)]+\)/, '') + ` scale(${newScale})`;
                canvas.setAttribute('transform', newTransform.trim());
            }
        }
        
        const action = scaleFactor > 1 ? 'Powiększono' : 'Zmniejszono';
        showNotification(`🔍 ${action} widok`, 'info');
    } catch (error) {
        console.error('Zoom operation failed:', error);
        showNotification('❌ Błąd zmiany powiększenia', 'error');
    }
}

export function executeStartConnection(appInstance, points) {
    if (!appInstance || !hasSelectedComponents(appInstance)) return;
    
    try {
        // This would start connection mode between selected components
        if (appInstance.connectionManager) {
            appInstance.connectionManager.startConnectionMode(points);
        } else {
            // Fallback: dispatch connection event
            document.dispatchEvent(new CustomEvent('start-connection', { 
                detail: { points } 
            }));
        }
        
        showNotification('🔗 Tryb połączeń aktywny', 'info');
    } catch (error) {
        console.error('Start connection failed:', error);
        showNotification('❌ Błąd trybu połączeń', 'error');
    }
}

/**
 * Execute component selection from a tap gesture
 * @param {Object} appInstance - The Digital Twin app instance
 * @param {Object} point - The tap point coordinates
 */
export function executeSelectComponent(appInstance, point) {
    if (!appInstance) {
        console.error('❌ App instance not available for component selection');
        return;
    }
    
    try {
        const component = getElementAtPoint(appInstance, point);
        if (!component) {
            console.log('🔍 No component found at tap coordinates');
            return;
        }
        
        // Use canvas selection manager if available
        if (appInstance.canvasSelectionManager) {
            const ctrlKey = false; // Default to replacing selection, not adding to it
            appInstance.canvasSelectionManager.selectComponent(component, ctrlKey);
            showNotification(`🎯 Zaznaczono: ${getComponentName(component)}`, 'success');
        } else {
            // Fallback: toggle selection class manually
            const isSelected = component.classList.contains('selected');
            
            // Clear other selections if not using multiselect
            document.querySelectorAll('.selected').forEach(el => {
                if (el !== component) el.classList.remove('selected');
            });
            
            // Toggle selection on this component
            if (isSelected) {
                component.classList.remove('selected');
            } else {
                component.classList.add('selected');
                showNotification(`🎯 Zaznaczono komponent`, 'success');
            }
            
            // Dispatch event for other modules
            document.dispatchEvent(new CustomEvent('component-selected', { 
                detail: { component } 
            }));
        }
    } catch (error) {
        console.error('Component selection failed:', error);
        showNotification('❌ Błąd zaznaczania komponentu', 'error');
    }
}

/**
 * Execute path selection of components
 * @param {Object} appInstance - The Digital Twin app instance
 * @param {Array} points - Array of points defining the path
 */
export function executePathSelection(appInstance, points) {
    if (!appInstance || !points || points.length < 3) return;
    
    try {
        const components = getAllComponents(appInstance);
        const selectedComponents = [];
        
        // Create a buffer around the path (distance threshold for component to be considered along path)
        const pathThreshold = 15; // pixels
        
        // Check each component's bounding box against the path
        components.forEach(component => {
            // Get component center point
            const bbox = component.getBBox();
            const centerX = bbox.x + bbox.width / 2;
            const centerY = bbox.y + bbox.height / 2;
            
            // Check if component center is close to any path segment
            for (let i = 1; i < points.length; i++) {
                const p1 = points[i-1];
                const p2 = points[i];
                
                // Distance from point to line segment
                const distance = distanceToLineSegment(centerX, centerY, p1.x, p1.y, p2.x, p2.y);
                if (distance <= pathThreshold) {
                    selectedComponents.push(component);
                    break;
                }
            }
        });
        
        // Apply selection using canvas selection manager if available
        if (appInstance.canvasSelectionManager && selectedComponents.length > 0) {
            appInstance.canvasSelectionManager.selectComponents(selectedComponents, false);
            showNotification(`🔍 Zaznaczono: ${selectedComponents.length} komponentów`, 'success');
        } else {
            // Fallback: add selected class manually
            document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
            selectedComponents.forEach(component => component.classList.add('selected'));
            
            // Dispatch event
            if (selectedComponents.length > 0) {
                document.dispatchEvent(new CustomEvent('components-selected', { 
                    detail: { components: selectedComponents } 
                }));
                showNotification(`🔍 Zaznaczono: ${selectedComponents.length} komponentów`, 'success');
            }
        }
    } catch (error) {
        console.error('Path selection failed:', error);
        showNotification('❌ Błąd zaznaczania ścieżką', 'error');
    }
}

/**
 * Execute lasso selection of components
 * @param {Object} appInstance - The Digital Twin app instance
 * @param {Array} points - Array of points defining the lasso polygon
 */
export function executeLassoSelection(appInstance, points) {
    if (!appInstance || !points || points.length < 5) return;
    
    try {
        const components = getAllComponents(appInstance);
        const selectedComponents = [];
        
        // Check each component's bounding box against the lasso polygon
        components.forEach(component => {
            // Get component center point
            const bbox = component.getBBox();
            const centerX = bbox.x + bbox.width / 2;
            const centerY = bbox.y + bbox.height / 2;
            
            // Check if component center is inside the lasso polygon
            const centerPoint = { x: centerX, y: centerY };
            if (isPointInPolygon(centerPoint, points)) {
                selectedComponents.push(component);
            }
        });
        
        // Apply selection using canvas selection manager if available
        if (appInstance.canvasSelectionManager && selectedComponents.length > 0) {
            appInstance.canvasSelectionManager.selectComponents(selectedComponents, false);
            showNotification(`📌 Zaznaczono: ${selectedComponents.length} komponentów`, 'success');
        } else {
            // Fallback: add selected class manually
            document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
            selectedComponents.forEach(component => component.classList.add('selected'));
            
            // Dispatch event
            if (selectedComponents.length > 0) {
                document.dispatchEvent(new CustomEvent('components-selected', { 
                    detail: { components: selectedComponents } 
                }));
                showNotification(`📌 Zaznaczono: ${selectedComponents.length} komponentów`, 'success');
            }
        }
    } catch (error) {
        console.error('Lasso selection failed:', error);
        showNotification('❌ Błąd zaznaczania lasso', 'error');
    }
}

/**
 * Calculate distance from a point to a line segment
 */
function distanceToLineSegment(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const len_sq = C * C + D * D;
    let param = -1;
    
    if (len_sq !== 0) {
        param = dot / len_sq;
    }

    let xx, yy;

    if (param < 0) {
        xx = x1;
        yy = y1;
    } else if (param > 1) {
        xx = x2;
        yy = y2;
    } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Get a friendly name for a component
 */
function getComponentName(component) {
    if (!component) return 'Nieznany';
    
    // Try different attributes for a name
    return component.getAttribute('data-label') || 
           component.getAttribute('data-name') ||
           component.getAttribute('aria-label') ||
           component.getAttribute('title') ||
           component.getAttribute('id') ||
           'Komponent';
}

export function showProperties(appInstance) {
    if (appInstance.propertiesManager) {
        // Show properties panel
        const propertiesPanel = document.getElementById('properties-panel');
        if (propertiesPanel) {
            propertiesPanel.style.display = 'block';
            showNotification('Właściwości komponentu', 'info');
        }
    }
}

function showGestureHelp() {
    const helpText = `Dostępne gesty:
• Okrąg - usuń zaznaczone komponenty
• Przeciągnij w prawo - zapisz projekt  
• Przeciągnij w lewo - cofnij akcję
• Zygzak - pokaż właściwości

Komendy głosowe:
• "zapisz" - zapisz projekt
• "usuń" - usuń zaznaczone
• "właściwości" - pokaż właściwości
• "pomoc" - pokaż tę pomoc`;
    
    showNotification(helpText, 'info');
}

function showNotification(message, type = 'info') {
    console.info(`📢 ${message}`);
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `hmi-notification hmi-notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${getNotificationColor(type)};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        font-size: 14px;
        max-width: 300px;
        word-wrap: break-word;
        white-space: pre-line;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease-out;
    `;

    document.body.appendChild(notification);
    
    // Animate in
    requestAnimationFrame(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    });
    
    // Remove after delay
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, type === 'info' && message.includes('\n') ? 6000 : 3000);
}

function getNotificationColor(type) {
    switch (type) {
        case 'success': return '#4CAF50';
        case 'error': return '#f44336';
        case 'warning': return '#ff9800';
        default: return '#2196F3';
    }
}

/**
 * Gets SVG element at specific coordinates
 * @param {Object} appInstance - The Digital Twin app instance
 * @param {Object} point - The point with x,y coordinates
 * @returns {Element|null} - The SVG component element or null if not found
 */
function getElementAtPoint(appInstance, point) {
    if (!appInstance) {
        console.error('❌ App instance not available');
        return null;
    }
    
    // Convert screen coordinates to SVG coordinates
    const svgCanvas = document.getElementById('svgCanvas') || document.querySelector('svg.canvas');
    if (!svgCanvas) {
        console.error('❌ SVG canvas not found');
        return null;
    }
    
    // Get SVG point in canvas coordinate system
    const svgPoint = svgCanvas.createSVGPoint();
    svgPoint.x = point.x;
    svgPoint.y = point.y;
    
    // Transform point to canvas coordinate space
    const CTM = svgCanvas.getScreenCTM();
    if (!CTM) {
        console.error('❌ Cannot get canvas transform matrix');
        return null;
    }
    const transformedPoint = svgPoint.matrixTransform(CTM.inverse());
    
    // Use elementFromPoint to find element at coordinates
    const element = document.elementFromPoint(point.x, point.y);
    if (!element) return null;
    
    // Check if the element itself is a component or find closest parent component
    const isComponent = (el) => {
        return el && (el.hasAttribute('data-component-id') || 
                    el.hasAttribute('data-id') ||
                    el.classList && (el.classList.contains('component') || 
                                    el.classList.contains('dt-component')));
    };
    
    let targetElement = element;
    while (targetElement && !isComponent(targetElement) && targetElement !== svgCanvas) {
        targetElement = targetElement.parentElement;
    }
    
    if (isComponent(targetElement)) {
        return targetElement;
    }
    
    return null;
}

/**
 * Checks if point is inside polygon
 * @param {Object} point - Point with x,y coordinates
 * @param {Array} polygon - Array of points forming a polygon
 * @returns {boolean} - True if point is inside polygon
 */
function isPointInPolygon(point, polygon) {
    const x = point.x;
    const y = point.y;
    let inside = false;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x;
        const yi = polygon[i].y;
        const xj = polygon[j].x;
        const yj = polygon[j].y;
        
        const intersect = ((yi > y) !== (yj > y)) && 
                          (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    
    return inside;
}

/**
 * Gets all components from the SVG canvas
 * @param {Object} appInstance - The Digital Twin app instance
 * @returns {Array} - Array of component elements
 */
function getAllComponents(appInstance) {
    const svgCanvas = document.getElementById('svgCanvas') || document.querySelector('svg.canvas');
    if (!svgCanvas) {
        console.error('❌ SVG canvas not found');
        return [];
    }
    
    const components = [
        ...svgCanvas.querySelectorAll('[data-component-id]'),
        ...svgCanvas.querySelectorAll('[data-id]'),
        ...svgCanvas.querySelectorAll('.component'),
        ...svgCanvas.querySelectorAll('.dt-component')
    ];
    
    // Remove duplicates (elements that match multiple selectors)
    return [...new Set(components)];
}

// Export for legacy compatibility
export class AppHMIIntegration {
    constructor() {
        console.warn('⚠️ Using legacy AppHMIIntegration. Please use integrateHMIWithApp() instead.');
    }
    
    async init(appManagers) {
        console.warn('⚠️ Legacy HMI init called. Falling back to new system.');
        return integrateHMIWithApp({ ...appManagers });
    }
    
    destroy() {
        if (window.hmi) {
            window.hmi.destroy();
        }
    }
    
    getAdvancedMetrics() {
        return window.hmi ? window.hmi.getMetrics() : {};
    }
}

export default AppHMIIntegration;
