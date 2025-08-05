/**
 * NEW SIMPLIFIED HMI INTEGRATION
 * Uses the new simple-hmi.js system instead of the complex one
 */

import { createHMI } from './simple-hmi.js';

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
 * Set up comprehensive gesture patterns for Digital Twin IDE
 */
function setupDigitalTwinGestures(hmi, appInstance) {
    // === BASIC OPERATIONS ===
    
    // Delete gesture - circle over selected components (HIGH PRIORITY)
    hmi.gesture('delete')
        .circle({ minRadius: 30, maxRadius: 100 })
        .when(() => hasSelectedComponents(appInstance))
        .on((data) => {
            console.log('🗑️ Delete gesture detected');
            executeDelete(appInstance);
            hmi.voiceHMI.speak('Usunięto komponenty');
        })
        .priority(8)
        .cooldown(500);

    // Enhanced delete - double tap to delete (alternative method)
    hmi.gesture('delete_doubletap')
        .doubleTap({ maxDistance: 40, maxTime: 400 })
        .when(() => hasSelectedComponents(appInstance))
        .on((data) => {
            console.log('🗑️ Double tap delete detected');
            executeDelete(appInstance);
            hmi.voiceHMI.speak('Usunięto przez podwójne dotknięcie');
        })
        .priority(7)
        .cooldown(300);

    // === FILE OPERATIONS ===
    
    // Save gesture - swipe right
    hmi.gesture('save')
        .swipeRight({ minDistance: 120 })
        .on((data) => {
            console.log('💾 Save gesture detected');
            executeSave(appInstance);
            hmi.voiceHMI.speak('Projekt zapisany');
        })
        .priority(6)
        .cooldown(1000);

    // Export gesture - swipe down
    hmi.gesture('export')
        .swipeDown({ minDistance: 100 })
        .on((data) => {
            console.log('📤 Export gesture detected');
            executeExport(appInstance);
            hmi.voiceHMI.speak('Eksport rozpoczęty');
        })
        .priority(5)
        .cooldown(800);

    // === HISTORY OPERATIONS ===
    
    // Undo gesture - swipe left
    hmi.gesture('undo')
        .swipeLeft({ minDistance: 100 })
        .on((data) => {
            console.log('↩️ Undo gesture detected');
            executeUndo(appInstance);
            hmi.voiceHMI.speak('Cofnięto akcję');
        })
        .priority(6)
        .cooldown(400);

    // Redo gesture - swipe up
    hmi.gesture('redo')
        .swipeUp({ minDistance: 100 })
        .on((data) => {
            console.log('↪️ Redo gesture detected');
            executeRedo(appInstance);
            hmi.voiceHMI.speak('Powtórzono akcję');
        })
        .priority(6)
        .cooldown(400);

    // === COMPONENT OPERATIONS ===
    
    // Properties gesture - zigzag
    hmi.gesture('properties')
        .zigzag({ minPoints: 3, amplitude: 40 })
        .when(() => hasSelectedComponents(appInstance))
        .on((data) => {
            console.log('🔧 Properties gesture detected');
            showProperties(appInstance);
            hmi.voiceHMI.speak('Właściwości komponentu');
        })
        .priority(7)
        .cooldown(600);

    // Copy gesture - straight line horizontal
    hmi.gesture('copy')
        .line({ minLength: 80, straightness: 0.9, maxDeviation: 15 })
        .when(() => hasSelectedComponents(appInstance))
        .on((data) => {
            const angle = Math.abs(data.result.angle);
            if (angle < 15 || angle > 165) { // Horizontal line
                console.log('📋 Copy gesture detected');
                executeCopy(appInstance);
                hmi.voiceHMI.speak('Skopiowano komponenty');
            }
        })
        .priority(5)
        .cooldown(300);

    // Scale/Resize gesture - spiral
    hmi.gesture('scale')
        .spiral({ minTurns: 1.2 })
        .when(() => hasSelectedComponents(appInstance))
        .on((data) => {
            console.log('🔄 Scale gesture detected');
            executeScale(appInstance, data.result.turns > 2 ? 1.2 : 0.8);
            hmi.voiceHMI.speak(data.result.turns > 2 ? 'Powiększono' : 'Zmniejszono');
        })
        .priority(4)
        .cooldown(800);

    // === SELECTION OPERATIONS ===
    
    // Select all gesture - large circle
    hmi.gesture('select_all')
        .circle({ minRadius: 150, maxRadius: 300 })
        .on((data) => {
            console.log('🎯 Select all gesture detected');
            executeSelectAll(appInstance);
            hmi.voiceHMI.speak('Zaznaczono wszystkie komponenty');
        })
        .priority(3)
        .cooldown(1000);

    // Clear selection - small circle in empty area
    hmi.gesture('clear_selection')
        .circle({ minRadius: 20, maxRadius: 50 })
        .when(() => !hasSelectedComponents(appInstance))
        .on((data) => {
            console.log('🚫 Clear selection gesture detected');
            executeClearSelection(appInstance);
            hmi.voiceHMI.speak('Wyczyszczono zaznaczenie');
        })
        .priority(2)
        .cooldown(300);

    // === CANVAS OPERATIONS ===
    
    // Grid toggle gesture - cross pattern (custom)
    hmi.gesture('toggle_grid')
        .custom((points) => {
            // Detect cross pattern
            if (points.length < 6) return { detected: false };
            
            const start = points[0];
            const mid = points[Math.floor(points.length / 2)];
            const end = points[points.length - 1];
            
            // Check if it's roughly a cross (two perpendicular lines)
            const angle1 = Math.atan2(mid.y - start.y, mid.x - start.x);
            const angle2 = Math.atan2(end.y - mid.y, end.x - mid.x);
            const angleDiff = Math.abs(angle1 - angle2);
            
            const isCross = Math.abs(angleDiff - Math.PI/2) < 0.3 || Math.abs(angleDiff - 3*Math.PI/2) < 0.3;
            
            return { detected: isCross, pattern: 'cross' };
        })
        .on((data) => {
            console.log('⊞ Grid toggle gesture detected');
            executeToggleGrid(appInstance);
            hmi.voiceHMI.speak('Przełączono siatkę');
        })
        .priority(2)
        .cooldown(800);

    // === ZOOM OPERATIONS ===
    
    // Zoom in gesture - pinch out (for touch devices)
    hmi.gesture('zoom_in')
        .pinch({ threshold: 0.3 })
        .on((data) => {
            if (data.result.isZoomIn) {
                console.log('🔍 Zoom in gesture detected');
                executeZoom(appInstance, data.result.scale);
                hmi.voiceHMI.speak('Powiększono widok');
            }
        })
        .priority(4)
        .cooldown(200);

    // Zoom out gesture - pinch in (for touch devices)
    hmi.gesture('zoom_out')
        .pinch({ threshold: 0.3 })
        .on((data) => {
            if (data.result.isZoomOut) {
                console.log('🔍 Zoom out gesture detected');
                executeZoom(appInstance, data.result.scale);
                hmi.voiceHMI.speak('Zmniejszono widok');
            }
        })
        .priority(4)
        .cooldown(200);

    // === ADVANCED MULTI-MODAL GESTURES ===
    
    // Quick delete - spiral + circle combination
    hmi.gesture('quick_delete')
        .sequence('spiral', 'circle')
        .when(() => hasSelectedComponents(appInstance))
        .on((data) => {
            console.log('⚡ Quick delete sequence detected');
            executeDelete(appInstance, true); // Force delete without confirmation
            hmi.voiceHMI.speak('Szybkie usunięcie wykonane');
        })
        .priority(9)
        .cooldown(1000);

    // === CONNECTION MODE GESTURES ===
    
    // Start connection mode - straight line between components
    hmi.gesture('connect_components')
        .line({ minLength: 100, straightness: 0.8 })
        .when(() => hasSelectedComponents(appInstance))
        .on((data) => {
            const angle = Math.abs(data.result.angle);
            if (angle > 30 && angle < 150) { // Diagonal or vertical line
                console.log('🔗 Connection gesture detected');
                executeStartConnection(appInstance, data.points);
                hmi.voiceHMI.speak('Tryb połączeń aktywny');
            }
        })
        .priority(6)
        .cooldown(500);

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
function hasSelectedComponents(appInstance) {
    // Check if any components are currently selected
    return appInstance && 
           appInstance.canvasSelectionManager && 
           appInstance.canvasSelectionManager.selectedElements.size > 0;
}

// === DELETE OPERATIONS ===
function executeDelete(appInstance, force = false) {
    if (!appInstance) return;
    
    try {
        if (appInstance.actionManager) {
            appInstance.actionManager.executeAction('deleteSelected');
        } else if (appInstance.canvasSelectionManager) {
            // Fallback: direct deletion
            const selected = Array.from(appInstance.canvasSelectionManager.selectedElements);
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
function executeSave(appInstance) {
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

function executeUndo(appInstance) {
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

function executeRedo(appInstance) {
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

function executeExport(appInstance) {
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

function executeCopy(appInstance) {
    if (!appInstance || !hasSelectedComponents(appInstance)) return;
    
    try {
        if (appInstance.actionManager) {
            appInstance.actionManager.executeAction('copy');
        } else {
            // Fallback: copy selected elements
            const selected = Array.from(appInstance.canvasSelectionManager.selectedElements);
            const copiedData = selected.map(el => el.outerHTML);
            window.copiedElements = copiedData;
        }
        
        showNotification('📋 Skopiowano komponenty', 'success');
    } catch (error) {
        console.error('Copy operation failed:', error);
        showNotification('❌ Błąd podczas kopiowania', 'error');
    }
}

function executeScale(appInstance, scaleFactor = 1.0) {
    if (!appInstance || !hasSelectedComponents(appInstance)) return;
    
    try {
        const selected = Array.from(appInstance.canvasSelectionManager.selectedElements);
        
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

function executeSelectAll(appInstance) {
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

function executeClearSelection(appInstance) {
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

function executeToggleGrid(appInstance) {
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

function executeZoom(appInstance, scaleFactor) {
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

function executeStartConnection(appInstance, points) {
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

function showProperties(appInstance) {
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
