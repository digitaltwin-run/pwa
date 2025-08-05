/**
 * Digital Twin Gesture System
 * Contains setup and definition of all gesture patterns for Digital Twin IDE
 */

import { executeDelete, executeSave, executeUndo, executeRedo, executeExport, 
         executeCopy, executeScale, executeSelectAll, executeClearSelection, 
         executeToggleGrid, executeZoom, executeStartConnection,
         executeSelectComponent, executePathSelection, executeLassoSelection,
         showProperties, hasSelectedComponents } from './app-hmi-integration-new.js';

/**
 * Set up comprehensive gesture patterns for Digital Twin IDE
 * @param {Object} hmi - The HMI system instance
 * @param {Object} appInstance - The Digital Twin app instance
 */
export function setupDigitalTwinGestures(hmi, appInstance) {
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
            console.log('🔄 Redo gesture detected');
            executeRedo(appInstance);
            hmi.voiceHMI.speak('Przywrócono akcję');
        })
        .priority(5)
        .cooldown(400);

    // === COMPONENT OPERATIONS ===
    
    // Component properties - zigzag gesture
    hmi.gesture('properties')
        .zigzag({ minZigs: 2, maxZigs: 4 })
        .when(() => hasSelectedComponents(appInstance))
        .on((data) => {
            console.log('🔧 Properties gesture detected');
            showProperties(appInstance);
            hmi.voiceHMI.speak('Otwarto panel właściwości');
        })
        .priority(4)
        .cooldown(600);

    // Copy component - horizontal line gesture
    hmi.gesture('copy')
        .line({ minLength: 80, maxLength: 200, allowedAngles: [0], angleTolerance: 15 })
        .when(() => hasSelectedComponents(appInstance))
        .on((data) => {
            console.log('📋 Copy gesture detected');
            executeCopy(appInstance);
            hmi.voiceHMI.speak('Skopiowano komponenty');
        })
        .priority(3)
        .cooldown(500);

    // Scale component - spiral gesture
    hmi.gesture('scale')
        .spiral({ minLoops: 0.75, maxLoops: 3, direction: 'clockwise' })
        .when(() => hasSelectedComponents(appInstance))
        .on((data) => {
            console.log('🔍 Scale gesture detected');
            const scaleFactor = 1 + (data.loops * 0.25); // Scale factor based on spiral loops
            executeScale(appInstance, scaleFactor);
            hmi.voiceHMI.speak('Przeskalowano komponenty');
        })
        .priority(5)
        .cooldown(700);

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
        
    // Tap selection - select component with single tap
    hmi.gesture('tap_select')
        .doubleTap({ maxDistance: 20, maxTime: 300 })
        .on((data) => {
            console.log('🔍 Tap select detected');
            executeSelectComponent(appInstance, data.points[0]);
            hmi.voiceHMI.speak('Zaznaczono komponent');
        })
        .priority(5)
        .cooldown(200);
        
    // Path selection - draw path to select components
    hmi.gesture('path_selection')
        .custom((points) => {
            // For path selection, we need a minimum length gesture
            if (points.length < 5) return { detected: false };
            
            // Calculate total path length
            let totalLength = 0;
            for (let i = 1; i < points.length; i++) {
                const dx = points[i].x - points[i-1].x;
                const dy = points[i].y - points[i-1].y;
                totalLength += Math.sqrt(dx*dx + dy*dy);
            }
            
            return { 
                detected: totalLength > 50, 
                pattern: 'path',
                points: points,
                length: totalLength
            };
        })
        .on((data) => {
            console.log('🖊️ Path selection gesture detected');
            executePathSelection(appInstance, data.points);
            hmi.voiceHMI.speak('Zaznaczenie ścieżką');
        })
        .priority(4)
        .cooldown(300);
        
    // Lasso selection - draw closed loop to select components
    hmi.gesture('lasso_selection')
        .custom((points) => {
            // For lasso selection, we need enough points and a closed shape
            if (points.length < 8) return { detected: false };
            
            // Check if the shape is closed (end point near start point)
            const startX = points[0].x;
            const startY = points[0].y;
            const endX = points[points.length - 1].x;
            const endY = points[points.length - 1].y;
            
            const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
            const isClosed = distance < 30; // Within 30 pixels = closed loop
            
            return { 
                detected: isClosed, 
                pattern: 'lasso',
                points: points,
                closed: isClosed
            };
        })
        .on((data) => {
            console.log('🔗 Lasso selection gesture detected');
            executeLassoSelection(appInstance, data.points);
            hmi.voiceHMI.speak('Zaznaczenie lasso');
        })
        .priority(6)
        .cooldown(400);

    // === CANVAS OPERATIONS ===
    
    // Toggle grid - cross pattern
    hmi.gesture('toggle_grid')
        .custom((points) => {
            if (points.length < 6) return { detected: false };
            
            // Calculate directions for cross detection
            const midX = points[Math.floor(points.length / 2)].x;
            const midY = points[Math.floor(points.length / 2)].y;
            
            // Calculate if the pattern resembles a cross (horizontal then vertical line or vice versa)
            let horizontalCount = 0;
            let verticalCount = 0;
            let diagonalCount = 0;
            
            for (let i = 1; i < points.length; i++) {
                const dx = Math.abs(points[i].x - points[i-1].x);
                const dy = Math.abs(points[i].y - points[i-1].y);
                
                if (dx > 2*dy) horizontalCount++;
                if (dy > 2*dx) verticalCount++;
                if (dx > 5 && dy > 5 && (0.5 < dx/dy && dx/dy < 2)) diagonalCount++;
            }
            
            const isCross = (horizontalCount > 2 && verticalCount > 2) && diagonalCount < 3;
            return { detected: isCross, pattern: 'cross' };
        })
        .on((data) => {
            console.log('📏 Grid toggle gesture detected');
            executeToggleGrid(appInstance);
            hmi.voiceHMI.speak('Przełączono widok siatki');
        })
        .priority(2)
        .cooldown(500);
    
    // Canvas zoom - pinch gesture
    hmi.gesture('zoom')
        .pinch({ minDistance: 30 })
        .on((data) => {
            console.log('🔍 Zoom gesture detected, scale factor:', data.scaleFactor);
            executeZoom(appInstance, data.scaleFactor);
            const action = data.scaleFactor > 1 ? 'Powiększono' : 'Pomniejszono';
            hmi.voiceHMI.speak(`${action} widok`);
        })
        .priority(7)
        .cooldown(100); // Short cooldown for smoother zoom
    
    // === MULTI-MODAL GESTURES ===
    
    // Quick delete - sequence of spiral + circle
    hmi.gesture('quick_delete_sequence')
        .sequence(['spiral', 'circle'], { maxTimeBetween: 800 })
        .when(() => hasSelectedComponents(appInstance))
        .on((data) => {
            console.log('⚡ Quick delete sequence detected');
            executeDelete(appInstance, true); // force=true for quick delete
            hmi.voiceHMI.speak('Szybkie usunięcie wykonane');
        })
        .priority(9)
        .cooldown(1000);
    
    // Connect components - diagonal line
    hmi.gesture('connect_components')
        .line({ minLength: 100, maxLength: 400, allowedAngles: [45, 135, 225, 315], angleTolerance: 30 })
        .when(() => hasSelectedComponents(appInstance))
        .on((data) => {
            console.log('🔗 Connect components gesture detected');
            executeStartConnection(appInstance, data.points);
            hmi.voiceHMI.speak('Rozpoczęto łączenie komponentów');
        })
        .priority(6)
        .cooldown(500);

    console.info('✅ Gesture setup complete - all patterns registered');
    
    // Expose gesture help globally
    window.showGestureHelp = () => {
        console.info('ℹ️ Showing gesture help');
        const helpText = `Dostępne gesty:
• Okrąg - usuń zaznaczone komponenty
• Przeciągnij w prawo - zapisz projekt  
• Przeciągnij w lewo - cofnij akcję
• Zygzak - pokaż właściwości
• Lasso - zaznacz obszarem
• Ścieżka - zaznacz wzdłuż linii

Komendy głosowe:
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
}

// Export for easy access
export default setupDigitalTwinGestures;
