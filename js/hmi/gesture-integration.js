/**
 * Digital Twin Gesture Integration for HMI
 * Comprehensive gesture patterns for Digital Twin IDE
 * @module hmi/gesture-integration
 */

/**
 * Setup comprehensive gesture patterns for Digital Twin IDE
 * @param {Object} hmi - The HMI system instance
 * @param {Object} appInstance - The Digital Twin app instance
 */
export function setupDigitalTwinGestures(hmi, appInstance) {
    console.info('🎮 Setting up Digital Twin gesture patterns...');

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
        .spiral({ minRadius: 50, maxRadius: 150 })
        .when(() => hasSelectedComponents(appInstance))
        .on((data) => {
            console.log('🔄 Scale gesture detected');
            executeScale(appInstance, data.scaleFactor || 1.2);
            hmi.voiceHMI.speak('Zmieniono rozmiar komponentów');
        })
        .priority(4)
        .cooldown(600);

    // === SELECTION OPERATIONS ===
    
    // Select all - large circle
    hmi.gesture('select_all')
        .circle({ minRadius: 150, maxRadius: 300 })
        .when(() => !hasSelectedComponents(appInstance))
        .on((data) => {
            console.log('🎯 Select all gesture detected');
            executeSelectAll(appInstance);
            hmi.voiceHMI.speak('Zaznaczono wszystkie komponenty');
        })
        .priority(5)
        .cooldown(600);

    // Clear selection - small circle
    hmi.gesture('clear_selection')
        .circle({ minRadius: 15, maxRadius: 60 })
        .when(() => hasSelectedComponents(appInstance))
        .on((data) => {
            console.log('🚫 Clear selection gesture detected');
            executeClearSelection(appInstance);
            hmi.voiceHMI.speak('Wyczyszczono zaznaczenie');
        })
        .priority(6)
        .cooldown(400);

    // Lasso selection - continuous drawing selection
    hmi.gesture('lasso_selection')
        .path({ minPoints: 8, maxDistance: 400 })
        .on((data) => {
            console.log('🎯 Lasso selection detected');
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
            
            // Calculate if the pattern resembles a cross
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

    console.info('✅ Comprehensive gesture patterns configured:');
    console.info('   🗑️  Delete: Circle, Double-tap');
    console.info('   💾  File: Save (→), Export (↓)');
    console.info('   ↩️  History: Undo (←), Redo (↑)');
    console.info('   🔧  Components: Properties (zigzag), Copy (line), Scale (spiral)');
    console.info('   🎯  Selection: Select all (large circle), Clear (small circle)');
    console.info('   ⊞  Canvas: Grid toggle (cross), Zoom (pinch)');
    console.info('   🔗  Advanced: Quick delete (spiral+circle), Connect (diagonal line)');
    
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

/**
 * Setup voice commands for Digital Twin IDE
 * @param {Object} hmi - The HMI system instance
 * @param {Object} appInstance - The Digital Twin app instance
 */
export function setupVoiceCommands(hmi, appInstance) {
    console.info('🎤 Setting up voice commands...');

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
            if (window.showGestureHelp) {
                window.showGestureHelp();
            }
        })
        .speak('Dostępne gesty: okrąg aby usunąć, przeciągnij w prawo aby zapisać, zygzak aby pokazać właściwości');

    // Start voice recognition
    if (hmi.voiceHMI && typeof hmi.voiceHMI.startListening === 'function') {
        hmi.voiceHMI.startListening();
    }
    
    console.info('🎤 Voice commands enabled');
}

// === GESTURE ACTION IMPLEMENTATIONS ===

/**
 * Check if any components are currently selected
 */
export function hasSelectedComponents(appInstance) {
    return appInstance && 
           appInstance.inputManager &&
           appInstance.inputManager.selection &&
           appInstance.inputManager.selection.getSelectedComponents().length > 0;
}

/**
 * Execute delete action
 */
export function executeDelete(appInstance, force = false) {
    if (!appInstance || !hasSelectedComponents(appInstance)) return;
    
    const selectedComponents = appInstance.inputManager.selection.getSelectedComponents();
    
    // Dispatch delete event for input manager
    document.dispatchEvent(new CustomEvent('hmi-delete-components', {
        detail: { components: selectedComponents, force }
    }));
    
    console.log(`🗑️ Executed delete for ${selectedComponents.length} components`);
}

/**
 * Execute save action
 */
export function executeSave(appInstance) {
    document.dispatchEvent(new CustomEvent('hmi-save'));
    console.log('💾 Executed save');
}

/**
 * Execute undo action
 */
export function executeUndo(appInstance) {
    document.dispatchEvent(new CustomEvent('hmi-undo'));
    console.log('↩️ Executed undo');
}

/**
 * Execute redo action
 */
export function executeRedo(appInstance) {
    document.dispatchEvent(new CustomEvent('hmi-redo'));
    console.log('🔄 Executed redo');
}

/**
 * Execute export action
 */
export function executeExport(appInstance) {
    if (appInstance && appInstance.exportManager) {
        appInstance.exportManager.exportSVG();
    }
    console.log('📤 Executed export');
}

/**
 * Execute copy action
 */
export function executeCopy(appInstance) {
    if (!hasSelectedComponents(appInstance)) return;
    
    // Copy selected components to clipboard
    const selectedComponents = appInstance.inputManager.selection.getSelectedComponents();
    document.dispatchEvent(new CustomEvent('hmi-copy-components', {
        detail: { components: selectedComponents }
    }));
    
    console.log(`📋 Executed copy for ${selectedComponents.length} components`);
}

/**
 * Execute scale action
 */
export function executeScale(appInstance, scaleFactor = 1.2) {
    if (!hasSelectedComponents(appInstance)) return;
    
    const selectedComponents = appInstance.inputManager.selection.getSelectedComponents();
    document.dispatchEvent(new CustomEvent('hmi-scale-components', {
        detail: { components: selectedComponents, scaleFactor }
    }));
    
    console.log(`🔄 Executed scale (${scaleFactor}) for ${selectedComponents.length} components`);
}

/**
 * Execute select all action
 */
export function executeSelectAll(appInstance) {
    if (appInstance && appInstance.inputManager && appInstance.inputManager.selection) {
        appInstance.inputManager.selection.selectAll();
    }
    console.log('🎯 Executed select all');
}

/**
 * Execute clear selection action
 */
export function executeClearSelection(appInstance) {
    if (appInstance && appInstance.inputManager && appInstance.inputManager.selection) {
        appInstance.inputManager.selection.clearSelection();
    }
    console.log('🚫 Executed clear selection');
}

/**
 * Execute lasso selection
 */
export function executeLassoSelection(appInstance, points) {
    if (appInstance && appInstance.inputManager && appInstance.inputManager.selection) {
        appInstance.inputManager.selection.selectByPath(points);
    }
    console.log('🎯 Executed lasso selection');
}

/**
 * Execute toggle grid action
 */
export function executeToggleGrid(appInstance) {
    document.dispatchEvent(new CustomEvent('hmi-toggle-grid'));
    console.log('📏 Executed toggle grid');
}

/**
 * Execute zoom action
 */
export function executeZoom(appInstance, scaleFactor) {
    document.dispatchEvent(new CustomEvent('hmi-zoom', {
        detail: { scaleFactor }
    }));
    console.log(`🔍 Executed zoom: ${scaleFactor}`);
}

/**
 * Execute start connection action
 */
export function executeStartConnection(appInstance, points) {
    document.dispatchEvent(new CustomEvent('hmi-start-connection', {
        detail: { points }
    }));
    console.log('🔗 Executed start connection');
}

/**
 * Execute select component action
 */
export function executeSelectComponent(appInstance, componentId) {
    if (appInstance && appInstance.inputManager && appInstance.inputManager.selection) {
        const component = document.querySelector(`[data-id="${componentId}"]`);
        if (component) {
            appInstance.inputManager.selection.selectComponent(component);
        }
    }
    console.log(`🎯 Executed select component: ${componentId}`);
}

/**
 * Execute path selection
 */
export function executePathSelection(appInstance, points) {
    if (appInstance && appInstance.inputManager && appInstance.inputManager.selection) {
        appInstance.inputManager.selection.selectByPath(points);
    }
    console.log('🎯 Executed path selection');
}

/**
 * Show properties panel
 */
export function showProperties(appInstance) {
    document.dispatchEvent(new CustomEvent('hmi-show-properties'));
    console.log('🔧 Showing properties panel');
}
