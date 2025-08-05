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
 * Set up gesture patterns specific to Digital Twin IDE
 */
function setupDigitalTwinGestures(hmi, appInstance) {
    // Delete gesture - circle over selected components
    hmi.gesture('delete')
        .circle({ minRadius: 30, maxRadius: 100 })
        .when(() => hasSelectedComponents(appInstance))
        .on((data) => {
            console.log('🗑️ Delete gesture detected');
            executeDelete(appInstance);
            hmi.voiceHMI.speak('Usunięto komponenty');
        })
        .cooldown(500);

    // Save gesture - swipe right
    hmi.gesture('save')
        .swipe('right', { minDistance: 100 })
        .on((data) => {
            console.log('💾 Save gesture detected');
            executeSave(appInstance);
            hmi.voiceHMI.speak('Projekt zapisany');
        })
        .cooldown(1000);

    // Undo gesture - swipe left
    hmi.gesture('undo')
        .swipe('left', { minDistance: 100 })
        .on((data) => {
            console.log('↩️ Undo gesture detected');
            executeUndo(appInstance);
            hmi.voiceHMI.speak('Cofnięto akcję');
        })
        .cooldown(500);

    // Properties gesture - zigzag
    hmi.gesture('properties')
        .zigzag({ minPoints: 3, amplitude: 40 })
        .when(() => hasSelectedComponents(appInstance))
        .on((data) => {
            console.log('🔧 Properties gesture detected');
            showProperties(appInstance);
            hmi.voiceHMI.speak('Właściwości komponentu');
        })
        .cooldown(800);
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
 * Helper functions for actions
 */
function hasSelectedComponents(appInstance) {
    return appInstance.canvasSelectionManager && 
           appInstance.canvasSelectionManager.selectedElements.size > 0;
}

function executeDelete(appInstance) {
    if (appInstance.canvasSelectionManager && appInstance.actionManager) {
        const selectedElements = Array.from(appInstance.canvasSelectionManager.selectedElements);
        if (selectedElements.length > 0) {
            // Use the action manager to delete (for undo support)
            appInstance.actionManager.executeAction('delete', { elements: selectedElements });
            showNotification(`Usunięto ${selectedElements.length} komponentów`, 'success');
        }
    }
}

function executeSave(appInstance) {
    if (appInstance.exportManager) {
        try {
            // Trigger the save/export functionality
            const canvas = document.getElementById('svg-canvas');
            if (canvas) {
                appInstance.exportManager.exportSVG();
                showNotification('Projekt zapisany', 'success');
            }
        } catch (error) {
            console.error('Save failed:', error);
            showNotification('Błąd podczas zapisywania', 'error');
        }
    }
}

function executeUndo(appInstance) {
    if (appInstance.actionManager && appInstance.actionManager.undo) {
        try {
            appInstance.actionManager.undo();
            showNotification('Cofnięto akcję', 'success');
        } catch (error) {
            console.error('Undo failed:', error);
            showNotification('Nie można cofnąć akcji', 'error');
        }
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
