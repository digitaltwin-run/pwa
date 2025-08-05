/**
 * HMI Digital Twin Gesture System
 * Migrated from js/digital-twin-gestures.js
 * Contains setup and definition of all gesture patterns for Digital Twin IDE
 * @module hmi/gestures
 */

import { executeDelete, executeSave, executeUndo, executeRedo, executeExport, 
         executeCopy, executeScale, executeSelectAll, executeClearSelection, 
         executeToggleGrid, executeZoom, executeStartConnection,
         executeSelectComponent, executePathSelection, executeLassoSelection,
         showProperties, hasSelectedComponents } from '../gesture-integration.js';

/**
 * Set up comprehensive gesture patterns for Digital Twin IDE
 * @param {Object} hmi - The HMI system instance
 * @param {Object} appInstance - The Digital Twin app instance
 */
export function setupDigitalTwinGestures(hmi, appInstance) {
    console.info('🎮 Setting up HMI Digital Twin gesture patterns...');

    // === BASIC OPERATIONS ===
    
    // Delete gesture - circle over selected components (HIGH PRIORITY)
    hmi.gestureDetector.gesture('delete')
        .circle({ minRadius: 30, maxRadius: 100 })
        .when(() => hasSelectedComponents(appInstance))
        .on((data) => {
            console.log('🗑️ Delete gesture detected');
            executeDelete(appInstance);
            if (hmi.voiceHMI && hmi.voiceHMI.speak) {
                hmi.voiceHMI.speak('Usunięto komponenty');
            }
        })
        .priority(8)
        .cooldown(500);

    // Enhanced delete - double tap to delete (alternative method)
    hmi.gestureDetector.gesture('delete_doubletap')
        .doubleTap({ maxDistance: 40, maxTime: 400 })
        .when(() => hasSelectedComponents(appInstance))
        .on((data) => {
            console.log('🗑️ Double tap delete detected');
            executeDelete(appInstance);
            if (hmi.voiceHMI && hmi.voiceHMI.speak) {
                hmi.voiceHMI.speak('Usunięto przez podwójne dotknięcie');
            }
        })
        .priority(7)
        .cooldown(300);

    // === FILE OPERATIONS ===
    
    // Save gesture - swipe right
    hmi.gestureDetector.gesture('save')
        .swipe({ direction: 'right', minDistance: 120 })
        .on((data) => {
            console.log('💾 Save gesture detected');
            executeSave(appInstance);
            if (hmi.voiceHMI && hmi.voiceHMI.speak) {
                hmi.voiceHMI.speak('Projekt zapisany');
            }
        })
        .priority(6)
        .cooldown(1000);

    // Export gesture - swipe down
    hmi.gestureDetector.gesture('export')
        .swipe({ direction: 'down', minDistance: 100 })
        .on((data) => {
            console.log('📤 Export gesture detected');
            executeExport(appInstance);
            if (hmi.voiceHMI && hmi.voiceHMI.speak) {
                hmi.voiceHMI.speak('Eksport rozpoczęty');
            }
        })
        .priority(5)
        .cooldown(800);

    // === HISTORY OPERATIONS ===
    
    // Undo gesture - swipe left
    hmi.gestureDetector.gesture('undo')
        .swipe({ direction: 'left', minDistance: 100 })
        .on((data) => {
            console.log('↩️ Undo gesture detected');
            executeUndo(appInstance);
            if (hmi.voiceHMI && hmi.voiceHMI.speak) {
                hmi.voiceHMI.speak('Cofnięto akcję');
            }
        })
        .priority(6)
        .cooldown(400);

    // Redo gesture - swipe up
    hmi.gestureDetector.gesture('redo')
        .swipe({ direction: 'up', minDistance: 100 })
        .on((data) => {
            console.log('🔄 Redo gesture detected');
            executeRedo(appInstance);
            if (hmi.voiceHMI && hmi.voiceHMI.speak) {
                hmi.voiceHMI.speak('Przywrócono akcję');
            }
        })
        .priority(5)
        .cooldown(400);

    // === COMPONENT OPERATIONS ===
    
    // Component properties - using basic circle for compatibility
    hmi.gestureDetector.gesture('properties')
        .circle({ minRadius: 20, maxRadius: 60 })
        .when(() => hasSelectedComponents(appInstance))
        .on((data) => {
            console.log('🔧 Properties gesture detected');
            showProperties(appInstance);
            if (hmi.voiceHMI && hmi.voiceHMI.speak) {
                hmi.voiceHMI.speak('Otwarto panel właściwości');
            }
        })
        .priority(4)
        .cooldown(600);

    // Copy component - swipe gesture alternative
    hmi.gestureDetector.gesture('copy')
        .swipe({ direction: 'right', minDistance: 50, maxDistance: 100 })
        .when(() => hasSelectedComponents(appInstance))
        .on((data) => {
            console.log('📋 Copy gesture detected');
            executeCopy(appInstance);
            if (hmi.voiceHMI && hmi.voiceHMI.speak) {
                hmi.voiceHMI.speak('Skopiowano komponenty');
            }
        })
        .priority(3)
        .cooldown(500);

    // Scale component - circle with different size for scaling
    hmi.gestureDetector.gesture('scale')
        .circle({ minRadius: 60, maxRadius: 120 })
        .when(() => hasSelectedComponents(appInstance))
        .on((data) => {
            console.log('📏 Scale gesture detected');
            executeScale(appInstance, data.radius);
            if (hmi.voiceHMI && hmi.voiceHMI.speak) {
                hmi.voiceHMI.speak('Przeskalowano komponenty');
            }
        })
        .priority(4)
        .cooldown(400);

    // === SELECTION OPERATIONS ===
    
    // Select all - large circle gesture
    hmi.gestureDetector.gesture('select_all')
        .circle({ minRadius: 100, maxRadius: 200 })
        .when(() => !hasSelectedComponents(appInstance))
        .on((data) => {
            console.log('🎯 Select all gesture detected');
            executeSelectAll(appInstance);
            if (hmi.voiceHMI && hmi.voiceHMI.speak) {
                hmi.voiceHMI.speak('Zaznaczono wszystkie komponenty');
            }
        })
        .priority(3)
        .cooldown(600);

    // Clear selection - small circle
    hmi.gestureDetector.gesture('clear_selection')
        .circle({ minRadius: 10, maxRadius: 30 })
        .when(() => hasSelectedComponents(appInstance))
        .on((data) => {
            console.log('🎯 Clear selection gesture detected');
            executeClearSelection(appInstance);
            if (hmi.voiceHMI && hmi.voiceHMI.speak) {
                hmi.voiceHMI.speak('Usunięto zaznaczenie');
            }
        })
        .priority(2)
        .cooldown(300);

    // === CANVAS OPERATIONS ===
    
    // Toggle grid - custom cross pattern using basic gestures
    hmi.gestureDetector.gesture('toggle_grid')
        .swipe({ direction: 'up', minDistance: 30, maxDistance: 80 })
        .on((data) => {
            console.log('📏 Grid toggle gesture detected');
            executeToggleGrid(appInstance);
            if (hmi.voiceHMI && hmi.voiceHMI.speak) {
                hmi.voiceHMI.speak('Przełączono widok siatki');
            }
        })
        .priority(2)
        .cooldown(500);

    // === ADVANCED GESTURES ===
    
    // Quick delete - double circle sequence
    hmi.gestureDetector.gesture('quick_delete_double')
        .circle({ minRadius: 25, maxRadius: 75 })
        .when(() => hasSelectedComponents(appInstance))
        .on((data) => {
            console.log('⚡ Quick delete detected');
            executeDelete(appInstance, true); // force=true for quick delete
            if (hmi.voiceHMI && hmi.voiceHMI.speak) {
                hmi.voiceHMI.speak('Szybkie usunięcie wykonane');
            }
        })
        .priority(9)
        .cooldown(1000);

    console.info('✅ HMI Digital Twin gesture setup complete - all patterns registered');
    
    // Expose gesture help globally for HMI
    window.showHMIGestureHelp = () => {
        console.info('ℹ️ Showing HMI gesture help');
        const helpText = `🎮 Dostępne gesty HMI:
        
🗑️ USUWANIE:
• Okrąg (średni) - usuń zaznaczone komponenty
• Podwójne dotknięcie - alternatywne usunięcie

💾 PLIK:
• Przeciągnij w prawo - zapisz projekt  
• Przeciągnij w dół - eksportuj

↩️ HISTORIA:
• Przeciągnij w lewo - cofnij akcję
• Przeciągnij w górę - przywróć akcję

🔧 KOMPONENTY:
• Okrąg (mały) - pokaż właściwości
• Przeciągnij w prawo (krótko) - kopiuj
• Okrąg (duży) - skaluj

🎯 ZAZNACZANIE:
• Okrąg (bardzo duży) - zaznacz wszystko
• Okrąg (bardzo mały) - wyczyść zaznaczenie

📏 KANWA:
• Przeciągnij w górę (krótko) - przełącz siatkę

🎤 Komendy głosowe:
• "zapisz" - zapisz projekt
• "usuń" - usuń zaznaczone
• "właściwości" - pokaż właściwości
• "pomoc" - pokaż tę pomoc`;

        if (typeof showNotification === 'function') {
            showNotification(helpText, 'info');
        } else {
            alert(helpText);
        }
    };

    // Also maintain backward compatibility
    window.showGestureHelp = window.showHMIGestureHelp;
}

// Export for easy access
export default setupDigitalTwinGestures;
